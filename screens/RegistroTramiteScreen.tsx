// ─── RegistroTramiteScreen.tsx — T-01 y T-04 (HU-2) ─────────────────────────
// Formulario digital para registrar un nuevo trámite municipal.
// T-01: Campos obligatorios con estructura de datos y validaciones visuales.
// T-04: Validación que impide guardar con campos incompletos.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSesion } from '../context/SesionContext';
import {
  registrarTramite,
  TipoTramite,
  DatosTramite,
  Tramite,
} from '../services/tramiteService';

// ─── Tipos de trámite disponibles ────────────────────────────────────────────

const TIPOS_TRAMITE: { valor: TipoTramite; icono: string; dias: number }[] = [
  { valor: 'Licencia de funcionamiento', icono: 'business-outline',    dias: 15 },
  { valor: 'Patente',                    icono: 'ribbon-outline',       dias: 10 },
  { valor: 'Certificación',              icono: 'document-outline',     dias:  7 },
  { valor: 'Reclamo vecinal',            icono: 'megaphone-outline',    dias: 20 },
  { valor: 'Solicitud de obra',          icono: 'construct-outline',    dias: 30 },
];

// ─── Campos obligatorios del formulario ──────────────────────────────────────

interface FormularioTramite {
  tipo: TipoTramite | '';
  solicitante_nombre: string;
  solicitante_ci: string;
  solicitante_telefono: string;
  solicitante_email: string;
  descripcion: string;
  direccion: string;
}

interface ErroresFormulario {
  tipo: string;
  solicitante_nombre: string;
  solicitante_ci: string;
  solicitante_telefono: string;
  descripcion: string;
  direccion: string;
}

const ERRORES_INICIAL: ErroresFormulario = {
  tipo: '',
  solicitante_nombre: '',
  solicitante_ci: '',
  solicitante_telefono: '',
  descripcion: '',
  direccion: '',
};

// ─── Componente ───────────────────────────────────────────────────────────────

interface Props {
  onVolver: () => void;
}

export default function RegistroTramiteScreen({ onVolver }: Props) {
  const { usuarioActivo } = useSesion();

  // Estado del formulario
  const [form, setForm] = useState<FormularioTramite>({
    tipo: '',
    solicitante_nombre: '',
    solicitante_ci: '',
    solicitante_telefono: '',
    solicitante_email: '',
    descripcion: '',
    direccion: '',
  });

  const [errores, setErrores] = useState<ErroresFormulario>(ERRORES_INICIAL);
  const [cargando, setCargando] = useState(false);
  const [tramiteRegistrado, setTramiteRegistrado] = useState<Tramite | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const actualizarCampo = (campo: keyof FormularioTramite, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    // Limpiar error del campo al escribir
    if (errores[campo as keyof ErroresFormulario]) {
      setErrores((prev) => ({ ...prev, [campo]: '' }));
    }
  };

  // ── T-04 HU-2: Validación de campos obligatorios ──────────────────────────

  const validar = (): boolean => {
    const nuevosErrores: ErroresFormulario = { ...ERRORES_INICIAL };
    let valido = true;

    if (!form.tipo) {
      nuevosErrores.tipo = 'Seleccione el tipo de trámite.';
      valido = false;
    }

    if (!form.solicitante_nombre.trim()) {
      nuevosErrores.solicitante_nombre = 'El nombre del solicitante es obligatorio.';
      valido = false;
    } else if (form.solicitante_nombre.trim().length < 3) {
      nuevosErrores.solicitante_nombre = 'Ingrese el nombre completo.';
      valido = false;
    }

    if (!form.solicitante_ci.trim()) {
      nuevosErrores.solicitante_ci = 'El número de CI es obligatorio.';
      valido = false;
    } else if (!/^\d{5,10}$/.test(form.solicitante_ci.trim())) {
      nuevosErrores.solicitante_ci = 'El CI debe contener entre 5 y 10 dígitos.';
      valido = false;
    }

    if (!form.solicitante_telefono.trim()) {
      nuevosErrores.solicitante_telefono = 'El teléfono es obligatorio.';
      valido = false;
    } else if (!/^\d{7,10}$/.test(form.solicitante_telefono.trim())) {
      nuevosErrores.solicitante_telefono = 'Ingrese un número de teléfono válido.';
      valido = false;
    }

    if (!form.descripcion.trim()) {
      nuevosErrores.descripcion = 'La descripción del trámite es obligatoria.';
      valido = false;
    } else if (form.descripcion.trim().length < 10) {
      nuevosErrores.descripcion = 'La descripción debe tener al menos 10 caracteres.';
      valido = false;
    }

    if (!form.direccion.trim()) {
      nuevosErrores.direccion = 'La dirección es obligatoria.';
      valido = false;
    }

    setErrores(nuevosErrores);
    return valido;
  };

  // ── Enviar formulario ─────────────────────────────────────────────────────

  const handleRegistrar = async () => {
    setErrorGeneral(null);
    if (!validar()) return;
    if (!usuarioActivo) return;

    setCargando(true);

    const datos: DatosTramite = {
      tipo:                   form.tipo as TipoTramite,
      solicitante_nombre:     form.solicitante_nombre.trim(),
      solicitante_ci:         form.solicitante_ci.trim(),
      solicitante_telefono:   form.solicitante_telefono.trim(),
      solicitante_email:      form.solicitante_email.trim(),
      descripcion:            form.descripcion.trim(),
      direccion:              form.direccion.trim(),
      registrado_por:         usuarioActivo.usuario,
    };

    const resultado = await registrarTramite(datos);
    setCargando(false);

    if (resultado.exito && resultado.tramite) {
      setTramiteRegistrado(resultado.tramite);
    } else {
      setErrorGeneral(resultado.error ?? 'Error al registrar el trámite.');
    }
  };

  // ── Pantalla de éxito tras registro ──────────────────────────────────────

  if (tramiteRegistrado) {
    return (
      <View style={styles.contenedor}>
        <StatusBar style="light" />
        <View style={styles.cabecera}>
          <Text style={styles.cabeceraTitulo}>Trámite Registrado</Text>
        </View>
        <ScrollView contentContainerStyle={styles.exitoContenido}>
          <View style={styles.exitoIcono}>
            <Ionicons name="checkmark-circle" size={64} color="#16a34a" />
          </View>
          <Text style={styles.exitoTitulo}>¡Trámite registrado con éxito!</Text>

          <View style={styles.exitoCard}>
            <FilaDato icono="barcode-outline"      etiqueta="Número de trámite"  valor={tramiteRegistrado.numero_tramite} destacado />
            <FilaDato icono="document-text-outline" etiqueta="Tipo"              valor={tramiteRegistrado.tipo} />
            <FilaDato icono="person-outline"        etiqueta="Solicitante"       valor={tramiteRegistrado.solicitante_nombre} />
            <FilaDato icono="time-outline"          etiqueta="Fecha de registro" valor={formatearFecha(tramiteRegistrado.fecha_registro)} />
            <FilaDato icono="calendar-outline"      etiqueta="Vence el"          valor={formatearFecha(tramiteRegistrado.fecha_vencimiento)} />
            <FilaDato icono="ellipse-outline"       etiqueta="Estado inicial"    valor={tramiteRegistrado.estado} />
          </View>

          <View style={styles.notaInfo}>
            <Ionicons name="information-circle-outline" size={15} color="#0369a1" />
            <Text style={styles.notaInfoTexto}>
              Guarde el número de trámite para hacer seguimiento de su solicitud.
            </Text>
          </View>

          <TouchableOpacity style={styles.botonNuevo} onPress={() => {
            setTramiteRegistrado(null);
            setForm({
              tipo: '', solicitante_nombre: '', solicitante_ci: '',
              solicitante_telefono: '', solicitante_email: '',
              descripcion: '', direccion: '',
            });
          }}>
            <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
            <Text style={styles.botonNuevoTexto}>Registrar otro trámite</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonVolver} onPress={onVolver}>
            <Ionicons name="arrow-back-outline" size={18} color="#374151" />
            <Text style={styles.botonVolverTexto}>Volver al inicio</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Formulario principal ──────────────────────────────────────────────────

  return (
    <View style={styles.contenedor}>
      <StatusBar style="light" />

      {/* Cabecera */}
      <View style={styles.cabecera}>
        <TouchableOpacity onPress={onVolver} style={styles.botonAtras}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.cabeceraTitulo}>Nuevo Trámite</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Sección 1: Tipo de trámite ── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>
            <Ionicons name="list-outline" size={14} color="#0f2554" /> Tipo de trámite
          </Text>
          <Text style={styles.seccionObligatorio}>* Campo obligatorio</Text>

          <View style={styles.tiposGrid}>
            {TIPOS_TRAMITE.map((t) => (
              <TouchableOpacity
                key={t.valor}
                style={[
                  styles.tipoCard,
                  form.tipo === t.valor && styles.tipoCardActivo,
                  errores.tipo ? styles.tipoCardError : null,
                ]}
                onPress={() => actualizarCampo('tipo', t.valor)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={t.icono as any}
                  size={22}
                  color={form.tipo === t.valor ? '#ffffff' : '#0f2554'}
                />
                <Text style={[
                  styles.tipoTexto,
                  form.tipo === t.valor && styles.tipoTextoActivo,
                ]}>
                  {t.valor}
                </Text>
                <Text style={[
                  styles.tipoDias,
                  form.tipo === t.valor && styles.tipoDiasActivo,
                ]}>
                  {t.dias} días hábiles
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errores.tipo ? <Text style={styles.errorTexto}>⚠ {errores.tipo}</Text> : null}
        </View>

        {/* ── Sección 2: Datos del solicitante ── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>
            <Ionicons name="person-outline" size={14} color="#0f2554" /> Datos del solicitante
          </Text>

          <CampoTexto
            etiqueta="Nombre completo *"
            icono="person-outline"
            placeholder="Ej: Juan Pérez Mamani"
            valor={form.solicitante_nombre}
            onChange={(v) => actualizarCampo('solicitante_nombre', v)}
            error={errores.solicitante_nombre}
            editable={!cargando}
          />

          <CampoTexto
            etiqueta="Cédula de identidad *"
            icono="card-outline"
            placeholder="Ej: 1234567"
            valor={form.solicitante_ci}
            onChange={(v) => actualizarCampo('solicitante_ci', v)}
            error={errores.solicitante_ci}
            teclado="numeric"
            editable={!cargando}
          />

          <CampoTexto
            etiqueta="Teléfono *"
            icono="call-outline"
            placeholder="Ej: 70123456"
            valor={form.solicitante_telefono}
            onChange={(v) => actualizarCampo('solicitante_telefono', v)}
            error={errores.solicitante_telefono}
            teclado="numeric"
            editable={!cargando}
          />

          <CampoTexto
            etiqueta="Correo electrónico (opcional)"
            icono="mail-outline"
            placeholder="Ej: juan@correo.com"
            valor={form.solicitante_email}
            onChange={(v) => actualizarCampo('solicitante_email', v)}
            error=""
            teclado="email-address"
            editable={!cargando}
          />
        </View>

        {/* ── Sección 3: Detalles del trámite ── */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>
            <Ionicons name="document-text-outline" size={14} color="#0f2554" /> Detalles del trámite
          </Text>

          <CampoTexto
            etiqueta="Dirección *"
            icono="location-outline"
            placeholder="Ej: Av. Principal Nº 123, zona centro"
            valor={form.direccion}
            onChange={(v) => actualizarCampo('direccion', v)}
            error={errores.direccion}
            editable={!cargando}
          />

          {/* Descripción — campo multilínea */}
          <View style={styles.campoGrupo}>
            <Text style={styles.campoEtiqueta}>Descripción del motivo *</Text>
            <View style={[
              styles.inputWrapper,
              styles.inputMultilinea,
              errores.descripcion ? styles.inputError : null,
            ]}>
              <TextInput
                style={[styles.input, styles.inputAreaTexto]}
                placeholder="Describa brevemente el motivo de su trámite..."
                placeholderTextColor="#9ca3af"
                value={form.descripcion}
                onChangeText={(v) => actualizarCampo('descripcion', v)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!cargando}
              />
            </View>
            {errores.descripcion
              ? <Text style={styles.errorTexto}>⚠ {errores.descripcion}</Text>
              : <Text style={styles.contadorTexto}>{form.descripcion.length} caracteres</Text>
            }
          </View>
        </View>

        {/* ── Error general ── */}
        {errorGeneral ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={18} color="#dc2626" />
            <Text style={styles.errorBannerTexto}>{errorGeneral}</Text>
          </View>
        ) : null}

        {/* ── Botón registrar ── */}
        <TouchableOpacity
          style={[styles.botonRegistrar, cargando && styles.botonRegistrarDisabled]}
          onPress={handleRegistrar}
          disabled={cargando}
          activeOpacity={0.85}
        >
          {cargando ? (
            <View style={styles.filaIcono}>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={styles.botonRegistrarTexto}>Registrando trámite...</Text>
            </View>
          ) : (
            <View style={styles.filaIcono}>
              <Ionicons name="save-outline" size={20} color="#ffffff" />
              <Text style={styles.botonRegistrarTexto}>Registrar Trámite</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Subcomponente: Campo de texto reutilizable ───────────────────────────────

interface PropsCampo {
  etiqueta: string;
  icono: string;
  placeholder: string;
  valor: string;
  onChange: (v: string) => void;
  error: string;
  teclado?: 'default' | 'numeric' | 'email-address';
  editable?: boolean;
}

function CampoTexto({
  etiqueta, icono, placeholder, valor, onChange, error,
  teclado = 'default', editable = true,
}: PropsCampo) {
  return (
    <View style={styles.campoGrupo}>
      <Text style={styles.campoEtiqueta}>{etiqueta}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        <Ionicons name={icono as any} size={17} color="#6b7280" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={valor}
          onChangeText={onChange}
          keyboardType={teclado}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
        />
      </View>
      {error ? <Text style={styles.errorTexto}>⚠ {error}</Text> : null}
    </View>
  );
}

// ─── Subcomponente: Fila de dato en pantalla de éxito ────────────────────────

interface PropsFilaDato {
  icono: string;
  etiqueta: string;
  valor: string;
  destacado?: boolean;
}

function FilaDato({ icono, etiqueta, valor, destacado }: PropsFilaDato) {
  return (
    <View style={styles.filaDato}>
      <Ionicons name={icono as any} size={16} color="#6b7280" style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.filaDatoEtiqueta}>{etiqueta}</Text>
        <Text style={[styles.filaDatoValor, destacado && styles.filaDatoDestacado]}>
          {valor}
        </Text>
      </View>
    </View>
  );
}

// ─── Helper de fecha ──────────────────────────────────────────────────────────

function formatearFecha(fechaISO: string): string {
  return new Date(fechaISO).toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
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
  },
  cabeceraSubtitulo: {
    fontSize: 11,
    color: '#93c5fd',
  },

  scrollContenido: {
    padding: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },

  // ── Secciones ─────────────────────────────────────────────────────────────
  seccion: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f2554',
    letterSpacing: 0.3,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  seccionObligatorio: {
    fontSize: 11,
    color: '#ef4444',
    marginBottom: 14,
  },

  // ── Selector de tipo ──────────────────────────────────────────────────────
  tiposGrid: {
    gap: 8,
  },
  tipoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  tipoCardActivo: {
    backgroundColor: '#0f2554',
    borderColor: '#0f2554',
  },
  tipoCardError: {
    borderColor: '#fca5a5',
  },
  tipoTexto: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  tipoTextoActivo: {
    color: '#ffffff',
  },
  tipoDias: {
    fontSize: 11,
    color: '#94a3b8',
  },
  tipoDiasActivo: {
    color: '#93c5fd',
  },

  // ── Campos de texto ───────────────────────────────────────────────────────
  campoGrupo: {
    marginBottom: 14,
  },
  campoEtiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  inputMultilinea: {
    height: 'auto',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff5f5',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  inputAreaTexto: {
    minHeight: 90,
    paddingTop: 0,
  },
  errorTexto: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  contadorTexto: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },

  // ── Error general ─────────────────────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorBannerTexto: {
    color: '#dc2626',
    fontSize: 13,
    flex: 1,
  },

  // ── Botón registrar ───────────────────────────────────────────────────────
  botonRegistrar: {
    backgroundColor: '#0f2554',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f2554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  botonRegistrarDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  botonRegistrarTexto: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filaIcono: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  exitoContenido: {
    padding: 24,
    alignItems: 'center',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  exitoIcono: {
    marginBottom: 12,
    marginTop: 20,
  },
  exitoTitulo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f2554',
    textAlign: 'center',
    marginBottom: 20,
  },
  exitoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
    gap: 12,
  },
  filaDato: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filaDatoEtiqueta: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  filaDatoValor: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    marginTop: 2,
  },
  filaDatoDestacado: {
    fontSize: 18,
    color: '#0f2554',
    fontWeight: '800',
    letterSpacing: 1,
  },
  notaInfo: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  notaInfoTexto: {
    flex: 1,
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 18,
  },
  botonNuevo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f2554',
    borderRadius: 12,
    height: 50,
    width: '100%',
    marginBottom: 10,
  },
  botonNuevoTexto: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  botonVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 50,
    width: '100%',
    backgroundColor: '#ffffff',
  },
  botonVolverTexto: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 15,
  },
});