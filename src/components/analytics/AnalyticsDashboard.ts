import { BaseComponent } from '../base/BaseComponent.js';
import { AnalyticsEngine, TrendData, PersonalRecord, ZoneData } from './AnalyticsEngine.js';

// Chart.js types for CDN usage (minimal types to avoid npm dependency)
interface ChartConfiguration {
    type: string;
    data: {
        labels: string[];
        datasets: Array<{
            label?: string;
            data: number[];
            borderColor?: string;
            backgroundColor?: string | string[];
            fill?: boolean;
            tension?: number;
            pointBackgroundColor?: string;
            pointRadius?: number;
            borderWidth?: number;
        }>;
    };
    options?: {
        responsive?: boolean;
        maintainAspectRatio?: boolean;
        plugins?: {
            legend?: { display?: boolean; position?: string };
            tooltip?: { callbacks?: { label?: (ctx: ChartTooltipContext) => string } };
        };
        scales?: {
            y?: { beginAtZero?: boolean; title?: { display?: boolean; text?: string } };
            x?: { grid?: { display?: boolean } };
        };
    };
}

interface ChartTooltipContext {
    raw: unknown;
    label: string;
}

interface ChartInstance {
    destroy(): void;
}

interface ChartConstructor {
    new(canvas: HTMLCanvasElement, config: ChartConfiguration): ChartInstance;
}

declare global {
    interface Window {
        Chart: ChartConstructor;
    }
}

/**
 * Analytics Dashboard Component
 *
 * A comprehensive dashboard for viewing workout analytics, trends, and records.
 * Uses Chart.js via CDN for visualization.
 *
 * @element analytics-dashboard
 *
 * @attr {boolean} open - Whether the dashboard modal is visible
 *
 * @fires dashboard-close - Fired when the dashboard is closed
 *
 * @example
 * <analytics-dashboard open></analytics-dashboard>
 */
export class AnalyticsDashboard extends BaseComponent {
    private analytics: AnalyticsEngine;
    private trendsChart: ChartInstance | null = null;
    private zonesChart: ChartInstance | null = null;
    private currentTab: 'overview' | 'trends' | 'records' | 'zones' = 'overview';
    private currentPeriod: 'day' | 'week' | 'month' = 'week';
    private currentMetric: string = 'avgPower';
    private chartLoaded = false;

    constructor() {
        super();
        this.analytics = new AnalyticsEngine();
    }

    static get observedAttributes(): string[] {
        return ['open'];
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
                font-family: var(--font-family, system-ui, -apple-system, sans-serif);
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

            .dashboard {
                position: relative;
                background-color: var(--color-background, #ffffff);
                border-radius: var(--border-radius-lg, 12px);
                width: 95%;
                max-width: 1200px;
                height: 90vh;
                display: flex;
                flex-direction: column;
                box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.3));
                z-index: 1;
                overflow: hidden;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--spacing-md, 16px) var(--spacing-lg, 24px);
                border-bottom: 1px solid var(--color-border, #e1e4e8);
                background: var(--color-surface, #f6f8fa);
            }

            .header h1 {
                font-size: var(--font-size-xl, 1.5rem);
                font-weight: var(--font-weight-semibold, 600);
                color: var(--color-text-primary, #1f2328);
                margin: 0;
                display: flex;
                align-items: center;
                gap: var(--spacing-sm, 8px);
            }

            .close-button {
                background: none;
                border: none;
                font-size: 28px;
                color: var(--color-text-secondary, #656d76);
                cursor: pointer;
                padding: var(--spacing-xs, 4px);
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--border-radius-sm, 4px);
                transition: background-color var(--transition-fast, 0.15s ease);
            }

            .close-button:hover {
                background-color: rgba(0, 0, 0, 0.08);
            }

            .tabs {
                display: flex;
                gap: var(--spacing-xs, 4px);
                padding: var(--spacing-sm, 8px) var(--spacing-lg, 24px);
                border-bottom: 1px solid var(--color-border, #e1e4e8);
                overflow-x: auto;
            }

            .tab {
                padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
                border: none;
                background: transparent;
                cursor: pointer;
                border-radius: var(--border-radius-md, 8px);
                font-size: var(--font-size-sm, 0.875rem);
                color: var(--color-text-secondary, #656d76);
                white-space: nowrap;
                transition: all var(--transition-fast, 0.15s ease);
            }

            .tab:hover {
                background: var(--color-surface, #f6f8fa);
            }

            .tab.active {
                background: var(--color-primary, #2196f3);
                color: white;
                font-weight: var(--font-weight-medium, 500);
            }

            .content {
                flex: 1;
                overflow-y: auto;
                padding: var(--spacing-lg, 24px);
            }

            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: var(--color-text-secondary, #656d76);
            }

            .loading::after {
                content: '';
                width: 24px;
                height: 24px;
                margin-left: var(--spacing-sm, 8px);
                border: 2px solid var(--color-border, #e1e4e8);
                border-top-color: var(--color-primary, #2196f3);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* Overview Grid */
            .overview-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                gap: var(--spacing-md, 16px);
                margin-bottom: var(--spacing-lg, 24px);
            }

            .stat-card {
                background: white;
                border-radius: var(--border-radius-lg, 12px);
                padding: var(--spacing-lg, 24px);
                text-align: center;
                box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.08));
                border: 1px solid var(--color-border, #e1e4e8);
            }

            .stat-value {
                font-size: var(--font-size-2xl, 2rem);
                font-weight: var(--font-weight-bold, 700);
                color: var(--color-text-primary, #1f2328);
            }

            .stat-label {
                font-size: var(--font-size-sm, 0.875rem);
                color: var(--color-text-secondary, #656d76);
                margin-top: var(--spacing-xs, 4px);
            }

            .stat-change {
                font-size: var(--font-size-xs, 0.75rem);
                margin-top: var(--spacing-sm, 8px);
            }

            .stat-change.positive {
                color: var(--color-success, #22863a);
            }

            .stat-change.negative {
                color: var(--color-error, #cb2431);
            }

            /* Sections */
            .section {
                background: white;
                border-radius: var(--border-radius-lg, 12px);
                padding: var(--spacing-lg, 24px);
                margin-bottom: var(--spacing-lg, 24px);
                box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.08));
                border: 1px solid var(--color-border, #e1e4e8);
            }

            .section h3 {
                font-size: var(--font-size-lg, 1.25rem);
                font-weight: var(--font-weight-semibold, 600);
                color: var(--color-text-primary, #1f2328);
                margin: 0 0 var(--spacing-md, 16px) 0;
            }

            /* Records */
            .records-list {
                display: grid;
                gap: var(--spacing-sm, 8px);
            }

            .record-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--spacing-md, 16px);
                background: var(--color-surface, #f6f8fa);
                border-radius: var(--border-radius-md, 8px);
            }

            .record-type {
                font-weight: var(--font-weight-medium, 500);
                color: var(--color-text-primary, #1f2328);
            }

            .record-value {
                font-weight: var(--font-weight-bold, 700);
                color: var(--color-primary, #2196f3);
                font-size: var(--font-size-lg, 1.25rem);
            }

            .record-date {
                font-size: var(--font-size-sm, 0.875rem);
                color: var(--color-text-secondary, #656d76);
            }

            /* Chart Container */
            .chart-container {
                height: 300px;
                position: relative;
            }

            /* Controls */
            .controls {
                display: flex;
                gap: var(--spacing-sm, 8px);
                margin-bottom: var(--spacing-md, 16px);
                flex-wrap: wrap;
            }

            .control-group {
                display: flex;
                gap: var(--spacing-xs, 4px);
            }

            .control-btn {
                padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
                border: 1px solid var(--color-border, #e1e4e8);
                background: white;
                cursor: pointer;
                font-size: var(--font-size-xs, 0.75rem);
                border-radius: var(--border-radius-sm, 4px);
                transition: all var(--transition-fast, 0.15s ease);
            }

            .control-btn:hover {
                background: var(--color-surface, #f6f8fa);
            }

            .control-btn.active {
                background: var(--color-primary, #2196f3);
                color: white;
                border-color: var(--color-primary, #2196f3);
            }

            /* Workout List */
            .workout-list {
                display: grid;
                gap: var(--spacing-sm, 8px);
            }

            .workout-item {
                display: grid;
                grid-template-columns: 1fr repeat(3, 80px);
                padding: var(--spacing-md, 16px);
                background: var(--color-surface, #f6f8fa);
                border-radius: var(--border-radius-md, 8px);
                gap: var(--spacing-sm, 8px);
                align-items: center;
            }

            .workout-date {
                font-weight: var(--font-weight-medium, 500);
            }

            .workout-duration {
                font-size: var(--font-size-sm, 0.875rem);
                color: var(--color-text-secondary, #656d76);
            }

            .workout-metric {
                text-align: center;
                font-size: var(--font-size-sm, 0.875rem);
            }

            .workout-metric-value {
                font-weight: var(--font-weight-semibold, 600);
            }

            .workout-metric-label {
                font-size: var(--font-size-xs, 0.75rem);
                color: var(--color-text-secondary, #656d76);
            }

            /* Empty State */
            .empty-state {
                text-align: center;
                padding: var(--spacing-xl, 48px);
                color: var(--color-text-secondary, #656d76);
            }

            .empty-state-icon {
                font-size: 48px;
                margin-bottom: var(--spacing-md, 16px);
            }

            /* Zone Colors */
            .zone-legend {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: var(--spacing-sm, 8px);
                margin-top: var(--spacing-md, 16px);
            }

            .zone-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm, 8px);
                font-size: var(--font-size-sm, 0.875rem);
            }

            .zone-color {
                width: 16px;
                height: 16px;
                border-radius: var(--border-radius-sm, 4px);
            }

            @media (max-width: 768px) {
                .dashboard {
                    width: 100%;
                    height: 100%;
                    border-radius: 0;
                }

                .workout-item {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }

    protected template(): string {
        return `
            <div class="backdrop"></div>
            <div class="dashboard" role="dialog" aria-modal="true" aria-labelledby="dashboard-title">
                <div class="header">
                    <h1 id="dashboard-title">📊 Analytics Dashboard</h1>
                    <button class="close-button" aria-label="Close">&times;</button>
                </div>
                <div class="tabs">
                    <button class="tab active" data-tab="overview">Overview</button>
                    <button class="tab" data-tab="trends">Trends</button>
                    <button class="tab" data-tab="records">Records</button>
                    <button class="tab" data-tab="zones">Zones</button>
                </div>
                <div class="content">
                    <div class="loading">Loading analytics...</div>
                </div>
            </div>
        `;
    }

    protected setupEventListeners(): void {
        const backdrop = this.$<HTMLDivElement>('.backdrop');
        const closeButton = this.$<HTMLButtonElement>('.close-button');
        const tabs = this.$$<HTMLButtonElement>('.tab');

        if (backdrop) {
            backdrop.addEventListener('click', this.handleClose.bind(this));
        }

        if (closeButton) {
            closeButton.addEventListener('click', this.handleClose.bind(this));
        }

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab as typeof this.currentTab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    protected cleanup(): void {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        this.destroyCharts();
    }

    protected onAttributeChanged(name: string): void {
        if (name === 'open' && this.open) {
            this.loadDashboard();
        }
    }

    private handleClose(): void {
        this.destroyCharts();
        this.emit('dashboard-close');
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape' && this.open) {
            this.handleClose();
        }
    }

    private async loadDashboard(): Promise<void> {
        await this.loadChartJS();
        this.renderTab(this.currentTab);
    }

    private async loadChartJS(): Promise<void> {
        if (this.chartLoaded || typeof window.Chart !== 'undefined') {
            this.chartLoaded = true;
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
            script.async = true;
            script.onload = () => {
                this.chartLoaded = true;
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load Chart.js'));
            document.head.appendChild(script);
        });
    }

    private switchTab(tab: typeof this.currentTab): void {
        this.currentTab = tab;

        const tabs = this.$$<HTMLButtonElement>('.tab');
        tabs.forEach((t) => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        this.renderTab(tab);
    }

    private async renderTab(tab: string): Promise<void> {
        const content = this.$<HTMLDivElement>('.content');
        if (!content) return;

        content.innerHTML = '<div class="loading">Loading...</div>';
        this.destroyCharts();

        try {
            switch (tab) {
                case 'overview':
                    await this.renderOverview(content);
                    break;
                case 'trends':
                    await this.renderTrends(content);
                    break;
                case 'records':
                    await this.renderRecords(content);
                    break;
                case 'zones':
                    await this.renderZones(content);
                    break;
            }
        } catch (error) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>Error loading analytics data</p>
                </div>
            `;
            console.error('Error rendering tab:', error);
        }
    }

    private async renderOverview(container: HTMLElement): Promise<void> {
        const [trends, records, workouts] = await Promise.all([
            this.analytics.calculateTrends('week', 2),
            this.analytics.findRecords(),
            this.analytics.getAllWorkouts(),
        ]);

        const thisWeek = trends[1] || this.emptyTrend();
        const lastWeek = trends[0] || this.emptyTrend();

        const recentWorkouts = workouts.slice(0, 5).map((w) => this.analytics.calculateWorkoutSummary(w));

        container.innerHTML = `
            <div class="overview-grid">
                ${this.renderStatCard('Workouts', thisWeek.workoutCount, lastWeek.workoutCount, 'this week')}
                ${this.renderStatCard('Time', this.formatDuration(thisWeek.totalDuration), this.formatDuration(lastWeek.totalDuration), 'this week', true)}
                ${this.renderStatCard('Avg Power', `${thisWeek.avgPower || 0}W`, `${lastWeek.avgPower || 0}W`, 'this week')}
                ${this.renderStatCard('Work', `${thisWeek.totalWorkKJ}kJ`, `${lastWeek.totalWorkKJ}kJ`, 'this week')}
            </div>

            <div class="section">
                <h3>🏆 Personal Records</h3>
                ${records.length > 0 ? `
                    <div class="records-list">
                        ${records.map((r) => this.renderRecordItem(r)).join('')}
                    </div>
                ` : '<p>Complete more workouts to set records!</p>'}
            </div>

            <div class="section">
                <h3>🚴 Recent Workouts</h3>
                ${recentWorkouts.length > 0 ? `
                    <div class="workout-list">
                        ${recentWorkouts.map((w) => this.renderWorkoutItem(w)).join('')}
                    </div>
                ` : `
                    <div class="empty-state">
                        <div class="empty-state-icon">🚴</div>
                        <p>No workouts yet. Start riding!</p>
                    </div>
                `}
            </div>
        `;
    }

    private async renderTrends(container: HTMLElement): Promise<void> {
        container.innerHTML = `
            <div class="section">
                <h3>📈 Performance Trends</h3>
                <div class="controls">
                    <div class="control-group" data-control="period">
                        <button class="control-btn" data-value="day">Daily</button>
                        <button class="control-btn active" data-value="week">Weekly</button>
                        <button class="control-btn" data-value="month">Monthly</button>
                    </div>
                    <div class="control-group" data-control="metric">
                        <button class="control-btn active" data-value="avgPower">Power</button>
                        <button class="control-btn" data-value="avgHeartrate">Heart Rate</button>
                        <button class="control-btn" data-value="totalWorkKJ">Work</button>
                        <button class="control-btn" data-value="workoutCount">Workouts</button>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="trends-chart"></canvas>
                </div>
            </div>
        `;

        // Setup control listeners
        const controls = container.querySelectorAll('.control-btn');
        controls.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                const group = target.closest('.control-group');
                const controlType = group?.getAttribute('data-control');
                const value = target.dataset.value;

                if (controlType && value) {
                    group?.querySelectorAll('.control-btn').forEach((b) => b.classList.remove('active'));
                    target.classList.add('active');

                    if (controlType === 'period') {
                        this.currentPeriod = value as typeof this.currentPeriod;
                    } else if (controlType === 'metric') {
                        this.currentMetric = value;
                    }

                    this.updateTrendsChart();
                }
            });
        });

        await this.updateTrendsChart();
    }

    private async updateTrendsChart(): Promise<void> {
        const canvas = this.$<HTMLCanvasElement>('#trends-chart');
        if (!canvas || !window.Chart) return;

        const trends = await this.analytics.calculateTrends(this.currentPeriod, 12);

        if (this.trendsChart) {
            this.trendsChart.destroy();
        }

        const labels = trends.map((t) => this.formatTrendDate(t.startDate, this.currentPeriod));
        const data = trends.map((t) => (t as unknown as Record<string, number>)[this.currentMetric] || 0);

        this.trendsChart = new window.Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: this.getMetricLabel(this.currentMetric),
                        data,
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: '#2196F3',
                        pointRadius: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: this.getMetricUnit(this.currentMetric),
                        },
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                    },
                },
            },
        });
    }

    private async renderRecords(container: HTMLElement): Promise<void> {
        const records = await this.analytics.findRecords();

        container.innerHTML = `
            <div class="section">
                <h3>🏆 Personal Records</h3>
                ${records.length > 0 ? `
                    <div class="records-list">
                        ${records.map((r) => this.renderRecordItem(r)).join('')}
                    </div>
                ` : `
                    <div class="empty-state">
                        <div class="empty-state-icon">🏆</div>
                        <p>Complete workouts to set personal records!</p>
                    </div>
                `}
            </div>
        `;
    }

    private async renderZones(container: HTMLElement): Promise<void> {
        const zones = await this.analytics.getAggregatedZones();

        container.innerHTML = `
            <div class="section">
                <h3>⚡ Power Zone Distribution</h3>
                <div class="chart-container">
                    <canvas id="zones-chart"></canvas>
                </div>
                <div class="zone-legend">
                    <div class="zone-item"><span class="zone-color" style="background: #4CAF50"></span> Z1 Recovery (&lt;55% FTP)</div>
                    <div class="zone-item"><span class="zone-color" style="background: #8BC34A"></span> Z2 Endurance (55-75%)</div>
                    <div class="zone-item"><span class="zone-color" style="background: #FFEB3B"></span> Z3 Tempo (75-90%)</div>
                    <div class="zone-item"><span class="zone-color" style="background: #FF9800"></span> Z4 Threshold (90-105%)</div>
                    <div class="zone-item"><span class="zone-color" style="background: #FF5722"></span> Z5 VO2max (105-120%)</div>
                    <div class="zone-item"><span class="zone-color" style="background: #9C27B0"></span> Z6 Anaerobic (&gt;120%)</div>
                </div>
            </div>
        `;

        await this.updateZonesChart(zones);
    }

    private async updateZonesChart(zones: ZoneData): Promise<void> {
        const canvas = this.$<HTMLCanvasElement>('#zones-chart');
        if (!canvas || !window.Chart) return;

        if (this.zonesChart) {
            this.zonesChart.destroy();
        }

        const labels = [
            'Z1 Recovery',
            'Z2 Endurance',
            'Z3 Tempo',
            'Z4 Threshold',
            'Z5 VO2max',
            'Z6 Anaerobic',
        ];
        const colors = ['#4CAF50', '#8BC34A', '#FFEB3B', '#FF9800', '#FF5722', '#9C27B0'];
        const data = Object.values(zones.power);
        const total = data.reduce((a, b) => a + b, 0);

        this.zonesChart = new window.Chart(canvas, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [
                    {
                        data,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#ffffff',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const value = ctx.raw as number;
                                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                                return `${ctx.label}: ${this.formatZoneTime(value)} (${pct}%)`;
                            },
                        },
                    },
                },
            },
        });
    }

    private destroyCharts(): void {
        if (this.trendsChart) {
            this.trendsChart.destroy();
            this.trendsChart = null;
        }
        if (this.zonesChart) {
            this.zonesChart.destroy();
            this.zonesChart = null;
        }
    }

    // Render helpers

    private renderStatCard(
        label: string,
        value: string | number,
        prevValue: string | number,
        period: string,
        isDuration = false
    ): string {
        const change = isDuration ? 0 : this.calculateChange(value, prevValue);
        const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '';
        const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : '';

        return `
            <div class="stat-card">
                <div class="stat-value">${value}</div>
                <div class="stat-label">${label}</div>
                <div class="stat-change ${changeClass}">${arrow} ${Math.abs(change)}% vs last ${period.split(' ')[1] || period}</div>
            </div>
        `;
    }

    private renderRecordItem(record: PersonalRecord): string {
        return `
            <div class="record-item">
                <div>
                    <div class="record-type">${this.formatRecordType(record.type)}</div>
                    <div class="record-date">${record.date.toLocaleDateString()}</div>
                </div>
                <div class="record-value">${this.formatRecordValue(record)}</div>
            </div>
        `;
    }

    private renderWorkoutItem(workout: {
        id: string;
        date: Date;
        duration: number;
        avgPower: number;
        avgHeartrate: number;
        avgCadence: number;
    }): string {
        return `
            <div class="workout-item">
                <div>
                    <div class="workout-date">${workout.date.toLocaleDateString()}</div>
                    <div class="workout-duration">${this.formatDuration(workout.duration)}</div>
                </div>
                <div class="workout-metric">
                    <div class="workout-metric-value">${workout.avgPower || '-'}W</div>
                    <div class="workout-metric-label">Power</div>
                </div>
                <div class="workout-metric">
                    <div class="workout-metric-value">${workout.avgHeartrate || '-'}</div>
                    <div class="workout-metric-label">HR</div>
                </div>
                <div class="workout-metric">
                    <div class="workout-metric-value">${workout.avgCadence || '-'}</div>
                    <div class="workout-metric-label">Cadence</div>
                </div>
            </div>
        `;
    }

    // Formatting helpers

    private formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    private formatZoneTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    private formatTrendDate(date: Date, period: string): string {
        if (period === 'day') {
            return date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
        }
        if (period === 'week') {
            return `${date.getMonth() + 1}/${date.getDate()}`;
        }
        return date.toLocaleDateString('en', { month: 'short', year: '2-digit' });
    }

    private formatRecordType(type: string): string {
        const labels: Record<string, string> = {
            maxPower: '⚡ Max Power',
            '20minPower': '🎯 20-min Power',
            normalizedPower: '📊 Normalized Power',
            totalWork: '💪 Total Work',
        };
        return labels[type] || type;
    }

    private formatRecordValue(record: PersonalRecord): string {
        switch (record.type) {
            case 'maxPower':
            case '20minPower':
            case 'normalizedPower':
                return `${record.value}W`;
            case 'totalWork':
                return `${record.value}kJ`;
            default:
                return String(record.value);
        }
    }

    private getMetricLabel(metric: string): string {
        const labels: Record<string, string> = {
            avgPower: 'Average Power',
            avgHeartrate: 'Average Heart Rate',
            totalDuration: 'Total Duration',
            totalWorkKJ: 'Total Work',
            workoutCount: 'Workouts',
        };
        return labels[metric] || metric;
    }

    private getMetricUnit(metric: string): string {
        const units: Record<string, string> = {
            avgPower: 'Watts',
            avgHeartrate: 'BPM',
            totalDuration: 'Minutes',
            totalWorkKJ: 'kJ',
            workoutCount: 'Count',
        };
        return units[metric] || '';
    }

    private calculateChange(current: string | number, previous: string | number): number {
        const curr = typeof current === 'string' ? parseInt(current) || 0 : current;
        const prev = typeof previous === 'string' ? parseInt(previous) || 1 : previous || 1;
        return Math.round(((curr - prev) / prev) * 100);
    }

    private emptyTrend(): TrendData {
        return {
            period: 'week',
            startDate: new Date(),
            endDate: new Date(),
            workoutCount: 0,
            totalDuration: 0,
            avgPower: 0,
            avgHeartrate: 0,
            totalWorkKJ: 0,
        };
    }

    /**
     * Show the dashboard
     */
    public show(): void {
        this.setAttribute('open', '');
    }

    /**
     * Hide the dashboard
     */
    public hide(): void {
        this.removeAttribute('open');
    }
}

// Register the custom element
if (!customElements.get('analytics-dashboard')) {
    customElements.define('analytics-dashboard', AnalyticsDashboard);
}
