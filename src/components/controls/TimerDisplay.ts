import { BaseComponent } from '../base/BaseComponent.js';

/**
 * A component that displays the workout timer.
 *
 * @element timer-display
 *
 * @attr {string} time - The time string to display (e.g., "00:15:32")
 * @attr {boolean} running - Whether the timer is currently running
 * @attr {boolean} clickable - Whether clicking the timer should emit an event
 *
 * @fires timer-click - Fired when the timer is clicked (if clickable)
 *
 * @example
 * <timer-display time="00:15:32" running clickable></timer-display>
 */
export class TimerDisplay extends BaseComponent {
    static get observedAttributes(): string[] {
        return ['time', 'running', 'clickable'];
    }

    get time(): string {
        return this.getStringAttribute('time', '00:00:00');
    }

    get running(): boolean {
        return this.getBooleanAttribute('running');
    }

    get clickable(): boolean {
        return this.getBooleanAttribute('clickable');
    }

    protected styles(): string {
        return `
            :host {
                display: inline-block;
            }

            .timer {
                font-size: var(--font-size-2xl, 2em);
                font-weight: var(--font-weight-bold, 700);
                color: var(--color-text-primary, #333);
                white-space: nowrap;
                font-variant-numeric: tabular-nums;
                user-select: none;
            }

            :host([clickable]) .timer {
                cursor: pointer;
            }

            :host([clickable]) .timer:hover {
                color: var(--color-primary, #2196f3);
            }

            :host(:not([running])) .timer {
                color: var(--color-text-secondary, #656d76);
            }
        `;
    }

    protected template(): string {
        return `
            <div class="timer" role="timer" aria-live="polite">
                ${this.time}
            </div>
        `;
    }

    protected setupEventListeners(): void {
        if (this.clickable) {
            const timer = this.$<HTMLDivElement>('.timer');
            if (timer) {
                timer.addEventListener('click', this.handleClick.bind(this));
            }
        }
    }

    private handleClick(): void {
        if (this.clickable) {
            this.emit('timer-click');
        }
    }

    /**
     * Update the displayed time without a full re-render
     */
    public updateTime(time: string): void {
        const timer = this.$<HTMLDivElement>('.timer');
        if (timer && timer.textContent !== time) {
            timer.textContent = time;
            this.setAttribute('time', time);
        }
    }
}

// Register the custom element
if (!customElements.get('timer-display')) {
    customElements.define('timer-display', TimerDisplay);
}
