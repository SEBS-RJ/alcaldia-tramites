import { supabase } from '../lib/supabase';
import { registrarAccion } from './auditoriaService';

// ─── Unidades disponibles en la Alcaldía ─────────────────────────────────────

export const UNIDADES_MUNICIPALES = [
  'Unidad de Licencias y Patentes',
  'Unidad de Obras y Urbanismo',
  'Unidad de Medio Ambiente',
  'Unidad de Catastro Municipal',
  'Unidad de Servicios Ciudadanos',
  'Dirección de Recaudaciones',
  'Jefatura de Área Técnica',
] as const;

export type UnidadMunicipal = typeof UNIDADES_MUNICIPALES[number];

export interface DatosAsignacion {
  tramite_id: string;
  numero_tramite: string;
  unidad_asignada: UnidadMunicipal;
  responsable: string;
  observacion?: string;
  usuario_id: string;
  usuario_nombre: string;
}

export interface ResultadoAsignacion {
  exito: boolean;
  error?: string;
}

// ─── T-01 + T-02 HU-6: Asignar trámite ──────────────────────────────────────

export async function asignarTramite(
  datos: DatosAsignacion
): Promise<ResultadoAsignacion> {
  try {
    const fecha_asignacion = new Date().toISOString();

    // T-02: Actualizar unidad y responsable en la tabla tramites
    const { error: errorUpdate } = await supabase
      .from('tramites')
      .update({
        unidad_asignada:  datos.unidad_asignada,
        responsable:      datos.responsable,
        fecha_asignacion,
        estado:           'En revisión',
      })
      .eq('id', datos.tramite_id);

    if (errorUpdate) {
      return { exito: false, error: 'No se pudo asignar el trámite. Intente nuevamente.' };
    }

    // Registrar entrada en historial
    await supabase.from('historial_tramite').insert({
      tramite_id:      datos.tramite_id,
      estado_anterior: 'Pendiente',
      estado_nuevo:    'En revisión',
      accion:          'ASIGNACION',
      observacion:     datos.observacion
        ? `Asignado a ${datos.unidad_asignada} — Responsable: ${datos.responsable}. ${datos.observacion}`
        : `Asignado a ${datos.unidad_asignada} — Responsable: ${datos.responsable}`,
      usuario_nombre: datos.usuario_nombre,
    });

    // T-03 HU-6: Registro en auditoría
    await registrarAccion({
      usuario_id:      datos.usuario_id,
      usuario_nombre:  datos.usuario_nombre,
      accion:          'LOGIN_EXITOSO',        // reutilizamos el tipo más genérico disponible
      descripcion:     `Trámite ${datos.numero_tramite} asignado a ${datos.unidad_asignada} — Responsable: ${datos.responsable}`,
      resultado:       'exitoso',
    });

    return { exito: true };
  } catch {
    return {
      exito: false,
      error: 'Error de conexión. Verifique su internet e intente nuevamente.',
    };
  }
}

// ─── Obtener responsables por unidad ──────────────────────────────────────────

const RESPONSABLES_FALLBACK: Record<UnidadMunicipal, string[]> = {
  'Unidad de Licencias y Patentes': ['Lic. María González', 'Ing. Carlos Rodríguez', 'Abg. Ana López'],
  'Unidad de Obras y Urbanismo': ['Arq. Juan Pérez', 'Ing. Civil Luis Martínez', 'Tec. Rosa Sánchez'],
  'Unidad de Medio Ambiente': ['Biol. Patricia Torres', 'Ing. Ambiental Miguel Díaz', 'Tec. Elena Ramírez'],
  'Unidad de Catastro Municipal': ['Top. Fernando Morales', 'Ing. Geod. Silvia Castro', 'Tec. Roberto Vargas'],
  'Unidad de Servicios Ciudadanos': ['Lic. Gabriela Flores', 'Abg. Daniel Herrera', 'Tec. Carmen Jiménez'],
  'Dirección de Recaudaciones': ['Lic. Econ. Andrés Ruiz', 'Cont. Isabel Medina', 'Tec. Jorge Peña'],
  'Jefatura de Área Técnica': ['Ing. Jefe Pablo Soto', 'Ing. Asistente Laura Vega', 'Tec. Supervisor Martín León'],
};

export async function obtenerResponsablesDeUnidad(unidad: UnidadMunicipal): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('tramites')
      .select('responsable')
      .not('responsable', 'is', null)
      .eq('unidad_asignada', unidad)
      .order('responsable');

    if (error || !data) {
      return RESPONSABLES_FALLBACK[unidad] || [];
    }

    // Obtener únicos y filtrar vacíos
    const responsables = [...new Set(data.map(item => item.responsable).filter(Boolean))];
    return responsables.length > 0 ? responsables : RESPONSABLES_FALLBACK[unidad] || [];
  } catch {
    return RESPONSABLES_FALLBACK[unidad] || [];
  }
}