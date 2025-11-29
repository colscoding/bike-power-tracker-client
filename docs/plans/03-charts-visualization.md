# Plan: Real-Time Charts & Visualization

## Overview

Add live updating charts during workouts and detailed visualization for post-workout analysis using a lightweight charting library.

## Priority: High
## Effort: Medium (1-2 weeks)
## Type: Client-Only Feature

---

## Motivation

1. **Engagement**: Visual feedback makes workouts more engaging
2. **Pacing**: See trends to adjust effort in real-time
3. **Analysis**: Post-workout analysis with detailed charts
4. **Zones**: Visualize time spent in different power/HR zones
5. **Comparison**: Compare current effort to past workouts

---

## Feature Requirements

### Live Workout View
- [ ] Real-time line chart showing last 60 seconds of data
- [ ] Separate traces for power, heartrate, cadence
- [ ] Smooth animation as new data arrives
- [ ] Show current value prominently alongside chart
- [ ] Optional: Rolling average line overlay

### Post-Workout Analysis
- [ ] Full workout timeline chart
- [ ] Zoom and pan on timeline
- [ ] Summary statistics panel
- [ ] Zone distribution pie/bar chart
- [ ] Lap/interval markers (future)

---

## Library Selection

### Recommended: Chart.js + chartjs-plugin-streaming

**Pros:**
- Lightweight (~60KB gzipped)
- Great real-time streaming support
- Excellent documentation
- Active maintenance
- Canvas-based (performant)

**Alternatives Considered:**
| Library | Size | Real-time | Notes |
|---------|------|-----------|-------|
| Chart.js | 60KB | Plugin | Best balance |
| Plotly | 800KB | Built-in | Too heavy |
| D3.js | 75KB | Manual | Low-level, more work |
| uPlot | 20KB | Built-in | Fastest, but less features |
| Lightweight Charts | 40KB | Built-in | Finance-focused |

### Installation

```bash
pnpm add chart.js chartjs-plugin-streaming chartjs-adapter-date-fns date-fns
```

---

## Technical Design

### File Structure

```
src/
├── charts/
│   ├── index.js              # Chart initialization
│   ├── liveChart.js          # Real-time workout chart
│   ├── historyChart.js       # Post-workout analysis
│   ├── zoneChart.js          # Zone distribution
│   └── config.js             # Shared chart configs
└── ui/
    └── chartView.js          # UI integration
```

### Live Chart Implementation

```javascript
// src/charts/liveChart.js
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import StreamingPlugin from 'chartjs-plugin-streaming';

Chart.register(...registerables, StreamingPlugin);

export class LiveChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.chart = null;
    this.dataBuffer = {
      power: [],
      heartrate: [],
      cadence: []
    };
  }
  
  init() {
    this.chart = new Chart(this.canvas, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Power (W)',
            borderColor: '#FFD700',
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            data: [],
            yAxisID: 'power',
            tension: 0.3,
            pointRadius: 0
          },
          {
            label: 'Heart Rate (bpm)',
            borderColor: '#FF4444',
            backgroundColor: 'rgba(255, 68, 68, 0.1)',
            data: [],
            yAxisID: 'heartrate',
            tension: 0.3,
            pointRadius: 0
          },
          {
            label: 'Cadence (rpm)',
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            data: [],
            yAxisID: 'cadence',
            tension: 0.3,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0 // Disable for performance
        },
        scales: {
          x: {
            type: 'realtime',
            realtime: {
              duration: 60000, // 60 seconds window
              refresh: 1000,   // Refresh every second
              delay: 1000,     // 1 second delay
              onRefresh: (chart) => this.onRefresh(chart)
            },
            ticks: {
              display: false
            }
          },
          power: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 500,
            title: { display: true, text: 'Power (W)' }
          },
          heartrate: {
            type: 'linear',
            position: 'right',
            min: 60,
            max: 200,
            title: { display: true, text: 'HR (bpm)' },
            grid: { drawOnChartArea: false }
          },
          cadence: {
            type: 'linear',
            position: 'right',
            min: 0,
            max: 150,
            display: false // Hide to reduce clutter
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
    });
  }
  
  onRefresh(chart) {
    const now = Date.now();
    
    // Get latest values from buffer
    const latest = {
      power: this.getLatestValue('power'),
      heartrate: this.getLatestValue('heartrate'),
      cadence: this.getLatestValue('cadence')
    };
    
    // Add new points
    chart.data.datasets[0].data.push({ x: now, y: latest.power });
    chart.data.datasets[1].data.push({ x: now, y: latest.heartrate });
    chart.data.datasets[2].data.push({ x: now, y: latest.cadence });
  }
  
  getLatestValue(type) {
    const data = this.dataBuffer[type];
    if (data.length === 0) return null;
    return data[data.length - 1].value;
  }
  
  addData(type, measurement) {
    this.dataBuffer[type].push(measurement);
    // Keep buffer size manageable
    if (this.dataBuffer[type].length > 120) {
      this.dataBuffer[type].shift();
    }
  }
  
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
```

### History Chart (Post-Workout)

```javascript
// src/charts/historyChart.js
import { Chart, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(...registerables, zoomPlugin);

export class HistoryChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.chart = null;
  }
  
  render(mergedDataPoints) {
    if (this.chart) {
      this.chart.destroy();
    }
    
    const labels = mergedDataPoints.map(p => new Date(p.timestamp));
    
    this.chart = new Chart(this.canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Power (W)',
            data: mergedDataPoints.map(p => p.power),
            borderColor: '#FFD700',
            fill: false,
            tension: 0.1,
            pointRadius: 0
          },
          {
            label: 'Heart Rate (bpm)',
            data: mergedDataPoints.map(p => p.heartrate),
            borderColor: '#FF4444',
            fill: false,
            tension: 0.1,
            pointRadius: 0,
            yAxisID: 'heartrate'
          },
          {
            label: 'Cadence (rpm)',
            data: mergedDataPoints.map(p => p.cadence),
            borderColor: '#4CAF50',
            fill: false,
            tension: 0.1,
            pointRadius: 0,
            yAxisID: 'cadence'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            type: 'time',
            time: {
              displayFormats: {
                minute: 'HH:mm',
                second: 'HH:mm:ss'
              }
            }
          },
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Power (W)' }
          },
          heartrate: {
            type: 'linear',
            position: 'right',
            min: 60,
            max: 200,
            grid: { drawOnChartArea: false }
          },
          cadence: {
            type: 'linear',
            position: 'right',
            display: false
          }
        },
        plugins: {
          zoom: {
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: 'x'
            },
            pan: {
              enabled: true,
              mode: 'x'
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label;
                const value = context.parsed.y;
                if (value === null) return null;
                return `${label}: ${Math.round(value)}`;
              }
            }
          }
        }
      }
    });
  }
}
```

### Zone Chart

```javascript
// src/charts/zoneChart.js

// Power zones (FTP-based)
const POWER_ZONES = [
  { name: 'Recovery', min: 0, max: 55, color: '#9E9E9E' },
  { name: 'Endurance', min: 55, max: 75, color: '#2196F3' },
  { name: 'Tempo', min: 75, max: 90, color: '#4CAF50' },
  { name: 'Threshold', min: 90, max: 105, color: '#FF9800' },
  { name: 'VO2 Max', min: 105, max: 120, color: '#F44336' },
  { name: 'Anaerobic', min: 120, max: 150, color: '#9C27B0' },
  { name: 'Neuromuscular', min: 150, max: Infinity, color: '#000000' }
];

// Heart rate zones (% of max HR)
const HR_ZONES = [
  { name: 'Zone 1', min: 0, max: 60, color: '#9E9E9E' },
  { name: 'Zone 2', min: 60, max: 70, color: '#2196F3' },
  { name: 'Zone 3', min: 70, max: 80, color: '#4CAF50' },
  { name: 'Zone 4', min: 80, max: 90, color: '#FF9800' },
  { name: 'Zone 5', min: 90, max: 100, color: '#F44336' }
];

export function calculateZoneDistribution(measurements, zones, ftp = 200) {
  const zoneTimes = zones.map(() => 0);
  
  for (let i = 1; i < measurements.length; i++) {
    const value = measurements[i].value;
    const duration = measurements[i].timestamp - measurements[i - 1].timestamp;
    const percentage = (value / ftp) * 100;
    
    for (let z = 0; z < zones.length; z++) {
      if (percentage >= zones[z].min && percentage < zones[z].max) {
        zoneTimes[z] += duration;
        break;
      }
    }
  }
  
  return zones.map((zone, i) => ({
    ...zone,
    time: zoneTimes[i],
    percentage: (zoneTimes[i] / measurements.reduce((a, m, j) => 
      j > 0 ? a + (m.timestamp - measurements[j-1].timestamp) : a, 0)) * 100
  }));
}

export function renderZoneChart(canvasId, distribution) {
  return new Chart(document.getElementById(canvasId), {
    type: 'doughnut',
    data: {
      labels: distribution.map(z => z.name),
      datasets: [{
        data: distribution.map(z => z.time / 1000 / 60), // Convert to minutes
        backgroundColor: distribution.map(z => z.color),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const zone = distribution[context.dataIndex];
              const minutes = Math.floor(zone.time / 1000 / 60);
              return `${zone.name}: ${minutes}min (${zone.percentage.toFixed(1)}%)`;
            }
          }
        }
      }
    }
  });
}
```

---

## UI Layout Changes

### Live Workout Screen

```
┌─────────────────────────────────────┐
│  ☰                    00:15:32   ⏹️  │  Header
├─────────────────────────────────────┤
│                                     │
│         ⚡ 247 W                    │  Current Values
│         ❤️ 156 bpm                  │  (Large)
│         🚴 92 rpm                   │
│                                     │
├─────────────────────────────────────┤
│  [═══════════════════════╗          │
│  ║  Live Chart (60s)     ║          │  Chart Area
│  ║  Power / HR / Cadence ║          │  (Collapsible)
│  ╚═══════════════════════╝          │
└─────────────────────────────────────┘
```

### Post-Workout Summary

```
┌─────────────────────────────────────┐
│  ←  Workout Summary                 │
├─────────────────────────────────────┤
│  📅 Nov 29, 2025  ⏱️ 45:23          │
├─────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │Avg Power│ │ Avg HR  │ │Avg Cad │ │
│  │  185 W  │ │ 142 bpm │ │ 88 rpm │ │
│  │Max: 342 │ │Max: 178 │ │Max: 112│ │
│  └─────────┘ └─────────┘ └────────┘ │
├─────────────────────────────────────┤
│  [Full Workout Timeline Chart]      │
│  [Zoom & Pan enabled]               │
├─────────────────────────────────────┤
│  [Zone Distribution]  [Zone Time]   │
│     🍩 Chart          Zone 2: 15min │
│                       Zone 3: 20min │
│                       Zone 4: 8min  │
├─────────────────────────────────────┤
│  [Export TCX] [Export CSV] [Share]  │
└─────────────────────────────────────┘
```

---

## Performance Considerations

1. **Canvas vs SVG**: Use Canvas (Chart.js) for performance
2. **Data Decimation**: For long workouts, reduce points when zoomed out
3. **Web Workers**: Consider offloading zone calculations
4. **Lazy Loading**: Only load chart libraries when needed

```javascript
// Lazy load charts
const loadCharts = async () => {
  const { LiveChart } = await import('./charts/liveChart.js');
  return new LiveChart('liveCanvas');
};
```

---

## Mobile Considerations

- Touch-friendly zoom/pan gestures
- Responsive chart sizing
- Option to hide chart during workout (battery/performance)
- Landscape orientation for detailed analysis

---

## Related Plans

- [Workout History](./02-workout-history.md) - Store data to visualize
- [Analytics Dashboard](./07-analytics-dashboard.md) - Long-term trends
- [Training Plans](./10-training-plans.md) - Target zones visualization
