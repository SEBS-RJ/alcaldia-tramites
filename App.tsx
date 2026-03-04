import React from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoginScreen from "./screens/LoginScreen";

// En web, SafeAreaProvider puede causar pantalla en blanco,
// por eso se omite en esa plataforma.
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
