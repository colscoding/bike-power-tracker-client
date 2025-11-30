import { BaseComponent } from '../base/BaseComponent.js';

/**
 * A button for starting and stopping workouts.
 *
 * @element start-stop-button
 *
 * @attr {boolean} running - Whether the workout is currently running
 *
 * @fires start-stop-click - Fired when the button is clicked
 *
 * @example
 * <start-stop-button></start-stop-button>
 * <start-stop-button running></start-stop-button>
 */
export class StartStopButton extends BaseComponent {
    static get observedAttributes(): string[] {
        return ['running'];
    }

    get running(): boolean {
        return this.getBooleanAttribute('running');
    }

    protected styles(): string {
        return `
            :host {
                display: inline-block;
            }

            button {
                padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
                font-size: 20px;
                border: none;
                border-radius: var(--border-radius-md, 6px);
                background-color: transparent;
                cursor: pointer;
                transition: background-color var(--transition-fast, 0.15s ease);
                line-height: 1;
            }

            button:hover {
                background-color: rgba(9, 105, 218, 0.08);
            }

            button:active {
                background-color: rgba(9, 105, 218, 0.15);
            }
        `;
    }

    protected template(): string {
        const emoji = this.running ? '⏹️' : '▶️';
        const label = this.running ? 'Stop' : 'Start';

        return `
            <button aria-label="${label}" title="${label}">
                ${emoji}
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
        this.emit('start-stop-click');
    }
}

// Register the custom element
if (!customElements.get('start-stop-button')) {
    customElements.define('start-stop-button', StartStopButton);
}
