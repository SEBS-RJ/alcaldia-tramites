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

export interface EntradaAuditoria {
  id: string;
  usuario_nombre: string;
  accion: AccionAuditoria;
  descripcion: string;
  fecha: string;
  resultado: 'exitoso' | 'fallido';
}

// AccionFiltro permite string vacío para representar "todas las acciones"
export type AccionFiltro = AccionAuditoria | '';

export interface FiltrosAuditoria {
  usuario?: string;
  accion?: AccionFiltro;    // ← string vacío = sin filtro
  fechaDesde?: string;
  fechaHasta?: string;
}

// ─── T-02 HU-5: Registro automático de acciones críticas ─────────────────────

export async function registrarAccion(registro: RegistroAuditoria): Promise<void> {
  try {
    await supabase.from('auditoria').insert({
      usuario_id:     registro.usuario_id ?? null,
      usuario_nombre: registro.usuario_nombre,
      accion:         registro.accion,
      descripcion:    registro.descripcion,
      resultado:      registro.resultado,
    });
  } catch (error) {
    // La auditoría nunca interrumpe el flujo principal
    console.warn('Auditoría: no se pudo registrar la acción', error);
  }
}

// ─── T-03 HU-5: Consulta de auditoría con filtros ────────────────────────────

export async function consultarAuditoria(
  filtros: FiltrosAuditoria = {}
): Promise<{ datos: EntradaAuditoria[]; error: string | null }> {
  try {
    let query = supabase
      .from('auditoria')
      .select('id, usuario_nombre, accion, descripcion, fecha, resultado')
      .order('fecha', { ascending: false })
      .limit(100);

    // Filtro por nombre de usuario (búsqueda parcial)
    if (filtros.usuario && filtros.usuario.trim() !== '') {
      query = query.ilike('usuario_nombre', `%${filtros.usuario.trim()}%`);
    }

    // Filtro por tipo de acción — solo aplica si no es string vacío
    if (filtros.accion) {
      query = query.eq('accion', filtros.accion);
    }

    // Filtro por fecha desde
    if (filtros.fechaDesde && filtros.fechaDesde.trim() !== '') {
      query = query.gte('fecha', `${filtros.fechaDesde}T00:00:00`);
    }

    // Filtro por fecha hasta
    if (filtros.fechaHasta && filtros.fechaHasta.trim() !== '') {
      query = query.lte('fecha', `${filtros.fechaHasta}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      return { datos: [], error: 'No se pudo cargar el historial de auditoría.' };
    }

    return { datos: (data as EntradaAuditoria[]) ?? [], error: null };
  } catch {
    return { datos: [], error: 'Error de conexión al consultar auditoría.' };
  }
}