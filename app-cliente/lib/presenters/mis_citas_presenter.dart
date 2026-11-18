import 'dart:async';

import 'contracts/mis_citas_contract.dart';
import '../models/cita_cliente_model.dart';
import '../services/cliente_api_service.dart';
import '../services/push_service.dart';
import '../services/sesion_service.dart';

class MisCitasPresenter {
  /// Cada cuánto se consulta la ubicación del inspector mientras va en camino.
  static const Duration intervaloSeguimiento = Duration(seconds: 15);

  final MisCitasViewContract view;
  final ClienteApiService apiService;

  Timer? _timerSeguimiento;
  int? _idInspeccionSeguida;
  int? _idClienteSeguido;
  bool _pantallaVisible = true;
  bool _consultandoSeguimiento = false;

  MisCitasPresenter(this.view, {ClienteApiService? service})
      : apiService = service ?? ClienteApiService();

  /// RF-05 — Cierra la sesión en la API y en el teléfono.
  Future<void> cerrarSesion() async {
    detenerSeguimiento();
    PushService.instancia.olvidarCliente();
    await SesionService.instancia.cerrar();
    view.irAInicioDeSesion();
  }

  Future<void> cargarMisCitas(int idCliente) async {
    view.showLoading();
    try {
      final resultado = await apiService.getMisCitas(idCliente);
      final CitaCliente? proxima = resultado['proximaCita'];
      view.showCitas(
        proximaCita: proxima,
        historial: resultado['historial'],
      );
      _sincronizarSeguimiento(proxima, idCliente);
    } catch (e) {
      view.showError(e.toString().replaceAll('Exception: ', ''));
    } finally {
      view.hideLoading();
    }
  }

  // ---------------------------------------------------------------------------
  // Seguimiento en vivo (mapa): solo mientras la cita está en camino y la
  // pantalla está visible.
  // ---------------------------------------------------------------------------

  void _sincronizarSeguimiento(CitaCliente? cita, int idCliente) {
    if (cita != null && cita.estaEnCamino) {
      _idClienteSeguido = idCliente;
      view.showSeguimiento(cita.seguimientoVivo);
      if (_idInspeccionSeguida != cita.idInspeccion) {
        _cancelarTimer();
        _idInspeccionSeguida = cita.idInspeccion;
      }
      _programarTimer();
    } else {
      detenerSeguimiento();
      view.showSeguimiento(null);
    }
  }

  void _programarTimer() {
    if (!_pantallaVisible || _idInspeccionSeguida == null) return;
    if (_timerSeguimiento?.isActive == true) return;
    _timerSeguimiento = Timer.periodic(intervaloSeguimiento, (_) => refrescarSeguimiento());
  }

  void _cancelarTimer() {
    _timerSeguimiento?.cancel();
    _timerSeguimiento = null;
  }

  /// Consulta una vez la ubicación del inspector y actualiza el mapa.
  Future<void> refrescarSeguimiento() async {
    final id = _idInspeccionSeguida;
    if (id == null || _consultandoSeguimiento) return;
    _consultandoSeguimiento = true;
    try {
      final seguimiento = await apiService.getSeguimiento(id);
      if (_idInspeccionSeguida != id) return; // cambió la cita mientras tanto

      if (seguimiento.estadoInspeccion != 'EN_CAMINO') {
        // El inspector llegó (o la cita cambió): se apaga el mapa y se recarga.
        detenerSeguimiento();
        view.showSeguimiento(null);
        final idCliente = _idClienteSeguido;
        if (idCliente != null) await cargarMisCitas(idCliente);
        return;
      }
      view.showSeguimiento(seguimiento);
    } catch (_) {
      // Sin conexión con la API: se conserva el último dato y se reintenta en
      // el siguiente ciclo. El mapa indica cuánto tiempo lleva sin actualizar.
    } finally {
      _consultandoSeguimiento = false;
    }
  }

  /// La pantalla dejó de verse (app en segundo plano): no se consulta.
  void pausarSeguimiento() {
    _pantallaVisible = false;
    _cancelarTimer();
  }

  /// La pantalla volvió a verse: se refresca de inmediato y se reanuda el timer.
  void reanudarSeguimiento() {
    _pantallaVisible = true;
    if (_idInspeccionSeguida == null) return;
    refrescarSeguimiento();
    _programarTimer();
  }

  void detenerSeguimiento() {
    _cancelarTimer();
    _idInspeccionSeguida = null;
  }

  void dispose() {
    detenerSeguimiento();
  }

  // ---------------------------------------------------------------------------

  Future<void> confirmarAsistencia(int idInspeccion, int idCliente) async {
    view.showLoading();
    try {
      await apiService.confirmarAsistencia(idInspeccion);
      view.showSuccessMessage('¡Asistencia confirmada! El inspector ya fue avisado.');
      await cargarMisCitas(idCliente);
    } catch (e) {
      view.showError(e.toString().replaceAll('Exception: ', ''));
      view.hideLoading();
    }
  }

  Future<void> abrirModalReprogramacion(int idInspeccion) async {
    view.showLoading();
    try {
      final horarios = await apiService.getHorariosDisponibles(idInspeccion);
      view.hideLoading();
      view.showHorariosModal(horarios, idInspeccion);
    } catch (e) {
      view.hideLoading();
      view.showError('No se pudieron obtener horarios: ${e.toString().replaceAll('Exception: ', '')}');
    }
  }

  Future<void> enviarSolicitudReprogramacion({
    required int idInspeccion,
    required String nuevaFecha,
    required String nuevaVentana,
    required String motivo,
    required int idCliente,
  }) async {
    view.showLoading();
    try {
      await apiService.solicitarReprogramacion(
        idInspeccion: idInspeccion,
        nuevaFecha: nuevaFecha,
        nuevaVentana: nuevaVentana,
        motivo: motivo,
      );
      view.showSuccessMessage('Solicitud de cambio enviada. El administrador revisará el nuevo horario.');
      await cargarMisCitas(idCliente);
    } catch (e) {
      view.showError(e.toString().replaceAll('Exception: ', ''));
      view.hideLoading();
    }
  }

  Future<void> avisarEstoyEnCasa(int idInspeccion, int idCliente) async {
    view.showLoading();
    try {
      final ok = await apiService.confirmarEstoyEnCasa(idInspeccion);
      if (!ok) throw Exception('No se pudo enviar el aviso. Intenta de nuevo.');
      view.showSuccessMessage('¡Aviso enviado! El inspector sabe que ya estás en tu domicilio.');
      await cargarMisCitas(idCliente);
    } catch (e) {
      view.showError(e.toString().replaceAll('Exception: ', ''));
      view.hideLoading();
    }
  }
}
