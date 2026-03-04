import React from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoginScreen from "./screens/LoginScreen";

/**
 * App.tsx — Punto de entrada de la aplicación
 *
 * Por ahora solo muestra la pantalla de Login (Sprint 1 - T-01 HU-1).
 * En sprints futuros aquí se configurará la navegación con
 * React Navigation para dirigir al usuario según su rol.
 *
 * Nota: En web, SafeAreaProvider puede causar pantalla en blanco,
 * por eso en esa plataforma se renderiza directamente sin el Provider.
 */
export default function App() {
  if (Platform.OS === "web") {
    return <LoginScreen />;
  }

  return (
    <SafeAreaProvider>
      <LoginScreen />
    </SafeAreaProvider>
  );
}
