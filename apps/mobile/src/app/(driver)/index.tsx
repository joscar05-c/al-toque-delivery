import { Redirect } from 'expo-router';

/** Punto de entrada del grupo (driver): siempre aterriza en los tabs. */
export default function DriverIndex() {
  return <Redirect href="/(driver)/(tabs)" />;
}
