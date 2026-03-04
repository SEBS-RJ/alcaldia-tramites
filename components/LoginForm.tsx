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
import LoginSuccess from "./LoginSuccess";
import { USUARIOS_PRUEBA } from "../data/usuariosDemo";
import { styles } from "../styles/loginStyles";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FormErrors {
  usuario: string;
  contrasena: string;
  credenciales: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function LoginForm() {
  // Estado del formulario
  const [usuario, setUsuario] = useState<string>("");
  const [contrasena, setContrasena] = useState<string>("");
  const [mostrarContrasena, setMostrarContrasena] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [loginExitoso, setLoginExitoso] = useState<boolean>(false);
  const [rolUsuario, setRolUsuario] = useState<string>("");

  // Estado de errores por campo
  const [errores, setErrores] = useState<FormErrors>({
    usuario: "",
    contrasena: "",
    credenciales: "",
  });

  // ── Validación ──────────────────────────────────────────────────────────

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

  // ── Lógica de login ─────────────────────────────────────────────────────

  const handleLogin = async () => {
    // Limpiar errores previos
    setErrores({ usuario: "", contrasena: "", credenciales: "" });

    if (!validarFormulario()) return;

    // Simular llamada al backend (1.5 segundos)
    setCargando(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setCargando(false);

    // Verificar contra credenciales simuladas
    const usuarioEncontrado = USUARIOS_PRUEBA.find(
      (u) =>
        u.usuario === usuario.trim().toLowerCase() &&
        u.contrasena === contrasena,
    );

    if (usuarioEncontrado) {
      setRolUsuario(usuarioEncontrado.rol);
      setLoginExitoso(true);
    } else {
      setErrores((prev) => ({
        ...prev,
        credenciales: "Usuario o contraseña incorrectos. Intente nuevamente.",
      }));
    }
  };

  // ── Pantalla de éxito ───────────────────────────────────────────────────

  if (loginExitoso) {
    return (
      <LoginSuccess
        rol={rolUsuario}
        onLogout={() => {
          setLoginExitoso(false);
          setUsuario("");
          setContrasena("");
          setRolUsuario("");
        }}
      />
    );
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
        {/* Cabecera con logo institucional */}
        <LoginHeader />

        {/* Tarjeta del formulario */}
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
              {/* Botón mostrar / ocultar contraseña */}
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

          {/* ── Usuarios habilitados (para presentación) ── */}
          <View style={styles.credencialesBox}>
            <View style={styles.credencialesTitleRow}>
              <Ionicons name="key-outline" size={13} color="#0369a1" />
              <Text style={styles.credencialesTitle}>Usuarios habilitados</Text>
            </View>
            <Text style={styles.credencialesItem}>
              <Text style={styles.credencialesBold}>admin</Text> / 1234 →
              Administrador
            </Text>
            <Text style={styles.credencialesItem}>
              <Text style={styles.credencialesBold}>funcionario</Text> / 1234 →
              Funcionario Municipal
            </Text>
            <Text style={styles.credencialesItem}>
              <Text style={styles.credencialesBold}>jefe</Text> / 1234 → Jefe de
              Área
            </Text>
          </View>
        </View>

        {/* Pie de página con info del sprint */}
        <LoginFooter />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
