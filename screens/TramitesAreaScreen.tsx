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
import { Tramite, EstadoTramite } from "../services/tramiteService";
import { UNIDADES_MUNICIPALES } from "../services/asignacionService";

interface Props {
  onVolver: () => void;
}

const ESTADO_ESTILO: Record<string, { bg: string; color: string }> = {
  Pendiente: { bg: "#fef9c3", color: "#854d0e" },
  "En revisión": { bg: "#dbeafe", color: "#1e40af" },
  Observado: { bg: "#ffedd5", color: "#9a3412" },
  Aprobado: { bg: "#dcfce7", color: "#166534" },
  Rechazado: { bg: "#fee2e2", color: "#991b1b" },
};

const ESTADOS: EstadoTramite[] = [
  "Pendiente",
  "En revisión",
  "Observado",
  "Aprobado",
  "Rechazado",
];

export default function TramitesAreaScreen({ onVolver }: Props) {
  const { usuarioActivo } = useSesion();

  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoTramite | "">("");
  const [unidadFiltro, setUnidadFiltro] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    let query = supabase
      .from("tramites")
      .select("*")
      .order("fecha_registro", { ascending: false })
      .limit(50);

    if (filtroEstado) query = query.eq("estado", filtroEstado);
    if (unidadFiltro)
      query = query.ilike("unidad_asignada", `%${unidadFiltro}%`);

    const { data, error: err } = await query;
    setCargando(false);
    if (err) setError("No se pudieron cargar los trámites.");
    else setTramites((data as Tramite[]) ?? []);
  }, [filtroEstado, unidadFiltro]);

  useEffect(() => {
    cargar();
  }, []);

  return (
    <View style={s.contenedor}>
      <StatusBar style="light" />
      <View style={s.cabecera}>
        <TouchableOpacity onPress={onVolver} style={s.botonAtras}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.cabeceraTitulo}>Trámites del Área</Text>
          <Text style={s.cabeceraSubtitulo}>
            Jefe de Área — Vista de trámites asignados
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Filtros */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Filtros</Text>

          <Text style={s.etiqueta}>Estado</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
          >
            {(["", ...ESTADOS] as (EstadoTramite | "")[]).map((e) => (
              <TouchableOpacity
                key={e || "todos"}
                style={[s.chip, filtroEstado === e && s.chipActivo]}
                onPress={() => setFiltroEstado(e)}
              >
                <Text
                  style={[s.chipTexto, filtroEstado === e && s.chipTextoActivo]}
                >
                  {e || "Todos"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={s.etiqueta}>Unidad asignada</Text>
          <View style={s.inputRow}>
            <Ionicons name="business-outline" size={16} color="#6b7280" />
            <TextInput
              style={s.input}
              placeholder="Filtrar por unidad..."
              placeholderTextColor="#9ca3af"
              value={unidadFiltro}
              onChangeText={setUnidadFiltro}
            />
            {unidadFiltro ? (
              <TouchableOpacity onPress={() => setUnidadFiltro("")}>
                <Ionicons name="close-circle" size={16} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[s.botonBuscar, cargando && s.botonDisabled]}
            onPress={cargar}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={s.fila}>
                <Ionicons name="search-outline" size={16} color="#fff" />
                <Text style={s.botonBuscarTexto}>Buscar</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Resultados */}
        <Text style={s.resumen}>
          {cargando
            ? "Cargando..."
            : `${tramites.length} trámite${tramites.length !== 1 ? "s" : ""}`}
        </Text>

        {error && (
          <View style={s.errorBanner}>
            <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
            <Text style={s.errorTexto}>{error}</Text>
          </View>
        )}

        {!cargando && tramites.length === 0 && !error && (
          <View style={s.vacio}>
            <Ionicons name="folder-open-outline" size={48} color="#d1d5db" />
            <Text style={s.vacioTexto}>
              No hay trámites con los filtros actuales.
            </Text>
          </View>
        )}

        {tramites.map((t) => {
          const est = ESTADO_ESTILO[t.estado] ?? ESTADO_ESTILO["Pendiente"];
          return (
            <View key={t.id} style={s.filaCard}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={s.filaNro}>{t.numero_tramite}</Text>
                <Text style={s.filaTipo}>{t.tipo}</Text>
                <Text style={s.filaSol}>{t.solicitante_nombre}</Text>
                {t.unidad_asignada && (
                  <View style={s.filaAlign}>
                    <Ionicons
                      name="business-outline"
                      size={11}
                      color="#94a3b8"
                    />
                    <Text style={s.filaMeta}>{t.unidad_asignada}</Text>
                  </View>
                )}
                {t.responsable && (
                  <View style={s.filaAlign}>
                    <Ionicons name="person-outline" size={11} color="#94a3b8" />
                    <Text style={s.filaMeta}>{t.responsable}</Text>
                  </View>
                )}
              </View>
              <View style={[s.estadoBadge, { backgroundColor: est.bg }]}>
                <Text style={[s.estadoTexto, { color: est.color }]}>
                  {t.estado}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const isWeb = Platform.OS === "web";
const s = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#f1f5f9" },
  cabecera: {
    backgroundColor: "#0369a1",
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
  cabeceraSubtitulo: { fontSize: 11, color: "#bae6fd" },
  scroll: { padding: 16, maxWidth: 640, width: "100%", alignSelf: "center" },
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0369a1",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  etiqueta: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    marginRight: 8,
    backgroundColor: "#f9fafb",
  },
  chipActivo: { backgroundColor: "#0369a1", borderColor: "#0369a1" },
  chipTexto: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  chipTextoActivo: { color: "#fff", fontWeight: "700" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 10,
    height: 42,
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 13, color: "#111827" },
  botonBuscar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0369a1",
    borderRadius: 10,
    height: 42,
  },
  botonBuscarTexto: { color: "#fff", fontWeight: "600", fontSize: 14 },
  botonDisabled: { backgroundColor: "#94a3b8" },
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },
  resumen: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
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
  vacio: { alignItems: "center", paddingVertical: 48, gap: 10 },
  vacioTexto: { color: "#9ca3af", fontSize: 14, fontWeight: "600" },
  filaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filaNro: { fontSize: 14, fontWeight: "800", color: "#0f2554" },
  filaTipo: { fontSize: 12, color: "#374151" },
  filaSol: { fontSize: 12, color: "#64748b" },
  filaAlign: { flexDirection: "row", alignItems: "center", gap: 4 },
  filaMeta: { fontSize: 11, color: "#94a3b8" },
  estadoBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  estadoTexto: { fontSize: 11, fontWeight: "800" },
});
