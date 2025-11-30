// Base component
export { BaseComponent } from './base/BaseComponent.js';

// Metrics components
export { MetricDisplay } from './metrics/MetricDisplay.js';
export { MetricsPanel } from './metrics/MetricsPanel.js';

// Control components
export { ConnectButton } from './controls/ConnectButton.js';
export type { ConnectionToggleDetail } from './controls/ConnectButton.js';
export { StartStopButton } from './controls/StartStopButton.js';
export { TimerDisplay } from './controls/TimerDisplay.js';

// Layout components
export { AppHeader } from './layout/AppHeader.js';
export { AppMenu } from './layout/AppMenu.js';
export type { MenuItemClickDetail } from './layout/AppMenu.js';
export { AppModal } from './layout/AppModal.js';

// Feedback components
export { ToastNotification, showToast } from './feedback/ToastNotification.js';

// Analytics components
export { AnalyticsDashboard, AnalyticsEngine } from './analytics/index.js';
export type {
    WorkoutSummary as AnalyticsWorkoutSummary,
    TrendData,
    PersonalRecord,
    ZoneData,
    PowerZones,
} from './analytics/index.js';

// Import styles (consumers can include this CSS file)
// import './styles/tokens.css';
