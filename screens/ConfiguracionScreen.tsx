// ─── ConfiguracionScreen.tsx — RF14 ──────────────────────────────────────────
// Tipos de trámite configurables + parámetros generales del sistema.
// Solo accesible para Administrador.

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Switch,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useSesion } from "../context/SesionContext";
import {
  listarTiposTramite,
  guardarTipoTramite,
  listarParametros,
  guardarParametro,
  TipoTramiteConfig,
  ParametroSistema,
  TIPOS_DEFAULT,
} from "../services/configuracionService";

interface Props {
  onVolver: () => void;
}

type TabActiva = "tipos" | "parametros";

// ─── Iconos disponibles para tipos de trámite ─────────────────────────────────
const ICONOS_DISPONIBLES = [
  "business-outline",
  "ribbon-outline",
  "document-outline",
  "megaphone-outline",
  "construct-outline",
  "home-outline",
  "leaf-outline",
  "car-outline",
  "water-outline",
  "flash-outline",
  "medkit-outline",
  "school-outline",
];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ConfiguracionScreen({ onVolver }: Props) {
  const { tienePermiso } = useSesion();
  const [tabActiva, setTabActiva] = useState<TabActiva>("tipos");

  if (!tienePermiso(["Administrador"])) {
    return (
      <View style={s.sinAcceso}>
        <Ionicons name="lock-closed-outline" size={48} color="#dc2626" />
        <Text style={s.sinAccesoTexto}>
          Acceso restringido — Solo Administrador
        </Text>
        <TouchableOpacity style={s.botonPrimario} onPress={onVolver}>
          <Text style={s.botonPrimarioTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.contenedor}>
      <StatusBar style="light" />

      {/* Cabecera */}
      <View style={s.cabecera}>
        <TouchableOpacity onPress={onVolver} style={s.botonAtras}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.cabeceraTitulo}>Configuración del Sistema</Text>
          <Text style={s.cabeceraSubtitulo}>
            RF14 — Tipos de trámite y parámetros
          </Text>
        </View>
        <Ionicons name="settings-outline" size={20} color="#93c5fd" />
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tabActiva === "tipos" && s.tabActivo]}
          onPress={() => setTabActiva("tipos")}
        >
          <Ionicons
            name="list-outline"
            size={15}
            color={tabActiva === "tipos" ? "#0f2554" : "#94a3b8"}
          />
          <Text style={[s.tabTexto, tabActiva === "tipos" && s.tabTextoActivo]}>
            Tipos de trámite
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tabActiva === "parametros" && s.tabActivo]}
          onPress={() => setTabActiva("parametros")}
        >
          <Ionicons
            name="options-outline"
            size={15}
            color={tabActiva === "parametros" ? "#0f2554" : "#94a3b8"}
          />
          <Text
            style={[s.tabTexto, tabActiva === "parametros" && s.tabTextoActivo]}
          >
            Parámetros generales
          </Text>
        </TouchableOpacity>
      </View>

      {tabActiva === "tipos" ? <TabTiposTramite /> : <TabParametros />}
    </View>
  );
}

// ─── Tab: Tipos de trámite ────────────────────────────────────────────────────

function TabTiposTramite() {
  const [tipos, setTipos] = useState<TipoTramiteConfig[]>([]);
  const [cargando, setCargando] = useState(false);
  const [editando, setEditando] = useState<TipoTramiteConfig | null>(null);
  const [creando, setCreando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [formNombre, setFormNombre] = useState("");
  const [formDias, setFormDias] = useState("");
  const [formIcono, setFormIcono] = useState("document-outline");
  const [formDesc, setFormDesc] = useState("");
  const [formActivo, setFormActivo] = useState(true);
  const [erroresForm, setErroresForm] = useState<Record<string, string>>({});

  const cargar = useCallback(async () => {
    setCargando(true);
    const { tipos: lista } = await listarTiposTramite();
    setCargando(false);
    setTipos(lista);
  }, []);

  useEffect(() => {
    cargar();
  }, []);

  const abrirEditar = (tipo: TipoTramiteConfig) => {
    setEditando(tipo);
    setCreando(false);
    setFormNombre(tipo.nombre);
    setFormDias(String(tipo.dias_vencimiento));
    setFormIcono(tipo.icono);
    setFormDesc(tipo.descripcion);
    setFormActivo(tipo.activo);
    setErroresForm({});
    setMensajeExito(null);
    setError(null);
  };

  const abrirCrear = () => {
    setEditando(null);
    setCreando(true);
    setFormNombre("");
    setFormDias("15");
    setFormIcono("document-outline");
    setFormDesc("");
    setFormActivo(true);
    setErroresForm({});
    setMensajeExito(null);
    setError(null);
  };

  const cancelar = () => {
    setEditando(null);
    setCreando(false);
  };

  const validarForm = (): boolean => {
    const e: Record<string, string> = {};
    if (!formNombre.trim()) e.nombre = "El nombre es obligatorio.";
    const d = parseInt(formDias);
    if (!formDias || isNaN(d) || d < 1 || d > 365)
      e.dias = "Ingrese un número de días entre 1 y 365.";
    if (!formDesc.trim()) e.desc = "La descripción es obligatoria.";
    setErroresForm(e);
    return Object.keys(e).length === 0;
  };

  const handleGuardar = async () => {
    if (!validarForm()) return;
    setGuardando(true);
    setError(null);
    const resultado = await guardarTipoTramite(
      {
        nombre: formNombre.trim(),
        dias_vencimiento: parseInt(formDias),
        icono: formIcono,
        descripcion: formDesc.trim(),
        activo: formActivo,
      },
      editando?.id,
    );
    setGuardando(false);
    if (resultado.exito) {
      setMensajeExito(
        editando ? "Tipo de trámite actualizado." : "Tipo de trámite creado.",
      );
      setEditando(null);
      setCreando(false);
      cargar();
    } else {
      setError(resultado.error ?? "Error al guardar.");
    }
  };

  // ── Formulario de edición / creación ──────────────────────────────────────
  if (editando || creando) {
    return (
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.card}>
          <Text style={s.cardTitulo}>
            {editando ? `Editar: ${editando.nombre}` : "Nuevo tipo de trámite"}
          </Text>

          <CampoTexto
            etiqueta="Nombre del trámite *"
            placeholder="Ej: Permiso de demolición"
            valor={formNombre}
            onChange={setFormNombre}
            error={erroresForm.nombre}
          />
          <CampoTexto
            etiqueta="Días hábiles para atención *"
            placeholder="Ej: 15"
            valor={formDias}
            onChange={setFormDias}
            teclado="numeric"
            error={erroresForm.dias}
          />
          <CampoTexto
            etiqueta="Descripción *"
            placeholder="Breve descripción del propósito de este trámite"
            valor={formDesc}
            onChange={setFormDesc}
            multilinea
            error={erroresForm.desc}
          />

          {/* Selector de ícono */}
          <Text style={s.etiqueta}>Ícono</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 14 }}
          >
            {ICONOS_DISPONIBLES.map((ic) => (
              <TouchableOpacity
                key={ic}
                style={[s.iconoCard, formIcono === ic && s.iconoCardActivo]}
                onPress={() => setFormIcono(ic)}
              >
                <Ionicons
                  name={ic as any}
                  size={22}
                  color={formIcono === ic ? "#0f2554" : "#9ca3af"}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Activo */}
          <View style={s.switchRow}>
            <Text style={s.etiqueta}>Activo en el sistema</Text>
            <Switch
              value={formActivo}
              onValueChange={setFormActivo}
              trackColor={{ false: "#e5e7eb", true: "#bfdbfe" }}
              thumbColor={formActivo ? "#0f2554" : "#9ca3af"}
            />
          </View>

          {error && (
            <View style={s.errorBanner}>
              <MaterialIcons name="error-outline" size={15} color="#dc2626" />
              <Text style={s.errorTexto}>{error}</Text>
            </View>
          )}

          <View style={s.filaDos}>
            <TouchableOpacity style={s.botonSecundario} onPress={cancelar}>
              <Text style={s.botonSecundarioTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.botonPrimario,
                { flex: 1 },
                guardando && s.botonDisabled,
              ]}
              onPress={handleGuardar}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.botonPrimarioTexto}>
                  {editando ? "Guardar cambios" : "Crear tipo"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ── Lista de tipos ────────────────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={s.scroll}>
      {mensajeExito && (
        <View style={s.exitoBanner}>
          <Ionicons name="checkmark-circle-outline" size={15} color="#166534" />
          <Text style={s.exitoTexto}>{mensajeExito}</Text>
        </View>
      )}

      <TouchableOpacity style={s.botonAgregar} onPress={abrirCrear}>
        <Ionicons name="add-circle-outline" size={18} color="#fff" />
        <Text style={s.botonAgregarTexto}>Agregar nuevo tipo de trámite</Text>
      </TouchableOpacity>

      {cargando ? (
        <ActivityIndicator color="#0f2554" style={{ marginTop: 40 }} />
      ) : (
        tipos.map((tipo) => (
          <View
            key={tipo.id}
            style={[s.tipoCard, !tipo.activo && s.tipoCardInactivo]}
          >
            <View style={s.tipoIcono}>
              <Ionicons name={tipo.icono as any} size={22} color="#0f2554" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={s.filaAlign}>
                <Text style={s.tipoNombre}>{tipo.nombre}</Text>
                {!tipo.activo && (
                  <View style={s.badgeInactivo}>
                    <Text style={s.badgeInactivoTexto}>INACTIVO</Text>
                  </View>
                )}
              </View>
              <Text style={s.tipoDesc} numberOfLines={2}>
                {tipo.descripcion}
              </Text>
              <View style={s.filaAlign}>
                <Ionicons name="time-outline" size={12} color="#94a3b8" />
                <Text style={s.tipoDias}>
                  {tipo.dias_vencimiento} días hábiles
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.botonEditar}
              onPress={() => abrirEditar(tipo)}
            >
              <Ionicons name="create-outline" size={18} color="#0369a1" />
            </TouchableOpacity>
          </View>
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Tab: Parámetros generales ────────────────────────────────────────────────

function TabParametros() {
  const [parametros, setParametros] = useState<ParametroSistema[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState<string | null>(null); // clave que se guarda
  const [valores, setValores] = useState<Record<string, string>>({});
  const [exitos, setExitos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCargando(true);
    listarParametros().then(({ parametros: lista }) => {
      setCargando(false);
      setParametros(lista);
      const v: Record<string, string> = {};
      lista.forEach((p) => {
        v[p.clave] = p.valor;
      });
      setValores(v);
    });
  }, []);

  const handleGuardar = async (p: ParametroSistema) => {
    setGuardando(p.clave);
    const resultado = await guardarParametro(
      p.clave,
      valores[p.clave] ?? p.valor,
    );
    setGuardando(null);
    if (resultado.exito) {
      setExitos((e) => ({ ...e, [p.clave]: true }));
      setTimeout(() => setExitos((e) => ({ ...e, [p.clave]: false })), 2000);
    }
  };

  if (cargando) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <ActivityIndicator color="#0f2554" size="large" />
        <Text style={{ color: "#94a3b8" }}>Cargando parámetros...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.infoBox}>
        <Ionicons name="information-circle-outline" size={15} color="#0369a1" />
        <Text style={s.infoTexto}>
          Los cambios se guardan individualmente. Si la tabla{" "}
          <Text style={{ fontWeight: "700" }}>configuracion_sistema</Text> no
          existe, los valores se muestran pero no se persisten hasta crearla.
        </Text>
      </View>

      {parametros.map((p) => (
        <View key={p.clave} style={s.card}>
          <Text style={s.paramEtiqueta}>{p.etiqueta}</Text>
          <Text style={s.paramDesc}>{p.descripcion}</Text>

          {p.tipo === "booleano" ? (
            <View style={s.switchRow}>
              <Text style={s.paramValorTexto}>
                {valores[p.clave] === "true" ? "Activado" : "Desactivado"}
              </Text>
              <Switch
                value={valores[p.clave] === "true"}
                onValueChange={(v) =>
                  setValores((prev) => ({
                    ...prev,
                    [p.clave]: v ? "true" : "false",
                  }))
                }
                trackColor={{ false: "#e5e7eb", true: "#bfdbfe" }}
                thumbColor={valores[p.clave] === "true" ? "#0f2554" : "#9ca3af"}
              />
            </View>
          ) : (
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                value={valores[p.clave] ?? ""}
                onChangeText={(v) =>
                  setValores((prev) => ({ ...prev, [p.clave]: v }))
                }
                keyboardType={p.tipo === "numero" ? "numeric" : "default"}
                placeholder={p.valor}
                placeholderTextColor="#9ca3af"
              />
            </View>
          )}

          <TouchableOpacity
            style={[
              s.botonGuardarParam,
              guardando === p.clave && s.botonDisabled,
              exitos[p.clave] && s.botonExito,
            ]}
            onPress={() => handleGuardar(p)}
            disabled={guardando === p.clave}
          >
            {guardando === p.clave ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : exitos[p.clave] ? (
              <>
                <Ionicons name="checkmark-outline" size={15} color="#fff" />
                <Text style={s.botonGuardarParamTexto}>Guardado</Text>
              </>
            ) : (
              <>
                <Ionicons name="save-outline" size={15} color="#fff" />
                <Text style={s.botonGuardarParamTexto}>Guardar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

interface PropsCampo {
  etiqueta: string;
  placeholder: string;
  valor: string;
  onChange: (v: string) => void;
  error?: string;
  teclado?: "default" | "numeric";
  multilinea?: boolean;
}

function CampoTexto({
  etiqueta,
  placeholder,
  valor,
  onChange,
  error,
  teclado = "default",
  multilinea,
}: PropsCampo) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.etiqueta}>{etiqueta}</Text>
      <View
        style={[
          s.inputRow,
          error ? s.inputError : null,
          multilinea && {
            height: "auto" as any,
            alignItems: "flex-start",
            paddingVertical: 10,
          },
        ]}
      >
        <TextInput
          style={[
            s.input,
            multilinea && { minHeight: 70, textAlignVertical: "top" },
          ]}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={valor}
          onChangeText={onChange}
          keyboardType={teclado}
          multiline={multilinea}
        />
      </View>
      {error ? <Text style={s.errorTextoInline}>⚠ {error}</Text> : null}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const isWeb = Platform.OS === "web";

const s = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#f1f5f9" },
  sinAcceso: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 40,
  },
  sinAccesoTexto: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
    textAlign: "center",
  },

  cabecera: {
    backgroundColor: "#0f2554",
    paddingTop: isWeb ? 20 : 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  botonAtras: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff18",
    alignItems: "center",
    justifyContent: "center",
  },
  cabeceraTitulo: { fontSize: 18, fontWeight: "700", color: "#fff" },
  cabeceraSubtitulo: { fontSize: 11, color: "#93c5fd" },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
  },
  tabActivo: { borderBottomWidth: 3, borderBottomColor: "#0f2554" },
  tabTexto: { fontSize: 13, fontWeight: "600", color: "#94a3b8" },
  tabTextoActivo: { color: "#0f2554" },

  scroll: { padding: 16, maxWidth: 600, width: "100%", alignSelf: "center" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f2554",
    marginBottom: 16,
  },

  etiqueta: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 4,
  },
  inputError: { borderColor: "#ef4444" },
  input: { flex: 1, fontSize: 14, color: "#111827" },
  errorTextoInline: { color: "#ef4444", fontSize: 12, marginTop: 2 },

  iconoCard: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  iconoCardActivo: { borderColor: "#0f2554", backgroundColor: "#eff6ff" },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  paramValorTexto: { fontSize: 14, color: "#374151", fontWeight: "500" },

  filaDos: { flexDirection: "row", gap: 10, marginTop: 10 },

  botonPrimario: {
    backgroundColor: "#0f2554",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f2554",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  botonPrimarioTexto: { color: "#fff", fontWeight: "700", fontSize: 15 },
  botonSecundario: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  botonSecundarioTexto: { color: "#374151", fontWeight: "600", fontSize: 14 },
  botonDisabled: { backgroundColor: "#94a3b8", shadowOpacity: 0, elevation: 0 },

  botonAgregar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0f2554",
    borderRadius: 12,
    height: 50,
    marginBottom: 14,
  },
  botonAgregarTexto: { color: "#fff", fontWeight: "700", fontSize: 14 },

  tipoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tipoCardInactivo: { opacity: 0.5 },
  tipoIcono: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  tipoNombre: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  tipoDesc: { fontSize: 12, color: "#64748b" },
  tipoDias: { fontSize: 11, color: "#94a3b8", marginLeft: 2 },
  filaAlign: { flexDirection: "row", alignItems: "center", gap: 6 },
  botonEditar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeInactivo: {
    backgroundColor: "#fee2e2",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeInactivoTexto: { fontSize: 9, fontWeight: "800", color: "#dc2626" },

  botonGuardarParam: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0f2554",
    borderRadius: 10,
    height: 40,
    marginTop: 10,
  },
  botonGuardarParamTexto: { color: "#fff", fontWeight: "600", fontSize: 13 },
  botonExito: { backgroundColor: "#16a34a" },

  paramEtiqueta: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  paramDesc: { fontSize: 12, color: "#64748b", marginBottom: 10 },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  errorTexto: { flex: 1, color: "#dc2626", fontSize: 13 },
  exitoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  exitoTexto: { flex: 1, color: "#166534", fontSize: 13 },

  infoBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  infoTexto: { flex: 1, fontSize: 12, color: "#0369a1", lineHeight: 18 },

  sqlBox: {
    backgroundColor: "#1e1b4b",
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  sqlTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: "#c7d2fe",
    marginBottom: 8,
  },
  sqlTexto: {
    fontSize: 11,
    color: "#a5b4fc",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    lineHeight: 18,
  },
});
