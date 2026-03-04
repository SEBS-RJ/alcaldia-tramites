import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FormErrors {
  usuario: string;
  contrasena: string;
  credenciales: string;
}

// ─── Credenciales simuladas (sin backend todavía) ─────────────────────────────

const USUARIOS_DEMO = [
  { usuario: "admin", contrasena: "1234", rol: "Administrador" },
  { usuario: "funcionario", contrasena: "1234", rol: "Funcionario Municipal" },
  { usuario: "jefe", contrasena: "1234", rol: "Jefe de Área" },
];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function LoginScreen() {
  // Estado del formulario
  const [usuario, setUsuario] = useState<string>("");
  const [contrasena, setContrasena] = useState<string>("");
  const [mostrarContrasena, setMostrarContrasena] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [loginExitoso, setLoginExitoso] = useState<boolean>(false);
  const [rolUsuario, setRolUsuario] = useState<string>("");

  // Estado de errores
  const [errores, setErrores] = useState<FormErrors>({
    usuario: "",
    contrasena: "",
    credenciales: "",
  });

  // ── Validación del formulario ─────────────────────────────────────────────

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

  // ── Manejo del inicio de sesión ───────────────────────────────────────────

  const handleLogin = async () => {
    // Limpiar errores anteriores
    setErrores({ usuario: "", contrasena: "", credenciales: "" });

    // Validar campos
    if (!validarFormulario()) return;

    // Simular carga (como si consultara el backend)
    setCargando(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Verificar credenciales simuladas
    const usuarioEncontrado = USUARIOS_DEMO.find(
      (u) =>
        u.usuario === usuario.trim().toLowerCase() &&
        u.contrasena === contrasena,
    );

    setCargando(false);

    if (usuarioEncontrado) {
      // Credenciales correctas → acceso permitido
      setRolUsuario(usuarioEncontrado.rol);
      setLoginExitoso(true);
    } else {
      // Credenciales incorrectas → mostrar error
      setErrores((prev) => ({
        ...prev,
        credenciales: "Usuario o contraseña incorrectos. Intente nuevamente.",
      }));
    }
  };

  // ── Pantalla de bienvenida tras login exitoso ─────────────────────────────

  if (loginExitoso) {
    return (
      <View style={styles.successContainer}>
        <StatusBar style="light" />
        <View style={styles.successCard}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={40} color="#16a34a" />
          </View>
          <Text style={styles.successTitle}>¡Bienvenido!</Text>
          <Text style={styles.successRol}>{rolUsuario}</Text>
          <Text style={styles.successSubtitle}>
            Acceso concedido al Sistema de Trámites
          </Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              setLoginExitoso(false);
              setUsuario("");
              setContrasena("");
              setRolUsuario("");
            }}
          >
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Nota para presentación */}
        <View style={styles.demoNote}>
          <View style={styles.demoNoteRow}>
            <Ionicons
              name="information-circle-outline"
              size={13}
              color="#93c5fd"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.demoNoteText}>
              Sprint 1 – Módulo de autenticación simulado (sin backend)
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Pantalla de Login principal ───────────────────────────────────────────

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
        {/* Cabecera institucional */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="business" size={40} color="#ffffff" />
            </View>
          </View>
          <Text style={styles.headerTitle}>ALCALDÍA MUNICIPAL</Text>
          <Text style={styles.headerSubtitle}>
            Sistema de Trámites en Línea
          </Text>
          <View style={styles.headerDivider} />
        </View>

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
                usuario.length > 0 && !errores.usuario
                  ? styles.inputWrapperFocus
                  : null,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ej: funcionario, admin, jefe"
                placeholderTextColor="#9ca3af"
                value={usuario}
                onChangeText={(text) => {
                  setUsuario(text);
                  if (errores.usuario) {
                    setErrores((prev) => ({ ...prev, usuario: "" }));
                  }
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
                contrasena.length > 0 && !errores.contrasena
                  ? styles.inputWrapperFocus
                  : null,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ingrese su contraseña"
                placeholderTextColor="#9ca3af"
                value={contrasena}
                onChangeText={(text) => {
                  setContrasena(text);
                  if (errores.contrasena) {
                    setErrores((prev) => ({ ...prev, contrasena: "" }));
                  }
                }}
                secureTextEntry={!mostrarContrasena}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!cargando}
              />
              {/* Botón mostrar/ocultar contraseña */}
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

          {/* ── Error de credenciales incorrectas ── */}
          {errores.credenciales ? (
            <View style={styles.errorBanner}>
              <MaterialIcons
                name="error-outline"
                size={18}
                color="#dc2626"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.errorBannerText}>{errores.credenciales}</Text>
            </View>
          ) : null}

          {/* ── Botón de inicio de sesión ── */}
          <TouchableOpacity
            style={[styles.loginButton, cargando && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={cargando}
            activeOpacity={0.85}
          >
            {cargando ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={styles.loginButtonText}> Verificando...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Ingresar al Sistema</Text>
            )}
          </TouchableOpacity>

          {/* ── Nota de credenciales demo ── */}
          <View style={styles.demoCredentials}>
            <View style={styles.demoCredTitleRow}>
              <Ionicons
                name="key-outline"
                size={13}
                color="#0369a1"
                style={{ marginRight: 5 }}
              />
              <Text style={styles.demoCredTitle}>Credenciales de prueba</Text>
            </View>
            <Text style={styles.demoCredItem}>
              <Text style={styles.demoCredBold}>admin</Text> / 1234 →
              Administrador
            </Text>
            <Text style={styles.demoCredItem}>
              <Text style={styles.demoCredBold}>funcionario</Text> / 1234 →
              Funcionario
            </Text>
            <Text style={styles.demoCredItem}>
              <Text style={styles.demoCredBold}>jefe</Text> / 1234 → Jefe de
              Área
            </Text>
          </View>
        </View>

        {/* Pie de página */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Sistema de Trámites Digitales v1.0
          </Text>
          <Text style={styles.footerSprint}>
            Sprint 1 · T-01 HU-1 · Diseño interfaz de login
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

const styles = StyleSheet.create({
  // Contenedores base
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#0f2554",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },

  // ── Cabecera ──────────────────────────────────────────────────────────────
  header: {
    alignItems: "center",
    marginBottom: 28,
    width: "100%",
    maxWidth: 480,
  },
  logoContainer: {
    marginBottom: 14,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ffffff18",
    borderWidth: 2,
    borderColor: "#ffffff30",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: isWeb ? 22 : 18,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 2,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: isWeb ? 14 : 12,
    color: "#93c5fd",
    marginTop: 4,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  headerDivider: {
    width: 48,
    height: 3,
    backgroundColor: "#3b82f6",
    borderRadius: 2,
    marginTop: 14,
  },

  // ── Tarjeta del formulario ────────────────────────────────────────────────
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: isWeb ? 36 : 24,
    width: "100%",
    maxWidth: 480,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  cardTitle: {
    fontSize: isWeb ? 24 : 20,
    fontWeight: "700",
    color: "#0f2554",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 28,
  },

  // ── Campos del formulario ─────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 7,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
    height: 50,
  },
  inputWrapperError: {
    borderColor: "#ef4444",
    backgroundColor: "#fff5f5",
  },
  inputWrapperFocus: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 0,
  },
  eyeButton: {
    paddingLeft: 8,
  },
  demoCredTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  demoNoteRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  demoCredTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0369a1",
  },

  // ── Mensajes de error ─────────────────────────────────────────────────────
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 2,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  errorBannerText: {
    color: "#dc2626",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },

  // ── Botón de login ────────────────────────────────────────────────────────
  loginButton: {
    backgroundColor: "#1a3a8f",
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#1a3a8f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: "#6b7280",
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  // ── Credenciales demo ─────────────────────────────────────────────────────
  demoCredentials: {
    marginTop: 22,
    padding: 14,
    backgroundColor: "#f0f9ff",
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#0ea5e9",
  },
  demoCredItem: {
    fontSize: 12,
    color: "#374151",
    marginTop: 2,
  },
  demoCredBold: {
    fontWeight: "700",
    color: "#0369a1",
  },

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  successContainer: {
    flex: 1,
    backgroundColor: "#0f2554",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 36,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f2554",
    marginBottom: 4,
  },
  successRol: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3b82f6",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 28,
  },
  logoutButton: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  logoutButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },

  // ── Nota demo ─────────────────────────────────────────────────────────────
  demoNote: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ffffff15",
    borderRadius: 8,
    maxWidth: 400,
    width: "100%",
  },
  demoNoteText: {
    color: "#93c5fd",
    fontSize: 11,
    textAlign: "center",
  },

  // ── Pie de página ─────────────────────────────────────────────────────────
  footer: {
    marginTop: 28,
    alignItems: "center",
  },
  footerText: {
    color: "#64748b",
    fontSize: 12,
  },
  footerSprint: {
    color: "#475569",
    fontSize: 11,
    marginTop: 2,
  },
});
