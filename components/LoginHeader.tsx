import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles/loginStyles";

export default function LoginHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="business" size={40} color="#ffffff" />
        </View>
      </View>
      <Text style={styles.headerTitle}>ALCALDÍA MUNICIPAL</Text>
      <Text style={styles.headerSubtitle}>Sistema de Trámites en Línea</Text>
      <View style={styles.headerDivider} />
    </View>
  );
}
