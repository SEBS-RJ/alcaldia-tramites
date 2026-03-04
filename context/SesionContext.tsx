// ─── Contexto de Sesión (T-03 HU-1) ──────────────────────────────────────────
// Almacena el usuario autenticado y su rol de forma global.
// Cualquier pantalla puede leer el rol para restringir funcionalidades.

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UsuarioSesion, Rol } from '../services/authService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SesionContextType {
  usuarioActivo: UsuarioSesion | null;
  iniciarSesionContexto: (usuario: UsuarioSesion) => void;
  cerrarSesionContexto: () => void;
  tienePermiso: (rolesPermitidos: Rol[]) => boolean;
}

// ─── Creación del contexto ────────────────────────────────────────────────────

const SesionContext = createContext<SesionContextType | null>(null);

// ─── Proveedor ────────────────────────────────────────────────────────────────

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuarioActivo, setUsuarioActivo] = useState<UsuarioSesion | null>(null);

  // Guardar usuario en sesión tras login exitoso
  const iniciarSesionContexto = (usuario: UsuarioSesion) => {
    setUsuarioActivo(usuario);
  };

  // Limpiar sesión al cerrar
  const cerrarSesionContexto = () => {
    setUsuarioActivo(null);
  };

  /**
   * T-03: Verifica si el usuario activo tiene uno de los roles permitidos.
   * Se usa en cada pantalla para restringir acceso según permisos.
   *
   * Ejemplo de uso:
   *   tienePermiso(['Administrador'])           → solo admin
   *   tienePermiso(['Jefe de Área', 'Admin'])   → jefe o admin
   */
  const tienePermiso = (rolesPermitidos: Rol[]): boolean => {
    if (!usuarioActivo) return false;
    return rolesPermitidos.includes(usuarioActivo.rol);
  };

  return (
    <SesionContext.Provider
      value={{
        usuarioActivo,
        iniciarSesionContexto,
        cerrarSesionContexto,
        tienePermiso,
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
    throw new Error('useSesion debe usarse dentro de <SesionProvider>');
  }
  return contexto;
}