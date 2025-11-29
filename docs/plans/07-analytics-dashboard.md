# Plan: Analytics Dashboard

## Overview

Build a comprehensive analytics dashboard for reviewing workout performance, tracking progress over time, and identifying trends.

## Priority: Medium
## Effort: Large (3-4 weeks)
## Type: Feature (Client-Only or Backend-Enhanced)

---

## Motivation

1. **Performance Tracking**: See improvement over time
2. **Training Insights**: Understand power zones, HR patterns
3. **Goal Setting**: Track progress toward objectives
4. **Comparison**: Compare workouts side-by-side
5. **Motivation**: Visual progress is encouraging

---

## Feature Overview

### Dashboard Views

1. **Overview** - Key metrics at a glance
2. **Workout Detail** - Deep dive into single workout
3. **Trends** - Progress over weeks/months
4. **Records** - Personal bests and achievements
5. **Zones** - Time in power/HR zones

---

## Dashboard Layout

```
┌────────────────────────────────────────────────────────┐
│  ← Back to Tracker    Analytics Dashboard    ⚙️       │
├────────────────────────────────────────────────────────┤
│ Overview | Trends | Records | Zones | Compare         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ Workouts│ │  Time   │ │ Avg Pwr │ │ Avg HR  │      │
│  │   12    │ │ 8:32:15 │ │  187W   │ │ 142bpm  │      │
│  │ this wk │ │ this wk │ │  ↑ 5%   │ │  ↓ 2%   │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │                 Weekly Summary                  │   │
│  │   ████████████████████████░░░░░░░ 187W avg     │   │
│  │   Mon Tue Wed Thu Fri Sat Sun                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  Recent Workouts                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │ Today 45:00   │ 195W │ 148bpm │ 88rpm │  ▶    │   │
│  │ Yesterday 1:02│ 178W │ 135bpm │ 92rpm │  ▶    │   │
│  │ Mon 30:00     │ 210W │ 155bpm │ 85rpm │  ▶    │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Data Models

```javascript
// src/analytics/models.js

/**
 * @typedef {Object} WorkoutSummary
 * @property {string} id
 * @property {Date} date
 * @property {number} duration - seconds
 * @property {number} avgPower
 * @property {number} maxPower
 * @property {number} normalizedPower
 * @property {number} avgHeartrate
 * @property {number} maxHeartrate
 * @property {number} avgCadence
 * @property {number} workKJ - total work in kilojoules
 * @property {Object} zones - time in each zone
 */

/**
 * @typedef {Object} TrendData
 * @property {string} period - 'day' | 'week' | 'month'
 * @property {Date} startDate
 * @property {Date} endDate
 * @property {number} workoutCount
 * @property {number} totalDuration
 * @property {number} avgPower
 * @property {number} avgHeartrate
 * @property {number} totalWorkKJ
 */

/**
 * @typedef {Object} PersonalRecord
 * @property {string} type - 'maxPower' | '20minPower' | '5minPower' etc
 * @property {number} value
 * @property {Date} date
 * @property {string} workoutId
 */
```

---

## Analytics Engine

```javascript
// src/analytics/engine.js

export class AnalyticsEngine {
  constructor(workoutStore) {
    this.workoutStore = workoutStore;
  }
  
  /**
   * Calculate summary for a single workout
   */
  calculateWorkoutSummary(workout) {
    const { measurements, startedAt, endedAt } = workout;
    
    const powers = measurements
      .filter(m => m.power != null)
      .map(m => m.power);
    
    const heartrates = measurements
      .filter(m => m.heartrate != null)
      .map(m => m.heartrate);
    
    const cadences = measurements
      .filter(m => m.cadence != null)
      .map(m => m.cadence);
    
    return {
      id: workout.id,
      date: new Date(startedAt),
      duration: Math.floor((new Date(endedAt) - new Date(startedAt)) / 1000),
      avgPower: this.average(powers),
      maxPower: Math.max(...powers, 0),
      normalizedPower: this.calculateNP(powers),
      avgHeartrate: this.average(heartrates),
      maxHeartrate: Math.max(...heartrates, 0),
      avgCadence: this.average(cadences),
      workKJ: this.calculateWork(powers),
      zones: this.calculateZones(powers, heartrates)
    };
  }
  
  /**
   * Calculate Normalized Power (NP)
   * 30-second rolling average raised to 4th power, averaged, then 4th root
   */
  calculateNP(powers) {
    if (powers.length < 30) return this.average(powers);
    
    const rollingAvg = [];
    for (let i = 29; i < powers.length; i++) {
      const window = powers.slice(i - 29, i + 1);
      rollingAvg.push(this.average(window));
    }
    
    const raised = rollingAvg.map(p => Math.pow(p, 4));
    const avgRaised = this.average(raised);
    return Math.round(Math.pow(avgRaised, 0.25));
  }
  
  /**
   * Calculate total work in kJ
   */
  calculateWork(powers) {
    // Assuming 1 second intervals
    const joules = powers.reduce((sum, p) => sum + (p || 0), 0);
    return Math.round(joules / 1000);
  }
  
  /**
   * Calculate time in zones
   */
  calculateZones(powers, heartrates) {
    // Power zones (% of FTP, assuming 200W FTP for demo)
    const ftp = 200;
    const powerZones = {
      z1: 0, // Active Recovery (< 55%)
      z2: 0, // Endurance (55-75%)
      z3: 0, // Tempo (75-90%)
      z4: 0, // Threshold (90-105%)
      z5: 0, // VO2max (105-120%)
      z6: 0  // Anaerobic (> 120%)
    };
    
    powers.forEach(p => {
      const pct = p / ftp;
      if (pct < 0.55) powerZones.z1++;
      else if (pct < 0.75) powerZones.z2++;
      else if (pct < 0.90) powerZones.z3++;
      else if (pct < 1.05) powerZones.z4++;
      else if (pct < 1.20) powerZones.z5++;
      else powerZones.z6++;
    });
    
    return { power: powerZones };
  }
  
  /**
   * Calculate trends over a period
   */
  async calculateTrends(period = 'week', count = 8) {
    const workouts = await this.workoutStore.getAll();
    const now = new Date();
    const trends = [];
    
    for (let i = 0; i < count; i++) {
      const { startDate, endDate } = this.getPeriodBounds(now, period, i);
      
      const periodWorkouts = workouts.filter(w => {
        const date = new Date(w.startedAt);
        return date >= startDate && date < endDate;
      });
      
      const summaries = periodWorkouts.map(w => this.calculateWorkoutSummary(w));
      
      trends.push({
        period,
        startDate,
        endDate,
        workoutCount: summaries.length,
        totalDuration: summaries.reduce((s, w) => s + w.duration, 0),
        avgPower: this.average(summaries.map(s => s.avgPower)),
        avgHeartrate: this.average(summaries.map(s => s.avgHeartrate)),
        totalWorkKJ: summaries.reduce((s, w) => s + w.workKJ, 0)
      });
    }
    
    return trends.reverse(); // Oldest first
  }
  
  /**
   * Find personal records
   */
  async findRecords() {
    const workouts = await this.workoutStore.getAll();
    const records = {};
    
    for (const workout of workouts) {
      const summary = this.calculateWorkoutSummary(workout);
      
      // Max power
      if (!records.maxPower || summary.maxPower > records.maxPower.value) {
        records.maxPower = {
          type: 'maxPower',
          value: summary.maxPower,
          date: summary.date,
          workoutId: workout.id
        };
      }
      
      // Best average power (workouts > 20 min)
      if (summary.duration >= 1200) {
        if (!records.avgPower20 || summary.avgPower > records.avgPower20.value) {
          records.avgPower20 = {
            type: '20minPower',
            value: summary.avgPower,
            date: summary.date,
            workoutId: workout.id
          };
        }
      }
      
      // Best NP
      if (!records.normalizedPower || summary.normalizedPower > records.normalizedPower.value) {
        records.normalizedPower = {
          type: 'normalizedPower',
          value: summary.normalizedPower,
          date: summary.date,
          workoutId: workout.id
        };
      }
    }
    
    return Object.values(records);
  }
  
  // Helpers
  average(arr) {
    if (!arr.length) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }
  
  getPeriodBounds(date, period, offset) {
    const start = new Date(date);
    const end = new Date(date);
    
    if (period === 'day') {
      start.setDate(start.getDate() - offset);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 1);
    } else if (period === 'week') {
      start.setDate(start.getDate() - (offset * 7) - start.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 7);
    } else if (period === 'month') {
      start.setMonth(start.getMonth() - offset, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 1);
    }
    
    return { startDate: start, endDate: end };
  }
}
```

---

## Dashboard Components

### Overview Panel

```javascript
// src/analytics/components/OverviewPanel.js

export class OverviewPanel {
  constructor(container, analytics) {
    this.container = container;
    this.analytics = analytics;
  }
  
  async render() {
    const [thisWeek, lastWeek] = await this.analytics.calculateTrends('week', 2);
    const records = await this.analytics.findRecords();
    
    this.container.innerHTML = `
      <div class="overview-grid">
        ${this.renderStatCard('Workouts', thisWeek.workoutCount, lastWeek.workoutCount, 'this week')}
        ${this.renderStatCard('Time', this.formatDuration(thisWeek.totalDuration), this.formatDuration(lastWeek.totalDuration), 'this week')}
        ${this.renderStatCard('Avg Power', `${thisWeek.avgPower}W`, `${lastWeek.avgPower}W`, 'this week')}
        ${this.renderStatCard('Work', `${thisWeek.totalWorkKJ}kJ`, `${lastWeek.totalWorkKJ}kJ`, 'this week')}
      </div>
      
      <div class="records-section">
        <h3>Personal Records</h3>
        ${records.map(r => this.renderRecord(r)).join('')}
      </div>
    `;
  }
  
  renderStatCard(label, value, prevValue, period) {
    const change = this.calculateChange(value, prevValue);
    const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '';
    const color = change > 0 ? 'green' : change < 0 ? 'red' : '';
    
    return `
      <div class="stat-card">
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
        <div class="stat-change ${color}">${arrow} ${Math.abs(change)}%</div>
        <div class="stat-period">${period}</div>
      </div>
    `;
  }
  
  renderRecord(record) {
    return `
      <div class="record-item">
        <span class="record-type">${this.formatRecordType(record.type)}</span>
        <span class="record-value">${record.value}</span>
        <span class="record-date">${record.date.toLocaleDateString()}</span>
      </div>
    `;
  }
  
  calculateChange(current, previous) {
    const curr = parseInt(current) || 0;
    const prev = parseInt(previous) || 1;
    return Math.round(((curr - prev) / prev) * 100);
  }
  
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  }
  
  formatRecordType(type) {
    const labels = {
      maxPower: 'Max Power',
      '20minPower': '20-min Power',
      normalizedPower: 'Normalized Power'
    };
    return labels[type] || type;
  }
}
```

### Trends Chart

```javascript
// src/analytics/components/TrendsChart.js

import Chart from 'chart.js/auto';

export class TrendsChart {
  constructor(container, analytics) {
    this.container = container;
    this.analytics = analytics;
    this.chart = null;
  }
  
  async render(period = 'week', metric = 'avgPower') {
    const trends = await this.analytics.calculateTrends(period, 12);
    
    const canvas = document.createElement('canvas');
    this.container.innerHTML = '';
    this.container.appendChild(canvas);
    
    if (this.chart) this.chart.destroy();
    
    const labels = trends.map(t => this.formatDate(t.startDate, period));
    const data = trends.map(t => t[metric] || 0);
    
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: this.getMetricLabel(metric),
          data,
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: this.getMetricUnit(metric)
            }
          }
        }
      }
    });
  }
  
  formatDate(date, period) {
    if (period === 'day') return date.toLocaleDateString('en', { weekday: 'short' });
    if (period === 'week') return `Week of ${date.getMonth() + 1}/${date.getDate()}`;
    return date.toLocaleDateString('en', { month: 'short' });
  }
  
  getMetricLabel(metric) {
    const labels = {
      avgPower: 'Average Power',
      avgHeartrate: 'Average Heart Rate',
      totalDuration: 'Total Duration',
      totalWorkKJ: 'Total Work',
      workoutCount: 'Workouts'
    };
    return labels[metric] || metric;
  }
  
  getMetricUnit(metric) {
    const units = {
      avgPower: 'Watts',
      avgHeartrate: 'BPM',
      totalDuration: 'Minutes',
      totalWorkKJ: 'kJ',
      workoutCount: 'Count'
    };
    return units[metric] || '';
  }
}
```

### Zone Distribution

```javascript
// src/analytics/components/ZoneChart.js

import Chart from 'chart.js/auto';

export class ZoneChart {
  constructor(container) {
    this.container = container;
    this.chart = null;
  }
  
  render(zones) {
    const canvas = document.createElement('canvas');
    this.container.innerHTML = '';
    this.container.appendChild(canvas);
    
    if (this.chart) this.chart.destroy();
    
    const labels = ['Z1 Recovery', 'Z2 Endurance', 'Z3 Tempo', 'Z4 Threshold', 'Z5 VO2max', 'Z6 Anaerobic'];
    const colors = ['#4CAF50', '#8BC34A', '#FFEB3B', '#FF9800', '#FF5722', '#9C27B0'];
    const data = Object.values(zones.power);
    const total = data.reduce((a, b) => a + b, 0);
    
    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = ctx.raw;
                const pct = ((value / total) * 100).toFixed(1);
                return `${ctx.label}: ${this.formatTime(value)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
```

---

## CSS Styles

```css
/* src/analytics/analytics.css */

.analytics-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.analytics-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e1e4e8;
  padding-bottom: 8px;
}

.analytics-tabs button {
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  font-size: 14px;
  color: #656d76;
}

.analytics-tabs button.active {
  background: #f6f8fa;
  color: #1f2328;
  font-weight: 500;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2328;
}

.stat-label {
  font-size: 0.875rem;
  color: #656d76;
  margin-top: 4px;
}

.stat-change {
  font-size: 0.75rem;
  margin-top: 8px;
}

.stat-change.green { color: #22863a; }
.stat-change.red { color: #cb2431; }

.chart-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  height: 300px;
}

.records-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e1e4e8;
}

.record-item:last-child {
  border-bottom: none;
}

.workout-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.workout-list-item {
  display: grid;
  grid-template-columns: 1fr repeat(3, 80px) 40px;
  padding: 16px;
  border-bottom: 1px solid #e1e4e8;
  align-items: center;
}

.workout-list-item:hover {
  background: #f6f8fa;
}
```

---

## Backend-Enhanced Features

If using the [Cloud Sync](./05-cloud-sync.md) backend:

### Server-Side Analytics

```javascript
// worker/analytics.js

// Calculate FTP estimate from best 20-min power
async function estimateFTP(db, userId) {
  const result = await db.prepare(`
    SELECT MAX(twenty_min_power) as best20
    FROM (
      SELECT workout_id,
             AVG(power) as twenty_min_power
      FROM measurements
      WHERE workout_id IN (
        SELECT id FROM workouts WHERE user_id = ?
      )
      GROUP BY workout_id
      HAVING COUNT(*) >= 1200
    )
  `).bind(userId).first();
  
  return Math.round(result.best20 * 0.95); // 95% of 20-min power
}

// Weekly summary email
async function generateWeeklySummary(db, userId) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { results } = await db.prepare(`
    SELECT 
      COUNT(*) as workouts,
      SUM(duration_seconds) as total_time,
      AVG(json_extract(summary, '$.avgPower')) as avg_power
    FROM workouts
    WHERE user_id = ? 
      AND started_at >= ?
      AND deleted_at IS NULL
  `).bind(userId, weekAgo.toISOString()).all();
  
  return results[0];
}
```

### Comparison With Others (Anonymized)

```javascript
// Compare user's metrics with anonymized percentiles
async function getPercentileRanking(db, metric, value) {
  const { results } = await db.prepare(`
    SELECT 
      COUNT(CASE WHEN value < ? THEN 1 END) * 100.0 / COUNT(*) as percentile
    FROM (
      SELECT json_extract(summary, '$.${metric}') as value
      FROM workouts
      WHERE deleted_at IS NULL
    )
  `).bind(value).first();
  
  return Math.round(results.percentile);
}
```

---

## Implementation Phases

### Phase 1: Basic Dashboard (1 week)
- Workout list view
- Simple stats (totals, averages)
- Single workout detail view

### Phase 2: Charts (1 week)
- Trend charts over time
- Zone distribution
- Workout comparison

### Phase 3: Advanced Analytics (1 week)
- Normalized Power
- FTP estimation
- Personal records

### Phase 4: Polish (1 week)
- Mobile responsive
- Performance optimization
- Export reports

---

## Related Plans

- [Workout History](./02-workout-history.md) - Data source for analytics
- [Charts Visualization](./03-charts-visualization.md) - Real-time charts
- [Cloud Sync](./05-cloud-sync.md) - Server-side analytics
