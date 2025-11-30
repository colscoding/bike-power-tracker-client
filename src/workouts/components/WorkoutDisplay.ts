/**
 * Workout Display Component
 * 
 * Shows the current workout status during execution including:
 * - Current segment name and progress
 * - Target power zone
 * - Time remaining
 * - Instructions
 */

import { BaseComponent } from '../../components/base/BaseComponent';
import type { WorkoutExecutionState, PowerZoneStatus } from '../types';
import { formatDuration } from '../library';
import { getIntensityColor } from '../settings';

const STYLES = `
    :host {
        display: block;
    }

    .workout-display {
        background: var(--color-background, #ffffff);
        border-radius: var(--border-radius-lg, 12px);
        border: 1px solid var(--color-border, #e1e4e8);
        padding: var(--spacing-md, 16px);
        margin-bottom: var(--spacing-md, 16px);
    }

    .workout-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md, 16px);
    }

    .workout-name {
        font-size: var(--font-size-lg, 1.25rem);
        font-weight: var(--font-weight-semibold, 600);
    }

    .workout-time {
        font-size: var(--font-size-md, 1rem);
        color: var(--color-text-secondary, #656d76);
        font-variant-numeric: tabular-nums;
    }

    .segment-info {
        background: var(--color-surface, #f6f8fa);
        border-radius: var(--border-radius-md, 8px);
        padding: var(--spacing-md, 16px);
        margin-bottom: var(--spacing-md, 16px);
    }

    .segment-name {
        font-size: var(--font-size-lg, 1.25rem);
        font-weight: var(--font-weight-semibold, 600);
        margin-bottom: var(--spacing-sm, 8px);
    }

    .segment-progress {
        height: 8px;
        background: var(--color-border, #e1e4e8);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: var(--spacing-sm, 8px);
    }

    .segment-progress-bar {
        height: 100%;
        background: var(--color-primary, #2196f3);
        transition: width 0.3s ease;
    }

    .segment-time {
        display: flex;
        justify-content: space-between;
        font-size: var(--font-size-sm, 0.875rem);
        color: var(--color-text-secondary, #656d76);
    }

    .next-segment {
        font-size: var(--font-size-sm, 0.875rem);
        color: var(--color-text-muted, #999999);
        margin-top: var(--spacing-sm, 8px);
    }

    .power-target {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-lg, 24px);
        padding: var(--spacing-md, 16px);
        margin-bottom: var(--spacing-md, 16px);
    }

    .target-label {
        font-size: var(--font-size-sm, 0.875rem);
        color: var(--color-text-secondary, #656d76);
        margin-bottom: var(--spacing-xs, 4px);
    }

    .target-value {
        font-size: var(--font-size-xl, 1.5rem);
        font-weight: var(--font-weight-bold, 700);
        font-variant-numeric: tabular-nums;
    }

    .current-power {
        text-align: center;
    }

    .current-power .target-value {
        font-size: var(--font-size-2xl, 2rem);
    }

    .power-status {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs, 4px);
        padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
        border-radius: var(--border-radius-sm, 4px);
        font-size: var(--font-size-sm, 0.875rem);
        font-weight: var(--font-weight-medium, 500);
    }

    .power-status.in-zone {
        background: var(--color-success, #4caf50);
        color: white;
    }

    .power-status.low {
        background: #2196f3;
        color: white;
    }

    .power-status.high {
        background: var(--color-error, #cf222e);
        color: white;
    }

    .instructions {
        font-style: italic;
        color: var(--color-text-secondary, #656d76);
        text-align: center;
        padding: var(--spacing-sm, 8px);
        background: var(--color-surface, #f6f8fa);
        border-radius: var(--border-radius-md, 8px);
    }

    .workout-controls {
        display: flex;
        gap: var(--spacing-sm, 8px);
        margin-top: var(--spacing-md, 16px);
    }

    .control-button {
        flex: 1;
        padding: var(--spacing-md, 16px);
        border: none;
        border-radius: var(--border-radius-md, 8px);
        font-size: var(--font-size-md, 1rem);
        font-weight: var(--font-weight-semibold, 600);
        cursor: pointer;
        transition: all var(--transition-fast, 0.15s ease);
    }

    .control-button.primary {
        background: var(--color-primary, #2196f3);
        color: white;
    }

    .control-button.primary:hover {
        background: var(--color-primary-hover, #1976d2);
    }

    .control-button.secondary {
        background: var(--color-surface, #f6f8fa);
        color: var(--color-text-primary, #1f2328);
        border: 1px solid var(--color-border, #e1e4e8);
    }

    .control-button.secondary:hover {
        background: var(--color-border, #e1e4e8);
    }

    .hidden {
        display: none !important;
    }

    .paused-indicator {
        text-align: center;
        padding: var(--spacing-sm, 8px);
        background: #FFF3CD;
        color: #856404;
        border-radius: var(--border-radius-md, 8px);
        margin-bottom: var(--spacing-md, 16px);
        font-weight: var(--font-weight-medium, 500);
    }
`;

export class WorkoutDisplay extends BaseComponent {
    private state: WorkoutExecutionState | null = null;
    private workoutName: string = '';
    private currentPower: number = 0;
    private powerStatus: PowerZoneStatus = 'in-zone';

    protected template(): string {
        if (!this.state) {
            return `<div class="workout-display hidden"></div>`;
        }

        const { segment, nextSegment, segmentElapsed, segmentRemaining, totalElapsed, totalRemaining, targetPowerRange, isRunning } = this.state;
        const segmentProgress = (segmentElapsed / segment.duration) * 100;
        const intensity = (segment.target.powerLow + segment.target.powerHigh) / 2;
        const segmentColor = getIntensityColor(intensity);

        return `
            <div class="workout-display">
                <div class="workout-header">
                    <span class="workout-name">${this.workoutName}</span>
                    <span class="workout-time">${formatDuration(totalElapsed)} / ${formatDuration(totalElapsed + totalRemaining)}</span>
                </div>

                ${!isRunning ? '<div class="paused-indicator">⏸ Workout Paused</div>' : ''}

                <div class="segment-info">
                    <div class="segment-name">${segment.name}</div>
                    <div class="segment-progress">
                        <div class="segment-progress-bar" style="width: ${segmentProgress}%; background: ${segmentColor}"></div>
                    </div>
                    <div class="segment-time">
                        <span>${formatDuration(segmentElapsed)}</span>
                        <span>${formatDuration(segmentRemaining)} remaining</span>
                    </div>
                    ${nextSegment ? `<div class="next-segment">Next: ${nextSegment.name} (${formatDuration(nextSegment.duration)})</div>` : ''}
                </div>

                <div class="power-target">
                    <div>
                        <div class="target-label">Target</div>
                        <div class="target-value">${targetPowerRange.low}-${targetPowerRange.high}W</div>
                    </div>
                    <div class="current-power">
                        <div class="target-label">Current</div>
                        <div class="target-value">${this.currentPower}W</div>
                        <span class="power-status ${this.powerStatus}">${this.getStatusLabel()}</span>
                    </div>
                </div>

                ${segment.instructions ? `<div class="instructions">"${segment.instructions}"</div>` : ''}

                <div class="workout-controls">
                    <button class="control-button primary" id="toggle-button">
                        ${isRunning ? '⏸ Pause' : '▶ Resume'}
                    </button>
                    <button class="control-button secondary" id="stop-button">
                        ⏹ Stop
                    </button>
                </div>
            </div>
        `;
    }

    protected styles(): string {
        return STYLES;
    }

    private getStatusLabel(): string {
        switch (this.powerStatus) {
            case 'low': return '↑ Push harder';
            case 'high': return '↓ Ease off';
            case 'in-zone': return '✓ In zone';
        }
    }

    protected setupEventListeners(): void {
        this.$<HTMLButtonElement>('#toggle-button')?.addEventListener('click', () => {
            this.emit('toggle-workout');
        });

        this.$<HTMLButtonElement>('#stop-button')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to stop this workout?')) {
                this.emit('stop-workout');
            }
        });
    }

    /**
     * Update the display with new workout state
     */
    public updateState(state: WorkoutExecutionState): void {
        this.state = state;
        this.render();
    }

    /**
     * Set the workout name
     */
    public setWorkoutName(name: string): void {
        this.workoutName = name;
        this.render();
    }

    /**
     * Update current power reading
     */
    public updatePower(power: number, status: PowerZoneStatus): void {
        this.currentPower = power;
        this.powerStatus = status;
        this.render();
    }

    /**
     * Hide the display
     */
    public hide(): void {
        this.state = null;
        this.render();
    }

    /**
     * Check if display is visible
     */
    public get isVisible(): boolean {
        return this.state !== null;
    }
}

// Register the component
if (!customElements.get('workout-display')) {
    customElements.define('workout-display', WorkoutDisplay);
}
