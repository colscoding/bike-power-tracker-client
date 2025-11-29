import test from 'node:test';
import assert from 'node:assert';
import { getTimestring } from './getTimestring.js';

test('getTimestring returns 00:00:00 for 0 milliseconds', () => {
    assert.strictEqual(getTimestring(0), '00:00:00');
});

test('getTimestring formats seconds correctly', () => {
    assert.strictEqual(getTimestring(1000), '00:00:01');
    assert.strictEqual(getTimestring(5000), '00:00:05');
    assert.strictEqual(getTimestring(59000), '00:00:59');
});

test('getTimestring formats minutes correctly', () => {
    assert.strictEqual(getTimestring(60000), '00:01:00');
    assert.strictEqual(getTimestring(90000), '00:01:30');
    assert.strictEqual(getTimestring(3599000), '00:59:59');
});

test('getTimestring formats hours correctly', () => {
    assert.strictEqual(getTimestring(3600000), '01:00:00');
    assert.strictEqual(getTimestring(3661000), '01:01:01');
    assert.strictEqual(getTimestring(36000000), '10:00:00');
});

test('getTimestring pads single digits with zeros', () => {
    assert.strictEqual(getTimestring(3661000), '01:01:01');
    assert.strictEqual(getTimestring(7322000), '02:02:02');
});

test('getTimestring floors fractional seconds', () => {
    assert.strictEqual(getTimestring(1500), '00:00:01');
    assert.strictEqual(getTimestring(1999), '00:00:01');
});

test('getTimestring handles long durations', () => {
    // 99 hours, 59 minutes, 59 seconds
    assert.strictEqual(getTimestring(359999000), '99:59:59');
});
