import type { RutaParadaDTO } from '../../../shared/src/types/dtos.ts';

const CACHE_STORAGE_KEY = 'agave_inspector_ruta_cache';

let memoriaLocal: Record<string, RutaParadaDTO[]> = {};

/**
 * Servicio de caché local offline para la app del inspector (E07 Anuar IN).
 * Garantiza que ante pérdidas de señal celular en San Antonio, TX,
 * el técnico conserve acceso a la información de sus paradas del día.
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
