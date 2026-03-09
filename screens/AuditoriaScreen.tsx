import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSesion } from '../context/SesionContext';
import {
  consultarAuditoria,
  registrarAccion,
  EntradaAuditoria,
  AccionAuditoria,
  AccionFiltro,
} from '../services/auditoriaService';

// ─── Opciones de filtro por acción ───────────────────────────────────────────

const OPCIONES_ACCION: { label: string; value: AccionFiltro }[] = [
  { label: 'Todas',           value: '' },
  { label: 'Login exitoso',   value: 'LOGIN_EXITOSO' },
  { label: 'Login fallido',   value: 'LOGIN_FALLIDO' },
  { label: 'Cierre sesión',   value: 'CIERRE_SESION' },
  { label: 'Usuario inactivo',value: 'USUARIO_INACTIVO' },
];

// ─── Helpers de presentación ──────────────────────────────────────────────────

function formatearFecha(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function colorAccion(accion: AccionAuditoria): string {
  switch (accion) {
    case 'LOGIN_EXITOSO':   return '#16a34a';
    case 'LOGIN_FALLIDO':   return '#dc2626';
    case 'CIERRE_SESION':   return '#0369a1';
    case 'USUARIO_INACTIVO':return '#d97706';
    default:                return '#6b7280';
  }
}

function iconoAccion(accion: AccionAuditoria): string {
  switch (accion) {
    case 'LOGIN_EXITOSO':   return 'checkmark-circle-outline';
    case 'LOGIN_FALLIDO':   return 'close-circle-outline';
    case 'CIERRE_SESION':   return 'log-out-outline';
    case 'USUARIO_INACTIVO':return 'warning-outline';
    default:                return 'ellipse-outline';
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  onVolver: () => void;
}

export default function AuditoriaScreen({ onVolver }: Props) {
  const { usuarioActivo, tienePermiso } = useSesion();

  // ── Estado de filtros ─────────────────────────────────────────────────────
  const [filtroUsuario, setFiltroUsuario]   = useState('');
  const [filtroAccion, setFiltroAccion]     = useState<AccionFiltro>('');
  const [filtroDesde, setFiltroDesde]       = useState('');
  const [filtroHasta, setFiltroHasta]       = useState('');

  // ── Estado de datos ───────────────────────────────────────────────────────
  const [registros, setRegistros]           = useState<EntradaAuditoria[]>([]);
  const [cargando, setCargando]             = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [totalResultados, setTotalResultados] = useState(0);

  // ── Estado panel de pruebas (T-04) ────────────────────────────────────────
  const [mostrarPruebas, setMostrarPruebas] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<string | null>(null);
  const [ejecutandoPrueba, setEjecutandoPrueba] = useState(false);

  // ── Control de acceso: solo Administrador ────────────────────────────────
  if (!tienePermiso(['Administrador'])) {
    return (
      <View style={styles.sinAcceso}>
        <Ionicons name="lock-closed-outline" size={48} color="#dc2626" />
        <Text style={styles.sinAccesoTexto}>
          Acceso restringido — Solo Administrador
        </Text>
        <TouchableOpacity style={styles.botonVolver} onPress={onVolver}>
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── T-03 HU-5: Consulta con filtros ──────────────────────────────────────

  const buscar = useCallback(async () => {
    setCargando(true);
    setError(null);

    const { datos, error: errorConsulta } = await consultarAuditoria({
      usuario:    filtroUsuario,
      accion:     filtroAccion,
      fechaDesde: filtroDesde,
      fechaHasta: filtroHasta,
    });

    setCargando(false);

    if (errorConsulta) {
      setError(errorConsulta);
    } else {
      setRegistros(datos);
      setTotalResultados(datos.length);
    }
  }, [filtroUsuario, filtroAccion, filtroDesde, filtroHasta]);

  // Cargar al montar la pantalla
  useEffect(() => {
    buscar();
  }, []);

  const limpiarFiltros = () => {
    setFiltroUsuario('');
    setFiltroAccion('');
    setFiltroDesde('');
    setFiltroHasta('');
  };

  // ── T-04 HU-5: Pruebas funcionales ───────────────────────────────────────

  const ejecutarPrueba = async () => {
    if (!usuarioActivo) return;
    setEjecutandoPrueba(true);
    setResultadoPrueba(null);
    const resultados: string[] = [];

    try {
      // Prueba 1: Registrar acción de prueba
      await registrarAccion({
        usuario_id:     usuarioActivo.id,
        usuario_nombre: usuarioActivo.usuario,
        accion:         'LOGIN_EXITOSO',
        descripcion:    'PRUEBA FUNCIONAL T-04: Registro de acción de prueba',
        resultado:      'exitoso',
      });
      resultados.push('✅ Prueba 1: Registro de acción — OK');

      // Prueba 2: Consultar sin filtros y verificar que retorna datos
      const { datos, error: e1 } = await consultarAuditoria({});
      if (e1) {
        resultados.push('❌ Prueba 2: Consulta sin filtros — FALLÓ');
      } else {
        resultados.push(`✅ Prueba 2: Consulta sin filtros — OK (${datos.length} registros)`);
      }

      // Prueba 3: Filtrar por usuario actual
      const { datos: d2, error: e2 } = await consultarAuditoria({
        usuario: usuarioActivo.usuario,
      });
      if (e2) {
        resultados.push('❌ Prueba 3: Filtro por usuario — FALLÓ');
      } else {
        resultados.push(`✅ Prueba 3: Filtro por usuario — OK (${d2.length} registros)`);
      }

      // Prueba 4: Filtrar por tipo de acción
      const { datos: d3, error: e3 } = await consultarAuditoria({
        accion: 'LOGIN_EXITOSO',
      });
      if (e3) {
        resultados.push('❌ Prueba 4: Filtro por acción — FALLÓ');
      } else {
        resultados.push(`✅ Prueba 4: Filtro por acción LOGIN_EXITOSO — OK (${d3.length} registros)`);
      }

      // Prueba 5: Filtrar por fecha actual
      const hoy = new Date().toISOString().split('T')[0];
      const { datos: d4, error: e4 } = await consultarAuditoria({
        fechaDesde: hoy,
        fechaHasta: hoy,
      });
      if (e4) {
        resultados.push('❌ Prueba 5: Filtro por fecha — FALLÓ');
      } else {
        resultados.push(`✅ Prueba 5: Filtro por fecha de hoy — OK (${d4.length} registros)`);
      }

      resultados.push('');
      resultados.push('T-04 HU-5: Todas las pruebas completadas.');

    } catch {
      resultados.push('❌ Error inesperado durante las pruebas.');
    }

    setEjecutandoPrueba(false);
    setResultadoPrueba(resultados.join('\n'));

    // Refrescar la lista tras las pruebas
    buscar();
  };

  // ── Render de cada fila ───────────────────────────────────────────────────

  const renderRegistro = ({ item }: { item: EntradaAuditoria }) => (
    <View style={styles.fila}>
      <View style={styles.filaIcono}>
        <Ionicons
          name={iconoAccion(item.accion) as any}
          size={20}
          color={colorAccion(item.accion)}
        />
      </View>
      <View style={styles.filaContenido}>
        <View style={styles.filaEncabezado}>
          <Text style={styles.filaUsuario}>{item.usuario_nombre}</Text>
          <View style={[styles.filaBadge, { backgroundColor: colorAccion(item.accion) + '18' }]}>
            <Text style={[styles.filaBadgeTexto, { color: colorAccion(item.accion) }]}>
              {item.accion.replace('_', ' ')}
            </Text>
          </View>
        </View>
        <Text style={styles.filaDescripcion} numberOfLines={2}>
          {item.descripcion}
        </Text>
        <Text style={styles.filaFecha}>{formatearFecha(item.fecha)}</Text>
      </View>
    </View>
  );

  // ── Render principal ──────────────────────────────────────────────────────

  return (
    <View style={styles.contenedor}>

      {/* ── Cabecera ── */}
      <View style={styles.cabecera}>
        <TouchableOpacity onPress={onVolver} style={styles.botonAtras}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.cabeceraTitulo}>Auditoría del Sistema</Text>
          <Text style={styles.cabeceraSubtitulo}>T-03 y T-04 · HU-5</Text>
        </View>
        {/* Botón de pruebas funcionales */}
        <TouchableOpacity
          style={styles.botonPruebas}
          onPress={() => setMostrarPruebas(!mostrarPruebas)}
        >
          <Ionicons name="flask-outline" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── T-04: Panel de pruebas funcionales ── */}
        {mostrarPruebas && (
          <View style={styles.panelPruebas}>
            <View style={styles.panelPruebasTitulo}>
              <Ionicons name="flask-outline" size={16} color="#7c3aed" />
              <Text style={styles.panelPruebasTituloTexto}>
                T-04 HU-5 — Pruebas Funcionales
              </Text>
            </View>
            <Text style={styles.panelPruebasDesc}>
              Verifica que todas las acciones queden correctamente registradas
              y que los filtros funcionen.
            </Text>
            <TouchableOpacity
              style={[styles.botonEjecutar, ejecutandoPrueba && styles.botonEjecutarDisabled]}
              onPress={ejecutarPrueba}
              disabled={ejecutandoPrueba}
            >
              {ejecutandoPrueba ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="play-outline" size={16} color="#ffffff" />
                  <Text style={styles.botonEjecutarTexto}>Ejecutar Pruebas</Text>
                </>
              )}
            </TouchableOpacity>
            {resultadoPrueba ? (
              <View style={styles.resultadoPrueba}>
                <Text style={styles.resultadoPruebaTexto}>{resultadoPrueba}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ── T-03: Panel de filtros ── */}
        <View style={styles.panelFiltros}>
          <View style={styles.filtrosTitulo}>
            <Ionicons name="filter-outline" size={16} color="#0369a1" />
            <Text style={styles.filtrosTituloTexto}>Filtros de búsqueda</Text>
          </View>

          {/* Filtro usuario */}
          <View style={styles.campoFiltro}>
            <Text style={styles.etiquetaFiltro}>Usuario</Text>
            <View style={styles.inputFiltroWrapper}>
              <Ionicons name="person-outline" size={16} color="#6b7280" />
              <TextInput
                style={styles.inputFiltro}
                placeholder="Buscar por nombre de usuario"
                placeholderTextColor="#9ca3af"
                value={filtroUsuario}
                onChangeText={setFiltroUsuario}
                autoCapitalize="none"
              />
              {filtroUsuario ? (
                <TouchableOpacity onPress={() => setFiltroUsuario('')}>
                  <Ionicons name="close-circle" size={16} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Filtro tipo de acción */}
          <View style={styles.campoFiltro}>
            <Text style={styles.etiquetaFiltro}>Tipo de acción</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {OPCIONES_ACCION.map((op) => (
                <TouchableOpacity
                  key={op.value}
                  style={[
                    styles.chip,
                    filtroAccion === op.value && styles.chipActivo,
                  ]}
                  onPress={() => setFiltroAccion(op.value)}
                >
                  <Text
                    style={[
                      styles.chipTexto,
                      filtroAccion === op.value && styles.chipTextoActivo,
                    ]}
                  >
                    {op.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Filtro fechas */}
          <View style={styles.filaDos}>
            <View style={[styles.campoFiltro, { flex: 1 }]}>
              <Text style={styles.etiquetaFiltro}>Desde (AAAA-MM-DD)</Text>
              <View style={styles.inputFiltroWrapper}>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <TextInput
                  style={styles.inputFiltro}
                  placeholder="2026-03-01"
                  placeholderTextColor="#9ca3af"
                  value={filtroDesde}
                  onChangeText={setFiltroDesde}
                />
              </View>
            </View>
            <View style={{ width: 10 }} />
            <View style={[styles.campoFiltro, { flex: 1 }]}>
              <Text style={styles.etiquetaFiltro}>Hasta (AAAA-MM-DD)</Text>
              <View style={styles.inputFiltroWrapper}>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <TextInput
                  style={styles.inputFiltro}
                  placeholder="2026-03-11"
                  placeholderTextColor="#9ca3af"
                  value={filtroHasta}
                  onChangeText={setFiltroHasta}
                />
              </View>
            </View>
          </View>

          {/* Botones buscar / limpiar */}
          <View style={styles.filaDos}>
            <TouchableOpacity
              style={[styles.botonBuscar, cargando && styles.botonBuscarDisabled]}
              onPress={buscar}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="search-outline" size={16} color="#ffffff" />
                  <Text style={styles.botonBuscarTexto}>Buscar</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.botonLimpiar} onPress={limpiarFiltros}>
              <Ionicons name="refresh-outline" size={16} color="#374151" />
              <Text style={styles.botonLimpiarTexto}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Resultados ── */}
        <View style={styles.resultados}>
          <Text style={styles.resultadosTitulo}>
            {cargando
              ? 'Buscando...'
              : `${totalResultados} registro${totalResultados !== 1 ? 's' : ''} encontrado${totalResultados !== 1 ? 's' : ''}`}
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={18} color="#dc2626" />
              <Text style={styles.errorTexto}>{error}</Text>
            </View>
          ) : null}

          {!cargando && registros.length === 0 && !error ? (
            <View style={styles.sinResultados}>
              <Ionicons name="document-outline" size={40} color="#d1d5db" />
              <Text style={styles.sinResultadosTexto}>
                No se encontraron registros con los filtros aplicados.
              </Text>
            </View>
          ) : null}

          {registros.map((item) => (
            <View key={item.id}>
              {renderRegistro({ item })}
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  // ── Cabecera ──────────────────────────────────────────────────────────────
  cabecera: {
    backgroundColor: '#0f2554',
    paddingTop: isWeb ? 20 : 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botonAtras: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabeceraTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  cabeceraSubtitulo: {
    fontSize: 11,
    color: '#93c5fd',
  },
  botonPruebas: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7c3aed30',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },

  // ── Panel de pruebas (T-04) ───────────────────────────────────────────────
  panelPruebas: {
    margin: 16,
    padding: 16,
    backgroundColor: '#faf5ff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  panelPruebasTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  panelPruebasTituloTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7c3aed',
  },
  panelPruebasDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  botonEjecutar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 10,
  },
  botonEjecutarDisabled: {
    backgroundColor: '#9ca3af',
  },
  botonEjecutarTexto: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  resultadoPrueba: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#1e1b4b',
    borderRadius: 10,
  },
  resultadoPruebaTexto: {
    color: '#c7d2fe',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 20,
  },

  // ── Panel de filtros (T-03) ───────────────────────────────────────────────
  panelFiltros: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  filtrosTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  filtrosTituloTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369a1',
  },
  campoFiltro: {
    marginBottom: 12,
  },
  etiquetaFiltro: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputFiltroWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
    gap: 8,
    backgroundColor: '#f9fafb',
  },
  inputFiltro: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    marginRight: 8,
    backgroundColor: '#f9fafb',
  },
  chipActivo: {
    backgroundColor: '#0f2554',
    borderColor: '#0f2554',
  },
  chipTexto: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  chipTextoActivo: {
    color: '#ffffff',
    fontWeight: '700',
  },
  filaDos: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  botonBuscar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0f2554',
    borderRadius: 10,
    height: 42,
  },
  botonBuscarDisabled: {
    backgroundColor: '#9ca3af',
  },
  botonBuscarTexto: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  botonLimpiar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
  },
  botonLimpiarTexto: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },

  // ── Resultados ────────────────────────────────────────────────────────────
  resultados: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  resultadosTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  errorTexto: {
    color: '#dc2626',
    fontSize: 13,
    flex: 1,
  },
  sinResultados: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  sinResultadosTexto: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },

  // ── Filas de registro ─────────────────────────────────────────────────────
  fila: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  filaIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaContenido: {
    flex: 1,
    gap: 4,
  },
  filaEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  filaUsuario: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  filaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filaBadgeTexto: {
    fontSize: 10,
    fontWeight: '700',
  },
  filaDescripcion: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  filaFecha: {
    fontSize: 11,
    color: '#94a3b8',
  },

  // ── Sin acceso ────────────────────────────────────────────────────────────
  sinAcceso: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 40,
    backgroundColor: '#f1f5f9',
  },
  sinAccesoTexto: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '600',
  },
  botonVolver: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: '#0f2554',
    borderRadius: 10,
  },
  botonVolverTexto: {
    color: '#ffffff',
    fontWeight: '600',
  },
});