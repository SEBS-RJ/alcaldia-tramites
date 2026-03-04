import React from "react";
import { View, Text } from "react-native";
import { styles } from "../styles/loginStyles";

export default function LoginFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>Sistema de Trámites Digitales</Text>
    </View>
  );
}
