import { getEnvMode } from './getEnv.js';
import type { Measurement, SensorConnection } from './types/index.js';
import { showNotification } from './ui/notifications.js';

export const connectHeartRateMock = async (): Promise<SensorConnection> => {
    const listeners: ((entry: Measurement) => void)[] = [];
    const disconnectListeners: (() => void)[] = [];
    const heartRateInterval = setInterval(() => {
        const randomHeartRate = Math.floor(Math.random() * 80) + 120; // 120-200 bpm
        const entry: Measurement = { timestamp: Date.now(), value: randomHeartRate };
        listeners.forEach((listener) => listener(entry));
    }, 1000);

    return {
        disconnect: () => clearInterval(heartRateInterval),
        addListener: (callback) => {
            listeners.push(callback);
        },
        addDisconnectListener: (callback) => {
            disconnectListeners.push(callback);
        },
    };
};

export const connectHeartRateBluetooth = async (): Promise<SensorConnection> => {
    const listeners: ((entry: Measurement) => void)[] = [];
    const disconnectListeners: (() => void)[] = [];
    let device: BluetoothDevice | null = null;
    let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
    let isDisconnecting = false;

    // Handler for characteristic value changes
    const handleCharacteristicValueChanged = (event: Event): void => {
        try {
            const target = event.target as BluetoothRemoteGATTCharacteristic;
            const value = target.value;
            if (!value) return;

            const flags = value.getUint8(0);
            let heartRate: number;

            // Check Heart Rate Value Format bit (bit 0)
            if (flags & 0x01) {
                // UINT16 format
                heartRate = value.getUint16(1, true); // little-endian
            } else {
                // UINT8 format
                heartRate = value.getUint8(1);
            }

            // Sanity check for reasonable heart rate values (30-250 bpm)
            if (heartRate >= 30 && heartRate <= 250) {
                const entry: Measurement = { timestamp: Date.now(), value: heartRate };
                listeners.forEach((listener) => listener(entry));
            }
        } catch (error) {
            console.error('Error parsing heart rate data:', error);
        }
    };

    // Handler for unexpected disconnections
    const handleDisconnection = (): void => {
        if (isDisconnecting) return; // Ignore if we initiated the disconnect

        showNotification('Heart rate monitor disconnected', 'warning');
        cleanup();
        disconnectListeners.forEach((listener) => listener());
    };

    // Cleanup function to remove event listeners and reset state
    const cleanup = (): void => {
        if (characteristic) {
            characteristic.removeEventListener(
                'characteristicvaluechanged',
                handleCharacteristicValueChanged
            );
        }
        if (device) {
            device.removeEventListener('gattserverdisconnected', handleDisconnection);
        }
    };

    try {
        // Request Bluetooth device with heart rate service
        device = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['heart_rate'] }],
            optionalServices: ['heart_rate'],
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'NotFoundError') {
            showNotification('No heart rate monitor found or selection cancelled', 'error');
        } else {
            showNotification('Failed to search for heart rate monitor', 'error');
        }
        throw error;
    }

    // Listen for unexpected disconnections
    device.addEventListener('gattserverdisconnected', handleDisconnection);

    try {
        // Connect to GATT server
        const server = await device.gatt!.connect();

        // Get heart rate service
        const service = await server.getPrimaryService('heart_rate');

        // Get heart rate measurement characteristic
        characteristic = await service.getCharacteristic('heart_rate_measurement');

        // Start notifications
        await characteristic.startNotifications();

        // Listen for heart rate changes
        characteristic.addEventListener(
            'characteristicvaluechanged',
            handleCharacteristicValueChanged
        );
    } catch (error) {
        cleanup();
        if (device.gatt?.connected) {
            device.gatt.disconnect();
        }
        showNotification('Failed to connect to heart rate monitor', 'error');
        throw error;
    }

    return {
        disconnect: () => {
            isDisconnecting = true;
            try {
                cleanup();
                if (characteristic) {
                    characteristic.stopNotifications().catch(() => {
                        // Ignore errors - device may already be disconnected
                    });
                }
                if (device?.gatt?.connected) {
                    device.gatt.disconnect();
                }
            } catch {
                // Ignore disconnect errors - device may already be disconnected
            }
        },
        addListener: (callback) => {
            listeners.push(callback);
        },
        addDisconnectListener: (callback: () => void) => {
            disconnectListeners.push(callback);
        },
    };
};

export const connectHeartRate = async (): Promise<SensorConnection> => {
    const mode = getEnvMode();
    if (mode === 'development' || mode === 'test') {
        return connectHeartRateMock();
    }
    // Production implementation would go here
    return connectHeartRateBluetooth();
};
