import { mergeMeasurements } from './merge-measurements.js';
import type { MeasurementsState } from './MeasurementsState.js';
import type { MergedDataPoint } from './types/index.js';

const hrString = (hr: number | null): string =>
    hr !== null ? `<HeartRateBpm><Value>${Math.round(hr)}</Value></HeartRateBpm>` : '';

const cadenceString = (cadence: number | null): string =>
    cadence !== null ? `<Cadence>${Math.round(cadence)}</Cadence>` : '';

const powerString = (power: number | null): string => {
    if (power === null) return '';
    return `<Extensions><TPX xmlns="http://www.garmin.com/xmlschemas/ActivityExtension/v2"><Watts>${Math.round(power)}</Watts></TPX></Extensions>`;
};

const getTcxTrackpoint = (point: MergedDataPoint): string => {
    const timestamp = new Date(point.timestamp).toISOString();

    // TCX schema requires elements in this specific order:
    // Time, Position, AltitudeMeters, DistanceMeters, HeartRateBpm, Cadence, SensorState, Extensions
    const parts: string[] = [`<Time>${timestamp}</Time>`];

    // HeartRateBpm must come before Cadence
    if (point.heartrate !== null) {
        parts.push(hrString(point.heartrate));
    }

    // Cadence must come before Extensions
    if (point.cadence !== null) {
        parts.push(cadenceString(point.cadence));
    }

    // Extensions (containing power/Watts) must come last
    if (point.power !== null) {
        parts.push(powerString(point.power));
    }

    return `<Trackpoint>${parts.join('')}</Trackpoint>`;
};

/**
 * Creates a Garmin TCX (Training Center XML) string from merged measurements
 */
export const getTcxString = (measurements: MeasurementsState): string => {
    const dataPoints = mergeMeasurements(measurements);
    if (!dataPoints || dataPoints.length === 0) {
        return '';
    }

    const firstTimestamp = dataPoints[0].timestamp;
    const lastTimestamp = dataPoints[dataPoints.length - 1].timestamp;
    const totalTimeSeconds = Math.round((lastTimestamp - firstTimestamp) / 1000);
    const startDate = new Date(firstTimestamp).toISOString();

    // Build trackpoints
    const trackpoints = dataPoints.map(getTcxTrackpoint).join('');

    // TCX schema requires elements in specific order for ActivityLap_t:
    // TotalTimeSeconds, DistanceMeters, MaximumSpeed?, Calories, AverageHeartRateBpm?, 
    // MaximumHeartRateBpm?, Intensity, Cadence?, TriggerMethod, Track+, Notes?, Extensions?
    const tcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
<Activities>
<Activity Sport="Biking">
<Id>${startDate}</Id>
<Lap StartTime="${startDate}">
<TotalTimeSeconds>${totalTimeSeconds}</TotalTimeSeconds>
<DistanceMeters>0</DistanceMeters>
<Calories>0</Calories>
<Intensity>Active</Intensity>
<TriggerMethod>Manual</TriggerMethod>
<Track>
${trackpoints}
</Track>
</Lap>
</Activity>
</Activities>
</TrainingCenterDatabase>`;

    return tcx;
};
