import { BaseComponent } from '../base/BaseComponent.js';

/**
 * A reusable modal dialog component.
 *
 * @element app-modal
 *
 * @attr {string} title - The title displayed in the modal header
 * @attr {boolean} open - Whether the modal is currently visible
 *
 * @fires modal-close - Fired when the modal is closed (via close button or backdrop click)
 *
 * @slot - Default slot for modal body content
 * @slot footer - Slot for modal footer content (buttons, etc.)
 *
 * @example
 * <app-modal title="Settings" open>
 *   <p>Modal content goes here</p>
 *   <div slot="footer">
 *     <button>Save</button>
 *   </div>
 * </app-modal>
 */
export class AppModal extends BaseComponent {
    static get observedAttributes(): string[] {
        return ['title', 'open'];
    }

    get modalTitle(): string {
        return this.getStringAttribute('title', '');
    }

    get open(): boolean {
        return this.getBooleanAttribute('open');
    }

    protected styles(): string {
        return `
            :host {
                display: none;
                position: fixed;
                z-index: var(--z-index-modal, 1000);
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                align-items: center;
                justify-content: center;
            }

            :host([open]) {
                display: flex;
            }

            .backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
            }

            .modal-content {
                position: relative;
                background-color: var(--color-background, white);
                border-radius: var(--border-radius-lg, 12px);
                width: 90%;
                max-width: 600px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.3));
                z-index: 1;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--spacing-lg, 20px) var(--spacing-lg, 24px);
                border-bottom: 1px solid var(--color-border, #e5e7eb);
            }

            .modal-header h2 {
                font-size: var(--font-size-xl, 24px);
                font-weight: var(--font-weight-semibold, 600);
                color: var(--color-text-primary, #1f2328);
                margin: 0;
            }

            .close-button {
                background: none;
                border: none;
                font-size: 32px;
                color: var(--color-text-secondary, #666);
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--border-radius-sm, 4px);
                transition: background-color var(--transition-fast, 0.15s ease);
                line-height: 1;
            }

            .close-button:hover {
                background-color: rgba(9, 105, 218, 0.08);
            }

            .modal-body {
                padding: var(--spacing-lg, 20px) var(--spacing-lg, 24px);
                overflow-y: auto;
                flex: 1;
            }

            .modal-footer {
                padding: var(--spacing-md, 16px) var(--spacing-lg, 24px);
                border-top: 1px solid var(--color-border, #e5e7eb);
            }

            .modal-footer:empty {
                display: none;
            }
        `;
    }

    protected template(): string {
        return `
            <div class="backdrop"></div>
            <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal-header">
                    <h2 id="modal-title">${this.modalTitle}</h2>
                    <button class="close-button" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <slot></slot>
                </div>
                <div class="modal-footer">
                    <slot name="footer"></slot>
                </div>
            </div>
        `;
    }

    protected setupEventListeners(): void {
        const backdrop = this.$<HTMLDivElement>('.backdrop');
        const closeButton = this.$<HTMLButtonElement>('.close-button');

        if (backdrop) {
            backdrop.addEventListener('click', this.handleClose.bind(this));
        }

        if (closeButton) {
            closeButton.addEventListener('click', this.handleClose.bind(this));
        }

        // Handle escape key
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    protected cleanup(): void {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }

    private handleClose(): void {
        this.emit('modal-close');
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape' && this.open) {
            this.handleClose();
        }
    }

    /**
     * Show the modal
     */
    public show(): void {
        this.setAttribute('open', '');
    }

    /**
     * Hide the modal
     */
    public hide(): void {
        this.removeAttribute('open');
    }
}

// Register the custom element
if (!customElements.get('app-modal')) {
    customElements.define('app-modal', AppModal);
}
