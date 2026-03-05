// ─── LoginForm.tsx — T-01, T-02, T-03, T-04, T-05 (HU-1) ───────────────────
// Formulario de login conectado a Supabase con hash SHA-256 y auditoría.

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import LoginHeader from "./LoginHeader";
import LoginFooter from "./LoginFooter";
import PantallaRol from "./PantallaRol";
import { iniciarSesion, cerrarSesion } from "../services/authService";
import { useSesion } from "../context/SesionContext";
import { styles } from "../styles/loginStyles";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FormErrors {
  usuario: string;
  contrasena: string;
  credenciales: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function LoginForm() {
  const { usuarioActivo, iniciarSesionContexto, cerrarSesionContexto } =
    useSesion();

  const [usuario, setUsuario] = useState<string>("");
  const [contrasena, setContrasena] = useState<string>("");
  const [mostrarContrasena, setMostrarContrasena] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);

  const [errores, setErrores] = useState<FormErrors>({
    usuario: "",
    contrasena: "",
    credenciales: "",
  });

  // ── Validación de campos ────────────────────────────────────────────────

  const validarFormulario = (): boolean => {
    const nuevosErrores: FormErrors = {
      usuario: "",
      contrasena: "",
      credenciales: "",
    };
    let esValido = true;

    if (!usuario.trim()) {
      nuevosErrores.usuario = "El usuario es obligatorio.";
      esValido = false;
    }

    if (!contrasena.trim()) {
      nuevosErrores.contrasena = "La contraseña es obligatoria.";
      esValido = false;
    } else if (contrasena.length < 4) {
      nuevosErrores.contrasena =
        "La contraseña debe tener al menos 4 caracteres.";
      esValido = false;
    }

    setErrores(nuevosErrores);
    return esValido;
  };

  // ── Login con hash y auditoría (T-02, T-05 HU-1) ───────────────────────

  const handleLogin = async () => {
    setErrores({ usuario: "", contrasena: "", credenciales: "" });
    if (!validarFormulario()) return;

    setCargando(true);
    const resultado = await iniciarSesion(usuario, contrasena);
    setCargando(false);

    if (resultado.exito && resultado.usuarioSesion) {
      iniciarSesionContexto(resultado.usuarioSesion);
    } else {
      setErrores((prev) => ({
        ...prev,
        credenciales: resultado.error ?? "Error al iniciar sesión.",
      }));
    }
  };

  // ── Cierre de sesión con auditoría (T-04 HU-1, T-02 HU-5) ─────────────

  const handleLogout = async () => {
    if (usuarioActivo) {
      await cerrarSesion(usuarioActivo);
    }
    cerrarSesionContexto();
    setUsuario("");
    setContrasena("");
  };

  // ── Si hay sesión activa, mostrar pantalla por rol (T-03) ───────────────

  if (usuarioActivo) {
    return <PantallaRol onLogout={handleLogout} />;
  }

  // ── Formulario principal ────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LoginHeader />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>
          <Text style={styles.cardSubtitle}>
            Ingrese sus credenciales institucionales
          </Text>

          {/* ── Campo: Usuario ── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Usuario</Text>
            <View
              style={[
                styles.inputWrapper,
                errores.usuario ? styles.inputWrapperError : null,
              ]}
            >
              <Ionicons name="person-outline" size={18} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Ingrese su usuario"
                placeholderTextColor="#9ca3af"
                value={usuario}
                onChangeText={(text) => {
                  setUsuario(text);
                  if (errores.usuario)
                    setErrores((prev) => ({ ...prev, usuario: "" }));
                }}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!cargando}
              />
            </View>
            {errores.usuario ? (
              <Text style={styles.errorText}>⚠ {errores.usuario}</Text>
            ) : null}
          </View>

          {/* ── Campo: Contraseña ── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View
              style={[
                styles.inputWrapper,
                errores.contrasena ? styles.inputWrapperError : null,
              ]}
            >
              <Ionicons name="lock-closed-outline" size={18} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Ingrese su contraseña"
                placeholderTextColor="#9ca3af"
                value={contrasena}
                onChangeText={(text) => {
                  setContrasena(text);
                  if (errores.contrasena)
                    setErrores((prev) => ({ ...prev, contrasena: "" }));
                }}
                secureTextEntry={!mostrarContrasena}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!cargando}
              />
              <TouchableOpacity
                onPress={() => setMostrarContrasena(!mostrarContrasena)}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={mostrarContrasena ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
            {errores.contrasena ? (
              <Text style={styles.errorText}>⚠ {errores.contrasena}</Text>
            ) : null}
          </View>

          {/* ── Banner: credenciales incorrectas ── */}
          {errores.credenciales ? (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={18} color="#dc2626" />
              <Text style={styles.errorBannerText}>{errores.credenciales}</Text>
            </View>
          ) : null}

          {/* ── Botón de ingreso ── */}
          <TouchableOpacity
            style={[styles.loginButton, cargando && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={cargando}
            activeOpacity={0.85}
          >
            {cargando ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={styles.loginButtonText}>Verificando...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Ingresar al Sistema</Text>
            )}
          </TouchableOpacity>
        </View>

        <LoginFooter />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
