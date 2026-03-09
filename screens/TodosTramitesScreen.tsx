// ─── TodosTramitesScreen.tsx — Módulo Admin ───────────────────────────────────
// Tabla completa de trámites con filtros, paginación y exportación CSV

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { supabase } from "../lib/supabase";
import {
  listarTramites,
  exportarCSV,
  FiltrosTramites,
  PAGINA_TAMANO,
} from "../services/reporteService";
import {
  Tramite,
  TipoTramite,
  EstadoTramite,
} from "../services/tramiteService";

interface Props {
  onVolver: () => void;
}

// ─── Colores por estado ───────────────────────────────────────────────────────

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
const TIPOS: TipoTramite[] = [
  "Licencia de funcionamiento",
  "Patente",
  "Certificación",
  "Reclamo vecinal",
  "Solicitud de obra",
];

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function TodosTramitesScreen({ onVolver }: Props) {
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtros, setFiltros] = useState<FiltrosTramites>({
    estado: "",
    tipo: "",
    fechaDesde: "",
    fechaHasta: "",
    busqueda: "",
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosTramites>({});

  // Debounce para búsqueda
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGINA_TAMANO));

  // ── Cargar ────────────────────────────────────────────────────────────────

  const cargar = useCallback(async (f: FiltrosTramites, p: number) => {
    setCargando(true);
    setError(null);
    const resultado = await listarTramites(f, p);
    setCargando(false);
    if (resultado.error) setError(resultado.error);
    else {
      setTramites(resultado.tramites);
      setTotal(resultado.total);
    }
  }, []);

  useEffect(() => {
    cargar(filtrosAplicados, pagina);
  }, [pagina]);

  const aplicarFiltros = () => {
    setPagina(1);
    setFiltrosAplicados({ ...filtros });
    cargar({ ...filtros }, 1);
  };

  // Debounce para búsqueda
  const handleBusquedaChange = (texto: string) => {
    setFiltros((f) => ({ ...f, busqueda: texto }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPagina(1);
      setFiltrosAplicados({ ...filtros, busqueda: texto });
      cargar({ ...filtros, busqueda: texto }, 1);
    }, 500);
  };

  const limpiarFiltros = () => {
    const vacio: FiltrosTramites = {
      estado: "",
      tipo: "",
      fechaDesde: "",
      fechaHasta: "",
      busqueda: "",
    };
    setFiltros(vacio);
    setFiltrosAplicados({});
    setPagina(1);
    cargar({}, 1);
  };

  const handleExportar = async () => {
    setExportando(true);
    try {
      if (Platform.OS === "web") {
        await exportarCSV(filtrosAplicados);
      } else {
        // Para móvil: mostrar mensaje ya que FileSystem API cambió
        alert(
          "Exportación CSV en móvil no disponible en esta versión. Use la versión web para exportar.",
        );
      }
    } catch (error) {
      alert("Error al exportar: " + (error as Error).message);
    }
    setExportando(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.contenedor}>
      <StatusBar style="light" />

      {/* Cabecera */}
      <View style={s.cabecera}>
        <TouchableOpacity onPress={onVolver} style={s.botonAtras}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.cabeceraTitulo}>Todos los Trámites</Text>
          <Text style={s.cabeceraSubtitulo}>{total} trámites encontrados</Text>
        </View>
        <TouchableOpacity
          style={[s.botonExportar, exportando && s.botonDisabled]}
          onPress={handleExportar}
          disabled={exportando}
        >
          {exportando ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="download-outline" size={18} color="#fff" />
          )}
          <Text style={s.botonExportarTexto}>CSV</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Filtros ── */}
        <View style={s.card}>
          <Text style={s.cardTitulo}>
            <Ionicons name="filter-outline" size={13} color="#0f2554" /> Filtros
          </Text>

          {/* Búsqueda libre */}
          <View style={s.inputRow}>
            <Ionicons name="search-outline" size={16} color="#6b7280" />
            <TextInput
              style={s.input}
              placeholder="Buscar por número o nombre del solicitante"
              placeholderTextColor="#9ca3af"
              value={filtros.busqueda}
              onChangeText={handleBusquedaChange}
            />
            {filtros.busqueda ? (
              <TouchableOpacity
                onPress={() => setFiltros((f) => ({ ...f, busqueda: "" }))}
              >
                <Ionicons name="close-circle" size={16} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Estado */}
          <Text style={s.etiquetaFiltro}>Estado</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 10 }}
          >
            <TouchableOpacity
              style={[s.chip, !filtros.estado && s.chipActivo]}
              onPress={() => setFiltros((f) => ({ ...f, estado: "" }))}
            >
              <Text style={[s.chipTexto, !filtros.estado && s.chipTextoActivo]}>
                Todos
              </Text>
            </TouchableOpacity>
            {ESTADOS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[s.chip, filtros.estado === e && s.chipActivo]}
                onPress={() => setFiltros((f) => ({ ...f, estado: e }))}
              >
                <Text
                  style={[
                    s.chipTexto,
                    filtros.estado === e && s.chipTextoActivo,
                  ]}
                >
                  {e}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tipo */}
          <Text style={s.etiquetaFiltro}>Tipo</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 10 }}
          >
            <TouchableOpacity
              style={[s.chip, !filtros.tipo && s.chipActivo]}
              onPress={() => setFiltros((f) => ({ ...f, tipo: "" }))}
            >
              <Text style={[s.chipTexto, !filtros.tipo && s.chipTextoActivo]}>
                Todos
              </Text>
            </TouchableOpacity>
            {TIPOS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.chip, filtros.tipo === t && s.chipActivo]}
                onPress={() => setFiltros((f) => ({ ...f, tipo: t }))}
              >
                <Text
                  style={[s.chipTexto, filtros.tipo === t && s.chipTextoActivo]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Fechas */}
          <View style={s.filaDos}>
            <View style={{ flex: 1 }}>
              <Text style={s.etiquetaFiltro}>Desde (AAAA-MM-DD)</Text>
              <View style={s.inputRow}>
                <Ionicons name="calendar-outline" size={15} color="#6b7280" />
                <TextInput
                  style={s.input}
                  placeholder="2026-03-01"
                  placeholderTextColor="#9ca3af"
                  value={filtros.fechaDesde}
                  onChangeText={(v) =>
                    setFiltros((f) => ({ ...f, fechaDesde: v }))
                  }
                />
              </View>
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.etiquetaFiltro}>Hasta (AAAA-MM-DD)</Text>
              <View style={s.inputRow}>
                <Ionicons name="calendar-outline" size={15} color="#6b7280" />
                <TextInput
                  style={s.input}
                  placeholder="2026-03-31"
                  placeholderTextColor="#9ca3af"
                  value={filtros.fechaHasta}
                  onChangeText={(v) =>
                    setFiltros((f) => ({ ...f, fechaHasta: v }))
                  }
                />
              </View>
            </View>
          </View>

          {/* Botones */}
          <View style={[s.filaDos, { marginTop: 10 }]}>
            <TouchableOpacity
              style={[s.botonBuscar, cargando && s.botonDisabled]}
              onPress={aplicarFiltros}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="search-outline" size={15} color="#fff" />
                  <Text style={s.botonBuscarTexto}>Buscar</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.botonLimpiar} onPress={limpiarFiltros}>
              <Ionicons name="refresh-outline" size={15} color="#374151" />
              <Text style={s.botonLimpiarTexto}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Resumen ── */}
        <View style={s.resumenBar}>
          <Text style={s.resumenTexto}>
            {cargando
              ? "Cargando..."
              : `${total} trámite${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
          </Text>
          <Text style={s.resumenTexto}>
            Página {pagina} de {totalPaginas}
          </Text>
        </View>

        {/* ── Error ── */}
        {error && (
          <View style={s.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
            <Text style={s.errorTexto}>{error}</Text>
          </View>
        )}

        {/* ── Tabla ── */}
        {!cargando && tramites.length === 0 && !error ? (
          <View style={s.vacio}>
            <Ionicons name="document-outline" size={48} color="#d1d5db" />
            <Text style={s.vacioTexto}>No se encontraron trámites.</Text>
          </View>
        ) : (
          tramites.map((t, i) => {
            const est = ESTADO_ESTILO[t.estado] ?? ESTADO_ESTILO["Pendiente"];
            return (
              <View key={t.id} style={s.fila}>
                {/* Número + tipo */}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.filaNro}>{t.numero_tramite}</Text>
                  <Text style={s.filaTipo}>{t.tipo}</Text>
                  <Text style={s.filaSol}>{t.solicitante_nombre}</Text>
                  <Text style={s.filaFecha}>{fmtFecha(t.fecha_registro)}</Text>
                </View>
                {/* Estado */}
                <View style={[s.estadoBadge, { backgroundColor: est.bg }]}>
                  <Text style={[s.estadoTexto, { color: est.color }]}>
                    {t.estado}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {/* ── Paginación ── */}
        {!cargando && total > PAGINA_TAMANO && (
          <View style={s.paginacion}>
            <TouchableOpacity
              style={[s.botonPag, pagina === 1 && s.botonPagDisabled]}
              onPress={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={pagina === 1 ? "#d1d5db" : "#0f2554"}
              />
            </TouchableOpacity>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter(
                (n) =>
                  n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1,
              )
              .reduce<(number | "...")[]>((acc, n, idx, arr) => {
                if (idx > 0 && (arr[idx - 1] as number) + 1 < n)
                  acc.push("...");
                acc.push(n);
                return acc;
              }, [])
              .map((n, idx) =>
                n === "..." ? (
                  <Text key={`e${idx}`} style={s.paginacionPuntos}>
                    …
                  </Text>
                ) : (
                  <TouchableOpacity
                    key={n}
                    style={[s.botonPag, pagina === n && s.botonPagActivo]}
                    onPress={() => setPagina(n as number)}
                  >
                    <Text
                      style={[
                        s.botonPagTexto,
                        pagina === n && s.botonPagTextoActivo,
                      ]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ),
              )}

            <TouchableOpacity
              style={[
                s.botonPag,
                pagina === totalPaginas && s.botonPagDisabled,
              ]}
              onPress={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={pagina === totalPaginas ? "#d1d5db" : "#0f2554"}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  cabeceraTitulo: { fontSize: 18, fontWeight: "700", color: "#fff" },
  cabeceraSubtitulo: { fontSize: 11, color: "#93c5fd" },
  botonExportar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  botonExportarTexto: { color: "#fff", fontWeight: "700", fontSize: 12 },
  scroll: { padding: 16, maxWidth: 700, width: "100%", alignSelf: "center" },

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
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

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
    marginBottom: 10,
  },
  input: { flex: 1, fontSize: 13, color: "#111827" },
  etiquetaFiltro: {
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
  chipActivo: { backgroundColor: "#0f2554", borderColor: "#0f2554" },
  chipTexto: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  chipTextoActivo: { color: "#fff", fontWeight: "700" },

  filaDos: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  botonBuscar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0f2554",
    borderRadius: 10,
    height: 42,
  },
  botonBuscarTexto: { color: "#fff", fontWeight: "600", fontSize: 14 },
  botonLimpiar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 16,
    backgroundColor: "#f9fafb",
  },
  botonLimpiarTexto: { color: "#374151", fontWeight: "600", fontSize: 14 },

  resumenBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  resumenTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
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
  vacioTexto: { color: "#9ca3af", fontSize: 15, fontWeight: "600" },

  fila: {
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
  filaFecha: { fontSize: 11, color: "#94a3b8" },
  estadoBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  estadoTexto: { fontSize: 11, fontWeight: "800" },

  paginacion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    flexWrap: "wrap",
  },
  botonPag: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  botonPagActivo: { backgroundColor: "#0f2554", borderColor: "#0f2554" },
  botonPagDisabled: { borderColor: "#f1f5f9", backgroundColor: "#f8fafc" },
  botonPagTexto: { fontSize: 13, fontWeight: "600", color: "#374151" },
  botonPagTextoActivo: { color: "#fff" },
  paginacionPuntos: { fontSize: 14, color: "#94a3b8", paddingHorizontal: 4 },
  botonDisabled: { backgroundColor: "#94a3b8" },
});
