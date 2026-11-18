import assert from 'node:assert';
import path from 'node:path';

// Esta prueba siembra su propia base: nunca debe tocar la de la demo.
assert.ok(
  process.env.AGAVE_DB_PATH && !process.env.AGAVE_DB_PATH.endsWith('agavealerta.db'),
  'Ejecuta con AGAVE_DB_PATH apuntando a una base de prueba (npm run test:pasadas)'
);

// "Hoy" fijo para que la prueba no dependa del reloj real.
process.env.FECHA_HOY = '2026-11-13';

const { runSeed } = await import('../src/seed.ts');
const { db } = await import('../src/db.ts');
const { cerrarCitasPasadas } = await import('../src/services/citasPasadasService.ts');
const { transicionar, ErrorTransicionInvalida } = await import('../src/services/maquinaEstadosService.ts');
const {
  registrarLlegadaInspector,
  registrarResultadoInspeccion,
  registrarClienteAusente
} = await import('../src/services/ejecucionSincronizacionService.ts');
const { obtenerMisCitas } = await import('../src/services/misCitasClienteService.ts');
const { EstadoInspeccion, ESTADOS_QUE_VENCEN_SIN_VISITA, ESTADOS_VISITA_EN_CURSO } = await import(
  '../../shared/src/types/estados.ts'
);

type Fila = { id_inspeccion: number; folio: string; fecha_programada: string; estado: string; id_cliente: number };
const todas = () =>
  db.prepare('SELECT id_inspeccion, folio, fecha_programada, estado, id_cliente FROM inspeccion ORDER BY id_inspeccion').all() as Fila[];
const estadoDe = (id: number) =>
  (db.prepare('SELECT estado FROM inspeccion WHERE id_inspeccion = ?').get(id) as { estado: string }).estado;

console.log(`\n🧪 Citas pasadas (base: ${path.basename(process.env.AGAVE_DB_PATH!)})`);
runSeed();

// ---------------------------------------------------------------------------
// 1. Corte al 12 nov: lo anterior se cierra, lo de ese día en adelante no cambia
// ---------------------------------------------------------------------------
const antes = todas();
const r1 = cerrarCitasPasadas('2026-11-12');
const despues = new Map(todas().map((f) => [f.id_inspeccion, f]));

let esperadasNoRealizadas = 0;
let esperadasPendientes = 0;
for (const f of antes) {
  const ahora = despues.get(f.id_inspeccion)!;
  if (f.fecha_programada >= '2026-11-12') {
    assert.strictEqual(ahora.estado, f.estado, `${f.folio} (${f.fecha_programada}) no debe cambiar`);
  } else if ((ESTADOS_QUE_VENCEN_SIN_VISITA as readonly string[]).includes(f.estado)) {
    assert.strictEqual(ahora.estado, EstadoInspeccion.NO_REALIZADA, `${f.folio} debe quedar NO_REALIZADA`);
    esperadasNoRealizadas++;
  } else if ((ESTADOS_VISITA_EN_CURSO as readonly string[]).includes(f.estado)) {
    assert.strictEqual(ahora.estado, EstadoInspeccion.PENDIENTE_CIERRE, `${f.folio} debe quedar PENDIENTE_CIERRE`);
    esperadasPendientes++;
  } else {
    // Ya cerrada, o REPROG_SOLICITADA esperando respuesta de la oficina
    assert.strictEqual(ahora.estado, f.estado, `${f.folio} no debe cambiar (${f.estado})`);
  }
}
assert.ok(esperadasNoRealizadas > 0, 'El seed debe tener citas pasadas sin visita');
assert.strictEqual(r1.noRealizadas.length, esperadasNoRealizadas);
assert.strictEqual(r1.pendientesDeCierre.length, esperadasPendientes);
console.log(`  ✔ Corte 2026-11-12: ${r1.noRealizadas.length} NO_REALIZADA, ${r1.pendientesDeCierre.length} PENDIENTE_CIERRE; lo demás intacto.`);

// Queda en el historial como SISTEMA
const idNoRealizada = r1.noRealizadas[0].idInspeccion;
const hist = db
  .prepare(`SELECT origen, nota FROM inspeccion_historial WHERE id_inspeccion = ? AND estado_nuevo = 'NO_REALIZADA'`)
  .get(idNoRealizada) as { origen: string; nota: string };
assert.strictEqual(hist.origen, 'SISTEMA');
assert.match(hist.nota, /Cierre automático/);
console.log('  ✔ Cada cierre queda en el historial con origen SISTEMA.');

// Idempotente
const r1b = cerrarCitasPasadas('2026-11-12');
assert.strictEqual(r1b.noRealizadas.length + r1b.pendientesDeCierre.length, 0);
console.log('  ✔ Ejecutarlo dos veces no cambia nada.');

// ---------------------------------------------------------------------------
// 2. Al día siguiente, las visitas en curso del 12 quedan pendientes de cierre
// ---------------------------------------------------------------------------
const enCursoDel12 = todas().filter(
  (f) => f.fecha_programada === '2026-11-12' && (ESTADOS_VISITA_EN_CURSO as readonly string[]).includes(f.estado)
);
assert.ok(enCursoDel12.length > 0, 'El seed debe tener una visita en curso el 12 nov');
const r2 = cerrarCitasPasadas('2026-11-13');
for (const f of enCursoDel12) {
  assert.strictEqual(estadoDe(f.id_inspeccion), EstadoInspeccion.PENDIENTE_CIERRE);
  const activos = db
    .prepare(`SELECT COUNT(*) AS n FROM trayecto WHERE id_inspeccion = ? AND estado = 'ACTIVO'`)
    .get(f.id_inspeccion) as { n: number };
  assert.strictEqual(activos.n, 0, 'No debe quedar ningún trayecto activo (GPS)');
}
console.log(`  ✔ Corte 2026-11-13: ${r2.pendientesDeCierre.length} visita(s) en curso → PENDIENTE_CIERRE, sin trayectos activos.`);

// ---------------------------------------------------------------------------
// 3. El inspector cierra tarde una visita pendiente → COMPLETADA
// ---------------------------------------------------------------------------
const pendiente = enCursoDel12[0].id_inspeccion;
const foto = { tipo: 'FOTO_TECHO', rutaArchivo: 'https://example.com/techo.jpg', descripcion: 'Techo' } as const;
registrarResultadoInspeccion(pendiente, {
  estadoTecho: 'BUENO',
  hallazgos: 'Capturado sin señal y sincronizado al día siguiente',
  requiereReparacion: false,
  evidencias: [foto, { ...foto, rutaArchivo: 'https://example.com/techo2.jpg' }]
} as any);
assert.strictEqual(estadoDe(pendiente), EstadoInspeccion.COMPLETADA);
console.log('  ✔ PENDIENTE_CIERRE + resultado tardío → COMPLETADA.');

// ---------------------------------------------------------------------------
// 4. Visita hecha sin señal que el barrido ya marcó NO_REALIZADA:
//    llega la llegada (se reabre, sin avisar al cliente) y luego la ausencia
// ---------------------------------------------------------------------------
const noRealizada = r1.noRealizadas[0];
const notifAntes = (db
  .prepare(`SELECT COUNT(*) AS n FROM notificacion WHERE id_inspeccion = ? AND tipo = 'LLEGADA'`)
  .get(noRealizada.idInspeccion) as { n: number }).n;
const llegada = registrarLlegadaInspector(noRealizada.idInspeccion, {
  registradoSinSenal: true,
  ocurridoEn: '2026-10-15T15:10:00.000Z',
  idLocal: 'prueba-llegada-tardia'
} as any);
assert.strictEqual(llegada.estado, EstadoInspeccion.PENDIENTE_CIERRE);
assert.strictEqual(estadoDe(noRealizada.idInspeccion), EstadoInspeccion.PENDIENTE_CIERRE);
const notifDespues = (db
  .prepare(`SELECT COUNT(*) AS n FROM notificacion WHERE id_inspeccion = ? AND tipo = 'LLEGADA'`)
  .get(noRealizada.idInspeccion) as { n: number }).n;
assert.strictEqual(notifDespues, notifAntes, 'No se avisa "tu inspector llegó" días después');
registrarClienteAusente(noRealizada.idInspeccion, {
  nota: 'Nadie abrió (registrado sin señal)',
  rutaFotoEvidencia: 'https://example.com/fachada.jpg',
  registradoSinSenal: true,
  ocurridoEn: '2026-10-15T15:20:00.000Z'
} as any);
assert.strictEqual(estadoDe(noRealizada.idInspeccion), EstadoInspeccion.CLIENTE_AUSENTE);
console.log(`  ✔ ${noRealizada.folio}: NO_REALIZADA + llegada tardía → PENDIENTE_CIERRE → CLIENTE_AUSENTE (sin aviso de llegada).`);

// ---------------------------------------------------------------------------
// 5. Transiciones permitidas y prohibidas
// ---------------------------------------------------------------------------
const otraNoRealizada = r1.noRealizadas.find((c) => estadoDe(c.idInspeccion) === EstadoInspeccion.NO_REALIZADA)!;
transicionar(otraNoRealizada.idInspeccion, EstadoInspeccion.REPROGRAMADA, undefined, 'PANEL', 'Nueva fecha');
assert.strictEqual(estadoDe(otraNoRealizada.idInspeccion), EstadoInspeccion.REPROGRAMADA);
assert.throws(
  () => transicionar(pendiente, EstadoInspeccion.NO_REALIZADA, undefined, 'SISTEMA'),
  ErrorTransicionInvalida,
  'COMPLETADA es final'
);
console.log('  ✔ NO_REALIZADA → REPROGRAMADA permitida; COMPLETADA sigue siendo final.');

// Una solicitud de reprogramación pendiente no vence sola, y al aprobarse
// sobre una cita vencida la cita vuelve al flujo normal.
const reprogPendiente = antes.find((f) => f.estado === 'REPROG_SOLICITADA' && f.fecha_programada < '2026-11-12');
if (reprogPendiente) {
  assert.strictEqual(estadoDe(reprogPendiente.id_inspeccion), 'REPROG_SOLICITADA');
  console.log(`  ✔ ${reprogPendiente.folio}: REPROG_SOLICITADA con fecha pasada espera a la oficina.`);
}
const { solicitarReprogramacion, resolverReprogramacion } = await import(
  '../src/services/confirmacionReprogramacionService.ts'
);
const vencida = r1.noRealizadas.find(
  (c) =>
    estadoDe(c.idInspeccion) === EstadoInspeccion.NO_REALIZADA &&
    (db.prepare('SELECT veces_reprogramada AS v FROM inspeccion WHERE id_inspeccion = ?').get(c.idInspeccion) as any).v < 2
)!;
const solicitud = solicitarReprogramacion(vencida.idInspeccion, {
  fechaSolicitada: '2026-11-24',
  ventanaInicioSolicitada: '08:00',
  ventanaFinSolicitada: '08:45',
  motivo: 'No pude estar ese día'
} as any);
assert.strictEqual(solicitud.inspeccion.estado, EstadoInspeccion.REPROG_SOLICITADA);
const aprobada = resolverReprogramacion((solicitud.solicitud as any).id_reprogramacion, {
  aprobada: true,
  resueltaPor: 'u-admin-001'
} as any);
assert.strictEqual(aprobada.inspeccion.estado, EstadoInspeccion.NOTIFICADA);
assert.strictEqual(aprobada.inspeccion.fecha_programada, '2026-11-24');
assert.strictEqual(aprobada.inspeccion.folio, vencida.folio, 'Conserva el folio (RN-06)');
const r3 = cerrarCitasPasadas('2026-11-13');
assert.ok(!r3.noRealizadas.some((c) => c.idInspeccion === vencida.idInspeccion), 'Con fecha futura ya no vence');
assert.strictEqual(estadoDe(vencida.idInspeccion), EstadoInspeccion.NOTIFICADA);
// En cambio, la que quedó REPROGRAMADA con fecha pasada (paso 5) sí vuelve a vencer.
assert.ok(r3.noRealizadas.some((c) => c.idInspeccion === otraNoRealizada.idInspeccion));
console.log(`  ✔ ${vencida.folio}: NO_REALIZADA → cliente pide fecha → oficina aprueba → NOTIFICADA el 2026-11-24.`);

// ---------------------------------------------------------------------------
// 6. El cliente nunca ve una cita pasada como "próxima"
// ---------------------------------------------------------------------------
for (const idCliente of new Set(todas().map((f) => f.id_cliente))) {
  const { proximaCita } = obtenerMisCitas(idCliente) as any;
  if (proximaCita) {
    assert.ok(proximaCita.fechaProgramada >= '2026-11-13', `Cliente ${idCliente}: próxima cita en el pasado`);
    assert.ok(!['NO_REALIZADA', 'PENDIENTE_CIERRE'].includes(proximaCita.estado));
  }
}
console.log('  ✔ Ningún cliente tiene una "próxima inspección" con fecha pasada.');

// ---------------------------------------------------------------------------
// 7. Oficina y cliente: nuevas fechas para citas vencidas
// ---------------------------------------------------------------------------
const { moverInspeccion } = await import('../src/services/agendaService.ts');
const { obtenerHorariosDisponibles } = await import('../src/services/confirmacionReprogramacionService.ts');
const { obtenerTableroIndicadores } = await import('../src/services/indicadoresService.ts');

cerrarCitasPasadas('2026-11-13');
const vencidas = todas().filter((f) => f.estado === 'NO_REALIZADA');
assert.ok(vencidas.length >= 2, 'Debe haber citas vencidas para probar');

// Horarios: nunca en el pasado
const horarios = obtenerHorariosDisponibles(vencidas[0].id_inspeccion);
assert.ok(horarios.length > 0);
assert.ok(horarios.every((h) => h.fecha > '2026-11-13'), 'No se ofrecen días pasados');
console.log(`  ✔ Horarios para una cita vencida empiezan después de hoy (${horarios[0].fecha}).`);

// Mover a una fecha pasada: rechazado
assert.throws(
  () => moverInspeccion(vencidas[0].id_inspeccion, { nuevaFecha: '2026-11-10', nuevaVentanaInicio: '09:00', nuevaVentanaFin: '11:00' } as any),
  /ya pasó/
);
// Mover a fecha futura: vuelve al flujo normal
const movida = moverInspeccion(vencidas[0].id_inspeccion, {
  nuevaFecha: '2026-11-25',
  nuevaVentanaInicio: '07:00',
  nuevaVentanaFin: '07:45',
  motivo: 'Visita perdida'
} as any) as any;
assert.strictEqual(movida.estado, EstadoInspeccion.REPROGRAMADA);
assert.strictEqual(movida.fecha_programada, '2026-11-25');
console.log('  ✔ Oficina mueve una NO_REALIZADA a fecha futura → REPROGRAMADA (fecha pasada rechazada).');

// Una visita sin cerrar no se puede mover ni reprogramar por el cliente
const idPend = enCursoDel12[1]?.id_inspeccion;
if (idPend && estadoDe(idPend) === 'PENDIENTE_CIERRE') {
  assert.throws(
    () => moverInspeccion(idPend, { nuevaFecha: '2026-11-26', nuevaVentanaInicio: '09:00', nuevaVentanaFin: '11:00' } as any),
    /sin cerrar/
  );
  assert.throws(() =>
    solicitarReprogramacion(idPend, { fechaSolicitada: '2026-11-26', ventanaInicioSolicitada: '09:00' } as any)
  );
  console.log('  ✔ PENDIENTE_CIERRE no se puede mover ni reprogramar.');
}

// Indicadores
const ind = obtenerTableroIndicadores('2026-10-01', '2026-11-30') as any;
const noRealizadasBD = todas().filter((f) => f.estado === 'NO_REALIZADA').length;
assert.strictEqual(ind.tarjetas.noRealizadas, noRealizadasBD);
assert.ok(typeof ind.tarjetas.tasaNoRealizadasPct === 'number');
assert.ok(typeof ind.tarjetas.pendientesCierre === 'number');
console.log(`  ✔ Indicadores: ${ind.tarjetas.noRealizadas} no realizadas (${ind.tarjetas.tasaNoRealizadasPct}%), ${ind.tarjetas.pendientesCierre} sin cerrar.`);

console.log('✅ citas_pasadas: todas las pruebas OK\n');
