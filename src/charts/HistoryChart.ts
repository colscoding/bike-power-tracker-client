/**
 * History Chart Component
 *
 * Displays a full workout timeline with zoom and pan capabilities.
 * Used for post-workout analysis. Uses Chart.js loaded from CDN.
 */

import { BaseComponent } from '../components/base/BaseComponent';
import { loadChartJS, type ChartInstance } from './chartLoader';
import type { MergedDataPoint } from './types';

const STYLES = `
    :host {
        display: block;
    }

    .chart-container {
        position: relative;
        width: 100%;
        height: 300px;
        background: var(--color-background, #ffffff);
        border-radius: var(--border-radius-md, 8px);
        border: 1px solid var(--color-border, #e1e4e8);
        padding: var(--spacing-sm, 8px);
    }

    .chart-container.loading {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .loading-text {
        color: var(--color-text-secondary, #656d76);
        font-size: var(--font-size-sm, 0.875rem);
    }

    .error-text {
        color: var(--color-error, #cf222e);
        font-size: var(--font-size-sm, 0.875rem);
    }

    canvas {
        width: 100% !important;
        height: 100% !important;
    }

    .chart-controls {
        display: flex;
        justify-content: center;
        gap: var(--spacing-sm, 8px);
        margin-top: var(--spacing-sm, 8px);
    }

    .chart-button {
        padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
        background: var(--color-surface, #f6f8fa);
        border: 1px solid var(--color-border, #e1e4e8);
        border-radius: var(--border-radius-sm, 4px);
        font-size: var(--font-size-xs, 0.75rem);
        cursor: pointer;
        transition: all var(--transition-fast, 0.15s ease);
    }

    .chart-button:hover {
        background: var(--color-border, #e1e4e8);
    }

    .chart-legend {
        display: flex;
        justify-content: center;
        gap: var(--spacing-md, 16px);
        margin-top: var(--spacing-sm, 8px);
        font-size: var(--font-size-xs, 0.75rem);
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs, 4px);
        cursor: pointer;
        opacity: 1;
        transition: opacity var(--transition-fast, 0.15s ease);
    }

    .legend-item.hidden {
        opacity: 0.5;
    }

    .legend-color {
        width: 12px;
        height: 3px;
        border-radius: 2px;
    }

    .legend-color.power { background: #FFD700; }
    .legend-color.heartrate { background: #FF4444; }
    .legend-color.cadence { background: #4CAF50; }

    .no-data {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--color-text-muted, #999999);
        font-size: var(--font-size-sm, 0.875rem);
    }
`;

export class HistoryChart extends BaseComponent {
    private chart: ChartInstance | null = null;
    private data: MergedDataPoint[] = [];
    private isLoading = true;
    private error: string | null = null;
    private visibleTraces = {
        power: true,
        heartrate: true,
        cadence: true,
    };

    protected template(): string {
        if (this.error) {
            return `
                <div class="chart-container loading">
                    <span class="error-text">⚠️ ${this.error}</span>
                </div>
            `;
        }

        if (this.isLoading) {
            return `
                <div class="chart-container loading">
                    <span class="loading-text">Loading chart...</span>
                </div>
            `;
        }

        if (this.data.length === 0) {
            return `
                <div class="chart-container">
                    <div class="no-data">No workout data to display</div>
                </div>
            `;
        }

        return `
            <div class="chart-container">
                <canvas id="history-chart"></canvas>
            </div>
            <div class="chart-controls">
                <button class="chart-button" id="reset-zoom">Reset Zoom</button>
            </div>
            <div class="chart-legend">
                <div class="legend-item ${this.visibleTraces.power ? '' : 'hidden'}" data-trace="power">
                    <span class="legend-color power"></span>Power
                </div>
                <div class="legend-item ${this.visibleTraces.heartrate ? '' : 'hidden'}" data-trace="heartrate">
                    <span class="legend-color heartrate"></span>Heart Rate
                </div>
                <div class="legend-item ${this.visibleTraces.cadence ? '' : 'hidden'}" data-trace="cadence">
                    <span class="legend-color cadence"></span>Cadence
                </div>
            </div>
        `;
    }

    protected styles(): string {
        return STYLES;
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.initChart();
    }

    protected cleanup(): void {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    protected setupEventListeners(): void {
        // Reset zoom button
        this.$<HTMLButtonElement>('#reset-zoom')?.addEventListener('click', () => {
            this.resetZoom();
        });

        // Legend toggle
        this.$$<HTMLDivElement>('.legend-item').forEach((item) => {
            item.addEventListener('click', () => {
                const trace = item.dataset.trace as 'power' | 'heartrate' | 'cadence';
                if (trace) {
                    this.toggleTrace(trace);
                }
            });
        });
    }

    private async initChart(): Promise<void> {
        try {
            await loadChartJS();
            this.isLoading = false;
            this.render();

            if (this.data.length > 0) {
                await this.renderChart();
            }
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to load chart';
            this.isLoading = false;
            this.render();
        }
    }

    private async renderChart(): Promise<void> {
        const { getChartJS } = await import('./chartLoader');
        const Chart = getChartJS();

        // Wait for next frame to ensure canvas is rendered
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const canvas = this.$<HTMLCanvasElement>('#history-chart');
        if (!canvas) return;

        if (this.chart) {
            this.chart.destroy();
        }

        const labels = this.data.map((p) => p.timestamp);
        const startTime = this.data[0]?.timestamp || 0;

        this.chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Power (W)',
                        data: this.data.map((p) => ({ x: p.timestamp, y: p.power })),
                        borderColor: '#FFD700',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        tension: 0.1,
                        pointRadius: 0,
                        borderWidth: 2,
                        fill: true,
                        yAxisID: 'power',
                    },
                    {
                        label: 'Heart Rate (bpm)',
                        data: this.data.map((p) => ({ x: p.timestamp, y: p.heartrate })),
                        borderColor: '#FF4444',
                        backgroundColor: 'transparent',
                        tension: 0.1,
                        pointRadius: 0,
                        borderWidth: 2,
                        fill: false,
                        yAxisID: 'heartrate',
                    },
                    {
                        label: 'Cadence (rpm)',
                        data: this.data.map((p) => ({ x: p.timestamp, y: p.cadence })),
                        borderColor: '#4CAF50',
                        backgroundColor: 'transparent',
                        tension: 0.1,
                        pointRadius: 0,
                        borderWidth: 2,
                        fill: false,
                        yAxisID: 'cadence',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Time' },
                        ticks: {
                            callback: (value: number) => {
                                const elapsed = Math.floor((value - startTime) / 1000);
                                const mins = Math.floor(elapsed / 60);
                                const secs = elapsed % 60;
                                return `${mins}:${secs.toString().padStart(2, '0')}`;
                            },
                        },
                    },
                    power: {
                        type: 'linear',
                        position: 'left',
                        min: 0,
                        title: { display: true, text: 'Power (W)', color: '#FFD700' },
                        ticks: { color: '#FFD700' },
                        grid: { color: 'rgba(255, 215, 0, 0.1)' },
                        display: this.visibleTraces.power,
                    },
                    heartrate: {
                        type: 'linear',
                        position: 'right',
                        min: 60,
                        max: 200,
                        title: { display: true, text: 'HR (bpm)', color: '#FF4444' },
                        ticks: { color: '#FF4444' },
                        grid: { drawOnChartArea: false },
                        display: this.visibleTraces.heartrate,
                    },
                    cadence: {
                        type: 'linear',
                        position: 'right',
                        min: 0,
                        max: 150,
                        display: false, // Always hidden to reduce clutter
                    },
                },
                plugins: {
                    legend: {
                        display: false, // We use custom legend
                    },
                    tooltip: {
                        callbacks: {
                            title: (items: Array<{ parsed: { x: number } }>) => {
                                if (items.length === 0) return '';
                                const elapsed = Math.floor((items[0].parsed.x - startTime) / 1000);
                                const mins = Math.floor(elapsed / 60);
                                const secs = elapsed % 60;
                                return `Time: ${mins}:${secs.toString().padStart(2, '0')}`;
                            },
                            label: (context: { dataset: { label: string }; parsed: { y: number | null } }) => {
                                const label = context.dataset.label;
                                const value = context.parsed.y;
                                if (value === null) return '';
                                return `${label}: ${Math.round(value)}`;
                            },
                        },
                    },
                    zoom: {
                        zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        },
                    },
                },
            },
        });

        // Apply initial visibility
        this.updateTraceVisibility();
    }

    /**
     * Set the workout data to display
     */
    public setData(data: MergedDataPoint[]): void {
        this.data = data;

        if (!this.isLoading && !this.error) {
            this.render();
            if (data.length > 0) {
                this.renderChart();
            }
        }
    }

    /**
     * Toggle visibility of a trace
     */
    public toggleTrace(trace: 'power' | 'heartrate' | 'cadence'): void {
        this.visibleTraces[trace] = !this.visibleTraces[trace];
        this.updateTraceVisibility();

        // Update legend UI
        const legendItem = this.$<HTMLDivElement>(`.legend-item[data-trace="${trace}"]`);
        if (legendItem) {
            legendItem.classList.toggle('hidden', !this.visibleTraces[trace]);
        }
    }

    private updateTraceVisibility(): void {
        if (!this.chart) return;

        // Dataset indices: 0=power, 1=heartrate, 2=cadence
        const traceIndices = { power: 0, heartrate: 1, cadence: 2 };

        for (const [trace, visible] of Object.entries(this.visibleTraces)) {
            const index = traceIndices[trace as keyof typeof traceIndices];
            const dataset = this.chart.data.datasets[index];
            if (dataset) {
                // Hide by setting borderColor to transparent
                dataset.borderColor = visible
                    ? trace === 'power'
                        ? '#FFD700'
                        : trace === 'heartrate'
                            ? '#FF4444'
                            : '#4CAF50'
                    : 'transparent';
                dataset.backgroundColor = visible && trace === 'power' ? 'rgba(255, 215, 0, 0.1)' : 'transparent';
            }
        }

        this.chart.update('none');
    }

    /**
     * Reset zoom to show all data
     */
    public resetZoom(): void {
        if (!this.chart) return;

        // Access zoom plugin's reset function
        const chartWithZoom = this.chart as ChartInstance & {
            resetZoom?: () => void;
        };

        if (chartWithZoom.resetZoom) {
            chartWithZoom.resetZoom();
        }
    }

    /**
     * Clear all data
     */
    public clear(): void {
        this.data = [];
        this.render();
    }
}

// Register the component
if (typeof customElements !== 'undefined' && !customElements.get('history-chart')) {
    customElements.define('history-chart', HistoryChart);
}
