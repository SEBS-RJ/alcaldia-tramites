import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SesionProvider } from './context/SesionContext';
import LoginScreen from './screens/LoginScreen';

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