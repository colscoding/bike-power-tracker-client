/**
 * Zone Chart Component
 *
 * Displays time spent in different power/heart rate zones as a doughnut chart.
 * Uses Chart.js loaded from CDN.
 */

import { BaseComponent } from '../components/base/BaseComponent';
import { loadChartJS, type ChartInstance } from './chartLoader';
import type { ZoneDistribution } from './types';
import { formatZoneTime } from './zoneCalculator';

const STYLES = `
    :host {
        display: block;
    }

    .zone-chart-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: var(--color-background, #ffffff);
        border-radius: var(--border-radius-md, 8px);
        border: 1px solid var(--color-border, #e1e4e8);
        padding: var(--spacing-md, 16px);
    }

    .zone-chart-container.loading {
        justify-content: center;
        min-height: 200px;
    }

    .loading-text {
        color: var(--color-text-secondary, #656d76);
        font-size: var(--font-size-sm, 0.875rem);
    }

    .error-text {
        color: var(--color-error, #cf222e);
        font-size: var(--font-size-sm, 0.875rem);
    }

    .chart-title {
        font-size: var(--font-size-md, 1rem);
        font-weight: var(--font-weight-semibold, 600);
        margin-bottom: var(--spacing-md, 16px);
    }

    .chart-wrapper {
        display: flex;
        gap: var(--spacing-lg, 24px);
        align-items: center;
        width: 100%;
    }

    .canvas-container {
        width: 150px;
        height: 150px;
        flex-shrink: 0;
    }

    canvas {
        width: 100% !important;
        height: 100% !important;
    }

    .zone-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs, 4px);
    }

    .zone-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm, 8px);
        font-size: var(--font-size-sm, 0.875rem);
    }

    .zone-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
        flex-shrink: 0;
    }

    .zone-name {
        flex: 1;
    }

    .zone-time {
        font-variant-numeric: tabular-nums;
        color: var(--color-text-secondary, #656d76);
    }

    .zone-percentage {
        font-weight: var(--font-weight-medium, 500);
        min-width: 40px;
        text-align: right;
    }

    .no-data {
        color: var(--color-text-muted, #999999);
        font-size: var(--font-size-sm, 0.875rem);
        text-align: center;
        padding: var(--spacing-lg, 24px);
    }

    @media (max-width: 400px) {
        .chart-wrapper {
            flex-direction: column;
        }
    }
`;

export class ZoneChart extends BaseComponent {
    private chart: ChartInstance | null = null;
    private distribution: ZoneDistribution[] = [];
    private chartTitle: string = 'Zone Distribution';
    private isLoading = true;
    private error: string | null = null;

    static get observedAttributes(): string[] {
        return ['title'];
    }

    protected template(): string {
        if (this.error) {
            return `
                <div class="zone-chart-container loading">
                    <span class="error-text">⚠️ ${this.error}</span>
                </div>
            `;
        }

        if (this.isLoading) {
            return `
                <div class="zone-chart-container loading">
                    <span class="loading-text">Loading chart...</span>
                </div>
            `;
        }

        if (this.distribution.length === 0 || this.distribution.every((z) => z.time === 0)) {
            return `
                <div class="zone-chart-container">
                    <div class="chart-title">${this.chartTitle}</div>
                    <div class="no-data">No zone data to display</div>
                </div>
            `;
        }

        return `
            <div class="zone-chart-container">
                <div class="chart-title">${this.chartTitle}</div>
                <div class="chart-wrapper">
                    <div class="canvas-container">
                        <canvas id="zone-chart"></canvas>
                    </div>
                    <div class="zone-list">
                        ${this.distribution
                .filter((z) => z.time > 0)
                .map(
                    (zone) => `
                            <div class="zone-item">
                                <div class="zone-color" style="background: ${zone.color}"></div>
                                <span class="zone-name">${zone.name}</span>
                                <span class="zone-time">${formatZoneTime(zone.time)}</span>
                                <span class="zone-percentage">${zone.percentage.toFixed(0)}%</span>
                            </div>
                        `
                )
                .join('')}
                    </div>
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

    protected onAttributeChanged(name: string, _oldValue: string | null, newValue: string | null): void {
        if (name === 'title') {
            this.chartTitle = newValue || 'Zone Distribution';
        }
    }

    private async initChart(): Promise<void> {
        try {
            await loadChartJS();
            this.isLoading = false;
            this.render();

            if (this.distribution.length > 0) {
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

        const canvas = this.$<HTMLCanvasElement>('#zone-chart');
        if (!canvas) return;

        if (this.chart) {
            this.chart.destroy();
        }

        // Filter out zones with no time
        const activeZones = this.distribution.filter((z) => z.time > 0);

        this.chart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: activeZones.map((z) => z.name),
                datasets: [
                    {
                        label: 'Time in Zone',
                        data: activeZones.map((z) => z.time / 1000 / 60), // Convert to minutes
                        backgroundColor: activeZones.map((z) => z.color),
                        borderWidth: 2,
                        borderColor: '#fff',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: false, // We use custom legend
                    },
                    tooltip: {
                        callbacks: {
                            label: (context: { dataIndex: number }) => {
                                const zone = activeZones[context.dataIndex];
                                const minutes = Math.floor(zone.time / 1000 / 60);
                                const seconds = Math.floor((zone.time / 1000) % 60);
                                return `${zone.name}: ${minutes}:${seconds.toString().padStart(2, '0')} (${zone.percentage.toFixed(1)}%)`;
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Set the zone distribution data
     */
    public setDistribution(distribution: ZoneDistribution[]): void {
        this.distribution = distribution;

        if (!this.isLoading && !this.error) {
            this.render();
            if (distribution.length > 0) {
                this.renderChart();
            }
        }
    }

    /**
     * Clear the chart
     */
    public clear(): void {
        this.distribution = [];
        this.render();
    }
}

// Register the component
if (typeof customElements !== 'undefined' && !customElements.get('zone-chart')) {
    customElements.define('zone-chart', ZoneChart);
}
