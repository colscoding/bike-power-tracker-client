# Plan: TypeScript Migration

## Overview

Migrate the codebase from JavaScript to TypeScript for improved type safety, better IDE support, and reduced runtime errors.

## Priority: Medium
## Effort: Large (2-3 weeks)
## Breaking Changes: None (TypeScript compiles to JavaScript)

---

## Motivation

1. **Type Safety**: Catch type-related bugs at compile time rather than runtime
2. **Better Refactoring**: IDE can safely rename and refactor with confidence
3. **Self-Documenting Code**: Types serve as inline documentation
4. **Improved DX**: Better autocomplete, inline errors, and navigation
5. **Ecosystem**: Most modern libraries ship with TypeScript types

---

## Implementation Phases

### Phase 1: Setup & Configuration (Day 1)

```bash
pnpm add -D typescript @types/node
```

**Create `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "vite.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Update `vite.config.js` → `vite.config.ts`**

### Phase 2: Core Types (Days 2-3)

Create `src/types/index.ts`:

```typescript
// Measurement types
export interface Measurement {
  timestamp: number;
  value: number;
}

export type MetricType = 'power' | 'heartrate' | 'cadence';

export interface MergedDataPoint {
  timestamp: number;
  power: number | null;
  heartrate: number | null;
  cadence: number | null;
}

// Connection types
export interface ConnectionState {
  isConnected: boolean;
  disconnect: (() => void) | null;
}

export interface ConnectionsState {
  power: ConnectionState;
  heartrate: ConnectionState;
  cadence: ConnectionState;
}

// Time state
export interface TimeState {
  running: boolean;
  startTime: number | null;
  endTime: number | null;
}

// Bluetooth sensor connection result
export interface SensorConnection {
  disconnect: () => void;
  addListener: (callback: (entry: Measurement) => void) => void;
}

// Settings
export interface AppSettings {
  power: boolean;
  cadence: boolean;
  heartrate: boolean;
}
```

### Phase 3: Incremental Migration (Days 4-10)

**Migration Order (by dependency depth):**

1. **Standalone utilities (no dependencies)**
   - `src/getTimestring.ts`
   - `src/merge-measurements.ts`

2. **Core state management**
   - `src/MeasurementsState.ts`
   - `src/getInitState.ts`

3. **Data export**
   - `src/create-csv.ts`
   - `src/create-tcx.ts`

4. **Bluetooth connections**
   - `src/connect-power.ts`
   - `src/connect-heartrate.ts`
   - `src/connect-cadence.ts`

5. **UI components**
   - `src/elements.ts`
   - `src/initMetricsDisplay.ts`
   - `src/initConnectionButtons.ts`
   - `src/ui/*.ts`

6. **Main entry**
   - `src/main.ts`

### Phase 4: Strict Mode & Cleanup (Days 11-14)

1. Enable all strict flags in tsconfig
2. Add explicit return types to all functions
3. Replace `any` with proper types
4. Add JSDoc comments for public APIs
5. Update ESLint for TypeScript

**ESLint Configuration (`eslint.config.js`):**
```javascript
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // ... existing config
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
```

---

## Key Type Definitions

### MeasurementsState Class

```typescript
class MeasurementsState {
  heartrate: Measurement[] = [];
  power: Measurement[] = [];
  cadence: Measurement[] = [];

  addHeartrate(entry: Measurement): void { /* ... */ }
  addPower(entry: Measurement): void { /* ... */ }
  addCadence(entry: Measurement): void { /* ... */ }
  add(type: MetricType, entry: Measurement): void { /* ... */ }
}
```

### Web Bluetooth Types

```typescript
// Extend Window interface for Web Bluetooth API
declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
}

// Or use @types/web-bluetooth package
pnpm add -D @types/web-bluetooth
```

---

## Test Migration

1. Keep test files as `.test.ts`
2. Add type assertions in tests
3. Use `vitest` for better TypeScript integration (optional)

```typescript
import { describe, it, expect } from 'vitest';
import { MeasurementsState } from './MeasurementsState';

describe('MeasurementsState', () => {
  it('should add power measurement', () => {
    const state = new MeasurementsState();
    const measurement: Measurement = { timestamp: Date.now(), value: 250 };
    state.addPower(measurement);
    expect(state.power).toHaveLength(1);
  });
});
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Build breaks during migration | Migrate one file at a time, keep tests passing |
| Web Bluetooth types incomplete | Use `@types/web-bluetooth` or custom declarations |
| Increased bundle size | TypeScript compiles away, no runtime cost |
| Learning curve | Types are optional initially, can be strict over time |

---

## Success Criteria

- [ ] All `.js` files converted to `.ts`
- [ ] Zero TypeScript errors with strict mode
- [ ] All tests passing
- [ ] No runtime regressions
- [ ] Improved IDE autocomplete and error detection
- [ ] ESLint TypeScript rules enabled

---

## Related Plans

- [Component Library](./04-component-library.md) - TypeScript enables better component APIs
- [State Management](./06-state-management.md) - Typed state reduces bugs
