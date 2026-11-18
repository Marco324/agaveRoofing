/**
 * Fecha de negocio ("hoy") del sistema.
 *
 * - Por defecto es la fecha actual en San Antonio, TX (America/Chicago), no en
 *   UTC: a partir de las 6 pm locales UTC ya marca el día siguiente.
 * - Con la variable de entorno `FECHA_HOY=AAAA-MM-DD` se fija una fecha de
 *   referencia, para que la demo y las pruebas sean reproducibles.
 *
 * Solo afecta decisiones por día (próxima cita, ruta por defecto, citas
 * pasadas). Las marcas de tiempo (GPS, bitácora, sincronización) siguen
 * usando el reloj real.
 */

export const ZONA_HORARIA = 'America/Chicago';

let avisoMostrado = false;

const FORMATO_ISO = /^\d{4}-\d{2}-\d{2}$/;

function esFechaValida(valor: string): boolean {
  if (!FORMATO_ISO.test(valor)) return false;
  const d = new Date(`${valor}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(valor);
}

/** Fecha configurada en `FECHA_HOY`, o `null` si no hay (o no es válida). */
export function fechaSimulada(): string | null {
  const valor = process.env.FECHA_HOY?.trim();
  if (!valor) return null;
  if (!esFechaValida(valor)) {
    if (avisoMostrado) return null;
    avisoMostrado = true;
    console.warn(`[fecha] FECHA_HOY="${valor}" no es una fecha AAAA-MM-DD válida; se usa la fecha real.`);
    return null;
  }
  return valor;
}

/** Fecha real de hoy en la zona horaria del negocio (`AAAA-MM-DD`). */
export function fechaRealHoy(ahora: Date = new Date()): string {
  // en-CA da el formato AAAA-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(ahora);
}

/** "Hoy" para el negocio: la fecha simulada si existe, si no la real. */
export function hoy(): string {
  return fechaSimulada() ?? fechaRealHoy();
}

/** Datos para `GET /api/sistema/fecha`. */
export function infoFecha() {
  const simulada = fechaSimulada();
  return {
    hoy: simulada ?? fechaRealHoy(),
    simulada: simulada !== null,
    fechaReal: fechaRealHoy(),
    zonaHoraria: ZONA_HORARIA
  };
}
