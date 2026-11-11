export const DRIVER_LOCATION_TASK = 'al-toque-driver-background-location';

export async function syncBackgroundTrackingSession(): Promise<void> {}

export async function isBackgroundDriverTrackingRunning(): Promise<boolean> {
  return false;
}

export async function startBackgroundDriverTracking(): Promise<boolean> {
  return false;
}

export async function stopBackgroundDriverTracking(): Promise<void> {}

