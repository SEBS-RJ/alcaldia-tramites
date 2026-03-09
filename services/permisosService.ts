import { supabase } from '../lib/supabase';

export interface ModuloSistema {
  id:          string;
  etiqueta:    string;
  descripcion: string;
  icono:       string;
  orden:       number;
}

export const MODULOS_DISPONIBLES: ModuloSistema[] = [
  { id: 'registro_tramite',   etiqueta: 'Registrar Nuevo Trámite',    descripcion: 'Crear y registrar solicitudes de trámite',         icono: 'add-circle-outline',       orden: 1  },
  { id: 'consulta_tramite',   etiqueta: 'Consultar Trámite',          descripcion: 'Buscar trámite por número y ver historial',        icono: 'search-outline',           orden: 2  },
  { id: 'asignacion_tramite', etiqueta: 'Asignar Trámite',            descripcion: 'Asignar trámites a unidades responsables',         icono: 'git-branch-outline',       orden: 3  },
  { id: 'documentos',         etiqueta: 'Gestión de Documentos',      descripcion: 'Cargar y revisar documentos adjuntos',             icono: 'attach-outline',           orden: 4  },
  { id: 'todos_tramites',     etiqueta: 'Todos los Trámites',         descripcion: 'Vista completa con filtros y exportar CSV',        icono: 'document-text-outline',    orden: 5  },
  { id: 'aprobar_tramite',    etiqueta: 'Aprobar / Rechazar Trámites',descripcion: 'Aprobar o rechazar trámites con justificación',    icono: 'checkmark-circle-outline', orden: 6  },
  { id: 'tramites_area',      etiqueta: 'Trámites del Área',          descripcion: 'Ver trámites asignados a la propia unidad',        icono: 'folder-open-outline',      orden: 7  },
  { id: 'reportes_area',      etiqueta: 'Reportes del Área',          descripcion: 'Estadísticas y reportes de la unidad',             icono: 'bar-chart-outline',        orden: 8  },
  { id: 'gestion_usuarios',   etiqueta: 'Gestión de Usuarios',        descripcion: 'Crear, editar y gestionar cuentas de usuario',     icono: 'people-outline',           orden: 9  },
  { id: 'configuracion',      etiqueta: 'Configuración del Sistema',  descripcion: 'Tipos de trámite y parámetros generales',          icono: 'settings-outline',         orden: 10 },
  { id: 'auditoria',          etiqueta: 'Reportes y Auditoría',       descripcion: 'Historial de acciones y reportes del sistema',     icono: 'stats-chart-outline',      orden: 11 },
];

// ─── Perfiles base (para selector al crear/editar rol) ───────────────────────

export type PerfilBase = 'Funcionario Municipal' | 'Jefe de Área' | 'Administrador' | 'Sin acceso';

export const MODULOS_POR_PERFIL: Record<PerfilBase, string[]> = {
  'Sin acceso':           [],
  'Funcionario Municipal':['registro_tramite', 'consulta_tramite', 'asignacion_tramite', 'documentos', 'todos_tramites'],
  'Jefe de Área':         ['consulta_tramite', 'aprobar_tramite', 'tramites_area', 'reportes_area', 'todos_tramites'],
  'Administrador':        MODULOS_DISPONIBLES.map(m => m.id),
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ResultadoPermisos {
  modulosIds: string[];
  error: string | null;
}

// ─── Obtener módulos de un rol ────────────────────────────────────────────────

export async function obtenerModulosDeRol(rol: string): Promise<ResultadoPermisos> {
  // Administrador siempre tiene todo — garantía sin BD
  if (rol === 'Administrador') {
    return { modulosIds: MODULOS_DISPONIBLES.map(m => m.id), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('roles_permisos')
      .select('modulo_id')
      .eq('rol', rol);

    if (error) {
      // Fallback a perfil base si la tabla no existe
      return {
        modulosIds: MODULOS_POR_PERFIL['Funcionario Municipal'],
        error: null,
      };
    }

    const ids = (data ?? []).map((r: any) => r.modulo_id as string);

    // Si no hay permisos configurados, usar perfil Funcionario como fallback
    if (ids.length === 0) {
      return { modulosIds: MODULOS_POR_PERFIL['Funcionario Municipal'], error: null };
    }

    // Ordenar según el orden definido localmente
    const ordenados = MODULOS_DISPONIBLES
      .filter(m => ids.includes(m.id))
      .map(m => m.id);

    return { modulosIds: ordenados, error: null };
  } catch {
    return { modulosIds: MODULOS_POR_PERFIL['Funcionario Municipal'], error: null };
  }
}

// ─── Guardar permisos de un rol (reemplaza todos) ─────────────────────────────

export async function guardarPermisosDeRol(
  rol: string,
  modulosIds: string[]
): Promise<{ exito: boolean; error?: string }> {
  // Administrador no se puede modificar
  if (rol === 'Administrador') {
    return { exito: false, error: 'Los permisos del Administrador no se pueden modificar.' };
  }

  try {
    // Borrar permisos actuales del rol
    await supabase.from('roles_permisos').delete().eq('rol', rol);

    // Insertar los nuevos
    if (modulosIds.length > 0) {
      const filas = modulosIds.map(modulo_id => ({ rol, modulo_id }));
      const { error } = await supabase.from('roles_permisos').insert(filas);
      if (error) return { exito: false, error: 'No se pudieron guardar los permisos.' };
    }

    return { exito: true };
  } catch {
    return { exito: false, error: 'Error de conexión.' };
  }
}

// ─── Obtener todos los roles con sus permisos (para pantalla de configuración) ─

export async function obtenerTodosLosPermisos(): Promise<{
  datos: Record<string, string[]>;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('roles_permisos')
      .select('rol, modulo_id');

    if (error) return { datos: {}, error: 'No se pudieron cargar los permisos.' };

    const agrupado: Record<string, string[]> = {};
    (data ?? []).forEach((r: any) => {
      if (!agrupado[r.rol]) agrupado[r.rol] = [];
      agrupado[r.rol].push(r.modulo_id);
    });

    return { datos: agrupado, error: null };
  } catch {
    return { datos: {}, error: 'Error de conexión.' };
  }
}

// ─── Obtener lista de roles existentes (distintos) ───────────────────────────

export async function obtenerRolesExistentes(): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('usuarios')
      .select('rol');

    const roles = [...new Set((data ?? []).map((r: any) => r.rol as string))];
    return roles.sort();
  } catch {
    return [];
  }
}