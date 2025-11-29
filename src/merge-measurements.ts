import type { Measurement, MergedDataPoint } from './types/index.js';
import type { MeasurementsState } from './MeasurementsState.js';

export const getValuesAtTimestamps = (
    arr: Measurement[],
    timestamps: number[]
): (number | null)[] => {
    const entries: (number | null)[] = [];
    let index = 0;
    for (const ts of timestamps) {
        while (index < arr.length && arr[index].timestamp < ts) {
            index++;
        }

        const prevIndex = index - 1;
        let suggestedElem: Measurement | undefined = undefined;
        const isAfterLastPoint = index >= arr.length;
        if (prevIndex < 0) {
            suggestedElem = arr?.[index];
        } else if (isAfterLastPoint) {
            suggestedElem = arr?.[prevIndex];
        } else {
            const prevTime = arr?.[prevIndex]?.timestamp ?? 0;
            const nextTime = arr?.[index]?.timestamp ?? 0;
            suggestedElem = ts - prevTime <= nextTime - ts ? arr?.[prevIndex] : arr?.[index];
        }
        if (suggestedElem?.timestamp) {
            const distance = Math.abs(suggestedElem.timestamp - ts);
            // Values must be strictly less than 1000ms away
            if (distance < 1000) {
                entries.push(suggestedElem.value);
            } else {
                entries.push(null);
            }
        } else {
            entries.push(null);
        }
    }
    return entries;
};

export const mergeMeasurements = (measurements: MeasurementsState): MergedDataPoint[] => {
    const sources = [measurements.heartrate, measurements.cadence, measurements.power];
    const hasData = sources.some((data) => data.length > 0);
    if (!hasData) {
        return [];
    }
    const firstTimestamps = sources.map((data) => (data.length > 0 ? data[0].timestamp : Infinity));
    const startTime = Math.min(...firstTimestamps);
    const endTime = Math.max(
        ...sources.map((data) => (data.length > 0 ? data[data.length - 1].timestamp : -Infinity))
    );
    const timeStep = 1000; // 1 second intervals
    const timestamps: number[] = [];
    let time = startTime;
    while (time <= endTime) {
        timestamps.push(time);
        time += timeStep;
    }
    const syncedHR = getValuesAtTimestamps(measurements.heartrate, timestamps);
    const syncedCadence = getValuesAtTimestamps(measurements.cadence, timestamps);
    const syncedPower = getValuesAtTimestamps(measurements.power, timestamps);

    const dataPoints: MergedDataPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
        const point: MergedDataPoint = {
            timestamp: timestamps[i],
            heartrate: syncedHR[i] ?? null,
            cadence: syncedCadence[i] ?? null,
            power: syncedPower[i] ?? null,
        };
        dataPoints.push(point);
    }
    return dataPoints;
};
