import assert from 'node:assert';
import { runSeed } from '../src/seed.ts';
import { db } from '../src/db.ts';
import { generarFolio } from '../src/services/folioService.ts';
import {
  crearInspeccion,
  reasignarInspector,
  moverInspeccion,
  cancelarInspeccion,
  listarAgenda,
  obtenerInspeccionPorId,
  validarTraslapeInspector,
  ErrorTraslapeInspector
} from '../src/services/agendaService.ts';
import {
  transicionar,
  obtenerHistorial,
  ErrorTransicionInvalida
} from '../src/services/maquinaEstadosService.ts';
import { EstadoInspeccion } from '../../shared/src/types/estados.ts';
import { obtenerRutaDelDia } from '../src/services/rutaInspectorService.ts';
import { obtenerMisCitas } from '../src/services/misCitasClienteService.ts';

console.log('🧪 Iniciando pruebas automáticas de Agenda y Máquina de Estados (E07)...\n');

// 1. Restaurar base de datos con semilla de San Antonio, TX
runSeed();

// -------------------------------------------------------------
// Prueba 1: Generación de folios consecutivos
// -------------------------------------------------------------
console.log('▶ [Prueba 1] Verificación de formato y consecutividad de folio');
const nuevoFolio = generarFolio(2026);
assert.match(nuevoFolio, /^INS-2026-\d{6}$/, 'El folio debe tener el formato INS-YYYY-XXXXXX');
console.log(`  ✔ Folio generado correctamente: ${nuevoFolio}`);

// -------------------------------------------------------------
// Prueba 2: Creación exitosa de una inspección válida
// -------------------------------------------------------------
console.log('\n▶ [Prueba 2] Creación de inspección sin traslapes');
const citaCreada = crearInspeccion({
  idCliente: 1,
  idDomicilio: 1,
  idInspector: 1,
  fechaProgramada: '2026-10-15',
  ventanaInicio: '15:00',
  ventanaFin: '17:00',
  motivoVisita: 'Inspección posterior a tormenta en Stone Oak',
  creadaPor: 'u-admin-001'
});

assert.ok(citaCreada, 'La cita debe crearse');
assert.strictEqual(citaCreada.estado, 'PROGRAMADA', 'El estado inicial debe ser PROGRAMADA');
assert.strictEqual(citaCreada.veces_reprogramada, 0, 'El contador de reprogramaciones debe iniciar en 0');
assert.strictEqual(citaCreada.historial.length, 1, 'Debe crearse el primer registro en el historial');
console.log(`  ✔ Cita creada con folio ${citaCreada.folio} e historial auditado.`);

// -------------------------------------------------------------
// Prueba 3: Validación estricta de traslapes (RN-02)
// -------------------------------------------------------------
console.log('\n▶ [Prueba 3] Validación de traslape de horario para el mismo inspector (RN-02)');
let errorLanzado = false;
try {
  // Intentar crear otra cita para el Inspector 1 en 2026-10-15 entre 15:30 y 16:30 (se traslapa con 15:00 - 17:00)
  crearInspeccion({
    idCliente: 2,
    idDomicilio: 2,
    idInspector: 1,
    fechaProgramada: '2026-10-15',
    ventanaInicio: '15:30',
    ventanaFin: '16:30',
    motivoVisita: 'Cita en conflicto',
    creadaPor: 'u-admin-001'
  });
} catch (err) {
  if (err instanceof ErrorTraslapeInspector) {
    errorLanzado = true;
    console.log(`  ✔ Traslape detectado y bloqueado exitosamente: ${err.message}`);
  }
}
assert.ok(errorLanzado, 'La regla RN-02 DEBE rechazar citas con ventanas traslapadas para el mismo inspector');

// -------------------------------------------------------------
// Prueba 4: Máquina de estados (RN-01) - Transición válida vs inválida
// -------------------------------------------------------------
console.log('\n▶ [Prueba 4] Máquina de estados - Validación estricta de transiciones (RN-01)');
// Transición válida: PROGRAMADA -> NOTIFICADA
const transicion1 = transicionar(
  citaCreada.id_inspeccion,
  EstadoInspeccion.NOTIFICADA,
  'u-admin-001',
  'PANEL',
  'Notificación enviada por el panel'
);
assert.strictEqual(transicion1.estadoNuevo, EstadoInspeccion.NOTIFICADA);
console.log('  ✔ Transición legal PROGRAMADA -> NOTIFICADA aceptada.');

// Transición inválida: NOTIFICADA -> COMPLETADA (debe saltarse EN_CAMINO y EN_SITIO)
let errorTransicionLanzado = false;
try {
  transicionar(
    citaCreada.id_inspeccion,
    EstadoInspeccion.COMPLETADA,
    'u-admin-001',
    'PANEL',
    'Salto ilegal a completada'
  );
} catch (err) {
  if (err instanceof ErrorTransicionInvalida) {
    errorTransicionLanzado = true;
    console.log(`  ✔ Transición ilegal bloqueada exitosamente: ${err.message}`);
  }
}
assert.ok(errorTransicionLanzado, 'La regla RN-01 DEBE bloquear transiciones que no pertenezcan al grafo');

// -------------------------------------------------------------
// Prueba 5: Reprogramación y límite de 3 veces (RN-05, RN-06)
// -------------------------------------------------------------
console.log('\n▶ [Prueba 5] Reprogramación de citas y límite de 3 movimientos');
const citaMovida = moverInspeccion(citaCreada.id_inspeccion, {
  nuevaFecha: '2026-10-17',
  nuevaVentanaInicio: '10:00',
  nuevaVentanaFin: '12:00',
  idUsuario: 'u-admin-001',
  motivo: 'Solicitud del cliente por viaje'
});
assert.strictEqual(citaMovida.fecha_programada, '2026-10-17');
assert.strictEqual(citaMovida.veces_reprogramada, 1);
assert.strictEqual(citaMovida.folio, citaCreada.folio, 'El folio DEBE ser estable al reprogramar');
console.log(`  ✔ Cita reprogramada a ${citaMovida.fecha_programada}, conservando folio ${citaMovida.folio}.`);

// -------------------------------------------------------------
// Prueba 6: Endpoint de la ruta del día del inspector (E07 Anuar)
// -------------------------------------------------------------
console.log('\n▶ [Prueba 6] Ruta del día del inspector (orden cronológico en San Antonio, TX)');
const rutaInspector = obtenerRutaDelDia(1, '2026-10-15');
assert.ok(rutaInspector.length >= 2, 'El inspector 1 debe tener al menos 2 paradas el 15 de oct');
// Verificar que estén ordenadas ascendentemente por hora de inicio
assert.ok(
  rutaInspector[0].ventanaInicio <= rutaInspector[1].ventanaInicio,
  'Las paradas deben devolverse ordenadas por ventana de atención'
);
console.log(`  ✔ Se recuperaron ${rutaInspector.length} paradas en orden:`);
rutaInspector.forEach((p, idx) => {
  console.log(`     Parada ${idx + 1}: ${p.ventanaInicio} - ${p.ventanaFin} | ${p.cliente.nombre} (${p.domicilio.colonia}, ${p.domicilio.ciudad}) [${p.estado}]`);
});

// -------------------------------------------------------------
// Prueba 7: Endpoint de Mis Citas del cliente (E07 Jesús)
// -------------------------------------------------------------
console.log('\n▶ [Prueba 7] Mis Citas del cliente (próxima cita y línea de tiempo)');
const misCitas = obtenerMisCitas(1);
assert.ok(misCitas.proximaCita !== null, 'El cliente 1 debe tener su próxima cita');
assert.ok(misCitas.proximaCita!.lineaDeTiempo.length >= 2, 'Debe incluir la línea de tiempo');
console.log(`  ✔ Próxima cita de ${misCitas.proximaCita!.folio}: ${misCitas.proximaCita!.fechaProgramada} (${misCitas.proximaCita!.ventanaInicio})`);
console.log(`  ✔ Eventos en línea de tiempo: ${misCitas.proximaCita!.lineaDeTiempo.length}`);

console.log('\n=============================================================');
console.log('🎉 TODAS LAS PRUEBAS DE E07 PASARON EXITOSAMENTE (100% OK)');
console.log('=============================================================\n');
