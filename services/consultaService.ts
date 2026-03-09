import { supabase } from '../lib/supabase';
import { Tramite } from './tramiteService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface EntradaHistorial {
  id: string;
  tramite_id: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  accion: string;
  observacion: string | null;
  usuario_nombre: string;
  fecha: string;
}

export interface ResultadoConsulta {
  exito: boolean;
  tramite?: Tramite;
  historial?: EntradaHistorial[];
  error?: string;
}

// ─── T-01 + T-02 + T-03 HU-4: Consultar trámite con historial ────────────────

export async function consultarTramite(
  numeroBusqueda: string
): Promise<ResultadoConsulta> {
  const numero = numeroBusqueda.trim().toUpperCase();

  if (!numero) {
    return { exito: false, error: 'Ingrese el número de trámite.' };
  }

  try {
    // T-01: Buscar por número único
    const { data: tramite, error: errorTramite } = await supabase
      .from('tramites')
      .select('*')
      .eq('numero_tramite', numero)
      .single();

    if (errorTramite || !tramite) {
      return {
        exito: false,
        error: `No se encontró el trámite "${numero}". Verifique el número e intente nuevamente.`,
      };
    }

    // T-03: Obtener historial de cambios ordenado por fecha descendente
    const { data: historial, error: errorHistorial } = await supabase
      .from('historial_tramite')
      .select('*')
      .eq('tramite_id', tramite.id)
      .order('fecha', { ascending: false });

    return {
      exito: true,
      tramite: tramite as Tramite,
      historial: (historial ?? []) as EntradaHistorial[],
    };
  } catch {
    return {
      exito: false,
      error: 'Error de conexión. Verifique su internet e intente nuevamente.',
    };
  }
}

// ─── Buscar trámites por nombre o CI del solicitante ─────────────────────────

export interface TramiteResumido {
  id: string;
  numero_tramite: string;
  tipo: string;
  estado: string;
  solicitante_nombre: string;
  fecha_registro: string;
}

export interface ResultadoBusquedaSolicitante {
  exito: boolean;
  tramites?: TramiteResumido[];
  error?: string;
}

export async function buscarTramitesPorSolicitante(
  texto: string
): Promise<ResultadoBusquedaSolicitante> {
  const busqueda = texto.trim().toLowerCase();

  if (!busqueda) {
    return { exito: false, error: 'Ingrese el nombre o CI del solicitante.' };
  }

  try {
    const { data, error } = await supabase
      .from('tramites')
      .select('id, numero_tramite, tipo, estado, solicitante_nombre, fecha_registro')
      .or(`solicitante_nombre.ilike.%${busqueda}%,solicitante_ci.ilike.%${busqueda}%`)
      .order('fecha_registro', { ascending: false })
      .limit(20);

    if (error) {
      return {
        exito: false,
        error: 'No se pudieron buscar los trámites. Intente nuevamente.',
      };
    }

    return {
      exito: true,
      tramites: (data ?? []) as TramiteResumido[],
    };
  } catch {
    return {
      exito: false,
      error: 'Error de conexión. Verifique su internet e intente nuevamente.',
    };
  }
}