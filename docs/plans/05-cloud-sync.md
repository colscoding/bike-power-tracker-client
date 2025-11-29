# Plan: Cloud Sync & Backend Services

## Overview

Add optional backend services for cloud synchronization, enabling workout data to be stored and accessed across devices.

## Priority: Low
## Effort: Extra Large (6-8 weeks)
## Type: Backend Feature

---

## Motivation

1. **Data Persistence**: Workouts survive device loss/replacement
2. **Cross-Device**: Access workouts from any device
3. **Sharing**: Share workouts with coaches or friends
4. **Analytics**: Server-side processing for advanced analysis
5. **Backup**: Automatic cloud backup

---

## Architecture Options

### Option A: Firebase (Fastest to Implement)

**Pros:**
- No server to manage
- Built-in auth (Google, email, etc.)
- Real-time sync
- Free tier sufficient for personal use

**Cons:**
- Vendor lock-in
- Costs can scale with users
- Less control over data

### Option B: Self-Hosted (Most Control)

**Pros:**
- Full data ownership
- Complete customization
- No vendor lock-in
- Can run on cheap VPS

**Cons:**
- More setup/maintenance
- Need to handle auth, scaling
- More initial development

### Option C: Hybrid (Best Balance)

Use a lightweight backend (Hono, Fastify) with:
- Auth0 or Clerk for authentication
- Cloudflare D1 or Turso for edge database
- R2/S3 for file storage

---

## Recommended: Cloudflare Workers + D1

Low-cost, globally distributed, easy to deploy:

```
Client (PWA)
     │
     ├── IndexedDB (offline-first)
     │
     └── Sync ───► Cloudflare Worker
                        │
                        ├── D1 Database
                        │
                        └── Auth (via JWT)
```

---

## Database Schema

```sql
-- users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  settings TEXT -- JSON blob for user preferences
);

-- workouts table
CREATE TABLE workouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  local_id TEXT, -- Client-side IndexedDB ID for sync
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  duration_seconds INTEGER,
  sport_type TEXT DEFAULT 'Biking',
  title TEXT,
  notes TEXT,
  summary TEXT, -- JSON: avg/max power, hr, cadence
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME, -- Soft delete
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- measurements table (normalized)
CREATE TABLE measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  power INTEGER,
  heartrate INTEGER,
  cadence INTEGER,
  FOREIGN KEY (workout_id) REFERENCES workouts(id)
);

-- sync_log for conflict resolution
CREATE TABLE sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  workout_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  client_timestamp DATETIME,
  server_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  device_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_workouts_user ON workouts(user_id);
CREATE INDEX idx_workouts_synced ON workouts(synced_at);
CREATE INDEX idx_measurements_workout ON measurements(workout_id);
```

---

## API Design

### Authentication Endpoints

```
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

### Workout Endpoints

```
GET    /api/workouts              - List all workouts
GET    /api/workouts/:id          - Get workout with measurements
POST   /api/workouts              - Create workout
PUT    /api/workouts/:id          - Update workout
DELETE /api/workouts/:id          - Soft delete workout

POST   /api/workouts/sync         - Sync local changes
GET    /api/workouts/changes      - Get changes since timestamp
```

### Export Endpoints

```
GET /api/workouts/:id/export/tcx
GET /api/workouts/:id/export/fit
GET /api/workouts/:id/export/gpx
```

---

## Worker Implementation

```javascript
// worker/src/index.js

import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { cors } from 'hono/cors';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('/api/*', jwt({ secret: 'your-secret' }));

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Workout routes
app.get('/api/workouts', async (c) => {
  const userId = c.get('jwtPayload').sub;
  
  const { results } = await c.env.DB.prepare(`
    SELECT id, started_at, duration_seconds, title, summary
    FROM workouts
    WHERE user_id = ? AND deleted_at IS NULL
    ORDER BY started_at DESC
    LIMIT 100
  `).bind(userId).all();
  
  return c.json(results);
});

app.get('/api/workouts/:id', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const workoutId = c.req.param('id');
  
  // Get workout
  const workout = await c.env.DB.prepare(`
    SELECT * FROM workouts 
    WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).bind(workoutId, userId).first();
  
  if (!workout) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  // Get measurements
  const { results: measurements } = await c.env.DB.prepare(`
    SELECT timestamp, power, heartrate, cadence
    FROM measurements
    WHERE workout_id = ?
    ORDER BY timestamp ASC
  `).bind(workoutId).all();
  
  return c.json({ ...workout, measurements });
});

app.post('/api/workouts', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json();
  
  const id = crypto.randomUUID();
  
  // Insert workout
  await c.env.DB.prepare(`
    INSERT INTO workouts (id, user_id, local_id, started_at, ended_at, 
                          duration_seconds, title, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, 
    userId, 
    body.localId,
    body.startedAt, 
    body.endedAt,
    body.durationSeconds,
    body.title || '',
    JSON.stringify(body.summary)
  ).run();
  
  // Insert measurements in batches
  if (body.measurements?.length) {
    const batchSize = 100;
    for (let i = 0; i < body.measurements.length; i += batchSize) {
      const batch = body.measurements.slice(i, i + batchSize);
      const stmt = c.env.DB.prepare(`
        INSERT INTO measurements (workout_id, timestamp, power, heartrate, cadence)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      await c.env.DB.batch(
        batch.map(m => stmt.bind(id, m.timestamp, m.power, m.heartrate, m.cadence))
      );
    }
  }
  
  return c.json({ id }, 201);
});

// Sync endpoint
app.post('/api/workouts/sync', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const { lastSyncAt, changes } = await c.req.json();
  
  // Process incoming changes
  for (const change of changes) {
    if (change.action === 'create') {
      // Check if already exists (by localId)
      // Create or update accordingly
    } else if (change.action === 'update') {
      // Update if server version is older
    } else if (change.action === 'delete') {
      // Soft delete
    }
  }
  
  // Get server changes since lastSyncAt
  const { results: serverChanges } = await c.env.DB.prepare(`
    SELECT * FROM workouts
    WHERE user_id = ? AND synced_at > ?
  `).bind(userId, lastSyncAt || '1970-01-01').all();
  
  return c.json({
    syncedAt: new Date().toISOString(),
    changes: serverChanges
  });
});

export default app;
```

---

## Client Sync Service

```javascript
// src/services/sync.js

export class SyncService {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.token = null;
    this.lastSyncAt = null;
  }
  
  async authenticate(email, password) {
    const res = await fetch(`${this.apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) throw new Error('Authentication failed');
    
    const { token, expiresAt } = await res.json();
    this.token = token;
    localStorage.setItem('sync_token', token);
    localStorage.setItem('sync_token_expires', expiresAt);
    
    return true;
  }
  
  async sync(localWorkouts) {
    if (!this.token) return { success: false, error: 'Not authenticated' };
    
    try {
      // Find local changes since last sync
      const changes = localWorkouts
        .filter(w => !w.syncedAt || w.updatedAt > w.syncedAt)
        .map(w => ({
          action: w.deletedAt ? 'delete' : (w.syncedAt ? 'update' : 'create'),
          localId: w.id,
          ...w
        }));
      
      const res = await fetch(`${this.apiUrl}/api/workouts/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          lastSyncAt: this.lastSyncAt,
          changes
        })
      });
      
      if (!res.ok) throw new Error('Sync failed');
      
      const { syncedAt, changes: serverChanges } = await res.json();
      
      this.lastSyncAt = syncedAt;
      localStorage.setItem('lastSyncAt', syncedAt);
      
      return { success: true, serverChanges };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Automatic background sync
  startAutoSync(localWorkoutsGetter, onServerChanges) {
    // Sync when online
    window.addEventListener('online', async () => {
      const result = await this.sync(localWorkoutsGetter());
      if (result.serverChanges?.length) {
        onServerChanges(result.serverChanges);
      }
    });
    
    // Periodic sync every 5 minutes
    setInterval(async () => {
      if (navigator.onLine && this.token) {
        const result = await this.sync(localWorkoutsGetter());
        if (result.serverChanges?.length) {
          onServerChanges(result.serverChanges);
        }
      }
    }, 5 * 60 * 1000);
  }
}
```

---

## Conflict Resolution Strategy

### Last-Write-Wins (Simple)
```javascript
function resolveConflict(local, server) {
  return new Date(local.updatedAt) > new Date(server.updatedAt) 
    ? local 
    : server;
}
```

### Merge Strategy (Better for Measurements)
```javascript
function mergeWorkout(local, server) {
  // Keep the newer metadata
  const base = resolveConflict(local, server);
  
  // Merge measurements (union of both, deduplicated by timestamp)
  const measurementMap = new Map();
  
  [...local.measurements, ...server.measurements].forEach(m => {
    const key = m.timestamp;
    if (!measurementMap.has(key) || 
        (m.power && !measurementMap.get(key).power)) {
      measurementMap.set(key, m);
    }
  });
  
  return {
    ...base,
    measurements: [...measurementMap.values()].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    )
  };
}
```

---

## Authentication Flow

```
┌─────────────┐                    ┌─────────────┐
│   Client    │                    │   Server    │
└─────────────┘                    └─────────────┘
       │                                  │
       │ 1. Login (email/password)        │
       │─────────────────────────────────>│
       │                                  │
       │ 2. JWT + Refresh Token           │
       │<─────────────────────────────────│
       │                                  │
       │ 3. Store tokens                  │
       │                                  │
       │ 4. API Request + JWT             │
       │─────────────────────────────────>│
       │                                  │
       │ 5. Response                      │
       │<─────────────────────────────────│
       │                                  │
       │ [JWT expires]                    │
       │                                  │
       │ 6. Refresh Token                 │
       │─────────────────────────────────>│
       │                                  │
       │ 7. New JWT                       │
       │<─────────────────────────────────│
```

---

## Security Considerations

1. **HTTPS Only**: All API requests over TLS
2. **JWT Expiration**: Short-lived tokens (15 min) with refresh
3. **Rate Limiting**: Prevent abuse
4. **Input Validation**: Sanitize all inputs
5. **Data Isolation**: Users can only access their own data
6. **CORS**: Restrict to known origins

---

## Deployment Options

### Cloudflare Workers (Recommended)
```bash
# Install Wrangler
npm install -g wrangler

# Create D1 database
wrangler d1 create bike-tracker-db

# Deploy
wrangler deploy
```

### Railway
```yaml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
```

### Fly.io
```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Privacy Features

1. **End-to-End Encryption**: Encrypt workout data on client before upload
2. **Data Export**: Allow users to download all their data
3. **Account Deletion**: Complete data removal on request
4. **Anonymous Mode**: Use without account (local only)

---

## Implementation Phases

### Phase 1: Anonymous Backend (2 weeks)
- Basic API without auth
- Manual export/import
- Proof of concept

### Phase 2: Authentication (2 weeks)
- User registration/login
- JWT-based auth
- Basic sync

### Phase 3: Full Sync (2 weeks)
- Conflict resolution
- Background sync
- Offline queue

### Phase 4: Polish (2 weeks)
- Sharing features
- Data export
- Account management

---

## Cost Estimates

### Cloudflare Workers (Free Tier)
- 100,000 requests/day free
- D1: 5GB free storage
- Estimated: $0 for personal use

### Scaling Costs
- Workers Paid: $5/mo + $0.50/million requests
- D1 Paid: $0.75/million reads, $1.00/million writes
- Estimated: $5-20/mo for ~1000 active users

---

## Related Plans

- [Workout History](./02-workout-history.md) - Local storage first
- [Analytics Dashboard](./07-analytics-dashboard.md) - Server-side analytics
- [Sharing Features](./future/sharing.md) - Share workouts (future)
