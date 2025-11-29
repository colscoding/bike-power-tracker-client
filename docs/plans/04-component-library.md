# Plan: UI Component Library with Web Components

## Overview

Refactor the UI into reusable Web Components for better maintainability, encapsulation, and potential reuse across projects.

## Priority: Low
## Effort: Large (3-4 weeks)
## Type: Code Architecture

---

## Motivation

1. **Encapsulation**: Shadow DOM isolates styles and prevents conflicts
2. **Reusability**: Components work anywhere, even outside this project
3. **Standards-Based**: Native browser API, no framework lock-in
4. **Testability**: Components can be tested in isolation
5. **Maintainability**: Clear boundaries between UI pieces

---

## Current State

The current UI is a mix of:
- Inline HTML in `index.html`
- DOM manipulation in various JS files
- CSS in a single `main.css` file
- No clear component boundaries

---

## Proposed Component Architecture

```
src/
├── components/
│   ├── base/
│   │   └── BaseComponent.js      # Base class with common functionality
│   ├── metrics/
│   │   ├── MetricDisplay.js      # Single metric (power/hr/cadence)
│   │   ├── MetricsPanel.js       # All metrics together
│   │   └── MetricChart.js        # Chart for a metric
│   ├── controls/
│   │   ├── ConnectButton.js      # Bluetooth connect/disconnect
│   │   ├── StartStopButton.js    # Workout control
│   │   └── TimerDisplay.js       # Workout timer
│   ├── layout/
│   │   ├── AppHeader.js          # Top bar with menu
│   │   ├── AppMenu.js            # Hamburger menu
│   │   └── Modal.js              # Reusable modal
│   └── index.js                  # Export all components
└── styles/
    ├── tokens.css                # Design tokens (colors, spacing)
    └── components/               # Component-specific styles
```

---

## Base Component Class

```javascript
// src/components/base/BaseComponent.js

export class BaseComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  // Lifecycle: Called when added to DOM
  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }
  
  // Lifecycle: Called when removed from DOM
  disconnectedCallback() {
    this.cleanup();
  }
  
  // Lifecycle: Called when attributes change
  static get observedAttributes() {
    return [];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }
  
  // Override in subclasses
  render() {
    this.shadowRoot.innerHTML = `
      <style>${this.styles()}</style>
      ${this.template()}
    `;
  }
  
  styles() {
    return '';
  }
  
  template() {
    return '';
  }
  
  setupEventListeners() {}
  
  cleanup() {}
  
  // Utility: Emit custom event
  emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      composed: true, // Crosses shadow DOM boundary
      detail
    }));
  }
  
  // Utility: Query shadow DOM
  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }
  
  $$(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }
}
```

---

## Example Components

### MetricDisplay Component

```javascript
// src/components/metrics/MetricDisplay.js

import { BaseComponent } from '../base/BaseComponent.js';

export class MetricDisplay extends BaseComponent {
  static get observedAttributes() {
    return ['type', 'value', 'connected'];
  }
  
  get type() {
    return this.getAttribute('type') || 'power';
  }
  
  get value() {
    return this.getAttribute('value') || '--';
  }
  
  get connected() {
    return this.hasAttribute('connected');
  }
  
  get config() {
    const configs = {
      power: { label: 'Power', unit: 'W', emoji: '⚡', color: '#FFD700' },
      heartrate: { label: 'Heart Rate', unit: 'bpm', emoji: '❤️', color: '#FF4444' },
      cadence: { label: 'Cadence', unit: 'rpm', emoji: '🚴', color: '#4CAF50' }
    };
    return configs[this.type] || configs.power;
  }
  
  styles() {
    return `
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        flex: 1;
      }
      
      :host([paused]) {
        opacity: 0.5;
        filter: grayscale(50%);
      }
      
      .label {
        font-size: clamp(0.8rem, 4cqh, 1.2rem);
        color: #666;
        margin-bottom: 0.5rem;
      }
      
      .value {
        font-size: clamp(2rem, 18cqh, 6rem);
        font-weight: bold;
        color: var(--metric-color, #333);
        line-height: 1;
      }
      
      .unit {
        font-size: clamp(0.6rem, 3cqh, 1rem);
        color: #999;
        margin-top: 0.25rem;
      }
    `;
  }
  
  template() {
    const { label, unit, color } = this.config;
    return `
      <div class="label">${label}</div>
      <div class="value" style="--metric-color: ${color}">${this.value}</div>
      <div class="unit">${this.value !== '--' ? unit : ''}</div>
    `;
  }
}

customElements.define('metric-display', MetricDisplay);
```

### ConnectButton Component

```javascript
// src/components/controls/ConnectButton.js

import { BaseComponent } from '../base/BaseComponent.js';

export class ConnectButton extends BaseComponent {
  static get observedAttributes() {
    return ['type', 'connected', 'connecting'];
  }
  
  get type() {
    return this.getAttribute('type') || 'power';
  }
  
  get connected() {
    return this.hasAttribute('connected');
  }
  
  get connecting() {
    return this.hasAttribute('connecting');
  }
  
  get config() {
    const configs = {
      power: { emoji: '⚡', label: 'Power' },
      heartrate: { emoji: '❤️', label: 'Heartrate' },
      cadence: { emoji: '🚴', label: 'Cadence' }
    };
    return configs[this.type] || configs.power;
  }
  
  styles() {
    return `
      :host {
        display: block;
      }
      
      button {
        width: 100%;
        padding: 8px 12px;
        font-size: 14px;
        border: none;
        border-radius: 6px;
        background-color: transparent;
        cursor: pointer;
        white-space: nowrap;
        text-align: left;
        transition: background-color 0.15s ease;
        color: #1f2328;
      }
      
      button:hover {
        background-color: rgba(9, 105, 218, 0.08);
      }
      
      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .connecting {
        animation: pulse 1s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
  }
  
  template() {
    const { emoji, label } = this.config;
    const action = this.connected ? 'Disconnect' : 'Connect';
    const className = this.connecting ? 'connecting' : '';
    
    return `
      <button class="${className}" ${this.connecting ? 'disabled' : ''}>
        ${emoji} ${action} ${label}
      </button>
    `;
  }
  
  setupEventListeners() {
    this.$('button').addEventListener('click', () => {
      if (this.connecting) return;
      
      this.emit('connection-toggle', { type: this.type });
    });
  }
}

customElements.define('connect-button', ConnectButton);
```

### App Header Component

```javascript
// src/components/layout/AppHeader.js

import { BaseComponent } from '../base/BaseComponent.js';

export class AppHeader extends BaseComponent {
  static get observedAttributes() {
    return ['time', 'running'];
  }
  
  get time() {
    return this.getAttribute('time') || '00:00:00';
  }
  
  get running() {
    return this.hasAttribute('running');
  }
  
  styles() {
    return `
      :host {
        display: block;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 0 2vw;
        min-height: 8vh;
      }
      
      .header-content {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        height: 100%;
        min-height: 8vh;
      }
      
      .time {
        font-size: 2em;
        font-weight: bold;
        color: #333;
        cursor: pointer;
        text-align: center;
      }
      
      .controls {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      
      button {
        padding: 8px 12px;
        font-size: 20px;
        border: none;
        border-radius: 6px;
        background-color: transparent;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      
      button:hover {
        background-color: rgba(9, 105, 218, 0.08);
      }
      
      ::slotted([slot="menu"]) {
        /* Style slotted menu */
      }
    `;
  }
  
  template() {
    const buttonEmoji = this.running ? '⏹️' : '▶️';
    
    return `
      <div class="header-content">
        <slot name="menu"></slot>
        <div class="time">${this.time}</div>
        <div class="controls">
          <button id="startStop">${buttonEmoji}</button>
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    this.$('#startStop').addEventListener('click', () => {
      this.emit('start-stop-click');
    });
    
    this.$('.time').addEventListener('click', () => {
      this.emit('start-stop-click');
    });
  }
}

customElements.define('app-header', AppHeader);
```

---

## Usage in HTML

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="/src/components/index.js"></script>
</head>
<body>
  <app-header time="00:15:32" running>
    <app-menu slot="menu"></app-menu>
  </app-header>
  
  <main>
    <metrics-panel paused>
      <metric-display type="power" value="247"></metric-display>
      <metric-display type="heartrate" value="156"></metric-display>
      <metric-display type="cadence" value="92"></metric-display>
    </metrics-panel>
  </main>
  
  <script type="module">
    // Listen for events from components
    document.querySelector('app-header').addEventListener('start-stop-click', () => {
      // Handle start/stop
    });
    
    document.querySelectorAll('connect-button').forEach(btn => {
      btn.addEventListener('connection-toggle', (e) => {
        console.log('Toggle connection for:', e.detail.type);
      });
    });
  </script>
</body>
</html>
```

---

## Design Tokens

```css
/* src/styles/tokens.css */

:root {
  /* Colors */
  --color-power: #FFD700;
  --color-heartrate: #FF4444;
  --color-cadence: #4CAF50;
  --color-primary: #2196F3;
  --color-background: #ffffff;
  --color-surface: #f6f8fa;
  --color-text-primary: #1f2328;
  --color-text-secondary: #656d76;
  --color-border: #e1e4e8;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Typography */
  --font-family: system-ui, -apple-system, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  
  /* Borders */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2);
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
}
```

---

## Migration Strategy

### Phase 1: Create New Components (No Changes to Existing)
1. Build components in isolation
2. Create component showcase/demo page
3. Write component tests

### Phase 2: Replace One at a Time
1. Start with simple components (MetricDisplay)
2. Replace in `index.html`, keep existing JS working
3. Gradually migrate event handling

### Phase 3: Clean Up
1. Remove old DOM manipulation code
2. Remove unused CSS
3. Update tests

---

## Testing Web Components

```javascript
// src/components/metrics/MetricDisplay.test.js

import { expect, test } from 'vitest';
import './MetricDisplay.js';

test('MetricDisplay renders with default values', async () => {
  document.body.innerHTML = '<metric-display type="power"></metric-display>';
  const el = document.querySelector('metric-display');
  
  await el.updateComplete; // Wait for render
  
  const value = el.shadowRoot.querySelector('.value');
  expect(value.textContent).toBe('--');
});

test('MetricDisplay updates when value attribute changes', async () => {
  document.body.innerHTML = '<metric-display type="power" value="250"></metric-display>';
  const el = document.querySelector('metric-display');
  
  await el.updateComplete;
  
  const value = el.shadowRoot.querySelector('.value');
  expect(value.textContent).toBe('250');
});

test('MetricDisplay emits connection-toggle event', async () => {
  document.body.innerHTML = '<connect-button type="power"></connect-button>';
  const el = document.querySelector('connect-button');
  
  await el.updateComplete;
  
  let eventFired = false;
  el.addEventListener('connection-toggle', (e) => {
    eventFired = true;
    expect(e.detail.type).toBe('power');
  });
  
  el.shadowRoot.querySelector('button').click();
  expect(eventFired).toBe(true);
});
```

---

## Related Plans

- [TypeScript Migration](./01-typescript-migration.md) - Type components properly
- [Charts Visualization](./03-charts-visualization.md) - Chart components
- [Storybook](./future/storybook.md) - Component documentation (future)
