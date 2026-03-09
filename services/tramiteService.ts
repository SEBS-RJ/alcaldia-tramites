// ─── Servicio de Trámites (HU-2) ─────────────────────────────────────────────
// Gestiona el registro de trámites contra Supabase.
// T-02: Número único correlativo automático
// T-03: Fecha y hora del sistema automática

import { supabase } from '../lib/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TipoTramite =
  | 'Licencia de funcionamiento'
  | 'Patente'
  | 'Certificación'
  | 'Reclamo vecinal'
  | 'Solicitud de obra';

export type EstadoTramite =
  | 'Pendiente'
  | 'En revisión'
  | 'Observado'
  | 'Aprobado'
  | 'Rechazado';

export interface DatosTramite {
  tipo: TipoTramite;
  solicitante_nombre: string;
  solicitante_ci: string;
  solicitante_telefono: string;
  solicitante_email: string;
  descripcion: string;
  direccion: string;
  registrado_por: string;
  dias_vencimiento: number;  // días para calcular fecha de vencimiento
}

export interface Tramite extends DatosTramite {
  id: string;
  numero_tramite: string;
  estado: EstadoTramite;
  fecha_registro: string;
  fecha_vencimiento: string;
  unidad_asignada?: string;     // unidad asignada (opcional)
  responsable?: string;          // responsable del trámite (opcional)
}

export interface ResultadoRegistro {
  exito: boolean;
  tramite?: Tramite;
  error?: string;
}

// ─── Días hábiles de vencimiento por tipo de trámite ─────────────────────────
// RF04: El sistema calcula la fecha de vencimiento según el tipo.

const DIAS_VENCIMIENTO: Record<TipoTramite, number> = {
  'Licencia de funcionamiento': 15,
  'Patente':                    10,
  'Certificación':               7,
  'Reclamo vecinal':            20,
  'Solicitud de obra':          30,
};

// ─── T-02 HU-2: Generación de número único correlativo ───────────────────────

async function generarNumeroTramite(): Promise<string> {
  const { data, error } = await supabase.rpc('nextval', {
    sequence_name: 'tramite_seq',
  });

  // Si el RPC no está disponible, usar timestamp como fallback
  const correlativo = error || !data
    ? Date.now().toString().slice(-6)
    : String(data).padStart(6, '0');

  const anio = new Date().getFullYear();
  return `TRM-${anio}-${correlativo}`;
}

// ─── T-03 HU-2: Fecha automática + RF04: Fecha de vencimiento ────────────────

function calcularFechaVencimiento(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

// ─── Registrar nuevo trámite ──────────────────────────────────────────────────

export async function registrarTramite(
  datos: DatosTramite
): Promise<ResultadoRegistro> {
  try {
    // T-02: Número correlativo automático
    const numero_tramite = await generarNumeroTramite();

    // T-03: Fecha de registro = ahora (se envía explícitamente para trazabilidad)
    const fecha_registro = new Date().toISOString();

    // RF04: Fecha de vencimiento según días del tipo
    const fecha_vencimiento = calcularFechaVencimiento(datos.dias_vencimiento).toISOString();

    const { data, error } = await supabase
      .from('tramites')
      .insert({
        numero_tramite,
        tipo:                   datos.tipo,
        solicitante_nombre:     datos.solicitante_nombre,
        solicitante_ci:         datos.solicitante_ci,
        solicitante_telefono:   datos.solicitante_telefono,
        solicitante_email:      datos.solicitante_email,
        descripcion:            datos.descripcion,
        direccion:              datos.direccion,
        registrado_por:         datos.registrado_por,
        estado:                 'Pendiente',
        fecha_registro,
        fecha_vencimiento,
      })
      .select()
      .single();

    if (error || !data) {
      return {
        exito: false,
        error: 'No se pudo registrar el trámite. Intente nuevamente.',
      };
    }

    return { exito: true, tramite: data as Tramite };
  } catch {
    return {
      exito: false,
      error: 'Error de conexión. Verifique su internet e intente nuevamente.',
    };
  }
}

// ─── Obtener tipos de trámite activos ─────────────────────────────────────────

interface TipoConDias {
  nombre: TipoTramite;
  dias_vencimiento: number;
}

const TIPOS_FALLBACK: TipoConDias[] = [
  { nombre: 'Licencia de funcionamiento', dias_vencimiento: 15 },
  { nombre: 'Patente', dias_vencimiento: 10 },
  { nombre: 'Certificación', dias_vencimiento: 7 },
  { nombre: 'Reclamo vecinal', dias_vencimiento: 20 },
  { nombre: 'Solicitud de obra', dias_vencimiento: 30 },
];

export async function obtenerTiposActivos(): Promise<TipoConDias[]> {
  try {
    const { data, error } = await supabase
      .from('tipos_tramite')
      .select('nombre, dias_vencimiento')
      .eq('activo', true)
      .order('nombre');

    if (error || !data) {
      return TIPOS_FALLBACK;
    }

    const tipos = data.map(item => ({
      nombre: item.nombre as TipoTramite,
      dias_vencimiento: item.dias_vencimiento || 7, // fallback a 7 días
    }));
    return tipos.length > 0 ? tipos : TIPOS_FALLBACK;
  } catch {
    return TIPOS_FALLBACK;
  }
}