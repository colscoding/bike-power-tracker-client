import { BaseComponent } from '../base/BaseComponent.js';

export interface MenuItemClickDetail {
    action: string;
}

/**
 * A dropdown menu component (hamburger menu).
 *
 * @element app-menu
 *
 * @fires menu-item-click - Fired when a menu item is clicked, with the action in detail
 *
 * @slot - Default slot for menu items (buttons)
 *
 * @example
 * <app-menu>
 *   <button data-action="export">💾 Export Data</button>
 *   <button data-action="discard">🗑️ Discard Data</button>
 *   <button data-action="settings">⚙️ Settings</button>
 * </app-menu>
 */
export class AppMenu extends BaseComponent {
    private _isOpen = false;

    get isOpen(): boolean {
        return this._isOpen;
    }

    protected styles(): string {
        return `
            :host {
                display: block;
                position: relative;
            }

            .menu-trigger {
                font-size: 24px;
                padding: var(--spacing-sm, 8px);
                cursor: pointer;
                background: transparent;
                border: none;
                color: var(--color-text-primary, #333);
                line-height: 1;
                border-radius: var(--border-radius-sm, 4px);
                transition: background-color var(--transition-fast, 0.15s ease);
            }

            .menu-trigger:hover {
                background-color: rgba(9, 105, 218, 0.08);
            }

            .menu-dropdown {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                margin-top: var(--spacing-sm, 8px);
                background: var(--color-background, white);
                border-radius: var(--border-radius-md, 8px);
                box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.15));
                padding: var(--spacing-sm, 8px);
                min-width: 180px;
                z-index: var(--z-index-dropdown, 100);
            }

            :host([open]) .menu-dropdown {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-xs, 4px);
            }

            ::slotted(button),
            ::slotted(a) {
                padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
                font-size: var(--font-size-sm, 14px);
                border: none;
                border-radius: var(--border-radius-md, 6px);
                background-color: transparent;
                cursor: pointer;
                white-space: nowrap;
                text-align: left;
                transition: background-color var(--transition-fast, 0.15s ease);
                color: var(--color-text-primary, #1f2328);
                font-weight: var(--font-weight-normal, 400);
                text-decoration: none;
                display: block;
                width: 100%;
                box-sizing: border-box;
            }

            ::slotted(button:hover),
            ::slotted(a:hover) {
                background-color: rgba(9, 105, 218, 0.08);
            }

            ::slotted(button:active),
            ::slotted(a:active) {
                background-color: rgba(9, 105, 218, 0.15);
            }
        `;
    }

    protected template(): string {
        return `
            <button class="menu-trigger" aria-label="Menu" aria-expanded="${this._isOpen}">
                ☰
            </button>
            <div class="menu-dropdown" role="menu">
                <slot></slot>
            </div>
        `;
    }

    protected setupEventListeners(): void {
        const trigger = this.$<HTMLButtonElement>('.menu-trigger');
        if (trigger) {
            trigger.addEventListener('click', this.handleTriggerClick.bind(this));
        }

        // Close when clicking outside
        document.addEventListener('click', this.handleOutsideClick.bind(this));

        // Listen for clicks on slotted items
        this.addEventListener('click', this.handleSlotClick.bind(this));
    }

    protected cleanup(): void {
        document.removeEventListener('click', this.handleOutsideClick.bind(this));
    }

    private handleTriggerClick(event: Event): void {
        event.stopPropagation();
        this.toggle();
    }

    private handleOutsideClick(event: Event): void {
        if (!this.contains(event.target as Node)) {
            this.close();
        }
    }

    private handleSlotClick(event: Event): void {
        const target = event.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.tagName === 'A') {
            const action = target.dataset.action;
            if (action) {
                this.emit<MenuItemClickDetail>('menu-item-click', { action });
            }
            this.close();
        }
    }

    /**
     * Toggle the menu open/closed
     */
    public toggle(): void {
        if (this._isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open the menu
     */
    public open(): void {
        this._isOpen = true;
        this.setAttribute('open', '');
        const trigger = this.$<HTMLButtonElement>('.menu-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'true');
        }
    }

    /**
     * Close the menu
     */
    public close(): void {
        this._isOpen = false;
        this.removeAttribute('open');
        const trigger = this.$<HTMLButtonElement>('.menu-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    }
}

// Register the custom element
if (!customElements.get('app-menu')) {
    customElements.define('app-menu', AppMenu);
}
