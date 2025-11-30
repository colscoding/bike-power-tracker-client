import { BaseComponent } from '../base/BaseComponent.js';

/**
 * The main application header with timer, controls, and menu.
 *
 * @element app-header
 *
 * @attr {string} time - The current workout time (e.g., "00:15:32")
 * @attr {boolean} running - Whether the workout is currently running
 *
 * @fires start-stop-click - Fired when start/stop is clicked (button or timer)
 *
 * @slot menu - Slot for the menu component
 * @slot controls - Slot for additional control buttons
 *
 * @example
 * <app-header time="00:15:32" running>
 *   <app-menu slot="menu">...</app-menu>
 * </app-header>
 */
export class AppHeader extends BaseComponent {
    static get observedAttributes(): string[] {
        return ['time', 'running'];
    }

    get time(): string {
        return this.getStringAttribute('time', '00:00:00');
    }

    get running(): boolean {
        return this.getBooleanAttribute('running');
    }

    protected styles(): string {
        return `
            :host {
                display: block;
                background: var(--color-background, white);
                box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
                padding: 0 2vw;
                min-height: 8vh;
                position: relative;
                z-index: var(--z-index-dropdown, 100);
            }

            .header-content {
                display: grid;
                grid-template-columns: auto 1fr auto;
                align-items: center;
                height: 100%;
                min-height: 8vh;
                gap: var(--spacing-sm, 8px);
            }

            .menu-slot {
                justify-self: start;
            }

            .time-container {
                justify-self: center;
                display: flex;
                align-items: center;
                gap: var(--spacing-xs, 4px);
            }

            .time {
                font-size: var(--font-size-2xl, 2em);
                font-weight: var(--font-weight-bold, 700);
                color: var(--color-text-primary, #333);
                cursor: pointer;
                white-space: nowrap;
                font-variant-numeric: tabular-nums;
                user-select: none;
            }

            .time:hover {
                color: var(--color-primary, #2196f3);
            }

            :host(:not([running])) .time {
                color: var(--color-text-secondary, #656d76);
            }

            .controls {
                justify-self: end;
                display: flex;
                align-items: center;
                gap: var(--spacing-sm, 8px);
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
        const buttonEmoji = this.running ? '⏹️' : '▶️';
        const buttonLabel = this.running ? 'Stop' : 'Start';

        return `
            <div class="header-content">
                <div class="menu-slot">
                    <slot name="menu"></slot>
                </div>
                <div class="time-container">
                    <span class="time" role="timer" aria-live="polite">${this.time}</span>
                </div>
                <div class="controls">
                    <button id="startStop" aria-label="${buttonLabel}" title="${buttonLabel}">
                        ${buttonEmoji}
                    </button>
                    <slot name="controls"></slot>
                </div>
            </div>
        `;
    }

    protected setupEventListeners(): void {
        const startStop = this.$<HTMLButtonElement>('#startStop');
        const time = this.$<HTMLSpanElement>('.time');

        if (startStop) {
            startStop.addEventListener('click', this.handleStartStop.bind(this));
        }

        if (time) {
            time.addEventListener('click', this.handleStartStop.bind(this));
        }
    }

    private handleStartStop(): void {
        this.emit('start-stop-click');
    }

    /**
     * Update the displayed time without a full re-render
     */
    public updateTime(time: string): void {
        const timeEl = this.$<HTMLSpanElement>('.time');
        if (timeEl && timeEl.textContent !== time) {
            timeEl.textContent = time;
        }
    }

    /**
     * Update the running state and button appearance
     */
    public updateRunningState(running: boolean): void {
        if (running) {
            this.setAttribute('running', '');
        } else {
            this.removeAttribute('running');
        }

        const startStop = this.$<HTMLButtonElement>('#startStop');
        if (startStop) {
            startStop.textContent = running ? '⏹️' : '▶️';
            startStop.setAttribute('aria-label', running ? 'Stop' : 'Start');
            startStop.setAttribute('title', running ? 'Stop' : 'Start');
        }
    }
}

// Register the custom element
if (!customElements.get('app-header')) {
    customElements.define('app-header', AppHeader);
}
