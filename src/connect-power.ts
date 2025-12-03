import { getEnvMode } from './getEnv.js';
import type { Measurement, SensorConnection } from './types/index.js';
import { showNotification } from './ui/notifications.js';

export const connectPowerMock = async (): Promise<SensorConnection> => {
    const listeners: ((entry: Measurement) => void)[] = [];
    const disconnectListeners: (() => void)[] = [];
    const powerInterval = setInterval(() => {
        const randomPower = Math.floor(Math.random() * 300) + 100; // 100-400W
        const entry: Measurement = { timestamp: Date.now(), value: randomPower };
        listeners.forEach((listener) => listener(entry));
    }, 100);

    return {
        disconnect: () => clearInterval(powerInterval),
        addListener: (callback) => {
            listeners.push(callback);
        },
        addDisconnectListener: (callback) => {
            disconnectListeners.push(callback);
        },
    };
};

export const connectPowerBluetooth = async (): Promise<SensorConnection> => {
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

            // Cycling power measurement format: bytes 2-3 contain instantaneous power (little-endian)
            const power = value.getInt16(2, true);

            // Sanity check for reasonable power values (0-3000W)
            if (power >= 0 && power <= 3000) {
                const entry: Measurement = { timestamp: Date.now(), value: power };
                listeners.forEach((listener) => listener(entry));
            }
        } catch (error) {
            console.error('Error parsing power data:', error);
        }
    };

    // Handler for unexpected disconnections
    const handleDisconnection = (): void => {
        if (isDisconnecting) return; // Ignore if we initiated the disconnect

        showNotification('Power meter disconnected', 'warning');
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
        // Request Bluetooth device with cycling power service
        device = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['cycling_power'] }],
            optionalServices: ['cycling_power'],
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'NotFoundError') {
            showNotification('No power meter found or selection cancelled', 'error');
        } else {
            showNotification('Failed to search for power meter', 'error');
        }
        throw error;
    }

    // Listen for unexpected disconnections
    device.addEventListener('gattserverdisconnected', handleDisconnection);

    try {
        // Connect to GATT server
        const server = await device.gatt!.connect();

        // Get cycling power service
        const service = await server.getPrimaryService('cycling_power');

        // Get cycling power measurement characteristic
        characteristic = await service.getCharacteristic('cycling_power_measurement');

        // Start notifications
        await characteristic.startNotifications();

        // Listen for power changes
        characteristic.addEventListener(
            'characteristicvaluechanged',
            handleCharacteristicValueChanged
        );
    } catch (error) {
        cleanup();
        if (device.gatt?.connected) {
            device.gatt.disconnect();
        }
        showNotification('Failed to connect to power meter', 'error');
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

export const connectPower = async (): Promise<SensorConnection> => {
    const mode = getEnvMode();
    if (mode === 'development' || mode === 'test') {
        return connectPowerMock();
    }
    return connectPowerBluetooth();
};
