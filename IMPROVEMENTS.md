# Improvement Recommendations

This document describes larger improvements that could enhance code quality and maintainability but are beyond quick fixes.

## 1. Console Warnings in Tests

**Problem**: Unit tests for `MeasurementsState` print `console.warn` messages (e.g., "Invalid heartrate value: 0") which pollute test output.

**Solution**: Suppress console output during tests or mock `console.warn` in tests. Options include:
- Add a `--silent` flag or custom test reporter
- Mock `console.warn` in beforeEach/afterEach hooks
- Add a test-specific logger that can be silenced

```javascript
// Example: Mock console.warn in test
test('...', () => {
    const warnSpy = test.mock.method(console, 'warn');
    // ... test code
    assert.strictEqual(warnSpy.mock.calls.length, 1);
});
```

## ~~2. Missing TCX Export Tests~~ ✅ COMPLETED

~~**Problem**: `create-tcx.js` has no unit tests.~~

**Resolution**: Created `src/create-tcx.test.js` with 13 comprehensive tests covering:
- Empty measurements returning empty string
- Valid TCX XML structure
- Correct ISO timestamp formatting
- Correct sport type ("Biking")
- Correct calculation of TotalTimeSeconds
- Handling of missing metrics (null values)
- Rounding of decimal values
- Multiple trackpoints
- Required Lap elements

## ~~3. Import Path Consistency~~ ✅ COMPLETED

~~**Problem**: Some imports omit the `.js` extension while others include it.~~

**Resolution**: Standardized all imports to use `.js` extension. Updated files:
- `src/getInitState.js`
- `src/initConnectionButtons.js`
- `src/initMetricsDisplay.js`
- `src/ui/menu.js`

## 4. Error Handling in Connection Functions

**Problem**: Bluetooth connection functions don't handle all potential errors gracefully. For example, if `device.gatt.connect()` fails, there's no user-facing error message.

**Solution**: Add try-catch blocks with user notifications:
```javascript
try {
    const server = await device.gatt.connect();
    // ...
} catch (error) {
    showNotification('Failed to connect to device', 'error');
    throw error;
}
```

## 5. Memory Leak in Event Listeners

**Problem**: The `initInstallPrompt.js` adds event listeners to buttons but doesn't clean them up if called multiple times.

**Solution**: Use `{ once: true }` option or track and remove listeners:
```javascript
installButton.addEventListener('click', handleInstall, { once: true });
```

## ~~6. E2E Test Reliability~~ ✅ COMPLETED

~~**Problem**: E2E tests use fixed `waitForTimeout` calls which can be flaky.~~

**Resolution**: Refactored all E2E tests to use Playwright's auto-waiting assertions:
- Replaced `waitForTimeout` with proper `expect().toHaveText()`, `expect().toContainText()`, etc.
- Used `{ timeout: X }` option where needed for slower operations
- Used `expect().toPass()` for polling assertions
- Used relative URL `/` with `baseURL` from config instead of hardcoded URLs
- Updated files: `power.spec.js`, `cadence.spec.js`, `heartrate.spec.js`, `workout.spec.js`, `export.spec.js`

## 7. Type Safety

**Problem**: No TypeScript or JSDoc type annotations for better IDE support and error catching.

**Solution**: Consider adding JSDoc annotations or migrating to TypeScript incrementally. Start with core modules like `MeasurementsState.js`:
```javascript
/**
 * @typedef {Object} Measurement
 * @property {number} timestamp
 * @property {number} value
 */

/**
 * @class MeasurementsState
 */
class MeasurementsState {
    /** @type {Measurement[]} */
    heartrate = [];
    // ...
}
```

## Priority Order (Remaining Items)

1. **Medium**: Console warnings in tests (clutters output)
2. **Medium**: Error handling in connection functions (user experience)
3. **Low**: Type safety (nice to have)
4. **Low**: Memory leak in event listeners (minor in practice)
