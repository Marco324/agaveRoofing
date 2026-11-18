import { db } from '../db.ts';
import { hoy } from '../fechaReferencia.ts';
import {
  EstadoInspeccion,
  OrigenTransicion,
  ESTADOS_QUE_VENCEN_SIN_VISITA,
  ESTADOS_VISITA_EN_CURSO
} from '../../../shared/src/types/estados.ts';
import { transicionar } from './maquinaEstadosService.ts';
import { cerrarTrayecto } from './trayectoService.ts';

/**
 * Cierre de citas cuya fecha ya pasó.
 *
 * - Nadie fue (PROGRAMADA … REPROGRAMADA)      → NO_REALIZADA
 *   (salvo REPROG_SOLICITADA: espera la respuesta de la oficina)
 * - El inspector salió o llegó y no cerró      → PENDIENTE_CIERRE
 *   (sigue aceptando el resultado o la ausencia, por ejemplo desde la cola
 *   sin señal; su trayecto activo se cancela para dejar de enviar GPS).
 *
 * "Pasada" significa `fecha_programada < hoy`, con el "hoy" de negocio
 * (FECHA_HOY o la fecha de San Antonio). Cada cambio queda en el historial
 * con origen SISTEMA.
 */
export interface ResumenCierrePasadas {
  fechaReferencia: string;
  noRealizadas: { idInspeccion: number; folio: string; estadoAnterior: string }[];
  pendientesDeCierre: { idInspeccion: number; folio: string; estadoAnterior: string }[];
  trayectosCancelados: number;
}

function marcadores(n: number) {
  return Array.from({ length: n }, () => '?').join(', ');
}

export function cerrarCitasPasadas(fechaReferencia: string = hoy()): ResumenCierrePasadas {
  const resumen: ResumenCierrePasadas = {
    fechaReferencia,
    noRealizadas: [],
    pendientesDeCierre: [],
    trayectosCancelados: 0
  };

  const sinVisita = db
    .prepare(
      `SELECT id_inspeccion, folio, estado, fecha_programada FROM inspeccion
       WHERE fecha_programada < ? AND estado IN (${marcadores(ESTADOS_QUE_VENCEN_SIN_VISITA.length)})
       ORDER BY fecha_programada, id_inspeccion`
    )
    .all(fechaReferencia, ...ESTADOS_QUE_VENCEN_SIN_VISITA) as {
    id_inspeccion: number;
    folio: string;
    estado: string;
    fecha_programada: string;
  }[];

  const enCurso = db
    .prepare(
      `SELECT id_inspeccion, folio, estado, fecha_programada FROM inspeccion
       WHERE fecha_programada < ? AND estado IN (${marcadores(ESTADOS_VISITA_EN_CURSO.length)})
       ORDER BY fecha_programada, id_inspeccion`
    )
    .all(fechaReferencia, ...ESTADOS_VISITA_EN_CURSO) as typeof sinVisita;

  if (sinVisita.length === 0 && enCurso.length === 0) return resumen;

  db.exec('BEGIN');
  try {
    for (const c of sinVisita) {
      transicionar(
        c.id_inspeccion,
        EstadoInspeccion.NO_REALIZADA,
        undefined,
        OrigenTransicion.SISTEMA,
        `Cierre automático: la fecha programada (${c.fecha_programada}) pasó sin visita (estaba en ${c.estado})`
      );
      resumen.noRealizadas.push({ idInspeccion: c.id_inspeccion, folio: c.folio, estadoAnterior: c.estado });
    }

    for (const c of enCurso) {
      const trayectos = db
        .prepare(`SELECT id_trayecto FROM trayecto WHERE id_inspeccion = ? AND estado = 'ACTIVO'`)
        .all(c.id_inspeccion) as { id_trayecto: number }[];
      for (const t of trayectos) {
        cerrarTrayecto(t.id_trayecto, 'CANCELADO');
        resumen.trayectosCancelados++;
      }
      transicionar(
        c.id_inspeccion,
        EstadoInspeccion.PENDIENTE_CIERRE,
        undefined,
        OrigenTransicion.SISTEMA,
        `Cierre automático: la fecha programada (${c.fecha_programada}) pasó con la visita sin cerrar (estaba en ${c.estado})`
      );
      resumen.pendientesDeCierre.push({ idInspeccion: c.id_inspeccion, folio: c.folio, estadoAnterior: c.estado });
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  return resumen;
}

/**
 * Prepara una cita para recibir un cierre tardío del inspector (llegada,
 * resultado o ausencia que llegan después de su fecha, p. ej. desde la cola
 * sin señal). Devuelve el estado con el que queda.
 *
 * - NO_REALIZADA → PENDIENTE_CIERRE (hay evidencia de que sí hubo visita)
 * - Cualquier otro estado se devuelve sin cambios.
 */
export function reabrirParaCierreTardio(
  idInspeccion: number,
  estadoActual: string,
  motivo: string
): string {
  if (estadoActual !== EstadoInspeccion.NO_REALIZADA) return estadoActual;
  transicionar(
    idInspeccion,
    EstadoInspeccion.PENDIENTE_CIERRE,
    undefined,
    OrigenTransicion.SISTEMA,
    `Reabierta: ${motivo}`
  );
  return EstadoInspeccion.PENDIENTE_CIERRE;
}

/** Ejecuta el cierre al arrancar y luego cada [intervaloMs]. */
export function programarCierreDeCitasPasadas(intervaloMs = 10 * 60 * 1000) {
  const ejecutar = () => {
    try {
      const r = cerrarCitasPasadas();
      const total = r.noRealizadas.length + r.pendientesDeCierre.length;
      if (total > 0) {
        console.log(
          `🗓️  Citas pasadas (antes de ${r.fechaReferencia}): ` +
            `${r.noRealizadas.length} no realizadas, ${r.pendientesDeCierre.length} pendientes de cierre` +
            (r.trayectosCancelados ? `, ${r.trayectosCancelados} trayectos cancelados` : '')
        );
      }
    } catch (e) {
      console.error('[citas pasadas] No se pudo ejecutar el cierre automático:', e);
    }
  };
  ejecutar();
  const timer = setInterval(ejecutar, intervaloMs);
  timer.unref?.();
  return timer;
}
