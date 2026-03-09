import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  titulo: string;
  opciones: string[];
  valorSeleccionado: string;
  onSeleccionar: (valor: string) => void;
  placeholder?: string;
  maxVisible?: number;
  icono?: string;
}

export default function SelectorConBusqueda({
  titulo,
  opciones,
  valorSeleccionado,
  onSeleccionar,
  placeholder = "Buscar...",
  maxVisible = 6,
  icono = "list-outline",
}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState(false);

  const opcionesFiltradas = useMemo(() => {
    if (!busqueda.trim()) return opciones;
    return opciones.filter((op) =>
      op.toLowerCase().includes(busqueda.toLowerCase()),
    );
  }, [opciones, busqueda]);

  const handleSeleccionar = (valor: string) => {
    onSeleccionar(valor);
    setExpandido(false);
    setBusqueda("");
  };

  const toggleExpandido = () => {
    setExpandido(!expandido);
    if (!expandido) setBusqueda("");
  };

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>
        <Ionicons name={icono as any} size={14} color="#0f2554" /> {titulo}
      </Text>

      <TouchableOpacity style={styles.selector} onPress={toggleExpandido}>
        <Text
          style={[
            styles.textoSeleccionado,
            !valorSeleccionado && styles.placeholder,
          ]}
        >
          {valorSeleccionado || "Seleccionar..."}
        </Text>
        <Ionicons
          name={expandido ? "chevron-up" : "chevron-down"}
          size={16}
          color="#6b7280"
        />
      </TouchableOpacity>

      {expandido && (
        <View style={styles.dropdown}>
          <View style={styles.busquedaContenedor}>
            <Ionicons name="search-outline" size={16} color="#9ca3af" />
            <TextInput
              style={styles.inputBusqueda}
              placeholder={placeholder}
              value={busqueda}
              onChangeText={setBusqueda}
              autoFocus
            />
          </View>

          {opcionesFiltradas.length > 0 ? (
            <FlatList
              data={opcionesFiltradas}
              keyExtractor={(item) => item}
              style={[
                styles.lista,
                opcionesFiltradas.length > maxVisible && { height: 200 },
              ]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.opcion}
                  onPress={() => handleSeleccionar(item)}
                >
                  <Text style={styles.textoOpcion}>{item}</Text>
                  {valorSeleccionado === item && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#0f2554"
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles.sinResultados}>
              Sin resultados para '{busqueda}'
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: 14,
  },
  titulo: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
    height: 48,
  },
  textoSeleccionado: {
    fontSize: 14,
    color: "#1e293b",
    flex: 1,
  },
  placeholder: {
    color: "#9ca3af",
  },
  dropdown: {
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  busquedaContenedor: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  inputBusqueda: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#1e293b",
  },
  lista: {
    maxHeight: 200,
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  textoOpcion: {
    fontSize: 14,
    color: "#374151",
  },
  sinResultados: {
    padding: 12,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
