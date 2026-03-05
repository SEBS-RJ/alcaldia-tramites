// ─── Servicio de Autenticación (T-02, T-05 HU-1) ────────────────────────────
// Valida credenciales contra Supabase usando SHA-256 (T-05).
// Registra automáticamente cada intento en auditoría (T-02 HU-5).

import { supabase } from '../lib/supabase';
import { hashSHA256 } from './hashService';
import { registrarAccion } from './auditoriaService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

// ─── T-02 HU-1 + T-05 HU-1: Login con hash y auditoría ──────────────────────

/**
 * Valida usuario y contraseña hasheada contra la base de datos.
 * Registra el intento (exitoso o fallido) en la tabla de auditoría.
 */
export async function iniciarSesion(
  usuario: string,
  contrasena: string
): Promise<ResultadoLogin> {
  try {
    // T-05: Hashear contraseña antes de comparar con la BD
    const contrasenaHash = await hashSHA256(contrasena);

    // T-02: Consultar en Supabase con contraseña hasheada
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, usuario, rol, activo')
      .eq('usuario', usuario.trim().toLowerCase())
      .eq('contrasena', contrasenaHash)
      .single();

    // Credenciales incorrectas — usuario no encontrado
    if (error || !data) {
      // T-02 HU-5: Registrar intento fallido en auditoría
      await registrarAccion({
        usuario_nombre: usuario.trim().toLowerCase(),
        accion:         'LOGIN_FALLIDO',
        descripcion:    `Intento de login fallido para el usuario: ${usuario.trim().toLowerCase()}`,
        resultado:      'fallido',
      });

      return {
        exito: false,
        error: 'Usuario o contraseña incorrectos.',
      };
    }

    // Usuario encontrado pero inactivo
    if (!data.activo) {
      // T-02 HU-5: Registrar intento con cuenta inactiva
      await registrarAccion({
        usuario_id:     data.id,
        usuario_nombre: data.usuario,
        accion:         'USUARIO_INACTIVO',
        descripcion:    `Intento de acceso con cuenta desactivada: ${data.usuario}`,
        resultado:      'fallido',
      });

      return {
        exito: false,
        error: 'Tu cuenta está desactivada. Contacta al administrador.',
      };
    }

    // T-02 HU-5: Registrar login exitoso en auditoría
    await registrarAccion({
      usuario_id:     data.id,
      usuario_nombre: data.usuario,
      accion:         'LOGIN_EXITOSO',
      descripcion:    `Inicio de sesión exitoso — Rol: ${data.rol}`,
      resultado:      'exitoso',
    });

    return {
      exito: true,
      usuarioSesion: {
        id:      data.id,
        usuario: data.usuario,
        rol:     data.rol as Rol,
      },
    };
  } catch {
    return {
      exito: false,
      error: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
    };
  }
}

// ─── T-04 HU-1: Cierre de sesión con auditoría ───────────────────────────────

export async function cerrarSesion(usuarioSesion: UsuarioSesion): Promise<void> {
  // T-02 HU-5: Registrar cierre de sesión
  await registrarAccion({
    usuario_id:     usuarioSesion.id,
    usuario_nombre: usuarioSesion.usuario,
    accion:         'CIERRE_SESION',
    descripcion:    `Cierre de sesión — Usuario: ${usuarioSesion.usuario}`,
    resultado:      'exitoso',
  });
}