// ─── AsignacionTramiteScreen.tsx — Mejora: Lista + Búsqueda ─────────────────
// Lista todos los trámites asignables con filtro por número, nombre o tipo.
// Al seleccionar uno, se abre el formulario de asignación.
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useSesion } from "../context/SesionContext";
import { supabase } from "../lib/supabase";
import { registrarAccion } from "../services/auditoriaService";
import {
  Tramite,
  TipoTramite,
  EstadoTramite,
} from "../services/tramiteService";
import {
  UNIDADES_MUNICIPALES,
  obtenerResponsablesDeUnidad,
} from "../services/asignacionService";
import SelectorConBusqueda from "../components/SelectorConBusqueda";

interface Props {
  onVolver: () => void;
}

const TIPOS_TRAMITE: TipoTramite[] = [
  "Licencia de funcionamiento",
  "Patente",
  "Certificación",
  "Reclamo vecinal",
  "Solicitud de obra",
];

const ESTADO_ESTILO: Record<string, { bg: string; color: string }> = {
  Pendiente: { bg: "#fef9c3", color: "#854d0e" },
  "En revisión": { bg: "#dbeafe", color: "#1e40af" },
  Observado: { bg: "#ffedd5", color: "#9a3412" },
  Aprobado: { bg: "#dcfce7", color: "#166534" },
  Rechazado: { bg: "#fee2e2", color: "#991b1b" },
};

// ─── Vista: Lista de trámites asignables ─────────────────────────────────────
export default function AsignacionTramiteScreen({ onVolver }: Props) {
  const { usuarioActivo } = useSesion();
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoTramite | "">("");
  const [tramiteSel, setTramiteSel] = useState<Tramite | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    let query = supabase
      .from("tramites")
      .select("*")
      .in("estado", ["Pendiente", "En revisión", "Observado"])
      .order("fecha_registro", { ascending: false })
      .limit(100);
    const { data, error: err } = await query;
    setCargando(false);
    if (err) setError("No se pudo cargar la lista de trámites.");
    else setTramites((data as Tramite[]) ?? []);
  }, []);

  useEffect(() => {
    cargar();
  }, []);

  // Filtrado local
  const tramitesFiltrados = tramites.filter((t) => {
    const q = busqueda.trim().toLowerCase();
    const coincideBusqueda =
      !q ||
      t.numero_tramite.toLowerCase().includes(q) ||
      t.solicitante_nombre.toLowerCase().includes(q) ||
      t.solicitante_ci.toLowerCase().includes(q);
    const coincideTipo = !filtroTipo || t.tipo === filtroTipo;
    return coincideBusqueda && coincideTipo;
  });

  if (tramiteSel) {
    return (
      <FormAsignacion
        tramite={tramiteSel}
        usuarioActivo={usuarioActivo!}
        onGuardado={() => {
          setTramiteSel(null);
          cargar();
        }}
        onCancelar={() => setTramiteSel(null)}
      />
    );
  }

  return (
    <View style={s.contenedor}>
      <StatusBar style="light" />
      <View style={s.cabecera}>
        <TouchableOpacity onPress={onVolver} style={s.botonAtras}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.cabeceraTitulo}>Asignar Trámite</Text>
          <Text style={s.cabeceraSubtitulo}>
            {cargando
              ? "Cargando..."
              : `${tramitesFiltrados.length} trámite${tramitesFiltrados.length !== 1 ? "s" : ""} disponibles`}
          </Text>
        </View>
        <TouchableOpacity onPress={cargar} style={s.botonRefrescar}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Filtros ── */}
      <View style={s.filtrosContenedor}>
        {/* Búsqueda libre */}
        <View style={s.inputRow}>
          <Ionicons name="search-outline" size={16} color="#6b7280" />
          <TextInput
            style={s.input}
            placeholder="Buscar por número, nombre o CI..."
            placeholderTextColor="#9ca3af"
            value={busqueda}
            onChangeText={setBusqueda}
            autoCapitalize="none"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda("")}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Chips de tipo */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsRow}
        >
          <TouchableOpacity
            style={[s.chip, !filtroTipo && s.chipActivo]}
            onPress={() => setFiltroTipo("")}
          >
            <Text style={[s.chipTexto, !filtroTipo && s.chipTextoActivo]}>
              Todos
            </Text>
          </TouchableOpacity>
          {TIPOS_TRAMITE.map((tipo) => (
            <TouchableOpacity
              key={tipo}
              style={[s.chip, filtroTipo === tipo && s.chipActivo]}
              onPress={() => setFiltroTipo(tipo)}
            >
              <Text
                style={[s.chipTexto, filtroTipo === tipo && s.chipTextoActivo]}
              >
                {tipo}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Lista ── */}
      {error ? (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
          <Text style={s.errorTexto}>{error}</Text>
          <TouchableOpacity onPress={cargar}>
            <Text style={s.reintentarTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : cargando ? (
        <View style={s.centrando}>
          <ActivityIndicator color="#0f2554" size="large" />
          <Text style={s.cargandoTexto}>Cargando trámites...</Text>
        </View>
      ) : tramitesFiltrados.length === 0 ? (
        <View style={s.centrando}>
          <Ionicons name="document-outline" size={48} color="#d1d5db" />
          <Text style={s.vacioTexto}>
            {busqueda || filtroTipo
              ? "No hay resultados para los filtros aplicados."
              : "No hay trámites pendientes de asignación."}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.lista}
          keyboardShouldPersistTaps="handled"
        >
          {tramitesFiltrados.map((t) => {
            const est = ESTADO_ESTILO[t.estado] ?? ESTADO_ESTILO["Pendiente"];
            const yaAsignado = !!t.unidad_asignada;
            return (
              <TouchableOpacity
                key={t.id}
                style={[s.tramiteCard, yaAsignado && s.tramiteCardAsignado]}
                onPress={() => setTramiteSel(t)}
                activeOpacity={0.75}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={s.filaAlign}>
                    <Text style={s.tramiteNro}>{t.numero_tramite}</Text>
                    <View style={[s.estadoBadge, { backgroundColor: est.bg }]}>
                      <Text style={[s.estadoTexto, { color: est.color }]}>
                        {t.estado}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.tramiteTipo}>{t.tipo}</Text>
                  <View style={s.filaAlign}>
                    <Ionicons name="person-outline" size={12} color="#94a3b8" />
                    <Text style={s.tramiteSol}>{t.solicitante_nombre}</Text>
                  </View>
                  {yaAsignado && (
                    <View style={s.filaAlign}>
                      <Ionicons
                        name="business-outline"
                        size={12}
                        color="#0369a1"
                      />
                      <Text style={s.tramiteUnidad}>{t.unidad_asignada}</Text>
                    </View>
                  )}
                  <Text style={s.tramiteFecha}>
                    {new Date(t.fecha_registro).toLocaleDateString("es-BO")}
                  </Text>
                </View>
                <View style={s.botonSeleccionar}>
                  <Ionicons
                    name="git-branch-outline"
                    size={16}
                    color="#0f2554"
                  />
                  <Text style={s.botonSeleccionarTexto}>
                    {yaAsignado ? "Reasignar" : "Asignar"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── FormAsignacion ───────────────────────────────────────────────────────────
interface FormProps {
  tramite: Tramite;
  usuarioActivo: { id: string; usuario: string; rol: string };
  onGuardado: () => void;
  onCancelar: () => void;
}

function FormAsignacion({
  tramite,
  usuarioActivo,
  onGuardado,
  onCancelar,
}: FormProps) {
  const [unidad, setUnidad] = useState(tramite.unidad_asignada ?? "");
  const [responsable, setResponsable] = useState(tramite.responsable ?? "");
  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGen, setErrorGen] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [responsables, setResponsables] = useState<string[]>([]);
  const [cargandoResponsables, setCargandoResponsables] = useState(false);

  // Cargar responsables cuando cambia la unidad
  useEffect(() => {
    if (unidad) {
      setCargandoResponsables(true);
      obtenerResponsablesDeUnidad(unidad as any).then((resp) => {
        setResponsables(resp);
        setCargandoResponsables(false);
        // Si el responsable actual no está en la lista, limpiarlo
        if (responsable && !resp.includes(responsable)) {
          setResponsable("");
        }
      });
    } else {
      setResponsables([]);
    }
  }, [unidad]);

  const validar = () => {
    const e: Record<string, string> = {};
    if (!unidad.trim()) e.unidad = "Seleccione una unidad.";
    if (!responsable.trim()) e.responsable = "El responsable es obligatorio.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleGuardar = async () => {
    if (!validar()) return;
    setGuardando(true);
    setErrorGen(null);

    const estadoNuevo = "En revisión";
    const { error: errUpdate } = await supabase
      .from("tramites")
      .update({
        unidad_asignada: unidad.trim(),
        responsable: responsable.trim(),
        estado: estadoNuevo,
        fecha_asignacion: new Date().toISOString(),
      })
      .eq("id", tramite.id);

    if (errUpdate) {
      setGuardando(false);
      setErrorGen("No se pudo guardar la asignación.");
      return;
    }

    // Historial
    await supabase.from("historial_tramite").insert({
      tramite_id: tramite.id,
      estado_anterior: tramite.estado,
      estado_nuevo: estadoNuevo,
      accion: "ASIGNACION",
      observacion: observacion.trim() || `Asignado a ${unidad.trim()}`,
      usuario_nombre: usuarioActivo.usuario,
    });

    // Auditoría
    await registrarAccion({
      usuario_id: usuarioActivo.id,
      usuario_nombre: usuarioActivo.usuario,
      accion: "LOGIN_EXITOSO",
      descripcion: `Trámite ${tramite.numero_tramite} asignado a "${unidad.trim()}" — responsable: ${responsable.trim()}`,
      resultado: "exitoso",
    });

    setGuardando(false);
    setExito(true);
    setTimeout(onGuardado, 1200);
  };

  return (
    <View style={s.contenedor}>
      <StatusBar style="light" />
      <View style={s.cabecera}>
        <TouchableOpacity onPress={onCancelar} style={s.botonAtras}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.cabeceraTitulo}>Asignar Trámite</Text>
          <Text style={s.cabeceraSubtitulo}>{tramite.numero_tramite}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Resumen del trámite */}
        <View style={s.card}>
          <Text style={s.cardTitulo}>Trámite seleccionado</Text>
          <FilaDato
            icono="barcode-outline"
            label="Número"
            valor={tramite.numero_tramite}
            negrita
          />
          <FilaDato icono="list-outline" label="Tipo" valor={tramite.tipo} />
          <FilaDato
            icono="person-outline"
            label="Solicitante"
            valor={tramite.solicitante_nombre}
          />
          <FilaDato
            icono="document-text-outline"
            label="Descripción"
            valor={tramite.descripcion}
          />
        </View>

        {/* Selección de unidad */}
        <View style={s.card}>
          <SelectorConBusqueda
            titulo="Unidad responsable *"
            opciones={UNIDADES_MUNICIPALES as any}
            valorSeleccionado={unidad}
            onSeleccionar={(v) => {
              setUnidad(v);
              setErrores((e) => ({ ...e, unidad: "" }));
            }}
            placeholder="Buscar unidad..."
            icono="business-outline"
          />
          {errores.unidad && (
            <Text style={s.errorTextoInline}>⚠ {errores.unidad}</Text>
          )}
        </View>

        {/* Responsable */}
        <View style={s.card}>
          <SelectorConBusqueda
            titulo="Responsable *"
            opciones={responsables}
            valorSeleccionado={responsable}
            onSeleccionar={(v) => {
              setResponsable(v);
              setErrores((e) => ({ ...e, responsable: "" }));
            }}
            placeholder="Buscar responsable..."
            icono="people-outline"
            maxVisible={4}
          />
          {cargandoResponsables && (
            <View style={s.cargandoResponsables}>
              <ActivityIndicator size="small" color="#0f2554" />
              <Text style={s.cargandoTexto}>Cargando responsables...</Text>
            </View>
          )}
          {errores.responsable && (
            <Text style={s.errorTextoInline}>⚠ {errores.responsable}</Text>
          )}
        </View>

        {/* Observación */}
        <View style={s.card}>
          <Text style={s.cardTitulo}>Observación (opcional)</Text>
          <View
            style={[
              s.inputRow,
              {
                height: "auto" as any,
                alignItems: "flex-start",
                paddingVertical: 10,
              },
            ]}
          >
            <TextInput
              style={[s.input, { minHeight: 70, textAlignVertical: "top" }]}
              placeholder="Instrucciones o comentarios adicionales..."
              placeholderTextColor="#9ca3af"
              value={observacion}
              onChangeText={setObservacion}
              multiline
            />
          </View>
        </View>

        {errorGen && (
          <View style={s.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
            <Text style={s.errorTexto}>{errorGen}</Text>
          </View>
        )}

        {exito && (
          <View style={s.exitoBanner}>
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color="#166534"
            />
            <Text style={s.exitoTexto}>¡Trámite asignado correctamente!</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.botonAccion, (guardando || exito) && s.botonDisabled]}
          onPress={handleGuardar}
          disabled={guardando || exito}
        >
          {guardando ? (
            <View style={s.fila}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={s.botonAccionTexto}>Guardando...</Text>
            </View>
          ) : (
            <View style={s.fila}>
              <Ionicons name="git-branch-outline" size={18} color="#fff" />
              <Text style={s.botonAccionTexto}>Confirmar asignación</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Subcomponente FilaDato ───────────────────────────────────────────────────
function FilaDato({
  icono,
  label,
  valor,
  negrita,
}: {
  icono: string;
  label: string;
  valor: string;
  negrita?: boolean;
}) {
  return (
    <View style={s.filaDato}>
      <Ionicons
        name={icono as any}
        size={14}
        color="#6b7280"
        style={{ marginTop: 2 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={s.filaDatoLabel}>{label}</Text>
        <Text style={[s.filaDatoValor, negrita && s.filaDatoNegrita]}>
          {valor}
        </Text>
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const isWeb = Platform.OS === "web";
const s = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#f1f5f9" },
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
  botonRefrescar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff18",
    alignItems: "center",
    justifyContent: "center",
  },
  cabeceraTitulo: { fontSize: 18, fontWeight: "700", color: "#fff" },
  cabeceraSubtitulo: { fontSize: 11, color: "#93c5fd" },

  filtrosContenedor: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 10,
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
  },
  inputError: { borderColor: "#ef4444" },
  input: { flex: 1, fontSize: 14, color: "#111827" },
  chipsRow: { paddingVertical: 2, gap: 8, flexDirection: "row" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  chipActivo: { backgroundColor: "#0f2554", borderColor: "#0f2554" },
  chipTexto: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  chipTextoActivo: { color: "#fff", fontWeight: "700" },

  lista: { padding: 16, maxWidth: 640, width: "100%", alignSelf: "center" },
  centrando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 40,
  },
  cargandoTexto: { color: "#94a3b8", fontSize: 14 },
  vacioTexto: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    padding: 12,
    margin: 16,
  },
  errorTexto: { flex: 1, color: "#dc2626", fontSize: 13 },
  reintentarTexto: { color: "#0369a1", fontWeight: "700", fontSize: 13 },

  tramiteCard: {
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
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  tramiteCardAsignado: { borderColor: "#bfdbfe" },
  tramiteNro: { fontSize: 14, fontWeight: "800", color: "#0f2554" },
  tramiteTipo: { fontSize: 12, color: "#374151" },
  tramiteSol: { fontSize: 12, color: "#64748b" },
  tramiteUnidad: { fontSize: 11, color: "#0369a1", fontWeight: "600" },
  tramiteFecha: { fontSize: 11, color: "#94a3b8" },
  filaAlign: { flexDirection: "row", alignItems: "center", gap: 5 },
  estadoBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  estadoTexto: { fontSize: 10, fontWeight: "800" },
  botonSeleccionar: { alignItems: "center", gap: 4, paddingHorizontal: 10 },
  botonSeleccionarTexto: { fontSize: 10, fontWeight: "700", color: "#0f2554" },

  // Form
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
    fontSize: 13,
    fontWeight: "700",
    color: "#0f2554",
    marginBottom: 12,
  },
  unidadCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    padding: 12,
    marginBottom: 6,
  },
  unidadCardActiva: { borderColor: "#0f2554", backgroundColor: "#eff6ff" },
  unidadTexto: { flex: 1, fontSize: 13, color: "#6b7280" },
  unidadTextoActivo: { fontWeight: "700", color: "#0f2554" },
  errorTextoInline: { color: "#ef4444", fontSize: 12, marginBottom: 8 },
  cargandoResponsables: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  exitoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  exitoTexto: { flex: 1, color: "#166534", fontSize: 13 },
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },
  botonAccion: {
    backgroundColor: "#0f2554",
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f2554",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  botonDisabled: { backgroundColor: "#94a3b8", shadowOpacity: 0, elevation: 0 },
  botonAccionTexto: { color: "#fff", fontWeight: "700", fontSize: 15 },
  filaDato: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  filaDatoLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  filaDatoValor: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "500",
    marginTop: 1,
  },
  filaDatoNegrita: { fontSize: 15, fontWeight: "800", color: "#0f2554" },
});
