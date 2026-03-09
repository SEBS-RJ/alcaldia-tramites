import { supabase } from '../lib/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TipoTramiteConfig {
  id: string;
  nombre: string;
  dias_vencimiento: number;
  activo: boolean;
  icono: string;
  descripcion: string;
  creado_en: string;
}

export interface ParametroSistema {
  clave: string;
  valor: string;
  etiqueta: string;
  descripcion: string;
  tipo: 'texto' | 'numero' | 'booleano';
}

export interface ResultadoConfig {
  exito: boolean;
  error?: string;
}

// ─── Parámetros por defecto (usados si la tabla no existe aún) ────────────────

export const PARAMETROS_DEFAULT: ParametroSistema[] = [
  {
    clave:       'nombre_institucion',
    valor:       'Alcaldía Municipal',
    etiqueta:    'Nombre de la institución',
    descripcion: 'Nombre que aparece en cabeceras y reportes.',
    tipo:        'texto',
  },
  {
    clave:       'correo_notificaciones',
    valor:       'tramites@alcaldia.gob.bo',
    etiqueta:    'Correo de notificaciones',
    descripcion: 'Dirección desde la que se envían notificaciones automáticas.',
    tipo:        'texto',
  },
  {
    clave:       'max_documentos_tramite',
    valor:       '10',
    etiqueta:    'Máximo de documentos por trámite',
    descripcion: 'Cantidad máxima de archivos adjuntos permitidos por trámite.',
    tipo:        'numero',
  },
  {
    clave:       'dias_alerta_vencimiento',
    valor:       '3',
    etiqueta:    'Días de alerta antes del vencimiento',
    descripcion: 'Con cuántos días de anticipación se genera alerta de vencimiento.',
    tipo:        'numero',
  },
  {
    clave:       'notificaciones_activas',
    valor:       'true',
    etiqueta:    'Notificaciones automáticas activas',
    descripcion: 'Activar o desactivar el envío de notificaciones al ciudadano.',
    tipo:        'booleano',
  },
  {
    clave:       'modo_mantenimiento',
    valor:       'false',
    etiqueta:    'Modo mantenimiento',
    descripcion: 'Cuando está activo, solo el Administrador puede acceder al sistema.',
    tipo:        'booleano',
  },
];

// ─── Tipos de trámite por defecto ─────────────────────────────────────────────

export const TIPOS_DEFAULT: Omit<TipoTramiteConfig, 'id' | 'creado_en'>[] = [
  { nombre: 'Licencia de funcionamiento', dias_vencimiento: 15, activo: true, icono: 'business-outline',  descripcion: 'Autorización para operar un establecimiento comercial.' },
  { nombre: 'Patente',                    dias_vencimiento: 10, activo: true, icono: 'ribbon-outline',    descripcion: 'Registro anual de actividad económica.' },
  { nombre: 'Certificación',              dias_vencimiento:  7, activo: true, icono: 'document-outline',  descripcion: 'Emisión de certificados municipales.' },
  { nombre: 'Reclamo vecinal',            dias_vencimiento: 20, activo: true, icono: 'megaphone-outline', descripcion: 'Registro de quejas o denuncias ciudadanas.' },
  { nombre: 'Solicitud de obra',          dias_vencimiento: 30, activo: true, icono: 'construct-outline', descripcion: 'Petición de obras o mejoras de infraestructura.' },
];

// ─── Listar tipos de trámite ──────────────────────────────────────────────────

export async function listarTiposTramite(): Promise<{
  tipos: TipoTramiteConfig[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('tipos_tramite')
      .select('*')
      .order('creado_en', { ascending: true });

    if (error) {
      // Si la tabla no existe aún, devolver los tipos por defecto con IDs simulados
      return {
        tipos: TIPOS_DEFAULT.map((t, i) => ({
          ...t,
          id: `default-${i}`,
          creado_en: new Date().toISOString(),
        })),
        error: null,
      };
    }
    return { tipos: (data as TipoTramiteConfig[]) ?? [], error: null };
  } catch {
    return { tipos: [], error: 'Error de conexión.' };
  }
}

// ─── Guardar tipo de trámite (crear o editar) ─────────────────────────────────

export async function guardarTipoTramite(
  tipo: Omit<TipoTramiteConfig, 'id' | 'creado_en'>,
  id?: string
): Promise<ResultadoConfig> {
  try {
    if (id && !id.startsWith('default-')) {
      // Editar existente
      const { error } = await supabase
        .from('tipos_tramite')
        .update(tipo)
        .eq('id', id);
      if (error) return { exito: false, error: 'No se pudo actualizar el tipo de trámite.' };
    } else {
      // Crear nuevo
      const { error } = await supabase
        .from('tipos_tramite')
        .insert(tipo);
      if (error) return { exito: false, error: 'No se pudo crear el tipo de trámite.' };
    }
    return { exito: true };
  } catch {
    return { exito: false, error: 'Error de conexión.' };
  }
}

// ─── Listar parámetros del sistema ────────────────────────────────────────────

export async function listarParametros(): Promise<{
  parametros: ParametroSistema[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('configuracion_sistema')
      .select('clave, valor');

    if (error || !data?.length) {
      // Tabla no existe o vacía — usar valores por defecto
      return { parametros: PARAMETROS_DEFAULT, error: null };
    }

    // Combinar valores guardados con la definición local
    const valoresGuardados: Record<string, string> = {};
    data.forEach((row: any) => { valoresGuardados[row.clave] = row.valor; });

    const parametros = PARAMETROS_DEFAULT.map(p => ({
      ...p,
      valor: valoresGuardados[p.clave] ?? p.valor,
    }));

    return { parametros, error: null };
  } catch {
    return { parametros: PARAMETROS_DEFAULT, error: null };
  }
}

// ─── Guardar parámetro ────────────────────────────────────────────────────────

export async function guardarParametro(
  clave: string,
  valor: string
): Promise<ResultadoConfig> {
  try {
    const { error } = await supabase
      .from('configuracion_sistema')
      .upsert({ clave, valor }, { onConflict: 'clave' });

    if (error) return { exito: false, error: 'No se pudo guardar el parámetro.' };
    return { exito: true };
  } catch {
    return { exito: false, error: 'Error de conexión.' };
  }
}