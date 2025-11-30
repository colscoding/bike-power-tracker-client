/**
 * Chart.js CDN Loader
 *
 * Dynamically loads Chart.js and plugins from CDN.
 * This avoids adding dependencies to package.json.
 */

// Chart.js types (simplified for our use case)
export interface ChartInstance {
    data: {
        labels: unknown[];
        datasets: ChartDataset[];
    };
    options: Record<string, unknown>;
    update(mode?: string): void;
    destroy(): void;
}

export interface ChartDataset {
    label: string;
    data: Array<{ x: number; y: number | null }> | number[];
    borderColor: string;
    backgroundColor: string | string[];
    tension?: number;
    pointRadius?: number;
    yAxisID?: string;
    fill?: boolean;
    borderWidth?: number;
}

export interface ChartConstructor {
    new(
        ctx: HTMLCanvasElement | CanvasRenderingContext2D,
        config: ChartConfiguration
    ): ChartInstance;
    register(...items: unknown[]): void;
}

export interface ChartConfiguration {
    type: string;
    data: {
        labels?: unknown[];
        datasets: ChartDataset[];
    };
    options?: Record<string, unknown>;
}

// Global Chart.js reference
let ChartJS: ChartConstructor | null = null;
let loadPromise: Promise<ChartConstructor> | null = null;

/**
 * CDN URLs for Chart.js and plugins
 */
const CDN_URLS = {
    chartjs: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    dateAdapter: 'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js',
    streaming: 'https://cdn.jsdelivr.net/npm/chartjs-plugin-streaming@2.0.0/dist/chartjs-plugin-streaming.min.js',
    zoom: 'https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1/dist/chartjs-plugin-zoom.min.js',
};

/**
 * Load a script from URL
 */
function loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (document.querySelector(`script[src="${url}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
    });
}

/**
 * Load Chart.js and required plugins from CDN
 */
export async function loadChartJS(): Promise<ChartConstructor> {
    // Return cached instance if available
    if (ChartJS) {
        return ChartJS;
    }

    // Return existing promise if loading
    if (loadPromise) {
        return loadPromise;
    }

    loadPromise = (async () => {
        // Load Chart.js first
        await loadScript(CDN_URLS.chartjs);

        // Then load plugins in parallel
        await Promise.all([
            loadScript(CDN_URLS.dateAdapter),
            loadScript(CDN_URLS.zoom),
        ]);

        // Get Chart from global scope
        const Chart = (window as unknown as { Chart: ChartConstructor }).Chart;

        if (!Chart) {
            throw new Error('Chart.js failed to load');
        }

        ChartJS = Chart;
        return Chart;
    })();

    return loadPromise;
}

/**
 * Load Chart.js with streaming plugin (for live charts)
 */
export async function loadChartJSWithStreaming(): Promise<ChartConstructor> {
    // Load base Chart.js first
    const Chart = await loadChartJS();

    // Load streaming plugin
    await loadScript(CDN_URLS.streaming);

    return Chart;
}

/**
 * Check if Chart.js is loaded
 */
export function isChartJSLoaded(): boolean {
    return ChartJS !== null;
}

/**
 * Get the loaded Chart.js instance (throws if not loaded)
 */
export function getChartJS(): ChartConstructor {
    if (!ChartJS) {
        throw new Error('Chart.js not loaded. Call loadChartJS() first.');
    }
    return ChartJS;
}
