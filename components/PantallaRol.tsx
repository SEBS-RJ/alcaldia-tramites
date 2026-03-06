// ─── PantallaRol.tsx — T-03 (HU-1) ──────────────────────────────────────────
// Muestra módulos según el rol del usuario autenticado.
// Navegación local con useState hasta implementar React Navigation en Sprint 2.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSesion } from '../context/SesionContext';
import { styles } from '../styles/loginStyles';
import AuditoriaScreen from '../screens/AuditoriaScreen';
import RegistroTramiteScreen from '../screens/RegistroTramiteScreen';

interface Props {
  onLogout: () => void;
}

// ─── Módulos por rol ──────────────────────────────────────────────────────────

const MODULOS_POR_ROL = {
  'Administrador': [
    { icono: 'people-outline',        etiqueta: 'Gestión de Usuarios',       pantalla: null },
    { icono: 'document-text-outline', etiqueta: 'Todos los Trámites',         pantalla: null },
    { icono: 'settings-outline',      etiqueta: 'Configuración del Sistema',  pantalla: null },
    { icono: 'bar-chart-outline',     etiqueta: 'Reportes y Auditoría',       pantalla: 'auditoria' },
  ],
  'Jefe de Área': [
    { icono: 'checkmark-circle-outline', etiqueta: 'Aprobar / Rechazar Trámites', pantalla: null },
    { icono: 'document-text-outline',    etiqueta: 'Trámites del Área',           pantalla: null },
    { icono: 'bar-chart-outline',        etiqueta: 'Reportes del Área',           pantalla: null },
  ],
  'Funcionario Municipal': [
    { icono: 'add-circle-outline',    etiqueta: 'Registrar Nuevo Trámite',  pantalla: 'registro_tramite' },
    { icono: 'document-text-outline', etiqueta: 'Trámites Asignados',       pantalla: null },
    { icono: 'attach-outline',        etiqueta: 'Revisar Documentos',       pantalla: null },
    { icono: 'git-branch-outline',    etiqueta: 'Derivar Trámite',          pantalla: null },
  ],
} as const;

const COLOR_POR_ROL: Record<string, string> = {
  'Administrador':        '#7c3aed',
  'Jefe de Área':         '#0369a1',
  'Funcionario Municipal':'#0f2554',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PantallaRol({ onLogout }: Props) {
  const { usuarioActivo } = useSesion();
  const [pantallaActiva, setPantallaActiva] = useState<string | null>(null);

  if (!usuarioActivo) return null;

  const volver = () => setPantallaActiva(null);

  if (pantallaActiva === 'auditoria') {
    return <AuditoriaScreen onVolver={volver} />;
  }

  if (pantallaActiva === 'registro_tramite') {
    return <RegistroTramiteScreen onVolver={volver} />;
  }

  const modulos = MODULOS_POR_ROL[usuarioActivo.rol] ?? [];
  const colorRol = COLOR_POR_ROL[usuarioActivo.rol] ?? '#0f2554';

  return (
    <View style={styles.rolContainer}>
      <StatusBar style="light" />

      {/* ── Cabecera ── */}
      <View style={[styles.rolHeader, { backgroundColor: colorRol }]}>
        <Text style={styles.rolBienvenida}>¡Bienvenido!</Text>
        <Text style={styles.rolUsuario}>{usuarioActivo.usuario}</Text>
        <View style={styles.rolBadge}>
          <Text style={styles.rolBadgeText}>{usuarioActivo.rol}</Text>
        </View>
      </View>

      {/* ── Módulos ── */}
      <ScrollView contentContainerStyle={styles.rolScrollContent}>
        <Text style={styles.rolSeccionTitle}>Módulos habilitados</Text>

        {modulos.map((modulo, index) => (
          <TouchableOpacity
            key={index}
            style={styles.moduloCard}
            activeOpacity={modulo.pantalla ? 0.75 : 0.4}
            onPress={() => modulo.pantalla && setPantallaActiva(modulo.pantalla)}
          >
            <View style={[styles.moduloIconCircle, { backgroundColor: colorRol + '18' }]}>
              <Ionicons name={modulo.icono as any} size={24} color={colorRol} />
            </View>
            <Text style={styles.moduloEtiqueta}>{modulo.etiqueta}</Text>
            <Ionicons
              name={modulo.pantalla ? 'chevron-forward' : 'time-outline'}
              size={18}
              color={modulo.pantalla ? '#6b7280' : '#d1d5db'}
            />
          </TouchableOpacity>
        ))}

        <View style={styles.sprintNote}>
          <Ionicons name="information-circle-outline" size={13} color="#6b7280" />
          <Text style={styles.sprintNoteText}>
            Sprint 2 en curso · Módulos restantes disponibles próximamente
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color="#374151" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}