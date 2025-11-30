import { BaseComponent } from '../base/BaseComponent.js';
import type { MetricType } from '../../types/index.js';

interface MetricConfig {
    label: string;
    unit: string;
    emoji: string;
    color: string;
}

const METRIC_CONFIGS: Record<MetricType, MetricConfig> = {
    power: { label: 'Power', unit: 'W', emoji: '⚡', color: 'var(--color-power, #FFD700)' },
    heartrate: { label: 'Heart Rate', unit: 'bpm', emoji: '❤️', color: 'var(--color-heartrate, #FF4444)' },
    cadence: { label: 'Cadence', unit: 'rpm', emoji: '🚴', color: 'var(--color-cadence, #4CAF50)' },
};

/**
 * A component that displays a single metric value (power, heart rate, or cadence).
 *
 * @element metric-display
 *
 * @attr {string} type - The type of metric: 'power' | 'heartrate' | 'cadence'
 * @attr {string} value - The current value to display (or '--' for no data)
 * @attr {boolean} connected - Whether the sensor is connected
 * @attr {boolean} paused - Whether the workout is paused (dims the display)
 *
 * @example
 * <metric-display type="power" value="247" connected></metric-display>
 */
export class MetricDisplay extends BaseComponent {
    static get observedAttributes(): string[] {
        return ['type', 'value', 'connected', 'paused'];
    }

    get type(): MetricType {
        return (this.getStringAttribute('type', 'power') as MetricType) || 'power';
    }

    get value(): string {
        return this.getStringAttribute('value', '--');
    }

    get connected(): boolean {
        return this.getBooleanAttribute('connected');
    }

    get paused(): boolean {
        return this.getBooleanAttribute('paused');
    }

    get config(): MetricConfig {
        return METRIC_CONFIGS[this.type] || METRIC_CONFIGS.power;
    }

    protected styles(): string {
        return `
            :host {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: var(--spacing-md, 1rem);
                flex: 1;
                container-type: size;
            }

            :host([paused]) {
                opacity: 0.5;
                filter: grayscale(50%);
                transition: opacity var(--transition-normal, 0.3s ease),
                            filter var(--transition-normal, 0.3s ease);
            }

            .label {
                font-size: clamp(0.8rem, 4cqh, 1.2rem);
                color: var(--color-text-secondary, #666);
                margin-bottom: 0.5rem;
                font-weight: var(--font-weight-medium, 500);
            }

            .value {
                font-size: clamp(2rem, 18cqh, 6rem);
                font-weight: var(--font-weight-bold, 700);
                color: var(--metric-color);
                line-height: 0.9;
                transition: color var(--transition-fast, 0.15s ease);
            }

            .value.disconnected {
                color: var(--color-text-muted, #999);
            }

            .unit {
                font-size: clamp(0.6rem, 3cqh, 1rem);
                color: var(--color-text-muted, #999);
                margin-top: 0.25rem;
                min-height: 1.2em;
            }
        `;
    }

    protected template(): string {
        const { label, unit, color } = this.config;
        const displayValue = this.value;
        const showUnit = displayValue !== '--' && displayValue !== '';
        const valueClass = this.connected ? 'value' : 'value disconnected';

        return `
            <div class="label">${label}</div>
            <div class="${valueClass}" style="--metric-color: ${color}">${displayValue}</div>
            <div class="unit">${showUnit ? unit : ''}</div>
        `;
    }
}

// Register the custom element
if (!customElements.get('metric-display')) {
    customElements.define('metric-display', MetricDisplay);
}
