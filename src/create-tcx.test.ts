import test from 'node:test';
import assert from 'node:assert';
import { getTcxString } from './create-tcx.js';
import { MeasurementsState } from './MeasurementsState.js';

test('getTcxString returns empty string when no measurements', () => {
    const measurements = new MeasurementsState();
    const tcx = getTcxString(measurements);
    assert.strictEqual(tcx, '');
});

test('getTcxString creates valid TCX XML structure', () => {
    const measurements = new MeasurementsState();
    const timestamp = new Date('2025-11-04T12:00:00.000Z').getTime();

    measurements.addPower({ timestamp, value: 250 });

    const tcx = getTcxString(measurements);

    // Check XML declaration
    assert.ok(tcx.includes('<?xml version="1.0" encoding="UTF-8"?>'));

    // Check root element
    assert.ok(tcx.includes('<TrainingCenterDatabase'));
    assert.ok(tcx.includes('</TrainingCenterDatabase>'));

    // Check Activities structure
    assert.ok(tcx.includes('<Activities>'));
    assert.ok(tcx.includes('</Activities>'));
    assert.ok(tcx.includes('<Activity Sport="Biking">'));
    assert.ok(tcx.includes('</Activity>'));

    // Check Lap structure
    assert.ok(tcx.includes('<Lap'));
    assert.ok(tcx.includes('</Lap>'));
    assert.ok(tcx.includes('<Track>'));
    assert.ok(tcx.includes('</Track>'));

    // Check Trackpoint structure
    assert.ok(tcx.includes('<Trackpoint>'));
    assert.ok(tcx.includes('</Trackpoint>'));
});

test('getTcxString includes correct sport type', () => {
    const measurements = new MeasurementsState();
    measurements.addPower({ timestamp: 1000, value: 200 });

    const tcx = getTcxString(measurements);

    assert.ok(tcx.includes('Sport="Biking"'));
});

test('getTcxString formats timestamp as ISO string', () => {
    const measurements = new MeasurementsState();
    const timestamp = new Date('2025-11-04T12:00:00.000Z').getTime();

    measurements.addPower({ timestamp, value: 250 });

    const tcx = getTcxString(measurements);

    assert.ok(tcx.includes('<Time>2025-11-04T12:00:00.000Z</Time>'));
    assert.ok(tcx.includes('<Id>2025-11-04T12:00:00.000Z</Id>'));
    assert.ok(tcx.includes('StartTime="2025-11-04T12:00:00.000Z"'));
});

test('getTcxString calculates TotalTimeSeconds correctly', () => {
    const measurements = new MeasurementsState();
    const startTimestamp = 1000;
    const endTimestamp = 6000; // 5 seconds later

    measurements.addPower({ timestamp: startTimestamp, value: 200 });
    measurements.addPower({ timestamp: endTimestamp, value: 250 });

    const tcx = getTcxString(measurements);

    // 5 seconds total
    assert.ok(tcx.includes('<TotalTimeSeconds>5</TotalTimeSeconds>'));
});

test('getTcxString includes power in Extensions/TPX/Watts', () => {
    const measurements = new MeasurementsState();
    measurements.addPower({ timestamp: 1000, value: 275 });

    const tcx = getTcxString(measurements);

    assert.ok(tcx.includes('<Watts>275</Watts>'));
    assert.ok(tcx.includes('<TPX'));
    assert.ok(tcx.includes('xmlns="http://www.garmin.com/xmlschemas/ActivityExtension/v2"'));
});

test('getTcxString includes heartrate in HeartRateBpm/Value', () => {
    const measurements = new MeasurementsState();
    measurements.addHeartrate({ timestamp: 1000, value: 145 });

    const tcx = getTcxString(measurements);

    assert.ok(tcx.includes('<HeartRateBpm><Value>145</Value></HeartRateBpm>'));
});

test('getTcxString includes cadence in Cadence element', () => {
    const measurements = new MeasurementsState();
    measurements.addCadence({ timestamp: 1000, value: 85 });

    const tcx = getTcxString(measurements);

    assert.ok(tcx.includes('<Cadence>85</Cadence>'));
});

test('getTcxString handles all three metrics at same timestamp', () => {
    const measurements = new MeasurementsState();
    const timestamp = 1000;

    measurements.addPower({ timestamp, value: 250 });
    measurements.addCadence({ timestamp, value: 80 });
    measurements.addHeartrate({ timestamp, value: 145 });

    const tcx = getTcxString(measurements);

    // All three should be present
    assert.ok(tcx.includes('<Watts>250</Watts>'));
    assert.ok(tcx.includes('<Cadence>80</Cadence>'));
    assert.ok(tcx.includes('<HeartRateBpm><Value>145</Value></HeartRateBpm>'));
});

test('getTcxString omits missing metrics (null values)', () => {
    const measurements = new MeasurementsState();

    // Only add power, no cadence or heartrate
    measurements.addPower({ timestamp: 1000, value: 250 });

    const tcx = getTcxString(measurements);

    // Power should be present
    assert.ok(tcx.includes('<Watts>250</Watts>'));

    // HeartRateBpm and Cadence should NOT be present (not even as empty tags)
    assert.ok(!tcx.includes('<HeartRateBpm>'));
    assert.ok(!tcx.includes('<Cadence>'));
});

test('getTcxString rounds decimal values', () => {
    const measurements = new MeasurementsState();
    const timestamp = 1000;

    measurements.addPower({ timestamp, value: 250.7 });
    measurements.addCadence({ timestamp, value: 80.3 });
    measurements.addHeartrate({ timestamp, value: 145.9 });

    const tcx = getTcxString(measurements);

    // Values should be rounded
    assert.ok(tcx.includes('<Watts>251</Watts>'));
    assert.ok(tcx.includes('<Cadence>80</Cadence>'));
    assert.ok(tcx.includes('<HeartRateBpm><Value>146</Value></HeartRateBpm>'));
});

test('getTcxString creates multiple trackpoints for multiple timestamps', () => {
    const measurements = new MeasurementsState();

    measurements.addPower({ timestamp: 1000, value: 200 });
    measurements.addPower({ timestamp: 2000, value: 250 });
    measurements.addPower({ timestamp: 3000, value: 300 });

    const tcx = getTcxString(measurements);

    // Should have 3 trackpoints
    const trackpointMatches = tcx.match(/<Trackpoint>/g);
    assert.strictEqual(trackpointMatches!.length, 3);
});

test('getTcxString includes required Lap elements', () => {
    const measurements = new MeasurementsState();
    measurements.addPower({ timestamp: 1000, value: 200 });

    const tcx = getTcxString(measurements);

    // Required Lap child elements per TCX schema (in order)
    assert.ok(tcx.includes('<TotalTimeSeconds>'));
    assert.ok(tcx.includes('<DistanceMeters>0</DistanceMeters>'));
    assert.ok(tcx.includes('<Calories>0</Calories>'));
    assert.ok(tcx.includes('<Intensity>Active</Intensity>'));
    assert.ok(tcx.includes('<TriggerMethod>Manual</TriggerMethod>'));
});

test('getTcxString includes schema location for validation', () => {
    const measurements = new MeasurementsState();
    measurements.addPower({ timestamp: 1000, value: 200 });

    const tcx = getTcxString(measurements);

    assert.ok(tcx.includes('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'));
    assert.ok(tcx.includes('xsi:schemaLocation'));
    assert.ok(tcx.includes('TrainingCenterDatabasev2.xsd'));
});
