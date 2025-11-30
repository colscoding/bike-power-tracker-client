/**
 * Workout Selector Component
 * 
 * A modal component that allows users to select a workout from the library
 * or choose to ride freeform.
 */

import { BaseComponent } from '../../components/base/BaseComponent';
import { workoutLibrary, getWorkoutsByCategory, formatDuration } from '../library';
import type { StructuredWorkout, WorkoutCategory } from '../types';

const STYLES = `
    :host {
        display: block;
    }

    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: var(--z-index-modal, 1000);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity var(--transition-normal, 0.3s ease), visibility var(--transition-normal, 0.3s ease);
    }

    .modal-backdrop.open {
        opacity: 1;
        visibility: visible;
    }

    .modal-content {
        background: var(--color-background, #ffffff);
        border-radius: var(--border-radius-lg, 12px);
        max-width: 500px;
        max-height: 80vh;
        width: 90%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transform: scale(0.95);
        transition: transform var(--transition-normal, 0.3s ease);
    }

    .modal-backdrop.open .modal-content {
        transform: scale(1);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md, 16px);
        border-bottom: 1px solid var(--color-border, #e1e4e8);
    }

    .modal-header h2 {
        margin: 0;
        font-size: var(--font-size-lg, 1.25rem);
        font-weight: var(--font-weight-semibold, 600);
    }

    .close-button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: var(--spacing-xs, 4px);
        color: var(--color-text-secondary, #656d76);
        transition: color var(--transition-fast, 0.15s ease);
    }

    .close-button:hover {
        color: var(--color-text-primary, #1f2328);
    }

    .category-tabs {
        display: flex;
        gap: var(--spacing-xs, 4px);
        padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
        border-bottom: 1px solid var(--color-border, #e1e4e8);
        overflow-x: auto;
    }

    .category-tab {
        background: var(--color-surface, #f6f8fa);
        border: 1px solid var(--color-border, #e1e4e8);
        border-radius: var(--border-radius-md, 8px);
        padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
        font-size: var(--font-size-sm, 0.875rem);
        cursor: pointer;
        white-space: nowrap;
        transition: all var(--transition-fast, 0.15s ease);
    }

    .category-tab:hover {
        border-color: var(--color-primary, #2196f3);
    }

    .category-tab.active {
        background: var(--color-primary, #2196f3);
        color: white;
        border-color: var(--color-primary, #2196f3);
    }

    .workout-list {
        flex: 1;
        overflow-y: auto;
        padding: var(--spacing-sm, 8px);
    }

    .workout-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md, 16px);
        border: 1px solid var(--color-border, #e1e4e8);
        border-radius: var(--border-radius-md, 8px);
        margin-bottom: var(--spacing-sm, 8px);
        cursor: pointer;
        transition: all var(--transition-fast, 0.15s ease);
    }

    .workout-item:hover {
        border-color: var(--color-primary, #2196f3);
        background: var(--color-surface, #f6f8fa);
    }

    .workout-info {
        flex: 1;
    }

    .workout-name {
        font-weight: var(--font-weight-semibold, 600);
        margin-bottom: var(--spacing-xs, 4px);
    }

    .workout-description {
        font-size: var(--font-size-sm, 0.875rem);
        color: var(--color-text-secondary, #656d76);
        margin-bottom: var(--spacing-xs, 4px);
    }

    .workout-meta {
        display: flex;
        gap: var(--spacing-md, 16px);
        font-size: var(--font-size-xs, 0.75rem);
        color: var(--color-text-muted, #999999);
    }

    .workout-meta span {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs, 4px);
    }

    .category-badge {
        padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
        border-radius: var(--border-radius-sm, 4px);
        font-size: var(--font-size-xs, 0.75rem);
        font-weight: var(--font-weight-medium, 500);
        text-transform: uppercase;
    }

    .category-badge.endurance { background: #4CAF50; color: white; }
    .category-badge.threshold { background: #FF9800; color: white; }
    .category-badge.vo2max { background: #FF5722; color: white; }
    .category-badge.recovery { background: #8BC34A; color: white; }
    .category-badge.test { background: #9C27B0; color: white; }

    .modal-footer {
        padding: var(--spacing-md, 16px);
        border-top: 1px solid var(--color-border, #e1e4e8);
    }

    .freeform-button {
        width: 100%;
        padding: var(--spacing-md, 16px);
        background: var(--color-surface, #f6f8fa);
        border: 2px dashed var(--color-border, #e1e4e8);
        border-radius: var(--border-radius-md, 8px);
        font-size: var(--font-size-md, 1rem);
        cursor: pointer;
        transition: all var(--transition-fast, 0.15s ease);
    }

    .freeform-button:hover {
        border-color: var(--color-primary, #2196f3);
        color: var(--color-primary, #2196f3);
    }
`;

export class WorkoutSelector extends BaseComponent {
    private selectedCategory: WorkoutCategory | 'all' = 'all';
    private isOpen: boolean = false;

    static get observedAttributes(): string[] {
        return ['open'];
    }

    protected template(): string {
        const workouts = this.getFilteredWorkouts();

        return `
            <div class="modal-backdrop ${this.isOpen ? 'open' : ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Choose a Workout</h2>
                        <button class="close-button" aria-label="Close">&times;</button>
                    </div>
                    <div class="category-tabs">
                        ${this.renderCategoryTabs()}
                    </div>
                    <div class="workout-list">
                        ${workouts.map(w => this.renderWorkoutItem(w)).join('')}
                    </div>
                    <div class="modal-footer">
                        <button class="freeform-button">
                            🚴 Ride Freeform (No targets)
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    protected styles(): string {
        return STYLES;
    }

    private renderCategoryTabs(): string {
        const categories: Array<WorkoutCategory | 'all'> = ['all', 'endurance', 'threshold', 'vo2max', 'recovery', 'test'];
        const labels: Record<string, string> = {
            all: 'All',
            endurance: 'Endurance',
            threshold: 'Threshold',
            vo2max: 'VO2max',
            recovery: 'Recovery',
            test: 'Test'
        };

        return categories.map(cat => `
            <button 
                class="category-tab ${cat === this.selectedCategory ? 'active' : ''}"
                data-category="${cat}"
            >
                ${labels[cat]}
            </button>
        `).join('');
    }

    private renderWorkoutItem(workout: StructuredWorkout): string {
        return `
            <div class="workout-item" data-workout-id="${workout.id}">
                <div class="workout-info">
                    <div class="workout-name">${workout.name}</div>
                    <div class="workout-description">${workout.description}</div>
                    <div class="workout-meta">
                        <span>⏱ ${formatDuration(workout.totalDuration)}</span>
                        <span>📊 TSS ${workout.tss}</span>
                        <span>💪 IF ${workout.intensityFactor.toFixed(2)}</span>
                    </div>
                </div>
                <span class="category-badge ${workout.category}">${workout.category}</span>
            </div>
        `;
    }

    private getFilteredWorkouts(): StructuredWorkout[] {
        if (this.selectedCategory === 'all') {
            return workoutLibrary;
        }
        return getWorkoutsByCategory(this.selectedCategory);
    }

    protected setupEventListeners(): void {
        // Close button
        this.$<HTMLButtonElement>('.close-button')?.addEventListener('click', () => {
            this.close();
        });

        // Backdrop click
        this.$<HTMLDivElement>('.modal-backdrop')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.close();
            }
        });

        // Category tabs
        this.$$<HTMLButtonElement>('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.selectedCategory = tab.dataset.category as WorkoutCategory | 'all';
                this.render();
            });
        });

        // Workout items
        this.$$<HTMLDivElement>('.workout-item').forEach(item => {
            item.addEventListener('click', () => {
                const workoutId = item.dataset.workoutId;
                if (workoutId) {
                    this.emit('workout-selected', { workoutId });
                    this.close();
                }
            });
        });

        // Freeform button
        this.$<HTMLButtonElement>('.freeform-button')?.addEventListener('click', () => {
            this.emit('freeform-selected');
            this.close();
        });

        // Escape key
        document.addEventListener('keydown', this.handleKeydown);
    }

    private handleKeydown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape' && this.isOpen) {
            this.close();
        }
    };

    protected cleanup(): void {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    protected onAttributeChanged(name: string, _oldValue: string | null, newValue: string | null): void {
        if (name === 'open') {
            this.isOpen = newValue !== null;
        }
    }

    public open(): void {
        this.isOpen = true;
        this.setAttribute('open', '');
        this.render();
    }

    public close(): void {
        this.isOpen = false;
        this.removeAttribute('open');
        this.render();
        this.emit('closed');
    }
}

// Register the component
if (!customElements.get('workout-selector')) {
    customElements.define('workout-selector', WorkoutSelector);
}
