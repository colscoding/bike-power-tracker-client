export const connectHeartRateMock = async () => {
    const listeners = [];
    const heartRateInterval = setInterval(() => {
        const randomHeartRate = Math.floor(Math.random() * 80) + 120; // 120-200 bpm
        const entry = { timestamp: Date.now(), value: randomHeartRate };
        listeners.forEach((listener) => listener(entry));
    }, 1000);

    return {
        disconnect: () => clearInterval(heartRateInterval),
        addListener: (callback) => {
            listeners.push(callback);
        },
    };
};

import { showNotification } from './ui/notifications.js';

export const connectHeartRateBluetooth = async () => {
    const listeners = [];
    let device;
    let characteristic;

    try {
        // Request Bluetooth device with heart rate service
        device = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['heart_rate'] }],
            optionalServices: ['heart_rate'],
        });
    } catch (error) {
        if (error.name === 'NotFoundError') {
            showNotification('No heart rate monitor found or selection cancelled', 'error');
        } else {
            showNotification('Failed to search for heart rate monitor', 'error');
        }
        throw error;
    }

    try {
        // Connect to GATT server
        const server = await device.gatt.connect();

        // Get heart rate service
        const service = await server.getPrimaryService('heart_rate');

        // Get heart rate measurement characteristic
        characteristic = await service.getCharacteristic('heart_rate_measurement');

        // Start notifications
        await characteristic.startNotifications();
    } catch (error) {
        showNotification('Failed to connect to heart rate monitor', 'error');
        throw error;
    }

    // Listen for heart rate changes
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        const flags = value.getUint8(0);
        let heartRate;

        // Check Heart Rate Value Format bit (bit 0)
        if (flags & 0x01) {
            // UINT16
            heartRate = value.getUint16(1, true); // little-endian
        } else {
            // UINT8
            heartRate = value.getUint8(1);
        }

        const entry = { timestamp: Date.now(), value: heartRate };
        listeners.forEach((listener) => listener(entry));
    });

    return {
        disconnect: () => {
            try {
                characteristic.stopNotifications();
                device.gatt.disconnect();
            } catch {
                // Ignore disconnect errors - device may already be disconnected
            }
        },
        addListener: (callback) => {
            listeners.push(callback);
        },
    };
};

export const connectHeartRate = async () => {
    if (import.meta.env.MODE === 'development' || import.meta.env.MODE === 'test') {
        return connectHeartRateMock();
    }
    // Production implementation would go here
    return connectHeartRateBluetooth();
};
