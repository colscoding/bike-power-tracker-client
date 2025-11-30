/**
 * Live Chart Component
 *
 * Real-time updating chart for displaying power, heart rate, and cadence
 * during a workout. Uses Chart.js loaded from CDN.
 */

import { BaseComponent } from '../components/base/BaseComponent';
import { loadChartJSWithStreaming, type ChartInstance, type ChartConfiguration, type ChartDataset } from './chartLoader';
import type { ChartDataPoint, ChartConfig } from './types';
import { DEFAULT_CHART_CONFIG } from './types';

const STYLES = `
    :host {
        display: block;
    }

    .chart-container {
        position: relative;
        width: 100%;
        height: 200px;
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
    }

    .legend-color {
        width: 12px;
        height: 3px;
        border-radius: 2px;
    }

    .legend-color.power { background: #FFD700; }
    .legend-color.heartrate { background: #FF4444; }
    .legend-color.cadence { background: #4CAF50; }
`;

export class LiveChart extends BaseComponent {
    private chart: ChartInstance | null = null;
    private config: Required<ChartConfig>;
    private dataBuffer: {
        power: ChartDataPoint[];
        heartrate: ChartDataPoint[];
        cadence: ChartDataPoint[];
    } = {
            power: [],
            heartrate: [],
            cadence: [],
        };
    private isLoading = true;
    private error: string | null = null;
    private refreshInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        super();
        this.config = { ...DEFAULT_CHART_CONFIG };
    }

    static get observedAttributes(): string[] {
        return ['duration', 'show-power', 'show-heartrate', 'show-cadence'];
    }

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

        return `
            <div class="chart-container">
                <canvas id="live-chart"></canvas>
            </div>
            <div class="chart-legend">
                ${this.config.showPower ? '<div class="legend-item"><span class="legend-color power"></span>Power</div>' : ''}
                ${this.config.showHeartrate ? '<div class="legend-item"><span class="legend-color heartrate"></span>Heart Rate</div>' : ''}
                ${this.config.showCadence ? '<div class="legend-item"><span class="legend-color cadence"></span>Cadence</div>' : ''}
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
        this.stopRefresh();
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    protected onAttributeChanged(name: string, _oldValue: string | null, newValue: string | null): void {
        switch (name) {
            case 'duration':
                this.config.duration = newValue ? parseInt(newValue, 10) : DEFAULT_CHART_CONFIG.duration;
                break;
            case 'show-power':
                this.config.showPower = newValue !== 'false';
                break;
            case 'show-heartrate':
                this.config.showHeartrate = newValue !== 'false';
                break;
            case 'show-cadence':
                this.config.showCadence = newValue !== 'false';
                break;
        }
    }

    private async initChart(): Promise<void> {
        try {
            const Chart = await loadChartJSWithStreaming();
            this.isLoading = false;
            this.render();

            // Wait for next frame to ensure canvas is rendered
            await new Promise((resolve) => requestAnimationFrame(resolve));

            const canvas = this.$<HTMLCanvasElement>('#live-chart');
            if (!canvas) {
                throw new Error('Canvas element not found');
            }

            this.chart = new Chart(canvas, this.getChartConfig());
            this.startRefresh();
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Failed to load chart';
            this.isLoading = false;
            this.render();
        }
    }

    private getChartConfig(): ChartConfiguration {
        const datasets: ChartDataset[] = [];

        if (this.config.showPower) {
            datasets.push({
                label: 'Power (W)',
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                data: [],
                yAxisID: 'power',
                tension: 0.3,
                pointRadius: 0,
                borderWidth: 2,
                fill: true,
            });
        }

        if (this.config.showHeartrate) {
            datasets.push({
                label: 'Heart Rate (bpm)',
                borderColor: '#FF4444',
                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                data: [],
                yAxisID: 'heartrate',
                tension: 0.3,
                pointRadius: 0,
                borderWidth: 2,
                fill: false,
            });
        }

        if (this.config.showCadence) {
            datasets.push({
                label: 'Cadence (rpm)',
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                data: [],
                yAxisID: 'cadence',
                tension: 0.3,
                pointRadius: 0,
                borderWidth: 2,
                fill: false,
            });
        }

        return {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0, // Disable for performance
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        type: 'linear',
                        min: () => Date.now() - this.config.duration * 1000,
                        max: () => Date.now(),
                        display: false,
                    },
                    power: this.config.showPower
                        ? {
                            type: 'linear',
                            position: 'left',
                            min: 0,
                            max: this.config.maxPower,
                            title: { display: true, text: 'Power (W)', color: '#FFD700' },
                            ticks: { color: '#FFD700' },
                            grid: { color: 'rgba(255, 215, 0, 0.1)' },
                        }
                        : { display: false },
                    heartrate: this.config.showHeartrate
                        ? {
                            type: 'linear',
                            position: 'right',
                            min: 60,
                            max: this.config.maxHeartrate,
                            title: { display: true, text: 'HR (bpm)', color: '#FF4444' },
                            ticks: { color: '#FF4444' },
                            grid: { drawOnChartArea: false },
                        }
                        : { display: false },
                    cadence: this.config.showCadence
                        ? {
                            type: 'linear',
                            position: 'right',
                            min: 0,
                            max: this.config.maxCadence,
                            display: false, // Hide to reduce clutter
                        }
                        : { display: false },
                },
                plugins: {
                    legend: {
                        display: false, // We use custom legend
                    },
                    tooltip: {
                        enabled: false, // Disable for performance
                    },
                },
            },
        };
    }

    private startRefresh(): void {
        if (this.refreshInterval) return;

        this.refreshInterval = setInterval(() => {
            this.updateChart();
        }, this.config.refreshInterval);
    }

    private stopRefresh(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    private updateChart(): void {
        if (!this.chart) return;

        const now = Date.now();
        const cutoff = now - this.config.duration * 1000;
        let datasetIndex = 0;

        // Update power dataset
        if (this.config.showPower) {
            const powerData = this.dataBuffer.power
                .filter((p) => p.timestamp >= cutoff)
                .map((p) => ({ x: p.timestamp, y: p.value }));
            this.chart.data.datasets[datasetIndex].data = powerData;
            datasetIndex++;
        }

        // Update heartrate dataset
        if (this.config.showHeartrate) {
            const hrData = this.dataBuffer.heartrate
                .filter((p) => p.timestamp >= cutoff)
                .map((p) => ({ x: p.timestamp, y: p.value }));
            this.chart.data.datasets[datasetIndex].data = hrData;
            datasetIndex++;
        }

        // Update cadence dataset
        if (this.config.showCadence) {
            const cadenceData = this.dataBuffer.cadence
                .filter((p) => p.timestamp >= cutoff)
                .map((p) => ({ x: p.timestamp, y: p.value }));
            this.chart.data.datasets[datasetIndex].data = cadenceData;
        }

        this.chart.update('none'); // Update without animation
    }

    /**
     * Add a power measurement
     */
    public addPower(value: number, timestamp?: number): void {
        this.addDataPoint('power', value, timestamp);
    }

    /**
     * Add a heart rate measurement
     */
    public addHeartrate(value: number, timestamp?: number): void {
        this.addDataPoint('heartrate', value, timestamp);
    }

    /**
     * Add a cadence measurement
     */
    public addCadence(value: number, timestamp?: number): void {
        this.addDataPoint('cadence', value, timestamp);
    }

    /**
     * Add a data point to the buffer
     */
    private addDataPoint(type: 'power' | 'heartrate' | 'cadence', value: number, timestamp?: number): void {
        const point: ChartDataPoint = {
            timestamp: timestamp ?? Date.now(),
            value,
        };

        this.dataBuffer[type].push(point);

        // Keep buffer size manageable (2x duration worth of data)
        const maxPoints = (this.config.duration * 2 * 1000) / this.config.refreshInterval;
        if (this.dataBuffer[type].length > maxPoints) {
            this.dataBuffer[type] = this.dataBuffer[type].slice(-Math.floor(maxPoints));
        }
    }

    /**
     * Clear all data
     */
    public clear(): void {
        this.dataBuffer = {
            power: [],
            heartrate: [],
            cadence: [],
        };
        this.updateChart();
    }

    /**
     * Get all buffered data
     */
    public getData(): typeof this.dataBuffer {
        return { ...this.dataBuffer };
    }
}

// Register the component
if (typeof customElements !== 'undefined' && !customElements.get('live-chart')) {
    customElements.define('live-chart', LiveChart);
}
