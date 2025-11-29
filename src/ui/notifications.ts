import type { NotificationType } from '../types/index.js';

/**
 * Show a notification to the user
 */
export function showNotification(message: string, type: NotificationType = 'info'): void {
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? '#cf222e' : type === 'success' ? '#1f883d' : '#2196f3';
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: ${bgColor};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1001;
        font-size: 14px;
        max-width: 90%;
        text-align: center;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
