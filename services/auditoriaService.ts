// ─── Servicio de Auditoría (T-01 y T-02 HU-5) ────────────────────────────────
// Registra automáticamente las acciones críticas del sistema en la tabla
// 'auditoria' de Supabase. Cumple RNF04: auditoría de acciones de usuarios.

import { supabase } from '../lib/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AccionAuditoria =
  | 'LOGIN_EXITOSO'
  | 'LOGIN_FALLIDO'
  | 'CIERRE_SESION'
  | 'USUARIO_INACTIVO';

export interface RegistroAuditoria {
  usuario_id?: string;
  usuario_nombre: string;
  accion: AccionAuditoria;
  descripcion: string;
  resultado: 'exitoso' | 'fallido';
}

// ─── T-02 HU-5: Registro automático de acciones críticas ─────────────────────

/**
 * Registra una acción en la tabla de auditoría.
 * Se llama automáticamente desde authService en cada evento crítico.
 */
export async function registrarAccion(registro: RegistroAuditoria): Promise<void> {
  try {
    await supabase.from('auditoria').insert({
      usuario_id:      registro.usuario_id ?? null,
      usuario_nombre:  registro.usuario_nombre,
      accion:          registro.accion,
      descripcion:     registro.descripcion,
      resultado:       registro.resultado,
      // fecha se genera automáticamente con DEFAULT now() en la BD
    });
  } catch (error) {
    // La auditoría nunca debe interrumpir el flujo principal
    console.warn('Auditoría: no se pudo registrar la acción', error);
  }
}