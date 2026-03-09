// ─── LoginForm.tsx — T-01 a T-05 (HU-1) + Permisos Dinámicos ────────────────
// iniciarSesionContexto ahora es async (carga módulos del rol desde BD).

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

interface FormErrors {
  usuario: string;
  contrasena: string;
  credenciales: string;
}

function validarContrasenaLogin(contrasena: string): string {
  if (!contrasena.trim()) return "La contraseña es obligatoria.";
  if (contrasena.length < 8)
    return "La contraseña debe tener al menos 8 caracteres.";
  if (!/[A-Z]/.test(contrasena))
    return "La contraseña debe incluir al menos una letra mayúscula.";
  if (!/[a-z]/.test(contrasena))
    return "La contraseña debe incluir al menos una letra minúscula.";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(contrasena))
    return "La contraseña debe incluir al menos un carácter especial (!@#$%...).";
  return "";
}

export default function LoginForm() {
  const {
    usuarioActivo,
    iniciarSesionContexto,
    cerrarSesionContexto,
    cargandoModulos,
  } = useSesion();

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<FormErrors>({
    usuario: "",
    contrasena: "",
    credenciales: "",
  });

  const validarFormulario = (): boolean => {
    const e: FormErrors = { usuario: "", contrasena: "", credenciales: "" };
    let ok = true;
    if (!usuario.trim()) {
      e.usuario = "El usuario es obligatorio.";
      ok = false;
    }
    const errPass = validarContrasenaLogin(contrasena);
    if (errPass) {
      e.contrasena = errPass;
      ok = false;
    }
    setErrores(e);
    return ok;
  };

  const handleLogin = async () => {
    setErrores({ usuario: "", contrasena: "", credenciales: "" });
    if (!validarFormulario()) return;
    setCargando(true);
    const resultado = await iniciarSesion(usuario, contrasena);
    if (resultado.exito && resultado.usuarioSesion) {
      await iniciarSesionContexto(resultado.usuarioSesion);
    } else {
      setErrores((p) => ({
        ...p,
        credenciales: resultado.error ?? "Error al iniciar sesión.",
      }));
    }
    setCargando(false);
  };

  const handleLogout = async () => {
    if (usuarioActivo) await cerrarSesion(usuarioActivo);
    cerrarSesionContexto();
    setUsuario("");
    setContrasena("");
  };

  if (usuarioActivo) return <PantallaRol onLogout={handleLogout} />;

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
                onChangeText={(t) => {
                  setUsuario(t);
                  if (errores.usuario)
                    setErrores((p) => ({ ...p, usuario: "" }));
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
                placeholder="Mín. 8 chars, mayúscula, especial"
                placeholderTextColor="#9ca3af"
                value={contrasena}
                onChangeText={(t) => {
                  setContrasena(t);
                  if (errores.contrasena)
                    setErrores((p) => ({ ...p, contrasena: "" }));
                }}
                secureTextEntry={!mostrarContrasena}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!cargando}
              />
              <TouchableOpacity
                onPress={() => setMostrarContrasena((v) => !v)}
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

          {errores.credenciales ? (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={18} color="#dc2626" />
              <Text style={styles.errorBannerText}>{errores.credenciales}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.loginButton,
              (cargando || cargandoModulos) && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={cargando || cargandoModulos}
            activeOpacity={0.85}
          >
            {cargando || cargandoModulos ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.loginButtonText}>
                  {cargandoModulos ? "Cargando permisos..." : "Verificando..."}
                </Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Ingresar al Sistema</Text>
            )}
          </TouchableOpacity>

          <View style={styles.notaContrasena}>
            <Ionicons
              name="shield-checkmark-outline"
              size={13}
              color="#0369a1"
            />
            <Text style={styles.notaContrasenaTexto}>
              La contraseña debe tener mínimo 8 caracteres, incluir mayúscula,
              minúscula y un carácter especial.
            </Text>
          </View>
        </View>
        <LoginFooter />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
