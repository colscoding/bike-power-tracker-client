import type { Measurement, MetricType } from './types/index.js';

class MeasurementsState {
    heartrate: Measurement[] = [];
    power: Measurement[] = [];
    cadence: Measurement[] = [];

    addHeartrate({ timestamp, value }: Measurement): void {
        if (value <= 0 || value >= 300) {
            return;
        }
        this.heartrate.push({
            timestamp: timestamp,
            value: value,
        });
    }

    addPower({ timestamp, value }: Measurement): void {
        if (value < 0 || value >= 3000) {
            return;
        }
        this.power.push({
            timestamp: timestamp,
            value: value,
        });
    }

    addCadence({ timestamp, value }: Measurement): void {
        if (value < 0 || value >= 300) {
            return;
        }
        this.cadence.push({
            timestamp: timestamp,
            value: value,
        });
    }

    add(type: MetricType, entry: Measurement): void {
        if (type === 'heartrate') {
            this.addHeartrate(entry);
        } else if (type === 'power') {
            this.addPower(entry);
        } else if (type === 'cadence') {
            this.addCadence(entry);
        } else {
            throw new Error(`Unknown measurement type: ${type}`);
        }
    }
}

export { MeasurementsState };
