import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SesionProvider } from './context/SesionContext';
import LoginScreen from './screens/LoginScreen';

// SesionProvider envuelve toda la app para que cualquier
// pantalla pueda acceder al usuario activo y su rol (T-03).
export default function App() {
  if (Platform.OS === 'web') {
    return (
      <SesionProvider>
        <LoginScreen />
      </SesionProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SesionProvider>
        <LoginScreen />
      </SesionProvider>
    </SafeAreaProvider>
  );
}