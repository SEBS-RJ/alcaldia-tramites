// ─── DocumentosScreen.tsx — HU-3 (Sprint 3) ─────────────────────────────────
// T-19: Almacenamiento en Supabase Storage (bucket tramites-documentos)
// T-20: Carga de archivos vinculados al trámite
// T-21: Validación de formato (PDF, JPG, PNG) y tamaño máximo (5 MB)
// T-22: Visualización y descarga segura de documentos
// T-23: Registro automático en auditoría

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
  Linking,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import { useSesion } from "../context/SesionContext";
import { consultarTramite } from "../services/consultaService";
import {
  cargarDocumento,
  listarDocumentos,
  validarArchivo,
  formatearTamano,
  iconoPorTipo,
  Documento,
  ArchivoSeleccionado,
  FORMATOS_PERMITIDOS,
  TAMANO_MAXIMO_BYTES,
} from "../services/documentoService";
import { Tramite } from "../services/tramiteService";

interface Props {
  onVolver: () => void;
}

export default function DocumentosScreen({ onVolver }: Props) {
  const { usuarioActivo } = useSesion();

  // Búsqueda de trámite
  const [numeroBusqueda, setNumeroBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [tramite, setTramite] = useState<Tramite | null>(null);

  // Lista de documentos
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);

  // Archivo seleccionado
  const [archivoSeleccionado, setArchivoSeleccionado] =
    useState<ArchivoSeleccionado | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // ── Cargar lista de documentos ────────────────────────────────────────────

  const cargarLista = useCallback(async (id: string) => {
    setCargandoLista(true);
    const resultado = await listarDocumentos(id);
    setCargandoLista(false);
    if (resultado.exito) setDocumentos(resultado.documentos ?? []);
  }, []);

  useEffect(() => {
    if (tramite) cargarLista(tramite.id);
  }, [tramite, cargarLista]);

  // ── Buscar trámite ────────────────────────────────────────────────────────

  const handleBuscar = async () => {
    setErrorBusqueda(null);
    setTramite(null);
    setDocumentos([]);
    if (!numeroBusqueda.trim()) {
      setErrorBusqueda("Ingrese el número de trámite.");
      return;
    }
    setBuscando(true);
    const resultado = await consultarTramite(numeroBusqueda);
    setBuscando(false);
    if (resultado.exito && resultado.tramite) {
      setTramite(resultado.tramite);
    } else {
      setErrorBusqueda(resultado.error ?? "Trámite no encontrado.");
    }
  };

  // ── T-20+T-21: Seleccionar archivo ───────────────────────────────────────

  const handleSeleccionarArchivo = async () => {
    setErrorArchivo(null);
    setMensajeExito(null);

    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });

      if (resultado.canceled || !resultado.assets?.length) return;

      const asset = resultado.assets[0];
      const archivo: ArchivoSeleccionado = {
        nombre: asset.name,
        tipo: asset.mimeType ?? "application/octet-stream",
        tamano: asset.size ?? 0,
        uri: asset.uri,
      };

      // T-21: Validar formato y tamaño
      const errorVal = validarArchivo(archivo);
      if (errorVal) {
        setErrorArchivo(errorVal.mensaje);
        setArchivoSeleccionado(null);
        return;
      }

      setArchivoSeleccionado(archivo);
    } catch {
      setErrorArchivo("No se pudo acceder al archivo. Intente nuevamente.");
    }
  };

  // ── T-20: Subir archivo ───────────────────────────────────────────────────

  const handleSubir = async () => {
    if (!tramite || !archivoSeleccionado || !usuarioActivo) return;
    setErrorSubida(null);
    setMensajeExito(null);
    setSubiendo(true);

    const resultado = await cargarDocumento(
      tramite.id,
      tramite.numero_tramite,
      archivoSeleccionado,
      usuarioActivo.id,
      usuarioActivo.usuario,
    );
    setSubiendo(false);

    if (resultado.exito && resultado.documento) {
      setArchivoSeleccionado(null);
      setMensajeExito(
        `"${resultado.documento.nombre_archivo}" cargado correctamente.`,
      );
      await cargarLista(tramite.id);
    } else {
      setErrorSubida(resultado.error ?? "Error al subir el archivo.");
    }
  };

  // ── T-22: Descargar documento ─────────────────────────────────────────────

  const handleDescargar = async (doc: Documento) => {
    if (!doc.url_descarga) {
      Alert.alert("Sin URL", "No se pudo generar el enlace de descarga.");
      return;
    }
    try {
      await Linking.openURL(doc.url_descarga);
    } catch {
      Alert.alert("Error", "No se pudo abrir el documento.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.contenedor}>
      <StatusBar style="light" />

      <View style={s.cabecera}>
        <TouchableOpacity onPress={onVolver} style={s.botonAtras}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.cabeceraTitulo}>Gestión de Documentos</Text>
          <Text style={s.cabeceraSubtitulo}>
            T-19 · T-20 · T-21 · T-22 · T-23 · HU-3 — Sprint 3
          </Text>
        </View>
        <Ionicons name="attach-outline" size={22} color="#93c5fd" />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Buscar trámite ── */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>
            <Ionicons name="search-outline" size={13} color="#0f2554" /> Trámite
          </Text>
          {!tramite ? (
            <>
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
                />
              </View>
              {errorBusqueda && (
                <View style={s.errorBanner}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={15}
                    color="#dc2626"
                  />
                  <Text style={s.errorTexto}>{errorBusqueda}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[s.botonPrincipal, buscando && s.botonDisabled]}
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
                    <Text style={s.botonTexto}>Buscar trámite</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={s.tramiteEncontrado}>
              <View style={{ flex: 1 }}>
                <Text style={s.tramiteNum}>{tramite.numero_tramite}</Text>
                <Text style={s.tramiteTipo}>{tramite.tipo}</Text>
                <Text style={s.tramiteSol}>{tramite.solicitante_nombre}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setTramite(null);
                  setNumeroBusqueda("");
                  setDocumentos([]);
                }}
              >
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {tramite && (
          <>
            {/* ── T-20 + T-21: Cargar nuevo documento ── */}
            <View style={s.card}>
              <Text style={s.sectionTitle}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={13}
                  color="#0f2554"
                />{" "}
                Cargar documento
              </Text>

              {/* Info de restricciones */}
              <View style={s.restriccionesRow}>
                <View style={s.restriccionChip}>
                  <Ionicons name="document-outline" size={12} color="#0369a1" />
                  <Text style={s.restriccionTexto}>PDF, JPG, PNG</Text>
                </View>
                <View style={s.restriccionChip}>
                  <Ionicons name="scale-outline" size={12} color="#0369a1" />
                  <Text style={s.restriccionTexto}>Máx. 5 MB</Text>
                </View>
              </View>

              {/* Zona de selección */}
              <TouchableOpacity
                style={s.zonaSeleccion}
                onPress={handleSeleccionarArchivo}
              >
                <Ionicons
                  name={
                    archivoSeleccionado
                      ? "document-attach"
                      : "cloud-upload-outline"
                  }
                  size={32}
                  color={archivoSeleccionado ? "#0f2554" : "#94a3b8"}
                />
                {archivoSeleccionado ? (
                  <View style={{ alignItems: "center" }}>
                    <Text style={s.archivoNombre}>
                      {archivoSeleccionado.nombre}
                    </Text>
                    <Text style={s.archivoTamano}>
                      {formatearTamano(archivoSeleccionado.tamano)}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={s.zonaTexto}>
                      Toque para seleccionar un archivo
                    </Text>
                    <Text style={s.zonaSubTexto}>
                      PDF, JPG o PNG — máximo 5 MB
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {errorArchivo && (
                <View style={s.errorBanner}>
                  <MaterialIcons
                    name="error-outline"
                    size={15}
                    color="#dc2626"
                  />
                  <Text style={s.errorTexto}>{errorArchivo}</Text>
                </View>
              )}

              {mensajeExito && (
                <View style={s.exitoBanner}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={15}
                    color="#166534"
                  />
                  <Text style={s.exitoTexto}>{mensajeExito}</Text>
                </View>
              )}

              {errorSubida && (
                <View style={s.errorBanner}>
                  <MaterialIcons
                    name="error-outline"
                    size={15}
                    color="#dc2626"
                  />
                  <Text style={s.errorTexto}>{errorSubida}</Text>
                </View>
              )}

              {archivoSeleccionado && (
                <TouchableOpacity
                  style={[
                    s.botonPrincipal,
                    { marginTop: 10 },
                    subiendo && s.botonDisabled,
                  ]}
                  onPress={handleSubir}
                  disabled={subiendo}
                >
                  {subiendo ? (
                    <View style={s.fila}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={s.botonTexto}>Cargando archivo...</Text>
                    </View>
                  ) : (
                    <View style={s.fila}>
                      <Ionicons
                        name="cloud-upload-outline"
                        size={18}
                        color="#fff"
                      />
                      <Text style={s.botonTexto}>Subir documento</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* ── T-22: Lista de documentos cargados ── */}
            <View style={s.card}>
              <View style={s.listaHeader}>
                <Text style={s.sectionTitle}>
                  <Ionicons
                    name="folder-open-outline"
                    size={13}
                    color="#0f2554"
                  />{" "}
                  Documentos del trámite
                </Text>
                <TouchableOpacity
                  onPress={() => cargarLista(tramite.id)}
                  style={s.botonRefrescar}
                >
                  <Ionicons name="refresh-outline" size={15} color="#0f2554" />
                </TouchableOpacity>
              </View>

              {cargandoLista ? (
                <View style={s.cargandoContenedor}>
                  <ActivityIndicator color="#0f2554" />
                  <Text style={s.cargandoTexto}>Cargando documentos...</Text>
                </View>
              ) : documentos.length === 0 ? (
                <View style={s.sinDocs}>
                  <Ionicons
                    name="folder-open-outline"
                    size={36}
                    color="#cbd5e1"
                  />
                  <Text style={s.sinDocsTexto}>
                    Sin documentos adjuntos aún.
                  </Text>
                  <Text style={s.sinDocsSub}>
                    Use el formulario anterior para cargar el primer documento.
                  </Text>
                </View>
              ) : (
                documentos.map((doc, i) => (
                  <View
                    key={doc.id}
                    style={[
                      s.docItem,
                      i < documentos.length - 1 && s.docItemBorde,
                    ]}
                  >
                    <View style={s.docIcono}>
                      <Ionicons
                        name={iconoPorTipo(doc.tipo_archivo) as any}
                        size={22}
                        color="#0f2554"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.docNombre} numberOfLines={1}>
                        {doc.nombre_archivo}
                      </Text>
                      <View style={s.fila}>
                        <Text style={s.docMeta}>
                          {doc.tipo_archivo.toUpperCase()}
                        </Text>
                        <Text style={s.docMeta}>·</Text>
                        <Text style={s.docMeta}>
                          {formatearTamano(doc.tamano_bytes)}
                        </Text>
                        <Text style={s.docMeta}>·</Text>
                        <Text style={s.docMeta}>{doc.subido_por}</Text>
                      </View>
                      <Text style={s.docFecha}>
                        {new Date(doc.fecha_subida).toLocaleString("es-BO", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={s.botonDescarga}
                      onPress={() => handleDescargar(doc)}
                    >
                      <Ionicons
                        name="download-outline"
                        size={20}
                        color="#0f2554"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </>
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
  inputError: { borderColor: "#ef4444", backgroundColor: "#fff5f5" },
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
  exitoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  exitoTexto: { flex: 1, color: "#166534", fontSize: 13 },

  fila: { flexDirection: "row", alignItems: "center", gap: 4 },
  botonPrincipal: {
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

  tramiteEncontrado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#86efac",
    padding: 12,
  },
  tramiteNum: { fontSize: 15, fontWeight: "800", color: "#0f2554" },
  tramiteTipo: { fontSize: 13, color: "#374151" },
  tramiteSol: { fontSize: 12, color: "#64748b" },

  restriccionesRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  restriccionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  restriccionTexto: { fontSize: 11, color: "#0369a1", fontWeight: "600" },

  zonaSeleccion: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f9fafb",
    marginBottom: 10,
  },
  zonaTexto: { fontSize: 14, color: "#374151", fontWeight: "600" },
  zonaSubTexto: { fontSize: 12, color: "#9ca3af" },
  archivoNombre: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f2554",
    textAlign: "center",
  },
  archivoTamano: { fontSize: 12, color: "#64748b" },

  listaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  botonRefrescar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  cargandoContenedor: { alignItems: "center", gap: 8, paddingVertical: 20 },
  cargandoTexto: { fontSize: 13, color: "#94a3b8" },
  sinDocs: { alignItems: "center", paddingVertical: 28, gap: 6 },
  sinDocsTexto: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },
  sinDocsSub: { fontSize: 12, color: "#cbd5e1", textAlign: "center" },

  docItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  docItemBorde: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  docIcono: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  docNombre: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  docMeta: { fontSize: 11, color: "#94a3b8" },
  docFecha: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  botonDescarga: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
