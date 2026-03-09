// ─── AprobarTramiteScreen.tsx — Jefe de Área ─────────────────────────────────
// Busca un trámite, muestra su estado e historial, y permite aprobarlo
// o rechazarlo registrando justificación y actualizando historial + auditoría.

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
import { useSesion } from "../context/SesionContext";
import { consultarTramite } from "../services/consultaService";
import { supabase } from "../lib/supabase";
import { registrarAccion } from "../services/auditoriaService";
import { Tramite } from "../services/tramiteService";

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

export default function AprobarTramiteScreen({ onVolver }: Props) {
  const { usuarioActivo } = useSesion();

  const [numeroBusqueda, setNumeroBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [tramite, setTramite] = useState<Tramite | null>(null);

  const [accion, setAccion] = useState<"Aprobado" | "Rechazado" | null>(null);
  const [justificacion, setJustificacion] = useState("");
  const [errorJust, setErrorJust] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<{
    exito: boolean;
    mensaje: string;
  } | null>(null);

  const handleBuscar = async () => {
    setErrorBusqueda(null);
    setTramite(null);
    setAccion(null);
    setResultado(null);
    if (!numeroBusqueda.trim()) {
      setErrorBusqueda("Ingrese el número de trámite.");
      return;
    }
    setBuscando(true);
    const res = await consultarTramite(numeroBusqueda);
    setBuscando(false);
    if (res.exito && res.tramite) setTramite(res.tramite);
    else setErrorBusqueda(res.error ?? "Trámite no encontrado.");
  };

  const handleConfirmar = async () => {
    if (!tramite || !accion || !usuarioActivo) return;
    if (!justificacion.trim()) {
      setErrorJust("La justificación es obligatoria.");
      return;
    }
    setErrorJust("");
    setGuardando(true);

    const estadoAnterior = tramite.estado;

    // Actualizar estado del trámite
    const { error: errUpdate } = await supabase
      .from("tramites")
      .update({ estado: accion })
      .eq("id", tramite.id);

    if (errUpdate) {
      setGuardando(false);
      setResultado({
        exito: false,
        mensaje: "No se pudo actualizar el trámite.",
      });
      return;
    }

    // Registrar en historial
    await supabase.from("historial_tramite").insert({
      tramite_id: tramite.id,
      estado_anterior: estadoAnterior,
      estado_nuevo: accion,
      accion: accion === "Aprobado" ? "APROBACION" : "RECHAZO",
      observacion: justificacion.trim(),
      usuario_nombre: usuarioActivo.usuario,
    });

    // Auditoría
    await registrarAccion({
      usuario_id: usuarioActivo.id,
      usuario_nombre: usuarioActivo.usuario,
      accion: "LOGIN_EXITOSO",
      descripcion: `Trámite ${tramite.numero_tramite} ${accion.toLowerCase()} — ${justificacion.trim()}`,
      resultado: "exitoso",
    });

    setGuardando(false);
    setResultado({
      exito: true,
      mensaje: `Trámite ${accion.toLowerCase()} correctamente.`,
    });
    setTramite((prev) => (prev ? { ...prev, estado: accion } : prev));
  };

  const est = tramite
    ? (ESTADO_ESTILO[tramite.estado] ?? ESTADO_ESTILO["Pendiente"])
    : null;
  const puedeDecidir =
    tramite && !["Aprobado", "Rechazado"].includes(tramite.estado);

  return (
    <View style={s.contenedor}>
      <StatusBar style="light" />
      <View style={s.cabecera}>
        <TouchableOpacity onPress={onVolver} style={s.botonAtras}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.cabeceraTitulo}>Aprobar / Rechazar Trámite</Text>
          <Text style={s.cabeceraSubtitulo}>Jefe de Área</Text>
        </View>
        <Ionicons name="checkmark-circle-outline" size={20} color="#93c5fd" />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Búsqueda */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Buscar trámite</Text>
          <View style={[s.inputRow, errorBusqueda ? s.inputError : null]}>
            <Ionicons name="barcode-outline" size={18} color="#6b7280" />
            <TextInput
              style={s.input}
              placeholder="Ej: TRM-2026-000001"
              placeholderTextColor="#9ca3af"
              value={numeroBusqueda}
              onChangeText={(v) => {
                setNumeroBusqueda(v);
                setErrorBusqueda(null);
              }}
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={handleBuscar}
              editable={!buscando}
            />
          </View>
          {errorBusqueda && (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
              <Text style={s.errorTexto}>{errorBusqueda}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[s.botonPrimario, buscando && s.botonDisabled]}
            onPress={handleBuscar}
            disabled={buscando}
          >
            {buscando ? (
              <View style={s.fila}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={s.botonTexto}>Buscando...</Text>
              </View>
            ) : (
              <View style={s.fila}>
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={s.botonTexto}>Buscar</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Datos del trámite */}
        {tramite && est && (
          <View style={s.card}>
            <View style={[s.estadoBadge, { backgroundColor: est.bg }]}>
              <Text style={[s.estadoTexto, { color: est.color }]}>
                {tramite.estado}
              </Text>
            </View>
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
            {tramite.unidad_asignada && (
              <FilaDato
                icono="business-outline"
                label="Unidad"
                valor={tramite.unidad_asignada}
              />
            )}
            {tramite.responsable && (
              <FilaDato
                icono="people-outline"
                label="Responsable"
                valor={tramite.responsable}
              />
            )}
          </View>
        )}

        {/* Decisión */}
        {tramite && (
          <View style={s.card}>
            {!puedeDecidir ? (
              <View style={s.yaDecidido}>
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color="#0369a1"
                />
                <Text style={s.yaDecididoTexto}>
                  Este trámite ya fue {tramite.estado.toLowerCase()}. No se
                  puede modificar.
                </Text>
              </View>
            ) : (
              <>
                <Text style={s.sectionTitle}>Decisión</Text>
                <View style={s.filaDos}>
                  <TouchableOpacity
                    style={[
                      s.botonDecision,
                      accion === "Aprobado" && s.botonAprobadoActivo,
                    ]}
                    onPress={() => {
                      setAccion("Aprobado");
                      setErrorJust("");
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color={accion === "Aprobado" ? "#fff" : "#166534"}
                    />
                    <Text
                      style={[
                        s.botonDecisionTexto,
                        accion === "Aprobado" && { color: "#fff" },
                      ]}
                    >
                      Aprobar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      s.botonDecision,
                      accion === "Rechazado" && s.botonRechazadoActivo,
                    ]}
                    onPress={() => {
                      setAccion("Rechazado");
                      setErrorJust("");
                    }}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={20}
                      color={accion === "Rechazado" ? "#fff" : "#991b1b"}
                    />
                    <Text
                      style={[
                        s.botonDecisionTexto,
                        accion === "Rechazado" && { color: "#fff" },
                      ]}
                    >
                      Rechazar
                    </Text>
                  </TouchableOpacity>
                </View>

                {accion && (
                  <>
                    <Text style={[s.sectionTitle, { marginTop: 14 }]}>
                      Justificación *
                    </Text>
                    <View
                      style={[
                        s.inputRow,
                        {
                          height: "auto" as any,
                          alignItems: "flex-start",
                          paddingVertical: 10,
                        },
                        errorJust ? s.inputError : null,
                      ]}
                    >
                      <TextInput
                        style={[
                          s.input,
                          { minHeight: 80, textAlignVertical: "top" },
                        ]}
                        placeholder="Describa el motivo de su decisión..."
                        placeholderTextColor="#9ca3af"
                        value={justificacion}
                        onChangeText={(v) => {
                          setJustificacion(v);
                          setErrorJust("");
                        }}
                        multiline
                      />
                    </View>
                    {errorJust ? (
                      <Text style={s.errorTextoInline}>⚠ {errorJust}</Text>
                    ) : null}

                    {resultado && !resultado.exito && (
                      <View style={[s.errorBanner, { marginTop: 8 }]}>
                        <Ionicons
                          name="alert-circle-outline"
                          size={15}
                          color="#dc2626"
                        />
                        <Text style={s.errorTexto}>{resultado.mensaje}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        s.botonPrimario,
                        { marginTop: 12 },
                        accion === "Rechazado" && {
                          backgroundColor: "#dc2626",
                        },
                        guardando && s.botonDisabled,
                      ]}
                      onPress={handleConfirmar}
                      disabled={guardando}
                    >
                      {guardando ? (
                        <View style={s.fila}>
                          <ActivityIndicator color="#fff" size="small" />
                          <Text style={s.botonTexto}>Guardando...</Text>
                        </View>
                      ) : (
                        <View style={s.fila}>
                          <Ionicons
                            name={
                              accion === "Aprobado"
                                ? "checkmark-circle"
                                : "close-circle"
                            }
                            size={18}
                            color="#fff"
                          />
                          <Text style={s.botonTexto}>Confirmar {accion}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {resultado?.exito && (
              <View style={s.exitoBanner}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color="#166534"
                />
                <Text style={s.exitoTexto}>{resultado.mensaje}</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

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
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0369a1",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
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
    marginBottom: 8,
  },
  inputError: { borderColor: "#ef4444" },
  input: { flex: 1, fontSize: 14, color: "#111827" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  errorTexto: { flex: 1, color: "#dc2626", fontSize: 13 },
  errorTextoInline: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 2,
    marginBottom: 6,
  },
  exitoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  exitoTexto: { flex: 1, color: "#166534", fontSize: 13 },
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },
  filaDos: { flexDirection: "row", gap: 10 },
  botonPrimario: {
    backgroundColor: "#0369a1",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0369a1",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  botonDisabled: { backgroundColor: "#94a3b8", shadowOpacity: 0, elevation: 0 },
  botonTexto: { color: "#fff", fontWeight: "700", fontSize: 15 },
  estadoBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  estadoTexto: { fontSize: 13, fontWeight: "800" },
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
  botonDecision: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderRadius: 12,
    height: 48,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  botonAprobadoActivo: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  botonRechazadoActivo: { backgroundColor: "#dc2626", borderColor: "#dc2626" },
  botonDecisionTexto: { fontSize: 14, fontWeight: "700", color: "#374151" },
  yaDecidido: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 12,
  },
  yaDecididoTexto: { flex: 1, fontSize: 13, color: "#0369a1" },
});
