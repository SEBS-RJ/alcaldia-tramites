// ─── ConsultaTramiteScreen.tsx — HU-4 (Sprint 2) ────────────────────────────
// T-01: Búsqueda por número único
// T-02: Visualización del estado actual
// T-03: Historial de cambios con fecha, usuario y acción
// Acceso: Funcionario Municipal y Jefe de Área

import React, { useState } from "react";
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
import {
  consultarTramite,
  buscarTramitesPorSolicitante,
  TramiteResumido,
  EntradaHistorial,
} from "../services/consultaService";
import { Tramite } from "../services/tramiteService";

// ─── Colores por estado ───────────────────────────────────────────────────────

const COLOR_ESTADO: Record<
  string,
  { bg: string; text: string; icono: string }
> = {
  Pendiente: { bg: "#fef9c3", text: "#854d0e", icono: "time-outline" },
  "En revisión": { bg: "#dbeafe", text: "#1e40af", icono: "search-outline" },
  Observado: { bg: "#ffedd5", text: "#9a3412", icono: "alert-circle-outline" },
  Aprobado: {
    bg: "#dcfce7",
    text: "#166534",
    icono: "checkmark-circle-outline",
  },
  Rechazado: { bg: "#fee2e2", text: "#991b1b", icono: "close-circle-outline" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatearFecha(fechaISO: string): string {
  return new Date(fechaISO).toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  onVolver: () => void;
}

export default function ConsultaTramiteScreen({ onVolver }: Props) {
  const [numeroBusqueda, setNumeroBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tramite, setTramite] = useState<Tramite | null>(null);
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);

  // Búsqueda por solicitante
  const [busquedaSolicitante, setBusquedaSolicitante] = useState("");
  const [cargandoSolicitante, setCargandoSolicitante] = useState(false);
  const [tramitesEncontrados, setTramitesEncontrados] = useState<
    TramiteResumido[]
  >([]);
  const [errorSolicitante, setErrorSolicitante] = useState<string | null>(null);

  // ── T-01 HU-4: Buscar trámite ─────────────────────────────────────────────

  const handleBuscar = async () => {
    setError(null);
    setTramite(null);
    setHistorial([]);

    if (!numeroBusqueda.trim()) {
      setError("Ingrese el número de trámite para buscar.");
      return;
    }

    setCargando(true);
    const resultado = await consultarTramite(numeroBusqueda);
    setCargando(false);

    if (resultado.exito && resultado.tramite) {
      setTramite(resultado.tramite);
      setHistorial(resultado.historial ?? []);
    } else {
      setError(resultado.error ?? "No se pudo consultar el trámite.");
    }
  };

  const handleLimpiar = () => {
    setNumeroBusqueda("");
    setTramite(null);
    setHistorial([]);
    setError(null);
  };

  // ── Buscar por solicitante ────────────────────────────────────────────────

  const handleBuscarSolicitante = async () => {
    setErrorSolicitante(null);
    setTramitesEncontrados([]);

    if (!busquedaSolicitante.trim()) {
      setErrorSolicitante("Ingrese el nombre o CI del solicitante.");
      return;
    }

    setCargandoSolicitante(true);
    const resultado = await buscarTramitesPorSolicitante(busquedaSolicitante);
    setCargandoSolicitante(false);

    if (resultado.exito && resultado.tramites) {
      setTramitesEncontrados(resultado.tramites);
    } else {
      setErrorSolicitante(
        resultado.error ?? "No se pudieron buscar los trámites.",
      );
    }
  };

  const handleSeleccionarTramite = async (
    tramiteSeleccionado: TramiteResumido,
  ) => {
    setNumeroBusqueda(tramiteSeleccionado.numero_tramite);
    setBusquedaSolicitante("");
    setTramitesEncontrados([]);
    setErrorSolicitante(null);

    // Cargar el trámite completo
    setCargando(true);
    const resultado = await consultarTramite(
      tramiteSeleccionado.numero_tramite,
    );
    setCargando(false);

    if (resultado.exito && resultado.tramite) {
      setTramite(resultado.tramite);
      setHistorial(resultado.historial ?? []);
    } else {
      setError(resultado.error ?? "No se pudo cargar el trámite.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.contenedor}>
      <StatusBar style="light" />

      {/* Cabecera */}
      <View style={s.cabecera}>
        <TouchableOpacity onPress={onVolver} style={s.botonAtras}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.cabeceraTitulo}>Consultar Trámite</Text>
          <Text style={s.cabeceraSubtitulo}>
            T-01 · T-02 · T-03 · HU-4 — Sprint 2
          </Text>
        </View>
        <Ionicons name="search-outline" size={22} color="#93c5fd" />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Buscador ── */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>
            <Ionicons name="barcode-outline" size={13} color="#0f2554" /> Número
            de trámite
          </Text>
          <View style={[s.inputRow, error && !tramite ? s.inputError : null]}>
            <Ionicons name="document-text-outline" size={18} color="#6b7280" />
            <TextInput
              style={s.input}
              placeholder="Ej: TRM-2026-000001"
              placeholderTextColor="#9ca3af"
              value={numeroBusqueda}
              onChangeText={(v) => {
                setNumeroBusqueda(v);
                setError(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleBuscar}
            />
            {numeroBusqueda.length > 0 && (
              <TouchableOpacity onPress={handleLimpiar}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          {error && (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
              <Text style={s.errorTexto}>{error}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[s.botonBuscar, cargando && s.botonDisabled]}
            onPress={handleBuscar}
            disabled={cargando}
          >
            {cargando ? (
              <View style={s.fila}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={s.botonTexto}>Buscando...</Text>
              </View>
            ) : (
              <View style={s.fila}>
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={s.botonTexto}>Buscar trámite</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Búsqueda por solicitante ── */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>
            <Ionicons name="person-outline" size={13} color="#0f2554" /> Buscar
            por nombre o CI
          </Text>
          <View
            style={[
              s.inputRow,
              errorSolicitante && !tramitesEncontrados.length
                ? s.inputError
                : null,
            ]}
          >
            <Ionicons name="person-outline" size={18} color="#6b7280" />
            <TextInput
              style={s.input}
              placeholder="Nombre completo o número de CI"
              placeholderTextColor="#9ca3af"
              value={busquedaSolicitante}
              onChangeText={(v) => {
                setBusquedaSolicitante(v);
                setErrorSolicitante(null);
              }}
              autoCapitalize="words"
              returnKeyType="search"
              onSubmitEditing={handleBuscarSolicitante}
            />
            {busquedaSolicitante.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setBusquedaSolicitante("");
                  setTramitesEncontrados([]);
                  setErrorSolicitante(null);
                }}
              >
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          {errorSolicitante && (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
              <Text style={s.errorTexto}>{errorSolicitante}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[s.botonBuscar, cargandoSolicitante && s.botonDisabled]}
            onPress={handleBuscarSolicitante}
            disabled={cargandoSolicitante}
          >
            {cargandoSolicitante ? (
              <View style={s.fila}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={s.botonTexto}>Buscando...</Text>
              </View>
            ) : (
              <View style={s.fila}>
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={s.botonTexto}>Buscar por solicitante</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Resultados de búsqueda */}
          {tramitesEncontrados.length > 0 && (
            <View style={s.resultadosContainer}>
              <Text style={s.resultadosTitulo}>
                Trámites encontrados ({tramitesEncontrados.length})
              </Text>
              {tramitesEncontrados.map((t) => {
                const cs = COLOR_ESTADO[t.estado] ?? COLOR_ESTADO["Pendiente"];
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={s.tramiteCard}
                    onPress={() => handleSeleccionarTramite(t)}
                  >
                    <View style={s.tramiteHeader}>
                      <Text style={s.tramiteNumero}>{t.numero_tramite}</Text>
                      <View style={[s.miniBadge, { backgroundColor: cs.bg }]}>
                        <Text style={[s.miniBadgeTexto, { color: cs.text }]}>
                          {t.estado}
                        </Text>
                      </View>
                    </View>
                    <Text style={s.tramiteTipo}>{t.tipo}</Text>
                    <Text style={s.tramiteSolicitante}>
                      {t.solicitante_nombre}
                    </Text>
                    <Text style={s.tramiteFecha}>
                      {formatearFecha(t.fecha_registro)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── T-02 HU-4: Estado actual del trámite ── */}
        {tramite && (
          <>
            <View style={s.card}>
              <Text style={s.sectionTitle}>
                <Ionicons
                  name="information-circle-outline"
                  size={13}
                  color="#0f2554"
                />{" "}
                Datos del trámite
              </Text>

              {/* Badge de estado destacado */}
              {(() => {
                const cs =
                  COLOR_ESTADO[tramite.estado] ?? COLOR_ESTADO["Pendiente"];
                return (
                  <View style={[s.estadoBadge, { backgroundColor: cs.bg }]}>
                    <Ionicons
                      name={cs.icono as any}
                      size={20}
                      color={cs.text}
                    />
                    <Text style={[s.estadoTexto, { color: cs.text }]}>
                      {tramite.estado}
                    </Text>
                  </View>
                );
              })()}

              <FilaDato
                icono="barcode-outline"
                etiqueta="Número"
                valor={tramite.numero_tramite}
                negrita
              />
              <FilaDato
                icono="list-outline"
                etiqueta="Tipo"
                valor={tramite.tipo}
              />
              <FilaDato
                icono="person-outline"
                etiqueta="Solicitante"
                valor={tramite.solicitante_nombre}
              />
              <FilaDato
                icono="card-outline"
                etiqueta="CI"
                valor={tramite.solicitante_ci}
              />
              {tramite.solicitante_telefono ? (
                <FilaDato
                  icono="call-outline"
                  etiqueta="Teléfono"
                  valor={tramite.solicitante_telefono}
                />
              ) : null}
              <FilaDato
                icono="location-outline"
                etiqueta="Dirección"
                valor={tramite.direccion}
              />
              <FilaDato
                icono="document-text-outline"
                etiqueta="Descripción"
                valor={tramite.descripcion}
              />
              <FilaDato
                icono="time-outline"
                etiqueta="Registrado"
                valor={formatearFecha(tramite.fecha_registro)}
              />
              <FilaDato
                icono="calendar-outline"
                etiqueta="Vence el"
                valor={formatearFecha(tramite.fecha_vencimiento)}
              />
              <FilaDato
                icono="person-add-outline"
                etiqueta="Registrado por"
                valor={tramite.registrado_por}
              />
              {tramite.unidad_asignada ? (
                <FilaDato
                  icono="business-outline"
                  etiqueta="Unidad asignada"
                  valor={tramite.unidad_asignada}
                />
              ) : null}
              {tramite.responsable ? (
                <FilaDato
                  icono="people-outline"
                  etiqueta="Responsable"
                  valor={tramite.responsable}
                />
              ) : null}
            </View>

            {/* ── T-03 HU-4: Historial de cambios ── */}
            <View style={s.card}>
              <Text style={s.sectionTitle}>
                <Ionicons name="git-branch-outline" size={13} color="#0f2554" />{" "}
                Historial de cambios
              </Text>

              {historial.length === 0 ? (
                <View style={s.sinHistorial}>
                  <Ionicons name="time-outline" size={28} color="#cbd5e1" />
                  <Text style={s.sinHistorialTexto}>
                    Sin cambios registrados aún.
                  </Text>
                  <Text style={s.sinHistorialSub}>
                    El trámite está en su estado inicial.
                  </Text>
                </View>
              ) : (
                historial.map((entrada, i) => {
                  const cs =
                    COLOR_ESTADO[entrada.estado_nuevo] ??
                    COLOR_ESTADO["Pendiente"];
                  return (
                    <View
                      key={entrada.id}
                      style={[
                        s.historialItem,
                        i < historial.length - 1 && s.historialItemBorde,
                      ]}
                    >
                      <View
                        style={[
                          s.historialDot,
                          { backgroundColor: cs.bg, borderColor: cs.text },
                        ]}
                      >
                        <Ionicons
                          name={cs.icono as any}
                          size={14}
                          color={cs.text}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={s.fila}>
                          <Text style={s.historialAccion}>
                            {entrada.accion}
                          </Text>
                          <View
                            style={[
                              s.historialEstadoBadge,
                              { backgroundColor: cs.bg },
                            ]}
                          >
                            <Text
                              style={[s.historialEstado, { color: cs.text }]}
                            >
                              {entrada.estado_nuevo}
                            </Text>
                          </View>
                        </View>
                        {entrada.estado_anterior && (
                          <Text style={s.historialTransicion}>
                            {entrada.estado_anterior} → {entrada.estado_nuevo}
                          </Text>
                        )}
                        {entrada.observacion && (
                          <Text style={s.historialObservacion}>
                            {entrada.observacion}
                          </Text>
                        )}
                        <View style={s.fila}>
                          <Ionicons
                            name="person-outline"
                            size={11}
                            color="#94a3b8"
                          />
                          <Text style={s.historialMeta}>
                            {entrada.usuario_nombre}
                          </Text>
                          <Text style={s.historialMeta}>·</Text>
                          <Ionicons
                            name="time-outline"
                            size={11}
                            color="#94a3b8"
                          />
                          <Text style={s.historialMeta}>
                            {formatearFecha(entrada.fecha)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Subcomponente FilaDato ────────────────────────────────────────────────────

interface PropsFilaDato {
  icono: string;
  etiqueta: string;
  valor: string;
  negrita?: boolean;
}

function FilaDato({ icono, etiqueta, valor, negrita }: PropsFilaDato) {
  return (
    <View style={s.filaDato}>
      <Ionicons
        name={icono as any}
        size={15}
        color="#6b7280"
        style={{ marginTop: 1 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={s.filaDatoEtiqueta}>{etiqueta}</Text>
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
  cabeceraTitulo: { fontSize: 18, fontWeight: "700", color: "#ffffff" },
  cabeceraSubtitulo: { fontSize: 11, color: "#93c5fd" },

  scroll: { padding: 16, maxWidth: 600, width: "100%", alignSelf: "center" },

  card: {
    backgroundColor: "#ffffff",
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
    color: "#0f2554",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 12,
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
    height: 48,
    marginBottom: 10,
  },
  inputError: { borderColor: "#ef4444", backgroundColor: "#fff5f5" },
  input: { flex: 1, fontSize: 14, color: "#111827" },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  errorTexto: { flex: 1, color: "#dc2626", fontSize: 13 },

  botonBuscar: {
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
  botonDisabled: { backgroundColor: "#94a3b8", shadowOpacity: 0, elevation: 0 },
  botonTexto: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },

  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  estadoTexto: { fontSize: 16, fontWeight: "800" },

  filaDato: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  filaDatoEtiqueta: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  filaDatoValor: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "500",
    marginTop: 1,
  },
  filaDatoNegrita: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f2554",
    letterSpacing: 0.5,
  },

  sinHistorial: { alignItems: "center", paddingVertical: 24, gap: 6 },
  sinHistorialTexto: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },
  sinHistorialSub: { fontSize: 12, color: "#cbd5e1" },

  historialItem: { flexDirection: "row", gap: 12, paddingVertical: 12 },
  historialItemBorde: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  historialDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  historialAccion: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  historialEstadoBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  historialEstado: { fontSize: 11, fontWeight: "700" },
  historialTransicion: { fontSize: 12, color: "#64748b", marginTop: 2 },
  historialObservacion: {
    fontSize: 12,
    color: "#374151",
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    padding: 6,
    marginTop: 4,
  },
  historialMeta: { fontSize: 11, color: "#94a3b8" },

  resultadosContainer: { marginTop: 16 },
  resultadosTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f2554",
    marginBottom: 12,
  },
  tramiteCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tramiteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  tramiteNumero: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f2554",
  },
  miniBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  miniBadgeTexto: { fontSize: 10, fontWeight: "700" },
  tramiteTipo: { fontSize: 12, color: "#374151", marginBottom: 2 },
  tramiteSolicitante: { fontSize: 12, color: "#64748b", marginBottom: 2 },
  tramiteFecha: { fontSize: 11, color: "#94a3b8" },
});
