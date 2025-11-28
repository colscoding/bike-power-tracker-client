# Bike Power Tracker - Client

Progressive Web App for tracking spin bike workouts with Bluetooth sensors.

## Features

- **Bluetooth Connectivity**: Connect to Bluetooth cycling sensors
- **Real-time Metrics**: Monitor power (watts), cadence (RPM), and heart rate (BPM)
- **Data Export**: Download workout data as JSON, TCX, and CSV
- **PWA Support**: Install as an app on mobile and desktop

## Development

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

## Building

```bash
pnpm build
```

Output will be in the `dist/` directory.

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```
