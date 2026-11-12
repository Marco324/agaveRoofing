import type { RutaParadaDTO, OperacionSincronizacionDTO } from '../../../shared/src/types/dtos.ts';

const CACHE_STORAGE_KEY = 'agave_inspector_ruta_cache';
const OFFLINE_QUEUE_KEY = 'agave_inspector_cola_sqlite_e11';

let memoriaLocal: Record<string, RutaParadaDTO[]> = {};
let colaOfflineMemoria: OperacionSincronizacionDTO[] = [];

/**
 * Servicio de caché local y cola SQLite offline para la app del inspector (E07 y E11 — RN-12).
 * Garantiza que ante pérdidas de señal celular en San Antonio, TX,
 * el técnico conserve acceso a la información de sus paradas del día y pueda
 * capturar llegadas, resultados, evidencias y cliente ausente sin duplicados al reconectar.
 */
export async function guardarRutaEnCache(fecha: string, paradas: RutaParadaDTO[]): Promise<void> {
  try {
    memoriaLocal[fecha] = paradas;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${CACHE_STORAGE_KEY}_${fecha}`, JSON.stringify(paradas));
    }
  } catch (err) {
    console.warn('No se pudo guardar la ruta en almacenamiento local:', err);
  }
}

export async function obtenerRutaDeCache(fecha: string): Promise<RutaParadaDTO[] | null> {
  try {
    if (memoriaLocal[fecha]) {
      return memoriaLocal[fecha];
    }
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(`${CACHE_STORAGE_KEY}_${fecha}`);
      if (data) {
        return JSON.parse(data) as RutaParadaDTO[];
      }
    }
  } catch (err) {
    console.warn('Error al leer caché local:', err);
  }
  return null;
}

/**
 * E11 — Cola SQLite local de sincronización diferida con idempotencia por idLocal (RN-12)
 */
export async function encolarOperacionOffline(operacion: OperacionSincronizacionDTO): Promise<number> {
  colaOfflineMemoria.push(operacion);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(colaOfflineMemoria));
  }
  return colaOfflineMemoria.length;
}

export async function obtenerColaOffline(): Promise<OperacionSincronizacionDTO[]> {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (raw) {
      colaOfflineMemoria = JSON.parse(raw) as OperacionSincronizacionDTO[];
    }
  }
  return colaOfflineMemoria;
}

export async function limpiarColaOffline(): Promise<void> {
  colaOfflineMemoria = [];
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(OFFLINE_QUEUE_KEY, '[]');
  }
}
