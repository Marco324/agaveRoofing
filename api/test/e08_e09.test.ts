import assert from 'node:assert';
import { runSeed } from '../src/seed.ts';
import { db } from '../src/db.ts';
import {
  registrarDispositivo,
  renderizarPlantilla,
  ajustarPorHorarioSilencio,
  encolarNotificacion,
  despacharNotificacionesPendientes,
  ejecutarTemporizadorAvisoDiaProgramado,
  ejecutarTemporizadorRecordatorioPrevio,
  reenviarNotificacionManual,
  listarNotificacionesPanel,
  ErrorNotificacionDuplicadaRN13
} from '../src/services/notificacionService.ts';
import {
  confirmarInspeccion,
  obtenerHorariosDisponibles,
  solicitarReprogramacion,
  resolverReprogramacion,
  ejecutarTemporizadorSinConfirmar,
  listarBandejaReprogramaciones,
  listarCitasSinConfirmar,
  ErrorReprogramacionEnCaminoRN05,
  ErrorLimiteReprogramacionesRN06
} from '../src/services/confirmacionReprogramacionService.ts';
import { transicionar } from '../src/services/maquinaEstadosService.ts';
import { crearInspeccion } from '../src/services/agendaService.ts';
import { EstadoInspeccion, TipoNotificacion } from '../../shared/src/types/estados.ts';

console.log('🧪 Iniciando pruebas automáticas de E08 (Notificaciones Push/SMS) y E09 (Confirmación y Reprogramación)...\n');

// Restaurar semilla base
runSeed();

// ============================================================================
// BLOQUE E08 — MOTOR DE NOTIFICACIONES PUSH Y RESPALDO SMS (22 de octubre)
// ============================================================================

console.log('▶ [Prueba E08-1] Registro y actualización idempotente de dispositivo móvil (Expo Push Token)');
const dispNuevo = registrarDispositivo({
  idUsuario: 'u-cli-001',
  tokenPush: 'ExponentPushToken[cli-robert-ipad-pro]',
  plataforma: 'IOS',
  versionApp: '1.4.0'
});
assert.strictEqual(dispNuevo.activo, 1);
const dispActualizado = registrarDispositivo({
  idUsuario: 'u-cli-001',
  tokenPush: 'ExponentPushToken[cli-robert-ipad-pro]',
  plataforma: 'IOS',
  versionApp: '1.5.0'
});
assert.strictEqual(dispActualizado.id_dispositivo, dispNuevo.id_dispositivo, 'No debe duplicar el dispositivo al actualizar el mismo token');
assert.strictEqual(dispActualizado.version_app, '1.5.0');
console.log('  ✔ Dispositivo registrado y actualizado correctamente sin duplicados.');

console.log('\n▶ [Prueba E08-2] Renderizado de plantillas y sustitución de variables');
const textoRenderizado = renderizarPlantilla(
  'Hola {{cliente}}: su inspección es el {{fecha}} entre {{ventana}} con {{inspector}}.',
  {
    cliente: 'Sarah Jenkins',
    fecha: '2026-10-29',
    ventana: '11:30 - 13:30',
    inspector: 'Carlos Garza'
  }
);
assert.strictEqual(
  textoRenderizado,
  'Hola Sarah Jenkins: su inspección es el 2026-10-29 entre 11:30 - 13:30 con Carlos Garza.'
);
console.log(`  ✔ Plantilla renderizada: "${textoRenderizado}"`);

console.log('\n▶ [Prueba E08-3] Horario de silencio nocturno (21:00 a 07:00) (RN-14)');
const noUrgenteNocturna = ajustarPorHorarioSilencio('2026-10-28T22:45:00Z', false);
assert.strictEqual(noUrgenteNocturna.reprogramadaPorSilencio, true);
assert.strictEqual(noUrgenteNocturna.programadaPara, '2026-10-29T07:00:00Z');
console.log(`  ✔ Notificación no urgente de las 22:45 reprogramada automáticamente a ${noUrgenteNocturna.programadaPara}.`);

const urgenteNocturna = ajustarPorHorarioSilencio('2026-10-28T22:45:00Z', true);
assert.strictEqual(urgenteNocturna.reprogramadaPorSilencio, false);
assert.strictEqual(urgenteNocturna.programadaPara, '2026-10-28T22:45:00Z');
console.log('  ✔ Notificación urgente (EN_CAMINO / POR_LLEGAR) ignora el horario de silencio (RN-14).');

console.log('\n▶ [Prueba E08-4] Temporizador de aviso 24h antes, bloqueo de duplicados (RN-13) y reenvío manual');
const resTemporizadorDia = ejecutarTemporizadorAvisoDiaProgramado('2026-10-16');
assert.strictEqual(resTemporizadorDia.totalNotificadas, 1, 'La cita INS-2026-000004 del 2026-10-16 debe notificarse');

// Intentar encolar de nuevo DIA_PROGRAMADO automático para la misma cita (debe fallar por RN-13)
let bloqueoRN13 = false;
try {
  encolarNotificacion({
    idInspeccion: 4,
    tipo: TipoNotificacion.DIA_PROGRAMADO,
    reenvioManual: false
  });
} catch (err) {
  if (err instanceof ErrorNotificacionDuplicadaRN13) {
    bloqueoRN13 = true;
    console.log(`  ✔ Duplicado automático bloqueado por RN-13: ${err.message}`);
  }
}
assert.ok(bloqueoRN13, 'RN-13 debe impedir dos notificaciones automáticas del mismo tipo para la misma cita');

// Reenvío manual desde el panel sí debe permitirse
const notifOriginalId = resTemporizadorDia.citas[0].idNotificacion;
const reenviada = reenviarNotificacionManual(notifOriginalId, 'u-admin-001');
assert.strictEqual(reenviada.reenvio_manual, 1);
assert.strictEqual(reenviada.estado, 'ENTREGADA');
console.log(`  ✔ Reenvío manual exitoso (id_notificacion=${reenviada.id_notificacion}, reenvio_manual=1).`);

console.log('\n▶ [Prueba E08-5] Fallo de token Push (Token vencido) y respaldo automático por SMS (Twilio)');
// Registrar un token inválido para el cliente 4 (Elena Rodriguez)
const dispInvalido = registrarDispositivo({
  idUsuario: 'u-cli-004',
  tokenPush: 'ExponentPushToken[INVALID_TOKEN_EXPIRED_999]',
  plataforma: 'IOS',
  versionApp: '1.4.0'
});
const notifFallida = encolarNotificacion({
  idInspeccion: 8,
  tipo: TipoNotificacion.RECORDATORIO,
  programadaPara: '2026-10-28T12:00:00Z'
});
const resDespacho = despacharNotificacionesPendientes('2026-10-28T15:00:00Z');
const itemFallido = resDespacho.resultados.find((r) => r.idNotificacion === notifFallida.id_notificacion);
assert.ok(itemFallido, 'Debe haberse procesado la notificación con token vencido');
assert.strictEqual(itemFallido.estado, 'FALLIDA');
assert.ok(itemFallido.respaldoSmsId, 'Debe haberse generado automáticamente una notificación de respaldo por SMS');

const dispTrasFallo = db.prepare('SELECT activo FROM dispositivo WHERE id_dispositivo = ?').get(dispInvalido.id_dispositivo) as any;
assert.strictEqual(dispTrasFallo.activo, 0, 'El dispositivo con token inválido debe desactivarse automáticamente');
console.log(`  ✔ Token inválido detectado, dispositivo desactivado y respaldo SMS #${itemFallido.respaldoSmsId} entregado vía Twilio.`);

// Restaurar dispositivo válido de Elena para siguientes pruebas
db.prepare('UPDATE dispositivo SET activo = 1 WHERE id_dispositivo = 5').run();

// ============================================================================
// BLOQUE E09 — CONFIRMACIÓN Y REPROGRAMACIÓN DE CITAS (29 de octubre)
// ============================================================================

console.log('\n▶ [Prueba E09-1] Confirmación de cita por el cliente (RN-04)');
const citaConfirmada = confirmarInspeccion(8, {
  idUsuario: 'u-cli-004',
  origen: 'APP_CLI',
  nota: 'Confirmada desde botón "Sí estaré" en la notificación push'
});
assert.strictEqual(citaConfirmada.estado, EstadoInspeccion.CONFIRMADA);
assert.ok(citaConfirmada.confirmado_en, 'Debe registrar el timestamp confirmado_en');
console.log(`  ✔ Cita ${citaConfirmada.folio} confirmada en ${citaConfirmada.confirmado_en}.`);

// Una cita recién programada (aún sin aviso del día) también se puede confirmar
// desde la app: pasa por NOTIFICADA para respetar RN-01.
const recienProgramada = crearInspeccion({
  idCliente: 1,
  idDomicilio: 1,
  idInspector: 1,
  fechaProgramada: '2026-10-20',
  ventanaInicio: '14:30',
  ventanaFin: '16:30',
  motivoVisita: 'Cita nueva sin aviso del día'
} as any) as any;
assert.strictEqual(recienProgramada.estado, EstadoInspeccion.PROGRAMADA);
const confirmadaSinAviso = confirmarInspeccion(recienProgramada.id_inspeccion, { origen: 'APP_CLI' });
assert.strictEqual(confirmadaSinAviso.estado, EstadoInspeccion.CONFIRMADA);
const pasos = (db
  .prepare('SELECT estado_anterior, estado_nuevo FROM inspeccion_historial WHERE id_inspeccion = ? ORDER BY id_historial')
  .all(recienProgramada.id_inspeccion) as any[]).map((h) => `${h.estado_anterior ?? '∅'}→${h.estado_nuevo}`);
assert.ok(pasos.includes('PROGRAMADA→NOTIFICADA') && pasos.includes('NOTIFICADA→CONFIRMADA'), pasos.join(', '));
console.log(`  ✔ Cita ${confirmadaSinAviso.folio} recién programada confirmada desde la app (PROGRAMADA → NOTIFICADA → CONFIRMADA).`);

console.log('\n▶ [Prueba E09-2] Consulta de horarios disponibles reales en la zona del domicilio');
const horariosDisponibles = obtenerHorariosDisponibles(6, 3, '2026-10-28');
assert.ok(horariosDisponibles.length > 0, 'Debe devolver horarios disponibles reales en la zona');
// Verificar que el bloque ocupado de Inspector 1 el 2026-10-29 de 09:00 a 11:00 NO aparezca disponible
const traslapadoEnLista = horariosDisponibles.find(
  (h) => h.idInspector === 1 && h.fecha === '2026-10-29' && h.ventanaInicio === '09:00'
);
assert.strictEqual(traslapadoEnLista, undefined, 'No debe ofrecer horarios donde el inspector ya tiene cita asignada');
console.log(`  ✔ Se calcularon ${horariosDisponibles.length} bloques disponibles en la zona excluyendo traslapes.`);

console.log('\n▶ [Prueba E09-3] Aprobación de reprogramación en la bandeja del administrador conservando el folio (RN-06)');
const resAprobacion = resolverReprogramacion(1, {
  aprobada: true,
  resueltaPor: 'u-admin-001'
});
assert.strictEqual(resAprobacion.resolucion, 'APROBADA');
assert.strictEqual(resAprobacion.inspeccion.folio, 'INS-2026-000006', 'El folio DEBE conservarse intacto tras aprobar reprogramación');
assert.strictEqual(resAprobacion.inspeccion.fecha_programada, '2026-10-30');
assert.strictEqual(resAprobacion.inspeccion.veces_reprogramada, 2);
assert.strictEqual(resAprobacion.inspeccion.estado, EstadoInspeccion.NOTIFICADA);
assert.ok(resAprobacion.notificacionEnviada, 'Debe enviarse la notificación de cita reprogramada al cliente');
console.log(`  ✔ Solicitud #1 aprobada: Cita ${resAprobacion.inspeccion.folio} movida al ${resAprobacion.inspeccion.fecha_programada} (veces_reprogramada=${resAprobacion.inspeccion.veces_reprogramada}).`);

console.log('\n▶ [Prueba E09-4] Rechazo de solicitud de reprogramación con motivo');
const nuevaSol = solicitarReprogramacion(6, {
  fechaSolicitada: '2026-11-02',
  ventanaInicioSolicitada: '11:30',
  ventanaFinSolicitada: '13:30',
  motivo: 'Cambio adicional de fecha',
  idUsuario: 'u-cli-002'
});
assert.strictEqual(nuevaSol.inspeccion.estado, EstadoInspeccion.REPROG_SOLICITADA);

const resRechazo = resolverReprogramacion((nuevaSol.solicitud as any).id_reprogramacion, {
  aprobada: false,
  motivoRechazo: 'Cuadrilla completa ese día por mantenimiento programado',
  resueltaPor: 'u-admin-001'
});
assert.strictEqual(resRechazo.resolucion, 'RECHAZADA');
assert.strictEqual(resRechazo.inspeccion.estado, EstadoInspeccion.NOTIFICADA, 'Al rechazar debe volver a NOTIFICADA');
console.log(`  ✔ Solicitud rechazada con motivo; cita regresó a estado ${resRechazo.inspeccion.estado}.`);

console.log('\n▶ [Prueba E09-5] Bloqueo de 4.ª reprogramación (RN-06) y bloqueo cuando va EN_CAMINO (RN-05)');
// Llevar la cita 6 a 3 reprogramaciones y probar que la 4.ª se bloquee
db.prepare('UPDATE inspeccion SET veces_reprogramada = 3 WHERE id_inspeccion = 6').run();
let bloqueoRN06 = false;
try {
  solicitarReprogramacion(6, {
    fechaSolicitada: '2026-11-03',
    ventanaInicioSolicitada: '09:00',
    motivo: 'Cuarto intento'
  });
} catch (err) {
  if (err instanceof ErrorLimiteReprogramacionesRN06) {
    bloqueoRN06 = true;
    console.log(`  ✔ Cuarta reprogramación bloqueada por RN-06: ${err.message}`);
  }
}
assert.ok(bloqueoRN06, 'RN-06 debe rechazar más de 3 reprogramaciones');

// Probar RN-05: Pasar cita 5 (CONFIRMADA) a EN_CAMINO e intentar pedir reprogramación
transicionar(5, EstadoInspeccion.EN_CAMINO, 'u-insp-001', 'APP_INSP', 'Inspector inició trayecto');
let bloqueoRN05 = false;
try {
  solicitarReprogramacion(5, {
    fechaSolicitada: '2026-11-01',
    ventanaInicioSolicitada: '09:00',
    motivo: 'Salí de emergencia'
  });
} catch (err) {
  if (err instanceof ErrorReprogramacionEnCaminoRN05) {
    bloqueoRN05 = true;
    console.log(`  ✔ Reprogramación en trayecto bloqueada por RN-05: ${err.message}`);
  }
}
assert.ok(bloqueoRN05, 'RN-05 debe rechazar reprogramación cuando la cita está EN_CAMINO');

console.log('\n▶ [Prueba E09-6] Temporizador de citas SIN_CONFIRMAR (RN-07) y confirmación por llamada de oficina');
const resSinConf = ejecutarTemporizadorSinConfirmar('2026-10-16');
assert.ok(resSinConf.totalMarcadasSinConfirmar >= 1, 'Debe marcar citas NOTIFICADA sin respuesta como SIN_CONFIRMAR');
const listaAlertaSinConf = listarCitasSinConfirmar() as any[];
assert.ok(listaAlertaSinConf.length >= 2, 'El panel debe listar las citas en estado SIN_CONFIRMAR');

// Confirmar por llamada telefónica desde el panel una cita SIN_CONFIRMAR (cita #7)
const confirmadaPorLlamada = confirmarInspeccion(7, {
  idUsuario: 'u-admin-001',
  confirmadaPorLlamada: true
});
assert.strictEqual(confirmadaPorLlamada.estado, EstadoInspeccion.CONFIRMADA);
console.log(`  ✔ Cita SIN_CONFIRMAR (${confirmadaPorLlamada.folio}) confirmada por llamada telefónica desde el panel.`);

// Restaurar semilla limpia al finalizar para dejar la BD lista para demostración en vivo
runSeed();

console.log('\n=========================================================================');
console.log('🎉 TODAS LAS PRUEBAS DE E08 Y E09 PASARON EXITOSAMENTE (100% OK)');
console.log('=========================================================================\n');
