import { BaseComponent } from '../base/BaseComponent.js';
import type { MetricType } from '../../types/index.js';

interface ButtonConfig {
    emoji: string;
    label: string;
}

const BUTTON_CONFIGS: Record<MetricType, ButtonConfig> = {
    power: { emoji: '⚡', label: 'Power' },
    heartrate: { emoji: '❤️', label: 'Heartrate' },
    cadence: { emoji: '🚴', label: 'Cadence' },
};

export interface ConnectionToggleDetail {
    type: MetricType;
}

/**
 * A button for connecting/disconnecting Bluetooth sensors.
 *
 * @element connect-button
 *
 * @attr {string} type - The type of sensor: 'power' | 'heartrate' | 'cadence'
 * @attr {boolean} connected - Whether the sensor is currently connected
 * @attr {boolean} connecting - Whether a connection is in progress
 *
 * @fires connection-toggle - Fired when the button is clicked
 *
 * @example
 * <connect-button type="power"></connect-button>
 * <connect-button type="heartrate" connected></connect-button>
 */
export class ConnectButton extends BaseComponent {
    static get observedAttributes(): string[] {
        return ['type', 'connected', 'connecting'];
    }

    get type(): MetricType {
        return (this.getStringAttribute('type', 'power') as MetricType) || 'power';
    }

    get connected(): boolean {
        return this.getBooleanAttribute('connected');
    }

    get connecting(): boolean {
        return this.getBooleanAttribute('connecting');
    }

    get config(): ButtonConfig {
        return BUTTON_CONFIGS[this.type] || BUTTON_CONFIGS.power;
    }

    protected styles(): string {
        return `
            :host {
                display: block;
            }

            button {
                width: 100%;
                padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
                font-size: var(--font-size-sm, 14px);
                font-family: var(--font-family, system-ui, sans-serif);
                border: none;
                border-radius: var(--border-radius-md, 6px);
                background-color: transparent;
                cursor: pointer;
                white-space: nowrap;
                text-align: left;
                transition: background-color var(--transition-fast, 0.15s ease);
                color: var(--color-text-primary, #1f2328);
                font-weight: var(--font-weight-normal, 400);
            }

            button:hover:not(:disabled) {
                background-color: rgba(9, 105, 218, 0.08);
            }

            button:active:not(:disabled) {
                background-color: rgba(9, 105, 218, 0.15);
            }

            button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            button.connecting {
                animation: pulse 1s infinite;
            }

            button.connected {
                color: var(--color-success, #1f883d);
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
    }

    protected template(): string {
        const { emoji, label } = this.config;
        const action = this.connected ? 'Disconnect' : 'Connect';
        const classes = [
            this.connecting ? 'connecting' : '',
            this.connected ? 'connected' : '',
        ]
            .filter(Boolean)
            .join(' ');

        return `
            <button class="${classes}" ${this.connecting ? 'disabled' : ''}>
                ${emoji} ${action} ${label}
            </button>
        `;
    }

    protected setupEventListeners(): void {
        const button = this.$<HTMLButtonElement>('button');
        if (button) {
            button.addEventListener('click', this.handleClick.bind(this));
        }
    }

    private handleClick(): void {
        if (this.connecting) return;

        this.emit<ConnectionToggleDetail>('connection-toggle', { type: this.type });
    }
}

// Register the custom element
if (!customElements.get('connect-button')) {
    customElements.define('connect-button', ConnectButton);
}
