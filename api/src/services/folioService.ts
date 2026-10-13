import { db } from '../db.ts';

/**
 * Servicio para generación de folios consecutivos anuales (E07 Jorge BD).
 * Formato normativo: INS-2026-000124 (único y estable al reprogramar).
 */
export function generarFolio(anio: number = new Date().getFullYear()): string {
  const patron = `INS-${anio}-%`;
  const row = db.prepare(`
    SELECT folio FROM inspeccion
    WHERE folio LIKE ?
    ORDER BY id_inspeccion DESC
    LIMIT 1
  `).get(patron) as { folio: string } | undefined;

  let secuencia = 1;
  if (row && row.folio) {
    const partes = row.folio.split('-');
    if (partes.length === 3) {
      const ultimaSecuencia = parseInt(partes[2], 10);
      if (!isNaN(ultimaSecuencia)) {
        secuencia = ultimaSecuencia + 1;
      }
    }
  }

  const strSecuencia = String(secuencia).padStart(6, '0');
  return `INS-${anio}-${strSecuencia}`;
}
