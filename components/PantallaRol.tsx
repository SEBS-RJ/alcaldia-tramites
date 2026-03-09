// ─── PantallaRol.tsx — Sistema de Permisos Dinámicos ─────────────────────────
// Los módulos se cargan desde Supabase al hacer login (via SesionContext).

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useSesion } from "../context/SesionContext";
import { styles } from "../styles/loginStyles";

import AuditoriaScreen from "../screens/AuditoriaScreen";
import RegistroTramiteScreen from "../screens/RegistroTramiteScreen";
import ConsultaTramiteScreen from "../screens/ConsultaTramiteScreen";
import AsignacionTramiteScreen from "../screens/AsignacionTramiteScreen";
import DocumentosScreen from "../screens/DocumentosScreen";
import GestionUsuariosScreen from "../screens/GestionUsuariosScreen";
import TodosTramitesScreen from "../screens/TodosTramitesScreen";
import ConfiguracionScreen from "../screens/ConfiguracionScreen";
import AprobarTramiteScreen from "../screens/AprobarTramiteScreen";
import TramitesAreaScreen from "../screens/TramitesAreaScreen";
import ReportesAreaScreen from "../screens/ReportesAreaScreen";

interface Props {
  onLogout: () => void;
}

const COLOR_ROL: Record<string, string> = {
  Administrador: "#7c3aed",
  "Funcionario Municipal": "#0f2554",
  "Jefe de Área": "#0369a1",
  "Director de Área": "#0891b2",
  "Secretario Municipal": "#059669",
  "Técnico Municipal": "#d97706",
  "Supervisor de Trámites": "#dc2626",
  "Auditor Interno": "#475569",
};

const PANTALLA_POR_MODULO: Record<string, string> = {
  registro_tramite: "registro_tramite",
  consulta_tramite: "consulta_tramite",
  asignacion_tramite: "asignacion_tramite",
  documentos: "documentos",
  todos_tramites: "todos_tramites",
  aprobar_tramite: "aprobar_tramite",
  tramites_area: "tramites_area",
  reportes_area: "reportes_area",
  gestion_usuarios: "gestion_usuarios",
  configuracion: "configuracion",
  auditoria: "auditoria",
};

export default function PantallaRol({ onLogout }: Props) {
  const { usuarioActivo, modulosActivos, cargandoModulos } = useSesion();
  const [pantallaActiva, setPantallaActiva] = useState<string | null>(null);

  if (!usuarioActivo) return null;
  const volver = () => setPantallaActiva(null);
  const colorRol = COLOR_ROL[usuarioActivo.rol] ?? "#0f2554";

  if (pantallaActiva === "auditoria")
    return <AuditoriaScreen onVolver={volver} />;
  if (pantallaActiva === "registro_tramite")
    return <RegistroTramiteScreen onVolver={volver} />;
  if (pantallaActiva === "consulta_tramite")
    return <ConsultaTramiteScreen onVolver={volver} />;
  if (pantallaActiva === "asignacion_tramite")
    return <AsignacionTramiteScreen onVolver={volver} />;
  if (pantallaActiva === "documentos")
    return <DocumentosScreen onVolver={volver} />;
  if (pantallaActiva === "gestion_usuarios")
    return <GestionUsuariosScreen onVolver={volver} />;
  if (pantallaActiva === "todos_tramites")
    return <TodosTramitesScreen onVolver={volver} />;
  if (pantallaActiva === "configuracion")
    return <ConfiguracionScreen onVolver={volver} />;
  if (pantallaActiva === "aprobar_tramite")
    return <AprobarTramiteScreen onVolver={volver} />;
  if (pantallaActiva === "tramites_area")
    return <TramitesAreaScreen onVolver={volver} />;
  if (pantallaActiva === "reportes_area")
    return <ReportesAreaScreen onVolver={volver} />;

  return (
    <View style={styles.rolContainer}>
      <StatusBar style="light" />
      <View style={[styles.rolHeader, { backgroundColor: colorRol }]}>
        <Text style={styles.rolBienvenida}>¡Bienvenido!</Text>
        <Text style={styles.rolUsuario}>{usuarioActivo.usuario}</Text>
        <View style={styles.rolBadge}>
          <Text style={styles.rolBadgeText}>{usuarioActivo.rol}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.rolScrollContent}>
        <Text style={styles.rolSeccionTitle}>Módulos habilitados</Text>
        {cargandoModulos ? (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 10 }}>
            <ActivityIndicator color={colorRol} size="large" />
            <Text style={{ color: "#94a3b8", fontSize: 14 }}>
              Cargando permisos...
            </Text>
          </View>
        ) : modulosActivos.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
            <Ionicons name="lock-closed-outline" size={40} color="#d1d5db" />
            <Text
              style={{ color: "#9ca3af", fontSize: 14, textAlign: "center" }}
            >
              No tiene módulos asignados.{"\n"}Contacte al Administrador.
            </Text>
          </View>
        ) : (
          modulosActivos.map((modulo) => {
            const pantallaId = PANTALLA_POR_MODULO[modulo.id];
            return (
              <TouchableOpacity
                key={modulo.id}
                style={styles.moduloCard}
                activeOpacity={pantallaId ? 0.75 : 0.4}
                onPress={() => pantallaId && setPantallaActiva(pantallaId)}
              >
                <View
                  style={[
                    styles.moduloIconCircle,
                    { backgroundColor: colorRol + "18" },
                  ]}
                >
                  <Ionicons
                    name={modulo.icono as any}
                    size={24}
                    color={colorRol}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduloEtiqueta}>{modulo.etiqueta}</Text>
                  {modulo.descripcion ? (
                    <Text style={styles.moduloDescripcion}>
                      {modulo.descripcion}
                    </Text>
                  ) : null}
                </View>
                <Ionicons
                  name={pantallaId ? "chevron-forward" : "time-outline"}
                  size={18}
                  color={pantallaId ? "#6b7280" : "#d1d5db"}
                />
              </TouchableOpacity>
            );
          })
        )}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color="#374151" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
