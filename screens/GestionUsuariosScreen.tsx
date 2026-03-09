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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useSesion } from "../context/SesionContext";
import {
  listarUsuarios,
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
  validarContrasenaRobusta,
  ROLES_BASE,
  Usuario,
} from "../services/usuarioService";
import {
  MODULOS_DISPONIBLES,
  MODULOS_POR_PERFIL,
  PerfilBase,
  guardarPermisosDeRol,
  obtenerModulosDeRol,
} from "../services/permisosService";

interface Props {
  onVolver: () => void;
}
type Vista = "lista" | "crear" | "editar";

const COLOR_ROL: Record<string, string> = {
  Administrador: "#7c3aed",
  "Funcionario Municipal": "#0f2554",
  "Jefe de Área": "#0369a1",
  "Director de Área": "#0891b2",
  "Secretario Municipal": "#059669",
  "Técnico Municipal": "#d97706",
  "Supervisor de Trámites": "#dc2626",
  "Auditor Interno": "#475569",
};
function colorRol(rol: string) {
  return COLOR_ROL[rol] ?? "#6b7280";
}

// ─── Selector de permisos ─────────────────────────────────────────────────────
function SelectorPermisos({
  modulosSeleccionados,
  onChange,
  rolNombre,
}: {
  modulosSeleccionados: string[];
  onChange: (ids: string[]) => void;
  rolNombre: string;
}) {
  if (rolNombre === "Administrador") {
    return (
      <View style={s.permisosBanner}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#7c3aed" />
        <Text style={s.permisosBannerTexto}>
          El Administrador tiene acceso completo. Sus permisos no se pueden
          modificar.
        </Text>
      </View>
    );
  }
  const aplicarPerfil = (perfil: PerfilBase) =>
    onChange([...MODULOS_POR_PERFIL[perfil]]);
  const toggle = (id: string) => {
    if (modulosSeleccionados.includes(id))
      onChange(modulosSeleccionados.filter((m) => m !== id));
    else onChange([...modulosSeleccionados, id]);
  };
  return (
    <View>
      <Text style={s.etiqueta}>1. Elige un perfil base</Text>
      <View style={s.perfilesRow}>
        {(
          [
            "Sin acceso",
            "Funcionario Municipal",
            "Jefe de Área",
          ] as PerfilBase[]
        ).map((p) => (
          <TouchableOpacity
            key={p}
            style={s.perfilChip}
            onPress={() => aplicarPerfil(p)}
          >
            <Ionicons name="copy-outline" size={13} color="#0369a1" />
            <Text style={s.perfilChipTexto}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[s.etiqueta, { marginTop: 14 }]}>2. Ajusta los módulos</Text>
      {MODULOS_DISPONIBLES.map((m) => {
        const activo = modulosSeleccionados.includes(m.id);
        return (
          <TouchableOpacity
            key={m.id}
            style={[s.moduloCheckCard, activo && s.moduloCheckCardActivo]}
            onPress={() => toggle(m.id)}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, activo && s.checkboxActivo]}>
              {activo && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            <Ionicons
              name={m.icono as any}
              size={18}
              color={activo ? "#0f2554" : "#9ca3af"}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[s.moduloCheckNombre, activo && { color: "#0f2554" }]}
              >
                {m.etiqueta}
              </Text>
              <Text style={s.moduloCheckDesc} numberOfLines={1}>
                {m.descripcion}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
      <Text style={s.contadorModulos}>
        {modulosSeleccionados.length} / {MODULOS_DISPONIBLES.length} módulos
      </Text>
    </View>
  );
}

// ─── Pantalla lista ───────────────────────────────────────────────────────────
export default function GestionUsuariosScreen({ onVolver }: Props) {
  const { usuarioActivo, tienePermiso } = useSesion();
  const [vista, setVista] = useState<Vista>("lista");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

  if (!tienePermiso(["Administrador"])) {
    return (
      <View style={s.sinAcceso}>
        <Ionicons name="lock-closed-outline" size={48} color="#dc2626" />
        <Text style={s.sinAccesoTexto}>
          Acceso restringido — Solo Administrador
        </Text>
        <TouchableOpacity style={s.botonAccion} onPress={onVolver}>
          <Text style={s.botonAccionTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorLista(null);
    const { usuarios: lista, error } = await listarUsuarios();
    setCargando(false);
    if (error) setErrorLista(error);
    else setUsuarios(lista);
  }, []);

  useEffect(() => {
    cargar();
  }, []);

  const toggleActivo = async (u: Usuario) => {
    if (!usuarioActivo) return;
    const res = await editarUsuario(
      u.id,
      u.usuario,
      { activo: !u.activo },
      { id: usuarioActivo.id, usuario: usuarioActivo.usuario },
    );
    if (res.exito)
      setUsuarios((p) =>
        p.map((x) => (x.id === u.id ? { ...x, activo: !u.activo } : x)),
      );
  };

  const handleEliminar = (u: Usuario) => {
    const ok = () => confirmarEliminar(u);
    if (Platform.OS === "web") {
      if (window.confirm(`¿Eliminar a "${u.usuario}"?`)) ok();
    } else
      Alert.alert("Eliminar", `¿Eliminar a "${u.usuario}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: ok },
      ]);
  };
  const confirmarEliminar = async (u: Usuario) => {
    if (!usuarioActivo) return;
    const res = await eliminarUsuario(u.id, u.usuario, {
      id: usuarioActivo.id,
      usuario: usuarioActivo.usuario,
    });
    if (res.exito) setUsuarios((p) => p.filter((x) => x.id !== u.id));
    else alert(res.error ?? "Error al eliminar.");
  };

  if (vista === "crear")
    return (
      <FormCrear
        administrador={{
          id: usuarioActivo!.id,
          usuario: usuarioActivo!.usuario,
        }}
        onGuardado={() => {
          cargar();
          setVista("lista");
        }}
        onCancelar={() => setVista("lista")}
      />
    );
  if (vista === "editar" && usuarioEditando)
    return (
      <FormEditar
        usuario={usuarioEditando}
        administrador={{
          id: usuarioActivo!.id,
          usuario: usuarioActivo!.usuario,
        }}
        onGuardado={() => {
          cargar();
          setVista("lista");
          setUsuarioEditando(null);
        }}
        onCancelar={() => {
          setVista("lista");
          setUsuarioEditando(null);
        }}
      />
    );

  return (
    <View style={s.contenedor}>
      <StatusBar style="light" />
      <View style={s.cabecera}>
        <TouchableOpacity onPress={onVolver} style={s.botonAtras}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.cabeceraTitulo}>Gestión de Usuarios</Text>
          <Text style={s.cabeceraSubtitulo}>Roles y permisos dinámicos</Text>
        </View>
        <TouchableOpacity
          style={s.botonNuevo}
          onPress={() => setVista("crear")}
        >
          <Ionicons name="person-add-outline" size={18} color="#fff" />
          <Text style={s.botonNuevoTexto}>Nuevo</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.resumenRow}>
          {[
            {
              icono: "people-outline",
              label: "Total",
              valor: usuarios.length,
              color: "#0f2554",
            },
            {
              icono: "checkmark-circle-outline",
              label: "Activos",
              valor: usuarios.filter((u) => u.activo).length,
              color: "#16a34a",
            },
            {
              icono: "close-circle-outline",
              label: "Inactivos",
              valor: usuarios.filter((u) => !u.activo).length,
              color: "#dc2626",
            },
          ].map(({ icono, label, valor, color }) => (
            <View
              key={label}
              style={[
                s.resumenChip,
                { borderColor: color + "30", backgroundColor: color + "0d" },
              ]}
            >
              <Ionicons name={icono as any} size={16} color={color} />
              <Text style={[s.resumenValor, { color }]}>{valor}</Text>
              <Text style={s.resumenLabel}>{label}</Text>
            </View>
          ))}
        </View>
        {errorLista && (
          <View style={s.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
            <Text style={s.errorTexto}>{errorLista}</Text>
          </View>
        )}
        {cargando ? (
          <View style={s.centrando}>
            <ActivityIndicator color="#0f2554" size="large" />
          </View>
        ) : usuarios.length === 0 ? (
          <View style={s.centrando}>
            <Ionicons name="people-outline" size={48} color="#d1d5db" />
            <Text style={s.vacioTexto}>Sin usuarios registrados.</Text>
          </View>
        ) : (
          usuarios.map((u) => (
            <View
              key={u.id}
              style={[s.usuarioCard, !u.activo && s.usuarioCardInactivo]}
            >
              <View
                style={[s.avatar, { backgroundColor: colorRol(u.rol) + "18" }]}
              >
                <Text style={[s.avatarLetra, { color: colorRol(u.rol) }]}>
                  {u.usuario.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={s.fila}>
                  <Text style={s.usuarioNombre}>{u.usuario}</Text>
                  {!u.activo && (
                    <View style={s.badgeInactivo}>
                      <Text style={s.badgeInactivoTexto}>INACTIVO</Text>
                    </View>
                  )}
                </View>
                <View
                  style={[
                    s.rolBadge,
                    { backgroundColor: colorRol(u.rol) + "15" },
                  ]}
                >
                  <Text style={[s.rolTexto, { color: colorRol(u.rol) }]}>
                    {u.rol}
                  </Text>
                </View>
                <Text style={s.fechaTexto}>
                  Creado: {new Date(u.creado_en).toLocaleDateString("es-BO")}
                </Text>
              </View>
              <View style={s.accionesCol}>
                <TouchableOpacity
                  style={s.botonIcono}
                  onPress={() => {
                    setUsuarioEditando(u);
                    setVista("editar");
                  }}
                >
                  <Ionicons name="create-outline" size={18} color="#0369a1" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.botonIcono}
                  onPress={() => toggleActivo(u)}
                >
                  <Ionicons
                    name={u.activo ? "toggle" : "toggle-outline"}
                    size={20}
                    color={u.activo ? "#16a34a" : "#9ca3af"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.botonIcono}
                  onPress={() => handleEliminar(u)}
                  disabled={u.id === usuarioActivo?.id}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={u.id === usuarioActivo?.id ? "#e5e7eb" : "#dc2626"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── FormCrear ────────────────────────────────────────────────────────────────
function FormCrear({
  administrador,
  onGuardado,
  onCancelar,
}: {
  administrador: { id: string; usuario: string };
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [rolSel, setRolSel] = useState("");
  const [rolCustom, setRolCustom] = useState("");
  const [useCustomRol, setUseCustomRol] = useState(false);
  const [modulosIds, setModulosIds] = useState<string[]>([
    ...MODULOS_POR_PERFIL["Funcionario Municipal"],
  ]);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGen, setErrorGen] = useState<string | null>(null);

  const validacion = contrasena ? validarContrasenaRobusta(contrasena) : null;
  const rolFinal = useCustomRol ? rolCustom.trim() : rolSel;

  const validar = () => {
    const e: Record<string, string> = {};
    if (!nombreUsuario.trim() || nombreUsuario.trim().length < 3)
      e.usuario = "Mínimo 3 caracteres.";
    if (!contrasena || !validarContrasenaRobusta(contrasena).valida)
      e.contrasena = "Contraseña no cumple requisitos.";
    if (!rolFinal) e.rol = "Seleccione o ingrese un rol.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleGuardar = async () => {
    setErrorGen(null);
    if (!validar()) return;
    setGuardando(true);
    const res = await crearUsuario(
      { usuario: nombreUsuario, contrasena, rol: rolFinal },
      administrador,
    );
    if (!res.exito) {
      setGuardando(false);
      setErrorGen(res.error ?? "Error al crear.");
      return;
    }
    if (rolFinal !== "Administrador")
      await guardarPermisosDeRol(rolFinal, modulosIds);
    setGuardando(false);
    onGuardado();
  };

  const pct = validacion
    ? validacion.fortaleza === "fuerte"
      ? 100
      : validacion.fortaleza === "media"
        ? 60
        : 30
    : 0;
  const clr = validacion
    ? validacion.fortaleza === "fuerte"
      ? "#16a34a"
      : validacion.fortaleza === "media"
        ? "#d97706"
        : "#dc2626"
    : "#e5e7eb";

  return (
    <View style={s.contenedor}>
      <StatusBar style="light" />
      <View style={s.cabecera}>
        <TouchableOpacity onPress={onCancelar} style={s.botonAtras}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.cabeceraTitulo}>Nuevo Usuario</Text>
          <Text style={s.cabeceraSubtitulo}>Rol + módulos personalizables</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.card}>
          <Text style={s.cardTitulo}>Datos de acceso</Text>
          <View style={s.campoGrupo}>
            <Text style={s.etiqueta}>Nombre de usuario *</Text>
            <View style={[s.inputRow, errores.usuario ? s.inputError : null]}>
              <Ionicons name="person-outline" size={17} color="#6b7280" />
              <TextInput
                style={s.input}
                placeholder="Ej: juan.perez"
                placeholderTextColor="#9ca3af"
                value={nombreUsuario}
                onChangeText={(v) => {
                  setNombreUsuario(v);
                  setErrores((e) => ({ ...e, usuario: "" }));
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errores.usuario && (
              <Text style={s.errorTextoInline}>⚠ {errores.usuario}</Text>
            )}
          </View>
          <View style={s.campoGrupo}>
            <Text style={s.etiqueta}>Contraseña *</Text>
            <View
              style={[s.inputRow, errores.contrasena ? s.inputError : null]}
            >
              <Ionicons name="lock-closed-outline" size={17} color="#6b7280" />
              <TextInput
                style={s.input}
                placeholder="Mín. 8 chars, mayúscula, especial"
                placeholderTextColor="#9ca3af"
                value={contrasena}
                onChangeText={(v) => {
                  setContrasena(v);
                  setErrores((e) => ({ ...e, contrasena: "" }));
                }}
                secureTextEntry={!mostrarPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setMostrarPass((v) => !v)}>
                <Ionicons
                  name={mostrarPass ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
            {contrasena.length > 0 && (
              <View style={{ marginTop: 6, gap: 3 }}>
                <View style={s.barraFortalezaBg}>
                  <View
                    style={[
                      s.barraFortalezaFill,
                      { width: `${pct}%` as any, backgroundColor: clr },
                    ]}
                  />
                </View>
                <Text style={[s.textoFortaleza, { color: clr }]}>
                  Contraseña {validacion?.fortaleza}
                </Text>
              </View>
            )}
            {validacion && !validacion.valida && (
              <View style={s.requisitosBox}>
                {validacion.errores.map((e, i) => (
                  <View key={i} style={s.fila}>
                    <Ionicons
                      name="close-circle-outline"
                      size={13}
                      color="#dc2626"
                    />
                    <Text style={s.requisitosTexto}>{e}</Text>
                  </View>
                ))}
              </View>
            )}
            {errores.contrasena && (
              <Text style={s.errorTextoInline}>⚠ {errores.contrasena}</Text>
            )}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitulo}>Rol del usuario</Text>
          {ROLES_BASE.map((rol) => (
            <TouchableOpacity
              key={rol}
              style={[
                s.rolCard,
                rolSel === rol && !useCustomRol && s.rolCardActivo,
              ]}
              onPress={() => {
                setRolSel(rol);
                setUseCustomRol(false);
                setErrores((e) => ({ ...e, rol: "" }));
              }}
            >
              <View style={[s.rolDot, { backgroundColor: colorRol(rol) }]} />
              <Text
                style={[
                  s.rolTextoOpc,
                  rolSel === rol && !useCustomRol && s.rolTextoActivo,
                ]}
              >
                {rol}
              </Text>
              {rolSel === rol && !useCustomRol && (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colorRol(rol)}
                />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              s.rolCard,
              useCustomRol && s.rolCardActivo,
              { borderStyle: "dashed" },
            ]}
            onPress={() => {
              setUseCustomRol(true);
              setRolSel("");
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#7c3aed" />
            <Text style={[s.rolTextoOpc, { color: "#7c3aed" }]}>
              Rol personalizado...
            </Text>
          </TouchableOpacity>
          {useCustomRol && (
            <View style={[s.inputRow, { marginTop: 8 }]}>
              <Ionicons name="ribbon-outline" size={17} color="#7c3aed" />
              <TextInput
                style={s.input}
                placeholder="Ej: Coordinador de Obras"
                placeholderTextColor="#9ca3af"
                value={rolCustom}
                onChangeText={(v) => {
                  setRolCustom(v);
                  setErrores((e) => ({ ...e, rol: "" }));
                }}
                autoCapitalize="words"
              />
            </View>
          )}
          {errores.rol && (
            <Text style={[s.errorTextoInline, { marginTop: 6 }]}>
              ⚠ {errores.rol}
            </Text>
          )}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitulo}>Módulos accesibles</Text>
          <SelectorPermisos
            modulosSeleccionados={modulosIds}
            onChange={setModulosIds}
            rolNombre={rolFinal}
          />
        </View>

        {errorGen && (
          <View style={s.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
            <Text style={s.errorTexto}>{errorGen}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.botonAccion, guardando && s.botonDisabled]}
          onPress={handleGuardar}
          disabled={guardando}
        >
          {guardando ? (
            <View style={s.fila}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={s.botonAccionTexto}>Creando...</Text>
            </View>
          ) : (
            <View style={s.fila}>
              <Ionicons name="person-add-outline" size={18} color="#fff" />
              <Text style={s.botonAccionTexto}>Crear usuario</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── FormEditar ───────────────────────────────────────────────────────────────
function FormEditar({
  usuario,
  administrador,
  onGuardado,
  onCancelar,
}: {
  usuario: Usuario;
  administrador: { id: string; usuario: string };
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  const [rolSel, setRolSel] = useState(usuario.rol);
  const [rolCustom, setRolCustom] = useState("");
  const [useCustomRol, setUseCustomRol] = useState(
    !ROLES_BASE.includes(usuario.rol as any),
  );
  const [modulosIds, setModulosIds] = useState<string[]>([]);
  const [cargandoPerms, setCargandoPerms] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [errorGen, setErrorGen] = useState<string | null>(null);

  const rolFinal = useCustomRol ? rolCustom.trim() : rolSel;

  useEffect(() => {
    if (!ROLES_BASE.includes(usuario.rol as any)) setRolCustom(usuario.rol);
    obtenerModulosDeRol(usuario.rol).then(({ modulosIds: ids }) => {
      setModulosIds(ids);
      setCargandoPerms(false);
    });
  }, []);

  const handleGuardar = async () => {
    if (!rolFinal) {
      setError("Seleccione o ingrese un rol.");
      return;
    }
    setError("");
    setGuardando(true);
    const res = await editarUsuario(
      usuario.id,
      usuario.usuario,
      { rol: rolFinal },
      administrador,
    );
    if (!res.exito) {
      setGuardando(false);
      setErrorGen(res.error ?? "Error.");
      return;
    }
    if (rolFinal !== "Administrador")
      await guardarPermisosDeRol(rolFinal, modulosIds);
    setGuardando(false);
    onGuardado();
  };

  return (
    <View style={s.contenedor}>
      <StatusBar style="light" />
      <View style={s.cabecera}>
        <TouchableOpacity onPress={onCancelar} style={s.botonAtras}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.cabeceraTitulo}>Editar usuario</Text>
          <Text style={s.cabeceraSubtitulo}>{usuario.usuario}</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.card}>
          <Text style={s.cardTitulo}>Rol</Text>
          <Text style={s.rolActualTexto}>
            Rol actual:{" "}
            <Text style={{ color: colorRol(usuario.rol), fontWeight: "700" }}>
              {usuario.rol}
            </Text>
          </Text>
          {ROLES_BASE.map((rol) => (
            <TouchableOpacity
              key={rol}
              style={[
                s.rolCard,
                rolSel === rol && !useCustomRol && s.rolCardActivo,
              ]}
              onPress={() => {
                setRolSel(rol);
                setUseCustomRol(false);
                setError("");
              }}
            >
              <View style={[s.rolDot, { backgroundColor: colorRol(rol) }]} />
              <Text
                style={[
                  s.rolTextoOpc,
                  rolSel === rol && !useCustomRol && s.rolTextoActivo,
                ]}
              >
                {rol}
              </Text>
              {rolSel === rol && !useCustomRol && (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colorRol(rol)}
                />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              s.rolCard,
              useCustomRol && s.rolCardActivo,
              { borderStyle: "dashed" },
            ]}
            onPress={() => {
              setUseCustomRol(true);
              setRolSel("");
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#7c3aed" />
            <Text style={[s.rolTextoOpc, { color: "#7c3aed" }]}>
              Rol personalizado...
            </Text>
          </TouchableOpacity>
          {useCustomRol && (
            <View style={[s.inputRow, { marginTop: 8 }]}>
              <Ionicons name="ribbon-outline" size={17} color="#7c3aed" />
              <TextInput
                style={s.input}
                placeholder="Ej: Coordinador de Obras"
                placeholderTextColor="#9ca3af"
                value={rolCustom}
                onChangeText={(v) => {
                  setRolCustom(v);
                  setError("");
                }}
                autoCapitalize="words"
              />
            </View>
          )}
          {error && (
            <Text style={[s.errorTextoInline, { marginTop: 6 }]}>
              ⚠ {error}
            </Text>
          )}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitulo}>Módulos accesibles</Text>
          {cargandoPerms ? (
            <View style={s.centrando}>
              <ActivityIndicator color="#0f2554" />
              <Text style={s.cargandoTexto}>Cargando permisos...</Text>
            </View>
          ) : (
            <SelectorPermisos
              modulosSeleccionados={modulosIds}
              onChange={setModulosIds}
              rolNombre={rolFinal}
            />
          )}
        </View>

        {errorGen && (
          <View style={s.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
            <Text style={s.errorTexto}>{errorGen}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.botonAccion, guardando && s.botonDisabled]}
          onPress={handleGuardar}
          disabled={guardando}
        >
          {guardando ? (
            <View style={s.fila}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={s.botonAccionTexto}>Guardando...</Text>
            </View>
          ) : (
            <View style={s.fila}>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={s.botonAccionTexto}>Guardar cambios</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const isWeb = Platform.OS === "web";
const s = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#f1f5f9" },
  sinAcceso: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 40,
    backgroundColor: "#f1f5f9",
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
  botonNuevo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1d4ed8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  botonNuevoTexto: { color: "#fff", fontWeight: "700", fontSize: 13 },
  scroll: { padding: 16, maxWidth: 600, width: "100%", alignSelf: "center" },
  resumenRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  resumenChip: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  resumenValor: { fontSize: 20, fontWeight: "800" },
  resumenLabel: { fontSize: 11, color: "#64748b", fontWeight: "500" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorTexto: { flex: 1, color: "#dc2626", fontSize: 13 },
  centrando: { alignItems: "center", paddingVertical: 32, gap: 10 },
  cargandoTexto: { color: "#94a3b8", fontSize: 14 },
  vacioTexto: { color: "#9ca3af", fontSize: 15, fontWeight: "600" },
  usuarioCard: {
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
  usuarioCardInactivo: { opacity: 0.6 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetra: { fontSize: 18, fontWeight: "800" },
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },
  usuarioNombre: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  badgeInactivo: {
    backgroundColor: "#fee2e2",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeInactivoTexto: { fontSize: 9, fontWeight: "800", color: "#dc2626" },
  rolBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rolTexto: { fontSize: 11, fontWeight: "700" },
  fechaTexto: { fontSize: 11, color: "#94a3b8" },
  accionesCol: { gap: 4 },
  botonIcono: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 14,
    fontWeight: "700",
    color: "#0f2554",
    marginBottom: 14,
  },
  campoGrupo: { marginBottom: 16 },
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
    height: 48,
  },
  inputError: { borderColor: "#ef4444" },
  input: { flex: 1, fontSize: 14, color: "#111827" },
  errorTextoInline: { color: "#ef4444", fontSize: 12, marginTop: 4 },
  barraFortalezaBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  barraFortalezaFill: { height: 5, borderRadius: 3 },
  textoFortaleza: { fontSize: 11, fontWeight: "700" },
  requisitosBox: {
    marginTop: 6,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  requisitosTexto: { fontSize: 12, color: "#dc2626" },
  rolCard: {
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
  rolCardActivo: { borderColor: "#0f2554", backgroundColor: "#eff6ff" },
  rolDot: { width: 10, height: 10, borderRadius: 5 },
  rolTextoOpc: { flex: 1, fontSize: 13, color: "#374151" },
  rolTextoActivo: { fontWeight: "700", color: "#0f2554" },
  rolActualTexto: { fontSize: 13, color: "#64748b", marginBottom: 12 },
  permisosBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#f5f3ff",
    borderRadius: 10,
    padding: 12,
  },
  permisosBannerTexto: {
    flex: 1,
    fontSize: 12,
    color: "#7c3aed",
    lineHeight: 18,
  },
  perfilesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  perfilChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  perfilChipTexto: { fontSize: 11, fontWeight: "700", color: "#0369a1" },
  moduloCheckCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 11,
    marginBottom: 6,
    backgroundColor: "#f9fafb",
  },
  moduloCheckCardActivo: { borderColor: "#0f2554", backgroundColor: "#eff6ff" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxActivo: { backgroundColor: "#0f2554", borderColor: "#0f2554" },
  moduloCheckNombre: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  moduloCheckDesc: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  contadorModulos: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    textAlign: "right",
    marginTop: 8,
  },
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
});
