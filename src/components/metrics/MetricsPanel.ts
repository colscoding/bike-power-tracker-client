import { BaseComponent } from '../base/BaseComponent.js';

/**
 * A container component for displaying multiple metrics together.
 *
 * @element metrics-panel
 *
 * @attr {boolean} paused - Whether the workout is paused (applies styling to all children)
 *
 * @slot - Default slot for metric-display elements
 *
 * @example
 * <metrics-panel>
 *   <metric-display type="power" value="247"></metric-display>
 *   <metric-display type="heartrate" value="156"></metric-display>
 *   <metric-display type="cadence" value="92"></metric-display>
 * </metrics-panel>
 */
export class MetricsPanel extends BaseComponent {
    static get observedAttributes(): string[] {
        return ['paused'];
    }

    get paused(): boolean {
        return this.getBooleanAttribute('paused');
    }

    protected styles(): string {
        return `
            :host {
                display: flex;
                flex-direction: column;
                justify-content: space-evenly;
                width: 100%;
                height: 100%;
                padding: var(--spacing-md, 16px);
                box-sizing: border-box;
                container-type: size;
            }

            :host([paused]) {
                opacity: 0.5;
                filter: grayscale(50%);
                transition: opacity var(--transition-normal, 0.3s ease),
                            filter var(--transition-normal, 0.3s ease);
            }

            ::slotted(*) {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
    }

    protected template(): string {
        return `<slot></slot>`;
    }

    /**
     * Update all child metric-display elements with the paused state
     */
    protected onAttributeChanged(name: string): void {
        if (name === 'paused') {
            this.updateChildPausedState();
        }
    }

    private updateChildPausedState(): void {
        const metrics = this.querySelectorAll('metric-display');
        metrics.forEach((metric) => {
            if (this.paused) {
                metric.setAttribute('paused', '');
            } else {
                metric.removeAttribute('paused');
            }
        });
    }
}

// Register the custom element
if (!customElements.get('metrics-panel')) {
    customElements.define('metrics-panel', MetricsPanel);
}
