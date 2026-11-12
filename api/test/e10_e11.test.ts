import assert from 'node:assert';
import { runSeed } from '../src/seed.ts';
import { db } from '../src/db.ts';
import {
  iniciarTrayecto,
  registrarPuntoUbicacion,
  simularPasoTrayecto,
  cerrarTrayecto,
  cerrarTrayectosOlvidados,
  obtenerSeguimientoVivo,
  listarMonitorVivoPanel,
  ErrorTrayectoActivoRN03,
  ErrorTrayectoNoActivoRN08
} from '../src/services/trayectoService.ts';
import {
  confirmarPresenciaCliente,
  registrarLlegadaInspector,
  registrarEvidencia,
  registrarResultadoInspeccion,
  registrarClienteAusente,
  sincronizarLoteOffline,
  obtenerReporteInspeccion,
  generarReporteHtml,
  listarMensajesInspeccion,
  enviarMensajeInspeccion,
  purgarPuntosGpsAntiguos,
  ErrorAusenciaSinEvidenciaRN10,
  ErrorEvidenciaRequeridaRN11
} from '../src/services/ejecucionSincronizacionService.ts';
import {
  obtenerTableroIndicadores,
  exportarIndicadoresCSV
} from '../src/services/indicadoresService.ts';
import { EstadoInspeccion, EstadoTecho, TipoEvidencia } from '../../shared/src/types/estados.ts';

console.log('🧪 Iniciando pruebas automáticas de E10 (Trayecto y Seguimiento en Vivo) y E11 (Llegada, Resultado, Modo Sin Señal y Tablero)...\n');

// Restaurar semilla limpia
runSeed();

// ============================================================================
// BLOQUE E10 — TRAYECTO, SEGUIMIENTO EN VIVO, ETA Y PRIVACIDAD (05 de nov)
// ============================================================================

console.log('▶ [Prueba E10-1] Privacidad del mapa antes de iniciar el trayecto (RN-08 / Riesgo R7)');
const segAntes = obtenerSeguimientoVivo(10);
assert.strictEqual(segAntes.ubicacionVisible, false, 'El mapa NO debe mostrar ubicación antes de que el inspector salga');
assert.strictEqual(segAntes.trayecto, undefined, 'No debe exponer objeto trayecto antes de salir');
console.log(`  ✔ Privacidad RN-08 verificada antes de salir: "${segAntes.motivoPrivacidad}"`);

console.log('\n▶ [Prueba E10-2] Inicio de trayecto transaccional ("Voy en camino") y notificación urgente EN_CAMINO');
const resInicio = iniciarTrayecto(10, {
  idInspector: 1,
  idUsuario: 'u-insp-001',
  latitudInicial: 29.521500,
  longitudInicial: -98.486200
});
assert.strictEqual(resInicio.trayecto.estado, 'ACTIVO');
assert.ok(resInicio.etaMinutos > 0, 'Debe calcular ETA inicial en minutos');
assert.strictEqual(resInicio.etaAproximado, false);
assert.ok(resInicio.notificacionEnCamino, 'Debe encolar y despachar notificación urgente EN_CAMINO');
console.log(`  ✔ Trayecto #${resInicio.trayecto.id_trayecto} abierto para cita INS-2026-000010. ETA inicial: ${resInicio.etaMinutos} min.`);

console.log('\n▶ [Prueba E10-3] Bloqueo de segundo trayecto activo para el mismo inspector (RN-03)');
let bloqueoRN03 = false;
try {
  // Intentar iniciar trayecto en la cita #1 para el mismo Inspector 1 mientras el trayecto de la cita #10 sigue ACTIVO
  iniciarTrayecto(1, { idInspector: 1 });
} catch (err) {
  if (err instanceof ErrorTrayectoActivoRN03) {
    bloqueoRN03 = true;
    console.log(`  ✔ Segundo trayecto simultáneo bloqueado por RN-03: ${err.message}`);
  }
}
assert.ok(bloqueoRN03, 'RN-03 debe impedir dos trayectos activos para un mismo inspector');

console.log('\n▶ [Prueba E10-4] Publicación de puntos GPS cada 15s, respaldo de ETA aproximado (RN-09) y aviso POR_LLEGAR (< 1 km)');
// Publicar punto simulando fallo de Google Directions para verificar respaldo en línea recta (RN-09)
const puntoAprox = registrarPuntoUbicacion(resInicio.trayecto.id_trayecto, {
  latitud: 29.575000,
  longitud: -98.492000,
  precisionM: 6,
  velocidadMs: 13.0,
  forzarCalculoEta: true,
  simularFalloDirections: true
});
assert.strictEqual(puntoAprox.etaAproximado, true, 'Cuando Directions falla debe activar etaAproximado = true (RN-09)');
console.log(`  ✔ Respaldo RN-09 verificado: ETA aproximado = ${puntoAprox.etaMinutos} min (${puntoAprox.distanciaRestanteM} m).`);

// Acercar al inspector a menos de 1000 m del domicilio en Stone Oak (29.620120, -98.498230)
const pasoCercano = simularPasoTrayecto(10, true);
assert.ok(pasoCercano.distanciaRestanteM < 1000, 'El inspector debe quedar a menos de 1000 m del domicilio');
assert.strictEqual(pasoCercano.avisoPorLlegarDisparado, true, 'Debe disparar automáticamente la notificación urgente POR_LLEGAR');
console.log(`  ✔ Inspector a ${pasoCercano.distanciaRestanteM} m (< 1000 m): aviso urgente POR_LLEGAR disparado.`);

// Enviar otro punto a < 1000 m: NO debe duplicar el aviso POR_LLEGAR
const segundoPasoCercano = registrarPuntoUbicacion(resInicio.trayecto.id_trayecto, {
  latitud: 29.618500,
  longitud: -98.497900,
  forzarCalculoEta: true
});
assert.strictEqual(segundoPasoCercano.avisoPorLlegarDisparado, false, 'El aviso POR_LLEGAR solo debe enviarse una vez por cita');
console.log('  ✔ Aviso POR_LLEGAR no se duplica en puntos subsecuentes (< 1 km).');

console.log('\n▶ [Prueba E10-5] Mapa del cliente con detección de pérdida de señal y Monitor en Vivo del Panel');
// Consultar seguimiento vivo simulando que pasaron 3 minutos sin recibir puntos
const futuro3Min = new Date(Date.now() + 3 * 60 * 1000).toISOString();
const segEnCamino = obtenerSeguimientoVivo(10, futuro3Min);
assert.strictEqual(segEnCamino.ubicacionVisible, true);
assert.strictEqual(segEnCamino.trayecto?.senalPerdida, true);
assert.ok((segEnCamino.trayecto?.minutosDesdeUltimoPunto || 0) >= 3);
console.log(`  ✔ Detección de pérdida de señal en mapa del cliente: "Última ubicación hace ${segEnCamino.trayecto?.minutosDesdeUltimoPunto} minutos".`);

const monitor = listarMonitorVivoPanel('2026-11-12');
assert.ok(monitor.totalEnCamino >= 2, 'El monitor en vivo debe mostrar a Carlos Garza y David Vance en camino');
console.log(`  ✔ Monitor en vivo del panel: ${monitor.totalEnCamino} inspectores en camino y ${monitor.citasHoy.length} citas en semáforo.`);

// ============================================================================
// BLOQUE E11 — LLEGADA, RESULTADO, EVIDENCIA, MODO SIN SEÑAL Y TABLERO (12 nov)
// ============================================================================

console.log('\n▶ [Prueba E11-1] Confirmación "Ya estoy en mi casa" del cliente y registro de llegada del inspector');
const pres = confirmarPresenciaCliente(10, { idUsuario: 'u-cli-001' });
assert.ok(pres.presenciaConfirmadaEn, 'Debe registrar presencia_confirmada_en');
console.log(`  ✔ Cliente confirmó presencia en casa (${pres.presenciaConfirmadaEn}).`);

const llegada = registrarLlegadaInspector(10, {
  idUsuario: 'u-insp-001',
  idLocal: 'uuid-llegada-cita-10'
});
assert.strictEqual(llegada.estado, EstadoInspeccion.EN_SITIO);
assert.strictEqual(llegada.seguimientoGpsDetenido, true);
assert.strictEqual(llegada.trayectoCerrado?.estado, 'FINALIZADO');
assert.ok(llegada.trayectoCerrado?.distancia_m > 0, 'Al cerrar trayecto debe conservar distancia_m');
console.log(`  ✔ Llegada registrada: cita en EN_SITIO y trayecto cerrado (distancia=${llegada.trayectoCerrado.distancia_m} m).`);

// Intentar publicar un punto GPS después de que el inspector llegó (debe bloquearse por RN-08)
let bloqueoRN08 = false;
try {
  registrarPuntoUbicacion(resInicio.trayecto.id_trayecto, {
    latitud: 29.620120,
    longitud: -98.498230
  });
} catch (err) {
  if (err instanceof ErrorTrayectoNoActivoRN08) {
    bloqueoRN08 = true;
    console.log(`  ✔ Publicación GPS post-llegada bloqueada por RN-08: ${err.message}`);
  }
}
assert.ok(bloqueoRN08, 'RN-08 debe rechazar puntos cuando el trayecto ya fue cerrado');

const segDespuesLlegada = obtenerSeguimientoVivo(10);
assert.strictEqual(segDespuesLlegada.ubicacionVisible, false, 'El mapa debe ocultarse tras la llegada del inspector (RN-08 / R7)');

console.log('\n▶ [Prueba E11-2] Bloqueo de resultado sin fotografías (RN-11) y guardado exitoso con reporte PDF');
let bloqueoRN11 = false;
try {
  registrarResultadoInspeccion(10, {
    estadoTecho: EstadoTecho.BUENO,
    hallazgos: 'Intento de guardar sin fotos',
    requiereReparacion: false,
    evidencias: []
  });
} catch (err) {
  if (err instanceof ErrorEvidenciaRequeridaRN11) {
    bloqueoRN11 = true;
    console.log(`  ✔ Resultado sin fotos rechazado por RN-11: ${err.message}`);
  }
}
assert.ok(bloqueoRN11, 'RN-11 debe impedir completar una inspección sin al menos 1 foto');

const resGuardado = registrarResultadoInspeccion(10, {
  estadoTecho: EstadoTecho.BUENO,
  hallazgos: 'Sellado perimetral en óptimo estado, sin filtraciones activas.',
  requiereReparacion: false,
  recomendaciones: 'Revisión preventiva anual antes de temporada de tormentas.',
  idLocal: 'uuid-resultado-cita-10',
  evidencias: [
    {
      tipo: TipoEvidencia.FOTO_TECHO,
      rutaArchivo: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=800',
      descripcion: 'Cubierta principal en Stone Oak verificada',
      idLocal: 'uuid-evidencia-10-1'
    }
  ]
});
assert.strictEqual(resGuardado.resultado.estado_techo, 'BUENO');
assert.strictEqual(resGuardado.evidencias.length, 1);
const htmlReporte = generarReporteHtml(10);
assert.ok(htmlReporte.includes('INS-2026-000010'), 'El reporte HTML/PDF debe incluir el folio de la cita');
console.log(`  ✔ Resultado guardado con evidencia y reporte oficial generado (${resGuardado.resultado.url_reporte_pdf}).`);

console.log('\n▶ [Prueba E11-3] Cliente ausente con foto de fachada y nota obligatoria (RN-10)');
let bloqueoRN10 = false;
try {
  // Intentar marcar ausente en cita #12 sin foto de fachada
  registrarClienteAusente(12, {
    nota: 'Toqué 3 veces y nadie abrió',
    rutaFotoEvidencia: ''
  });
} catch (err) {
  if (err instanceof ErrorAusenciaSinEvidenciaRN10) {
    bloqueoRN10 = true;
    console.log(`  ✔ Ausencia sin fotografía rechazada por RN-10: ${err.message}`);
  }
}
assert.ok(bloqueoRN10, 'RN-10 debe exigir fotografía y nota para marcar CLIENTE_AUSENTE');

console.log('\n▶ [Prueba E11-4] Sincronización en lote del modo sin señal (`POST /sincronizar`) con idempotencia por `id_local` (RN-12)');
const loteOffline = {
  idInspector: 1,
  idDispositivo: 'ExponentPushToken[insp-carlos-garza-satx01]',
  operaciones: [
    {
      idLocal: 'offline-uuid-evidencia-cita-11',
      tipoOperacion: 'EVIDENCIA' as const,
      idInspeccion: 11,
      ocurridoEn: '2026-11-12T11:45:00Z',
      datos: {
        tipo: 'FOTO_TECHO',
        rutaArchivo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        descripcion: 'Cumbrera ventilada capturada en modo avión en Alamo Heights'
      }
    },
    {
      idLocal: 'offline-uuid-resultado-cita-11',
      tipoOperacion: 'RESULTADO' as const,
      idInspeccion: 11,
      ocurridoEn: '2026-11-12T11:50:00Z',
      datos: {
        estadoTecho: 'MALO',
        hallazgos: 'Desprendimiento de tejas en cumbrera central capturado sin señal móvil.',
        requiereReparacion: true,
        urgencia: 'ALTA',
        recomendaciones: 'Programar cuadrilla de reparación urgente esta semana.'
      }
    }
  ]
};

const syncPrimeraVez = sincronizarLoteOffline(loteOffline);
assert.strictEqual(syncPrimeraVez.aplicadasNuevas, 2);
assert.strictEqual(syncPrimeraVez.ignoradasPorIdempotencia, 0);
console.log(`  ✔ Primer envío de lote offline: ${syncPrimeraVez.aplicadasNuevas} operaciones aplicadas conservando hora real del teléfono.`);

// Reenviar exactamente el mismo lote (simulando reintento por red inestable): NO debe duplicar nada (RN-12)
const syncReintento = sincronizarLoteOffline(loteOffline);
assert.strictEqual(syncReintento.aplicadasNuevas, 0, 'No debe volver a insertar operaciones con el mismo idLocal');
assert.strictEqual(syncReintento.ignoradasPorIdempotencia, 2, 'Las 2 operaciones deben reconocerse como idempotentes');
console.log(`  ✔ Reintento del mismo lote offline (RN-12): ${syncReintento.ignoradasPorIdempotencia} ignoradas por idempotencia, 0 duplicados.`);

console.log('\n▶ [Prueba E11-5] Mensajería directa Inspector <-> Cliente, Tablero de Indicadores y Purga de Puntos GPS (RN-17)');
const msgEnviado = enviarMensajeInspeccion(12, {
  remitenteRol: 'INSPECTOR',
  texto: 'Hola Elena, estoy a 8 minutos de Medical Center.'
});
assert.ok(msgEnviado.idMensaje > 0);
const conversacion = listarMensajesInspeccion(12);
assert.strictEqual(conversacion.length, 1);
console.log(`  ✔ Mensaje enviado y almacenado en la cita #12: "${conversacion[0].texto}"`);

const tablero = obtenerTableroIndicadores('2026-10-01', '2026-11-19');
assert.ok(tablero.tarjetas.totalCitas >= 10, 'El tablero debe consolidar las citas del periodo');
assert.ok(tablero.evolucionSemanal.length >= 2, 'La vista v_indicadores_semana debe devolver evolución semanal');
assert.ok(tablero.rankingPuntualidad.length === 2, 'La vista v_puntualidad_inspector debe incluir a los 2 inspectores');
assert.ok(tablero.efectividadPorCanal.length >= 2, 'La vista v_efectividad_notificacion debe desglosar PUSH y SMS');
const csv = exportarIndicadoresCSV('2026-10-01', '2026-11-19');
assert.ok(csv.includes('Tasa de Confirmacion (%)'), 'El CSV exportado debe contener las métricas del tablero');
console.log(`  ✔ Tablero de indicadores verificado: Tasa de confirmación=${tablero.tarjetas.tasaConfirmacionPct}%, Completadas=${tablero.tarjetas.completadas}.`);

// Insertar un punto GPS antiguo (> 35 días) y verificar que la tarea de purga RN-17 lo elimine sin borrar el resumen del trayecto
db.prepare(`
  INSERT INTO punto_ubicacion (id_trayecto, latitud, longitud, precision_m, velocidad_ms, capturado_en)
  VALUES (1, 29.500000, -98.500000, 10, 10.0, '2026-09-01T10:00:00Z')
`).run();
const resPurga = purgarPuntosGpsAntiguos(30, '2026-11-12T12:00:00Z');
assert.ok(resPurga.puntosEliminados >= 1, 'Debe purgar los puntos GPS con más de 30 días de antigüedad (RN-17)');
const trayectoResumen = db.prepare('SELECT distancia_m, duracion_s FROM trayecto WHERE id_trayecto = 1').get() as any;
assert.strictEqual(trayectoResumen.distancia_m, 11450, 'El resumen de distancia en trayecto debe sobrevivir a la purga de puntos');
console.log(`  ✔ Purga de privacidad RN-17 ejecutada: ${resPurga.puntosEliminados} punto(s) >30 días eliminados; resumen de trayecto intacto.`);

// Verificar apagado automático de trayectos olvidados > 90 min (Riesgo R5)
const futuro2Horas = new Date(Date.now() + 125 * 60 * 1000).toISOString();
const resOlvidados = cerrarTrayectosOlvidados(futuro2Horas);
assert.ok(resOlvidados.totalCancelados >= 1, 'Debe cerrar automáticamente los trayectos que excedan 90 minutos');
console.log(`  ✔ Apagado automático Riesgo R5 verificado: ${resOlvidados.totalCancelados} trayecto(s) >90 min cerrado(s).`);

// Restaurar semilla limpia al finalizar para dejar la BD lista para demostración en vivo
runSeed();

console.log('\n=========================================================================');
console.log('🎉 TODAS LAS PRUEBAS DE E10 Y E11 PASARON EXITOSAMENTE (100% OK)');
console.log('=========================================================================\n');
