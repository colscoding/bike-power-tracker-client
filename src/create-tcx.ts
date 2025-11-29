import { mergeMeasurements } from './merge-measurements.js';
import type { MeasurementsState } from './MeasurementsState.js';
import type { MergedDataPoint } from './types/index.js';

const hrString = (hr: number | null): string =>
    hr !== null ? `<HeartRateBpm><Value>${Math.round(hr)}</Value></HeartRateBpm>` : '';

const cadenceString = (cadence: number | null): string =>
    cadence !== null ? `<Cadence>${Math.round(cadence)}</Cadence>` : '';

const powerString = (power: number | null): string => {
    if (power === null) return '';
    return `<Extensions>
              <TPX xmlns="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
                <Watts>${Math.round(power)}</Watts>
              </TPX>
            </Extensions>`;
};

const getTcxTrackpoint = (point: MergedDataPoint): string => {
    const timestamp = new Date(point.timestamp).toISOString();

    // Order matters in TCX schema: Time, Position, Altitude, Distance, HeartRate, Cadence, Extensions
    const parts: string[] = [];

    if (point.heartrate !== null) {
        parts.push(hrString(point.heartrate));
    }

    if (point.cadence !== null) {
        parts.push(cadenceString(point.cadence));
    }

    if (point.power !== null) {
        parts.push(powerString(point.power));
    }

    const tcx = `
<Trackpoint>
    <Time>${timestamp}</Time>
    ${parts.join('\n')}
</Trackpoint>
    `.trim();
    return tcx;
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

    const tcx = `<?xml version="1.0" encoding="UTF-8"?>
    <TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
        <Activities>
            <Activity Sport="Biking">
                <Id>${startDate}</Id>
                <Lap StartTime="${startDate}">
                    <TotalTimeSeconds>${totalTimeSeconds}</TotalTimeSeconds>
                    <Calories>0</Calories>
                    <Intensity>Active</Intensity>
                    <TriggerMethod>Manual</TriggerMethod>
                    <Track>
${dataPoints.map(getTcxTrackpoint).join('\n')}
                    </Track>
                </Lap>
            </Activity>
        </Activities>
    </TrainingCenterDatabase>`;

    return tcx;
};
