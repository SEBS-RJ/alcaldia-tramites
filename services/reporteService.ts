import { supabase } from '../lib/supabase';
import { Tramite, TipoTramite, EstadoTramite } from './tramiteService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface FiltrosTramites {
  estado?: EstadoTramite | '';
  tipo?: TipoTramite | '';
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda?: string; // número o nombre solicitante
}

export interface ResultadoTramites {
  tramites: Tramite[];
  total: number;
  error: string | null;
}

export const PAGINA_TAMANO = 10;

// ─── Listar trámites con filtros y paginación ─────────────────────────────────

export async function listarTramites(
  filtros: FiltrosTramites = {},
  pagina: number = 1
): Promise<ResultadoTramites> {
  try {
    const desde = (pagina - 1) * PAGINA_TAMANO;
    const hasta = desde + PAGINA_TAMANO - 1;

    let query = supabase
      .from('tramites')
      .select('*', { count: 'exact' })
      .order('fecha_registro', { ascending: false })
      .range(desde, hasta);

    if (filtros.estado) query = query.eq('estado', filtros.estado);
    if (filtros.tipo)   query = query.eq('tipo', filtros.tipo);
    if (filtros.fechaDesde) query = query.gte('fecha_registro', `${filtros.fechaDesde}T00:00:00`);
    if (filtros.fechaHasta) query = query.lte('fecha_registro', `${filtros.fechaHasta}T23:59:59`);
    if (filtros.busqueda?.trim()) {
      query = query.or(
        `numero_tramite.ilike.%${filtros.busqueda.trim()}%,solicitante_nombre.ilike.%${filtros.busqueda.trim()}%`
      );
    }

    const { data, error, count } = await query;

    if (error) return { tramites: [], total: 0, error: 'No se pudo cargar la lista de trámites.' };
    return { tramites: (data as Tramite[]) ?? [], total: count ?? 0, error: null };
  } catch {
    return { tramites: [], total: 0, error: 'Error de conexión.' };
  }
}

// ─── Exportar a CSV ───────────────────────────────────────────────────────────
// Descarga todos los trámites (sin paginación) como archivo CSV

export async function exportarCSV(filtros: FiltrosTramites = {}): Promise<void> {
  try {
    let query = supabase
      .from('tramites')
      .select('numero_tramite, tipo, estado, solicitante_nombre, solicitante_ci, solicitante_telefono, solicitante_email, direccion, descripcion, registrado_por, fecha_registro, fecha_vencimiento, unidad_asignada, responsable')
      .order('fecha_registro', { ascending: false });

    if (filtros.estado) query = query.eq('estado', filtros.estado);
    if (filtros.tipo)   query = query.eq('tipo', filtros.tipo);
    if (filtros.fechaDesde) query = query.gte('fecha_registro', `${filtros.fechaDesde}T00:00:00`);
    if (filtros.fechaHasta) query = query.lte('fecha_registro', `${filtros.fechaHasta}T23:59:59`);
    if (filtros.busqueda?.trim()) {
      query = query.or(
        `numero_tramite.ilike.%${filtros.busqueda.trim()}%,solicitante_nombre.ilike.%${filtros.busqueda.trim()}%`
      );
    }

    const { data, error } = await query;
    if (error || !data) return;

    // Construir CSV
    const encabezado = [
      'Número', 'Tipo', 'Estado', 'Solicitante', 'CI', 'Teléfono', 'Email',
      'Dirección', 'Descripción', 'Registrado por', 'Fecha registro',
      'Fecha vencimiento', 'Unidad asignada', 'Responsable',
    ].join(',');

    const filas = data.map((t: any) => [
      t.numero_tramite,
      `"${t.tipo}"`,
      t.estado,
      `"${t.solicitante_nombre}"`,
      t.solicitante_ci,
      t.solicitante_telefono ?? '',
      t.solicitante_email ?? '',
      `"${(t.direccion ?? '').replace(/"/g, '""')}"`,
      `"${(t.descripcion ?? '').replace(/"/g, '""')}"`,
      t.registrado_por,
      new Date(t.fecha_registro).toLocaleString('es-BO'),
      new Date(t.fecha_vencimiento).toLocaleString('es-BO'),
      `"${t.unidad_asignada ?? ''}"`,
      `"${t.responsable ?? ''}"`,
    ].join(','));

    const csv = [encabezado, ...filas].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tramites_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    // Silencioso — el botón simplemente no descarga
  }
}