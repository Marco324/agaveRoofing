import assert from 'node:assert';
import { fechaRealHoy, fechaSimulada, hoy, infoFecha } from '../src/fechaReferencia.ts';

// No toca la base de datos: solo la lógica de "hoy".
const original = process.env.FECHA_HOY;

try {
  // 1. Zona horaria del negocio: 17 nov 2026 a las 8 pm en San Antonio
  //    ya es 18 nov en UTC, pero el negocio sigue en el 17.
  assert.strictEqual(fechaRealHoy(new Date('2026-11-18T02:00:00Z')), '2026-11-17');
  assert.strictEqual(fechaRealHoy(new Date('2026-11-17T15:00:00Z')), '2026-11-17');

  // 2. Sin FECHA_HOY: hoy() es la fecha real
  delete process.env.FECHA_HOY;
  assert.strictEqual(fechaSimulada(), null);
  assert.strictEqual(hoy(), fechaRealHoy());
  assert.strictEqual(infoFecha().simulada, false);

  // 3. Con FECHA_HOY válida: se usa esa fecha
  process.env.FECHA_HOY = '2026-11-12';
  assert.strictEqual(hoy(), '2026-11-12');
  const info = infoFecha();
  assert.strictEqual(info.simulada, true);
  assert.strictEqual(info.hoy, '2026-11-12');
  assert.strictEqual(info.zonaHoraria, 'America/Chicago');

  // 4. FECHA_HOY inválida (formato o día inexistente): se ignora
  for (const mala of ['12/11/2026', '2026-02-30', 'mañana']) {
    process.env.FECHA_HOY = mala;
    assert.strictEqual(fechaSimulada(), null, mala);
    assert.strictEqual(hoy(), fechaRealHoy(), mala);
  }

  console.log('✅ fecha_referencia: 4 grupos de pruebas OK');
} finally {
  if (original === undefined) delete process.env.FECHA_HOY;
  else process.env.FECHA_HOY = original;
}
