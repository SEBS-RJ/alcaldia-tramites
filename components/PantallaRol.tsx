// ─── PantallaRol.tsx — T-03 (HU-1) ──────────────────────────────────────────
// Muestra contenido diferente según el rol del usuario autenticado.
// Reemplaza a LoginSuccess — ahora el acceso se restringe por permisos reales.

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSesion } from '../context/SesionContext';
import { styles } from '../styles/loginStyles';

interface Props {
  onLogout: () => void;
}

// ─── Configuración de acceso por rol ─────────────────────────────────────────
// T-03: Define qué módulos ve cada rol.

const MODULOS_POR_ROL = {
  'Administrador': [
    { icono: 'people-outline',        etiqueta: 'Gestión de Usuarios' },
    { icono: 'document-text-outline', etiqueta: 'Todos los Trámites' },
    { icono: 'settings-outline',      etiqueta: 'Configuración del Sistema' },
    { icono: 'bar-chart-outline',     etiqueta: 'Reportes y Auditoría' },
  ],
  'Jefe de Área': [
    { icono: 'checkmark-circle-outline', etiqueta: 'Aprobar / Rechazar Trámites' },
    { icono: 'document-text-outline',    etiqueta: 'Trámites del Área' },
    { icono: 'bar-chart-outline',        etiqueta: 'Reportes del Área' },
  ],
  'Funcionario Municipal': [
    { icono: 'document-text-outline', etiqueta: 'Trámites Asignados' },
    { icono: 'attach-outline',        etiqueta: 'Revisar Documentos' },
    { icono: 'git-branch-outline',    etiqueta: 'Derivar Trámite' },
  ],
} as const;

// ─── Colores por rol ──────────────────────────────────────────────────────────

const COLOR_POR_ROL: Record<string, string> = {
  'Administrador':       '#7c3aed',
  'Jefe de Área':        '#0369a1',
  'Funcionario Municipal': '#0f2554',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PantallaRol({ onLogout }: Props) {
  const { usuarioActivo, tienePermiso } = useSesion();

  if (!usuarioActivo) return null;

  const modulos = MODULOS_POR_ROL[usuarioActivo.rol] ?? [];
  const colorRol = COLOR_POR_ROL[usuarioActivo.rol] ?? '#0f2554';

  return (
    <View style={styles.rolContainer}>
      <StatusBar style="light" />

      {/* ── Cabecera de bienvenida ── */}
      <View style={[styles.rolHeader, { backgroundColor: colorRol }]}>
        <Text style={styles.rolBienvenida}>¡Bienvenido!</Text>
        <Text style={styles.rolUsuario}>{usuarioActivo.usuario}</Text>
        <View style={styles.rolBadge}>
          <Text style={styles.rolBadgeText}>{usuarioActivo.rol}</Text>
        </View>
      </View>

      {/* ── Módulos habilitados para este rol (T-03) ── */}
      <ScrollView contentContainerStyle={styles.rolScrollContent}>
        <Text style={styles.rolSeccionTitle}>Módulos habilitados</Text>

        {modulos.map((modulo, index) => (
          <TouchableOpacity
            key={index}
            style={styles.moduloCard}
            activeOpacity={0.75}
          >
            <View style={[styles.moduloIconCircle, { backgroundColor: colorRol + '18' }]}>
              <Ionicons
                name={modulo.icono as any}
                size={24}
                color={colorRol}
              />
            </View>
            <Text style={styles.moduloEtiqueta}>{modulo.etiqueta}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ))}

        {/* ── Nota de sprint ── */}
        <View style={styles.sprintNote}>
          <Ionicons name="information-circle-outline" size={13} color="#6b7280" />
          <Text style={styles.sprintNoteText}>
            Sprint 1 completado · Módulos disponibles en próximos sprints
          </Text>
        </View>

        {/* ── Botón cerrar sesión ── */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color="#374151" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}