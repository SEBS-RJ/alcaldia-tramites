import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../lib/supabase";
import { Tramite } from "../services/tramiteService";

interface Props {
  onVolver: () => void;
}

interface Estadisticas {
  total: number;
  porEstado: Record<string, number>;
  porTipo: Record<string, number>;
  tiempoPromedio: number | null; // días promedio desde registro hasta hoy
  vencidos: number;
  pendientesMas7: number;
}

const ESTADO_COLOR: Record<string, string> = {
  Pendiente: "#d97706",
  "En revisión": "#2563eb",
  Observado: "#ea580c",
  Aprobado: "#16a34a",
  Rechazado: "#dc2626",
};

const TIPO_COLOR = ["#0f2554", "#0369a1", "#0891b2", "#059669", "#7c3aed"];

function diasEntre(fechaIso: string): number {
  const diff = Date.now() - new Date(fechaIso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function ReportesAreaScreen({ onVolver }: Props) {
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("tramites")
      .select("estado, tipo, fecha_registro, fecha_vencimiento");

    if (err || !data) {
      setCargando(false);
      setError("No se pudieron cargar los datos.");
      return;
    }

    const tramites = data as Pick<
      Tramite,
      "estado" | "tipo" | "fecha_registro" | "fecha_vencimiento"
    >[];
    const porEstado: Record<string, number> = {};
    const porTipo: Record<string, number> = {};
    let sumaDias = 0;
    let vencidos = 0;
    let pendientesMas7 = 0;
    const hoy = Date.now();

    tramites.forEach((t) => {
      porEstado[t.estado] = (porEstado[t.estado] ?? 0) + 1;
      porTipo[t.tipo] = (porTipo[t.tipo] ?? 0) + 1;
      sumaDias += diasEntre(t.fecha_registro);
      if (
        t.fecha_vencimiento &&
        new Date(t.fecha_vencimiento).getTime() < hoy &&
        t.estado !== "Aprobado" &&
        t.estado !== "Rechazado"
      )
        vencidos++;
      if (t.estado === "Pendiente" && diasEntre(t.fecha_registro) > 7)
        pendientesMas7++;
    });

    setStats({
      total: tramites.length,
      porEstado,
      porTipo,
      tiempoPromedio: tramites.length
        ? Math.round(sumaDias / tramites.length)
        : null,
      vencidos,
      pendientesMas7,
    });
    setCargando(false);
  };

  const maxEstado = stats ? Math.max(...Object.values(stats.porEstado), 1) : 1;
  const maxTipo = stats ? Math.max(...Object.values(stats.porTipo), 1) : 1;

  return (
    <View style={s.contenedor}>
      <StatusBar style="light" />
      <View style={s.cabecera}>
        <TouchableOpacity onPress={onVolver} style={s.botonAtras}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.cabeceraTitulo}>Reportes del Área</Text>
          <Text style={s.cabeceraSubtitulo}>
            Estadísticas generales de trámites
          </Text>
        </View>
        <TouchableOpacity onPress={cargar} style={s.botonRefrescar}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={s.centrando}>
          <ActivityIndicator color="#0369a1" size="large" />
          <Text style={s.cargandoTexto}>Calculando estadísticas...</Text>
        </View>
      ) : error ? (
        <View style={s.centrando}>
          <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
          <Text style={{ color: "#dc2626", fontSize: 14 }}>{error}</Text>
        </View>
      ) : stats ? (
        <ScrollView contentContainerStyle={s.scroll}>
          {/* KPIs */}
          <View style={s.kpiRow}>
            <KpiCard
              icono="document-text-outline"
              label="Total"
              valor={String(stats.total)}
              color="#0f2554"
            />
            <KpiCard
              icono="time-outline"
              label="Días promedio"
              valor={
                stats.tiempoPromedio != null ? `${stats.tiempoPromedio}d` : "—"
              }
              color="#0369a1"
            />
            <KpiCard
              icono="alert-circle-outline"
              label="Vencidos"
              valor={String(stats.vencidos)}
              color="#dc2626"
            />
            <KpiCard
              icono="hourglass-outline"
              label="+7 días pend."
              valor={String(stats.pendientesMas7)}
              color="#d97706"
            />
          </View>

          {/* Por estado */}
          <View style={s.card}>
            <Text style={s.cardTitulo}>Distribución por estado</Text>
            {Object.entries(stats.porEstado)
              .sort((a, b) => b[1] - a[1])
              .map(([estado, count]) => (
                <View key={estado} style={s.barraFila}>
                  <Text style={s.barraLabel}>{estado}</Text>
                  <View style={s.barraTrack}>
                    <View
                      style={[
                        s.barraFill,
                        {
                          width: `${(count / maxEstado) * 100}%` as any,
                          backgroundColor: ESTADO_COLOR[estado] ?? "#6b7280",
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      s.barraValor,
                      { color: ESTADO_COLOR[estado] ?? "#6b7280" },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              ))}
          </View>

          {/* Por tipo */}
          <View style={s.card}>
            <Text style={s.cardTitulo}>Distribución por tipo</Text>
            {Object.entries(stats.porTipo)
              .sort((a, b) => b[1] - a[1])
              .map(([tipo, count], i) => (
                <View key={tipo} style={s.barraFila}>
                  <Text
                    style={[s.barraLabel, { width: 160 }]}
                    numberOfLines={1}
                  >
                    {tipo}
                  </Text>
                  <View style={s.barraTrack}>
                    <View
                      style={[
                        s.barraFill,
                        {
                          width: `${(count / maxTipo) * 100}%` as any,
                          backgroundColor: TIPO_COLOR[i % TIPO_COLOR.length],
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      s.barraValor,
                      { color: TIPO_COLOR[i % TIPO_COLOR.length] },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              ))}
          </View>

          {/* Alertas */}
          {(stats.vencidos > 0 || stats.pendientesMas7 > 0) && (
            <View style={s.card}>
              <Text style={s.cardTitulo}>Alertas</Text>
              {stats.vencidos > 0 && (
                <View style={s.alertaFila}>
                  <View style={[s.alertaDot, { backgroundColor: "#dc2626" }]} />
                  <Text style={s.alertaTexto}>
                    <Text style={{ fontWeight: "700", color: "#dc2626" }}>
                      {stats.vencidos} trámite{stats.vencidos !== 1 ? "s" : ""}
                    </Text>{" "}
                    superaron la fecha de vencimiento sin resolución.
                  </Text>
                </View>
              )}
              {stats.pendientesMas7 > 0 && (
                <View style={s.alertaFila}>
                  <View style={[s.alertaDot, { backgroundColor: "#d97706" }]} />
                  <Text style={s.alertaTexto}>
                    <Text style={{ fontWeight: "700", color: "#d97706" }}>
                      {stats.pendientesMas7} trámite
                      {stats.pendientesMas7 !== 1 ? "s" : ""}
                    </Text>{" "}
                    llevan más de 7 días en estado Pendiente.
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : null}
    </View>
  );
}

function KpiCard({
  icono,
  label,
  valor,
  color,
}: {
  icono: string;
  label: string;
  valor: string;
  color: string;
}) {
  return (
    <View
      style={[
        s.kpiCard,
        { borderColor: color + "30", backgroundColor: color + "0c" },
      ]}
    >
      <Ionicons name={icono as any} size={18} color={color} />
      <Text style={[s.kpiValor, { color }]}>{valor}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
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
  botonRefrescar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff18",
    alignItems: "center",
    justifyContent: "center",
  },
  cabeceraTitulo: { fontSize: 18, fontWeight: "700", color: "#fff" },
  cabeceraSubtitulo: { fontSize: 11, color: "#bae6fd" },
  centrando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  cargandoTexto: { color: "#94a3b8", fontSize: 14 },
  scroll: { padding: 16, maxWidth: 640, width: "100%", alignSelf: "center" },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  kpiCard: {
    flex: 1,
    minWidth: 80,
    alignItems: "center",
    gap: 4,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  kpiValor: { fontSize: 22, fontWeight: "800" },
  kpiLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "600",
    textAlign: "center",
  },
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
    color: "#0369a1",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 14,
  },
  barraFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  barraLabel: { fontSize: 12, color: "#374151", width: 110 },
  barraTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#f1f5f9",
    overflow: "hidden",
  },
  barraFill: { height: 10, borderRadius: 5 },
  barraValor: {
    fontSize: 13,
    fontWeight: "800",
    width: 28,
    textAlign: "right",
  },
  alertaFila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  alertaDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  alertaTexto: { flex: 1, fontSize: 13, color: "#374151", lineHeight: 19 },
});
