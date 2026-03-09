// ─── SesionContext.tsx — T-03 (HU-1) + Sistema de Permisos Dinámicos ─────────
// Al iniciar sesión, carga los módulos del rol desde Supabase.
// PantallaRol lee modulosActivos en lugar de una lista hardcodeada.

import React, { createContext, useContext, useState, ReactNode } from "react";
import { UsuarioSesion, Rol } from "../services/authService";
import {
  obtenerModulosDeRol,
  ModuloSistema,
  MODULOS_DISPONIBLES,
} from "../services/permisosService";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SesionContextType {
  usuarioActivo: UsuarioSesion | null;
  modulosActivos: ModuloSistema[]; // módulos del rol cargados desde BD
  cargandoModulos: boolean;
  iniciarSesionContexto: (usuario: UsuarioSesion) => Promise<void>;
  cerrarSesionContexto: () => void;
  tienePermiso: (rolesPermitidos: Rol[]) => boolean;
  tieneModulo: (moduloId: string) => boolean;
  recargarModulos: () => Promise<void>; // útil tras cambiar permisos
}

// ─── Creación del contexto ────────────────────────────────────────────────────

const SesionContext = createContext<SesionContextType | null>(null);

// ─── Proveedor ────────────────────────────────────────────────────────────────

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuarioActivo, setUsuarioActivo] = useState<UsuarioSesion | null>(
    null,
  );
  const [modulosActivos, setModulosActivos] = useState<ModuloSistema[]>([]);
  const [cargandoModulos, setCargandoModulos] = useState(false);

  // ── Cargar módulos del rol desde Supabase ─────────────────────────────────

  const cargarModulos = async (rol: string): Promise<void> => {
    setCargandoModulos(true);
    const { modulosIds } = await obtenerModulosDeRol(rol);

    // Convertir IDs a objetos ModuloSistema con etiqueta e ícono
    const modulos = MODULOS_DISPONIBLES.filter((m) =>
      modulosIds.includes(m.id),
    ).sort((a, b) => a.orden - b.orden);

    setModulosActivos(modulos);
    setCargandoModulos(false);
  };

  // ── Iniciar sesión: guarda usuario y carga sus módulos ────────────────────

  const iniciarSesionContexto = async (
    usuario: UsuarioSesion,
  ): Promise<void> => {
    setUsuarioActivo(usuario);
    await cargarModulos(usuario.rol);
  };

  // ── Cerrar sesión: limpia todo ────────────────────────────────────────────

  const cerrarSesionContexto = (): void => {
    setUsuarioActivo(null);
    setModulosActivos([]);
  };

  // ── Recargar módulos (útil si el admin cambia permisos en vivo) ───────────

  const recargarModulos = async (): Promise<void> => {
    if (usuarioActivo) await cargarModulos(usuarioActivo.rol);
  };

  // ── Verificar rol ─────────────────────────────────────────────────────────

  const tienePermiso = (rolesPermitidos: Rol[]): boolean => {
    if (!usuarioActivo) return false;
    return rolesPermitidos.includes(usuarioActivo.rol as Rol);
  };

  // ── Verificar módulo específico ───────────────────────────────────────────

  const tieneModulo = (moduloId: string): boolean => {
    return modulosActivos.some((m) => m.id === moduloId);
  };

  return (
    <SesionContext.Provider
      value={{
        usuarioActivo,
        modulosActivos,
        cargandoModulos,
        iniciarSesionContexto,
        cerrarSesionContexto,
        tienePermiso,
        tieneModulo,
        recargarModulos,
      }}
    >
      {children}
    </SesionContext.Provider>
  );
}

// ─── Hook para consumir el contexto ──────────────────────────────────────────

export function useSesion(): SesionContextType {
  const contexto = useContext(SesionContext);
  if (!contexto) {
    throw new Error("useSesion debe usarse dentro de <SesionProvider>");
  }
  return contexto;
}
