import { supabase } from '../lib/supabase';
import { hashSHA256 } from './hashService';
import { registrarAccion } from './auditoriaService';

// ─── Roles del sistema ────────────────────────────────────────────────────────
// Lista base institucional + soporte para roles personalizados

export const ROLES_BASE = [
  'Administrador',
  'Funcionario Municipal',
  'Jefe de Área',
  'Director de Área',
  'Secretario Municipal',
  'Técnico Municipal',
  'Supervisor de Trámites',
  'Auditor Interno',
] as const;

export type RolBase = typeof ROLES_BASE[number];

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Usuario {
  id: string;
  usuario: string;
  rol: string;
  activo: boolean;
  creado_en: string;
}

export interface DatosNuevoUsuario {
  usuario: string;
  contrasena: string;
  rol: string;
}

export interface DatosEditarUsuario {
  rol?: string;
  activo?: boolean;
}

export interface ResultadoOperacion {
  exito: boolean;
  error?: string;
  dato?: unknown;
}

// ─── Mejora 1: Validación robusta de contraseña ───────────────────────────────
// Exige: mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 carácter especial

export interface ResultadoValidacionContrasena {
  valida: boolean;
  errores: string[];
  fortaleza: 'débil' | 'media' | 'fuerte';
}

export function validarContrasenaRobusta(
  contrasena: string
): ResultadoValidacionContrasena {
  const errores: string[] = [];

  if (contrasena.length < 8) {
    errores.push('Mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(contrasena)) {
    errores.push('Al menos una letra mayúscula');
  }
  if (!/[a-z]/.test(contrasena)) {
    errores.push('Al menos una letra minúscula');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(contrasena)) {
    errores.push('Al menos un carácter especial (!@#$%...)');
  }

  // Calcular fortaleza
  let puntos = 0;
  if (contrasena.length >= 8)  puntos++;
  if (contrasena.length >= 12) puntos++;
  if (/[A-Z]/.test(contrasena)) puntos++;
  if (/[a-z]/.test(contrasena)) puntos++;
  if (/[0-9]/.test(contrasena)) puntos++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(contrasena)) puntos++;

  const fortaleza =
    puntos <= 2 ? 'débil' :
    puntos <= 4 ? 'media' : 'fuerte';

  return { valida: errores.length === 0, errores, fortaleza };
}

// ─── Listar todos los usuarios ────────────────────────────────────────────────

export async function listarUsuarios(): Promise<{
  usuarios: Usuario[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, usuario, rol, activo, creado_en')
      .order('creado_en', { ascending: false });

    if (error) return { usuarios: [], error: 'No se pudo cargar la lista de usuarios.' };
    return { usuarios: (data as Usuario[]) ?? [], error: null };
  } catch {
    return { usuarios: [], error: 'Error de conexión.' };
  }
}

// ─── Crear nuevo usuario ──────────────────────────────────────────────────────

export async function crearUsuario(
  datos: DatosNuevoUsuario,
  administrador: { id: string; usuario: string }
): Promise<ResultadoOperacion> {
  try {
    // Verificar si el usuario ya existe
    const { data: existente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('usuario', datos.usuario.trim().toLowerCase())
      .single();

    if (existente) {
      return { exito: false, error: `El usuario "${datos.usuario}" ya existe en el sistema.` };
    }

    // Hashear contraseña
    const contrasenaHash = await hashSHA256(datos.contrasena);

    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        usuario:   datos.usuario.trim().toLowerCase(),
        contrasena: contrasenaHash,
        rol:        datos.rol,
        activo:     true,
      })
      .select()
      .single();

    if (error || !data) {
      return { exito: false, error: 'No se pudo crear el usuario. Intente nuevamente.' };
    }

    // Auditoría
    await registrarAccion({
      usuario_id:     administrador.id,
      usuario_nombre: administrador.usuario,
      accion:         'LOGIN_EXITOSO',
      descripcion:    `Usuario creado: ${datos.usuario} con rol "${datos.rol}"`,
      resultado:      'exitoso',
    });

    return { exito: true, dato: data };
  } catch {
    return { exito: false, error: 'Error de conexión.' };
  }
}

// ─── Editar rol de usuario ────────────────────────────────────────────────────

export async function editarUsuario(
  usuarioId: string,
  usuarioNombre: string,
  cambios: DatosEditarUsuario,
  administrador: { id: string; usuario: string }
): Promise<ResultadoOperacion> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update(cambios)
      .eq('id', usuarioId);

    if (error) {
      return { exito: false, error: 'No se pudo actualizar el usuario.' };
    }

    // Describir qué cambió para la auditoría
    const descripcion = cambios.rol !== undefined
      ? `Rol de "${usuarioNombre}" actualizado a "${cambios.rol}"`
      : cambios.activo !== undefined
        ? `Usuario "${usuarioNombre}" ${cambios.activo ? 'activado' : 'desactivado'}`
        : `Usuario "${usuarioNombre}" modificado`;

    await registrarAccion({
      usuario_id:     administrador.id,
      usuario_nombre: administrador.usuario,
      accion:         'LOGIN_EXITOSO',
      descripcion,
      resultado:      'exitoso',
    });

    return { exito: true };
  } catch {
    return { exito: false, error: 'Error de conexión.' };
  }
}

// ─── Eliminar usuario ─────────────────────────────────────────────────────────

export async function eliminarUsuario(
  usuarioId: string,
  usuarioNombre: string,
  administrador: { id: string; usuario: string }
): Promise<ResultadoOperacion> {
  // Protección: no eliminar al propio administrador
  if (usuarioId === administrador.id) {
    return { exito: false, error: 'No puedes eliminar tu propia cuenta.' };
  }

  try {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', usuarioId);

    if (error) {
      return { exito: false, error: 'No se pudo eliminar el usuario.' };
    }

    await registrarAccion({
      usuario_id:     administrador.id,
      usuario_nombre: administrador.usuario,
      accion:         'LOGIN_EXITOSO',
      descripcion:    `Usuario eliminado: "${usuarioNombre}"`,
      resultado:      'exitoso',
    });

    return { exito: true };
  } catch {
    return { exito: false, error: 'Error de conexión.' };
  }
}