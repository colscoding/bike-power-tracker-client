export const connectPowerMock = async () => {
    const listeners = [];
    const powerInterval = setInterval(() => {
        const randomPower = Math.floor(Math.random() * 300) + 100; // 100-400W
        const entry = { timestamp: Date.now(), value: randomPower };
        listeners.forEach((listener) => listener(entry));
    }, 100);

    return {
        disconnect: () => clearInterval(powerInterval),
        addListener: (callback) => {
            listeners.push(callback);
        },
    };
};

import { showNotification } from './ui/notifications.js';

export const connectPowerBluetooth = async () => {
    const listeners = [];
    let device;
    let characteristic;

    try {
        // Request Bluetooth device with cycling power service
        device = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['cycling_power'] }],
            optionalServices: ['cycling_power'],
        });
    } catch (error) {
        if (error.name === 'NotFoundError') {
            showNotification('No power meter found or selection cancelled', 'error');
        } else {
            showNotification('Failed to search for power meter', 'error');
        }
        throw error;
    }

    try {
        // Connect to GATT server
        const server = await device.gatt.connect();

        // Get cycling power service
        const service = await server.getPrimaryService('cycling_power');

        // Get cycling power measurement characteristic
        characteristic = await service.getCharacteristic('cycling_power_measurement');

        // Start notifications
        await characteristic.startNotifications();
    } catch (error) {
        showNotification('Failed to connect to power meter', 'error');
        throw error;
    }

    // Listen for power changes
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        // Cycling power measurement format: bytes 2-3 contain instantaneous power (little-endian)
        const power = value.getInt16(2, true);
        const entry = { timestamp: Date.now(), value: power };
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

export const connectPower = async () => {
    if (import.meta.env.MODE === 'development' || import.meta.env.MODE === 'test') {
        return connectPowerMock();
    }
    return connectPowerBluetooth();
};
