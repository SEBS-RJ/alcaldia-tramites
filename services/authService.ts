// ─── Servicio de autenticación (T-02 HU-1) ───────────────────────────────────
// Valida credenciales contra la tabla 'usuarios' en Supabase PostgreSQL.
//
// NOTA SPRINT 1: La contraseña se compara en texto plano por ahora.
// El cifrado con bcrypt se implementará cuando se integre el backend (Sprint futuro).

import { supabase } from '../lib/supabase';

export type Rol = 'Administrador' | 'Funcionario Municipal' | 'Jefe de Área';

export interface UsuarioSesion {
  id: string;
  usuario: string;
  rol: Rol;
}

export interface ResultadoLogin {
  exito: boolean;
  usuarioSesion?: UsuarioSesion;
  error?: string;
}

/**
 * T-02: Valida usuario y contraseña contra la base de datos.
 * Verifica que el usuario exista y esté activo.
 */
export async function iniciarSesion(
  usuario: string,
  contrasena: string
): Promise<ResultadoLogin> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, usuario, rol, activo')
      .eq('usuario', usuario.trim().toLowerCase())
      .eq('contrasena', contrasena)
      .single();

    if (error || !data) {
      return {
        exito: false,
        error: 'Usuario o contraseña incorrectos.',
      };
    }

    // Verificar que el usuario esté activo (T-02)
    if (!data.activo) {
      return {
        exito: false,
        error: 'Tu cuenta está desactivada. Contacta al administrador.',
      };
    }

    return {
      exito: true,
      usuarioSesion: {
        id: data.id,
        usuario: data.usuario,
        rol: data.rol as Rol,
      },
    };
  } catch {
    return {
      exito: false,
      error: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
    };
  }
}