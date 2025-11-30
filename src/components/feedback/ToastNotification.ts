import type { NotificationType } from '../../types/index.js';
import { BaseComponent } from '../base/BaseComponent.js';

/**
 * A toast notification component.
 *
 * @element toast-notification
 *
 * @attr {string} message - The message to display
 * @attr {string} type - The notification type: 'info' | 'success' | 'error'
 * @attr {number} duration - How long to show the notification (ms), 0 for persistent
 *
 * @fires notification-dismiss - Fired when the notification is dismissed
 *
 * @example
 * <toast-notification message="Data saved!" type="success" duration="3000"></toast-notification>
 */
export class ToastNotification extends BaseComponent {
    private _dismissTimeout: ReturnType<typeof setTimeout> | null = null;

    static get observedAttributes(): string[] {
        return ['message', 'type', 'duration'];
    }

    get message(): string {
        return this.getStringAttribute('message', '');
    }

    get type(): NotificationType {
        return (this.getStringAttribute('type', 'info') as NotificationType) || 'info';
    }

    get duration(): number {
        return this.getNumberAttribute('duration', 3000);
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.startDismissTimer();
    }

    disconnectedCallback(): void {
        this.clearDismissTimer();
        super.disconnectedCallback();
    }

    protected styles(): string {
        return `
            :host {
                display: block;
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                z-index: var(--z-index-notification, 1001);
                max-width: 90%;
                animation: slideIn 0.3s ease;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }

            :host(.dismissing) {
                animation: slideOut 0.3s ease forwards;
            }

            @keyframes slideOut {
                from {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-10px);
                }
            }

            .notification {
                padding: var(--spacing-md, 12px) var(--spacing-lg, 24px);
                border-radius: var(--border-radius-md, 8px);
                box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.3));
                font-size: var(--font-size-sm, 14px);
                text-align: center;
                color: white;
            }

            .notification.info {
                background: var(--color-primary, #2196f3);
            }

            .notification.success {
                background: var(--color-success, #1f883d);
            }

            .notification.error {
                background: var(--color-error, #cf222e);
            }
        `;
    }

    protected template(): string {
        return `
            <div class="notification ${this.type}" role="alert">
                ${this.message}
            </div>
        `;
    }

    private startDismissTimer(): void {
        if (this.duration > 0) {
            this._dismissTimeout = setTimeout(() => {
                this.dismiss();
            }, this.duration);
        }
    }

    private clearDismissTimer(): void {
        if (this._dismissTimeout !== null) {
            clearTimeout(this._dismissTimeout);
            this._dismissTimeout = null;
        }
    }

    /**
     * Dismiss the notification with animation
     */
    public dismiss(): void {
        this.clearDismissTimer();
        this.classList.add('dismissing');

        setTimeout(() => {
            this.emit('notification-dismiss');
            this.remove();
        }, 300);
    }
}

// Register the custom element
if (!customElements.get('toast-notification')) {
    customElements.define('toast-notification', ToastNotification);
}

/**
 * Helper function to show a toast notification
 */
export function showToast(message: string, type: NotificationType = 'info', duration = 3000): ToastNotification {
    const toast = document.createElement('toast-notification') as ToastNotification;
    toast.setAttribute('message', message);
    toast.setAttribute('type', type);
    toast.setAttribute('duration', String(duration));
    document.body.appendChild(toast);
    return toast;
}
