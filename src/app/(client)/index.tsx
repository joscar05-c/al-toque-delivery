import { Redirect } from 'expo-router';

/** Punto de entrada del grupo (client): siempre aterriza en los tabs. */
export default function ClientIndex() {
  return <Redirect href="/(client)/(tabs)" />;
}
