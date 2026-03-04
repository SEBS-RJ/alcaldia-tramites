import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { styles } from "../styles/loginStyles";

interface Props {
  rol: string;
  onLogout: () => void;
}

export default function LoginSuccess({ rol, onLogout }: Props) {
  return (
    <View style={styles.successContainer}>
      <StatusBar style="light" />

      <View style={styles.successCard}>
        {/* Ícono de éxito */}
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark" size={40} color="#16a34a" />
        </View>

        <Text style={styles.successTitle}>¡Bienvenido!</Text>
        <Text style={styles.successRol}>{rol}</Text>
        <Text style={styles.successSubtitle}>
          Acceso concedido al Sistema de Trámites
        </Text>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
