/**
 * Base class for all Web Components in the application.
 * Provides common functionality for Shadow DOM, rendering, and event handling.
 */
export abstract class BaseComponent extends HTMLElement {
    private _initialized = false;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    /**
     * Lifecycle: Called when element is added to the DOM
     */
    connectedCallback(): void {
        if (!this._initialized) {
            this.render();
            this._initialized = true;
        }
        this.setupEventListeners();
    }

    /**
     * Lifecycle: Called when element is removed from the DOM
     */
    disconnectedCallback(): void {
        this.cleanup();
    }

    /**
     * Lifecycle: Define which attributes to observe for changes
     */
    static get observedAttributes(): string[] {
        return [];
    }

    /**
     * Lifecycle: Called when an observed attribute changes
     */
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        if (oldValue !== newValue && this._initialized) {
            this.onAttributeChanged(name, oldValue, newValue);
            this.render();
        }
    }

    /**
     * Override in subclasses to handle specific attribute changes
     */
    protected onAttributeChanged(
        _name: string,
        _oldValue: string | null,
        _newValue: string | null
    ): void {
        // Override in subclasses if needed
    }

    /**
     * Render the component's template and styles into the Shadow DOM
     */
    protected render(): void {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            <style>${this.styles()}</style>
            ${this.template()}
        `;

        // Re-attach event listeners after re-render
        if (this._initialized) {
            this.setupEventListeners();
        }
    }

    /**
     * Override to provide component styles
     */
    protected styles(): string {
        return '';
    }

    /**
     * Override to provide component template
     */
    protected abstract template(): string;

    /**
     * Override to set up event listeners
     */
    protected setupEventListeners(): void {
        // Override in subclasses
    }

    /**
     * Override to clean up resources
     */
    protected cleanup(): void {
        // Override in subclasses
    }

    /**
     * Emit a custom event that bubbles and crosses Shadow DOM boundaries
     */
    protected emit<T>(eventName: string, detail?: T): void {
        this.dispatchEvent(
            new CustomEvent(eventName, {
                bubbles: true,
                composed: true, // Crosses shadow DOM boundary
                detail,
            })
        );
    }

    /**
     * Query a single element in the Shadow DOM
     */
    protected $<T extends Element = Element>(selector: string): T | null {
        return this.shadowRoot?.querySelector<T>(selector) ?? null;
    }

    /**
     * Query all matching elements in the Shadow DOM
     */
    protected $$<T extends Element = Element>(selector: string): NodeListOf<T> {
        return this.shadowRoot?.querySelectorAll<T>(selector) ?? ([] as unknown as NodeListOf<T>);
    }

    /**
     * Helper to get a boolean attribute
     */
    protected getBooleanAttribute(name: string): boolean {
        return this.hasAttribute(name);
    }

    /**
     * Helper to get a string attribute with a default value
     */
    protected getStringAttribute(name: string, defaultValue = ''): string {
        return this.getAttribute(name) ?? defaultValue;
    }

    /**
     * Helper to get a numeric attribute with a default value
     */
    protected getNumberAttribute(name: string, defaultValue = 0): number {
        const value = this.getAttribute(name);
        return value !== null ? Number(value) : defaultValue;
    }
}
