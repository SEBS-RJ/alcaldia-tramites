import { supabase } from '../lib/supabase';
import { registrarAccion } from './auditoriaService';

// ─── Constantes de validación (T-21) ─────────────────────────────────────────

export const FORMATOS_PERMITIDOS = ['pdf', 'jpg', 'jpeg', 'png'] as const;
export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB
export const BUCKET_NOMBRE       = 'tramites-documentos';

export type FormatoPermitido = typeof FORMATOS_PERMITIDOS[number];

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ArchivoSeleccionado {
  nombre: string;
  tipo:   string;   // MIME type: application/pdf, image/jpeg, image/png
  tamano: number;   // bytes
  uri:    string;   // ruta local del archivo (expo-document-picker)
}

export interface Documento {
  id:             string;
  tramite_id:     string;
  nombre_archivo: string;
  tipo_archivo:   string;
  tamano_bytes:   number;
  storage_path:   string;
  subido_por:     string;
  fecha_subida:   string;
  url_descarga?:  string;  // firmada al listar
}

export interface ResultadoCarga {
  exito:      boolean;
  documento?: Documento;
  error?:     string;
}

export interface ResultadoListado {
  exito:       boolean;
  documentos?: Documento[];
  error?:      string;
}

export interface ErrorValidacion {
  tipo: 'formato' | 'tamano';
  mensaje: string;
}

// ─── T-21: Validar archivo antes de cargar ────────────────────────────────────

export function validarArchivo(archivo: ArchivoSeleccionado): ErrorValidacion | null {
  // Extraer extensión del nombre
  const extension = archivo.nombre.split('.').pop()?.toLowerCase() ?? '';

  if (!(FORMATOS_PERMITIDOS as readonly string[]).includes(extension)) {
    return {
      tipo: 'formato',
      mensaje: `Formato no permitido (.${extension}). Solo se aceptan: PDF, JPG y PNG.`,
    };
  }

  if (archivo.tamano > TAMANO_MAXIMO_BYTES) {
    const mb = (archivo.tamano / 1024 / 1024).toFixed(1);
    return {
      tipo: 'tamano',
      mensaje: `El archivo pesa ${mb} MB. El tamaño máximo permitido es 5 MB.`,
    };
  }

  return null;
}

// ─── T-20: Cargar archivo a Supabase Storage ─────────────────────────────────

export async function cargarDocumento(
  tramiteId:      string,
  numeroTramite:  string,
  archivo:        ArchivoSeleccionado,
  usuarioId:      string,
  usuarioNombre:  string,
): Promise<ResultadoCarga> {

  // 1. Validar antes de cargar
  const errorVal = validarArchivo(archivo);
  if (errorVal) return { exito: false, error: errorVal.mensaje };

  try {
    // 2. Leer archivo como Blob desde la URI local (compatibilidad Expo web + móvil)
    const respuesta = await fetch(archivo.uri);
    const blob      = await respuesta.blob();

    // 3. Construir path único: tramiteId/timestamp_nombre.ext
    const extension   = archivo.nombre.split('.').pop()?.toLowerCase() ?? 'bin';
    const timestamp   = Date.now();
    const storagePath = `${tramiteId}/${timestamp}_${archivo.nombre.replace(/\s+/g, '_')}`;

    // 4. Subir a Supabase Storage
    const { error: errorSubida } = await supabase.storage
      .from(BUCKET_NOMBRE)
      .upload(storagePath, blob, {
        contentType: archivo.tipo,
        upsert:      false,
      });

    if (errorSubida) {
      return { exito: false, error: 'No se pudo subir el archivo. Intente nuevamente.' };
    }

    // 5. Registrar metadata en tabla documentos
    const { data: docData, error: errorDoc } = await supabase
      .from('documentos')
      .insert({
        tramite_id:     tramiteId,
        nombre_archivo: archivo.nombre,
        tipo_archivo:   extension,
        tamano_bytes:   archivo.tamano,
        storage_path:   storagePath,
        subido_por:     usuarioNombre,
      })
      .select()
      .single();

    if (errorDoc || !docData) {
      return { exito: false, error: 'Archivo subido pero no se pudo registrar. Contacte al administrador.' };
    }

    // 6. T-23: Registro en auditoría
    await registrarAccion({
      usuario_id:     usuarioId,
      usuario_nombre: usuarioNombre,
      accion:         'LOGIN_EXITOSO',
      descripcion:    `Documento cargado en trámite ${numeroTramite}: ${archivo.nombre} (${(archivo.tamano / 1024).toFixed(0)} KB)`,
      resultado:      'exitoso',
    });

    return { exito: true, documento: docData as Documento };
  } catch {
    return {
      exito: false,
      error: 'Error de conexión. Verifique su internet e intente nuevamente.',
    };
  }
}

// ─── T-22: Listar documentos de un trámite con URL de descarga ────────────────

export async function listarDocumentos(tramiteId: string): Promise<ResultadoListado> {
  try {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('tramite_id', tramiteId)
      .order('fecha_subida', { ascending: false });

    if (error) return { exito: false, error: 'No se pudo obtener la lista de documentos.' };

    // Generar URL firmada (1 hora) para descarga segura
    const documentos: Documento[] = await Promise.all(
      (data ?? []).map(async (doc) => {
        const { data: signed } = await supabase.storage
          .from(BUCKET_NOMBRE)
          .createSignedUrl(doc.storage_path, 3600);
        return { ...(doc as Documento), url_descarga: signed?.signedUrl };
      })
    );

    return { exito: true, documentos };
  } catch {
    return { exito: false, error: 'Error al cargar los documentos.' };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatearTamano(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function iconoPorTipo(tipo: string): string {
  if (tipo === 'pdf')              return 'document-text-outline';
  if (['jpg','jpeg'].includes(tipo)) return 'image-outline';
  if (tipo === 'png')              return 'image-outline';
  return 'attach-outline';
}