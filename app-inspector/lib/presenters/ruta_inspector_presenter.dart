import 'dart:async';

import 'contracts/ruta_inspector_contract.dart';
import '../models/ruta_parada_model.dart';
import '../services/id_local.dart';
import '../services/inspector_api_service.dart';
import '../services/ubicacion_service.dart';

class RutaInspectorPresenter {
  /// Cada cuánto se envía la posición mientras el trayecto está activo.
  static const Duration intervaloGps = Duration(seconds: 15);

  final RutaInspectorViewContract view;
  final InspectorApiService apiService;
  final UbicacionService ubicacionService;

  Timer? _timerGps;
  int? _idInspeccionGps;
  int? _idTrayectoGps;
  bool _enviandoPunto = false;
  bool _enPrimerPlano = true;
  bool _modoDemo = false;

  /// idLocal de "Llegué" por cita: se genera una vez y se reúsa en reintentos.
  final Map<int, String> _idLocalLlegada = {};

  RutaInspectorPresenter(
    this.view, {
    InspectorApiService? service,
    UbicacionService? ubicacion,
  }) : apiService = service ?? InspectorApiService(),
       ubicacionService = ubicacion ?? UbicacionService();

  bool get compartiendoUbicacion => _idTrayectoGps != null;
  bool get modoDemo => _modoDemo;

  String _mensajeDe(Object e) => e.toString().replaceAll('Exception: ', '');

  Future<void> cargarRuta(int idInspector, String fecha) async {
    view.showLoading();
    try {
      final paradas = await apiService.getRutaDelDia(
        idInspector: idInspector,
        fecha: fecha,
      );
      view.showRuta(paradas, fecha);
      await _reconciliarGps(paradas);
    } catch (e) {
      view.showError(_mensajeDe(e));
    } finally {
      view.hideLoading();
    }
  }

  /// Carga cuántas paradas hay cada día del rango. Si falla, el calendario
  /// simplemente se muestra sin marcas.
  Future<void> cargarParadasPorDia(
    int idInspector,
    String fechaInicio,
    String fechaFin,
  ) async {
    try {
      final conteo = await apiService.getParadasPorDia(
        idInspector: idInspector,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
      );
      view.showParadasPorDia(conteo);
    } catch (_) {
      // Opcional: sin conteos no se bloquea la ruta.
    }
  }

  // ---------------------------------------------------------------------------
  // Trayecto y GPS real (RF-08)
  // ---------------------------------------------------------------------------

  /// Ajusta el envío de GPS a lo que dice la API (por ejemplo, tras reabrir la app).
  Future<void> _reconciliarGps(List<RutaParada> paradas) async {
    if (_idInspeccionGps != null) {
      final seguida = paradas.where((p) => p.idInspeccion == _idInspeccionGps);
      if (seguida.isNotEmpty && !seguida.first.estaEnCamino) detenerGps();
      return;
    }
    // Retomar un trayecto que quedó activo, solo si ya hay permiso (no se pregunta aquí).
    final enCamino = paradas.where(
      (p) => p.estaEnCamino && p.trayectoActivo != null,
    );
    if (enCamino.isEmpty || _modoDemo) return;
    if (!await ubicacionService.tienePermiso()) return;
    final parada = enCamino.first;
    _comenzarEnvioGps(parada.idInspeccion, parada.trayectoActivo!.idTrayecto);
  }

  Future<void> iniciarTrayecto(
    int idInspeccion,
    int idInspector,
    String fecha,
  ) async {
    if (_idTrayectoGps != null && _idInspeccionGps != idInspeccion) {
      view.showError(
        'Ya vas en camino a otra cita. Registra la llegada antes de iniciar otro trayecto.',
      );
      return;
    }

    // 1. Permiso de ubicación, explicando antes para qué se usa.
    try {
      if (!await ubicacionService.tienePermiso()) {
        final acepta = await view.confirmarUsoDeUbicacion();
        if (!acepta) return;
      }
      final permiso = await ubicacionService.asegurarPermiso();
      if (permiso != PermisoUbicacion.concedido) {
        view.showPermisoUbicacionNegado(
          permanente: permiso == PermisoUbicacion.denegadoPermanente,
          gpsApagado: permiso == PermisoUbicacion.servicioApagado,
        );
        return;
      }
    } catch (e) {
      view.showError(
        'No se pudo revisar el permiso de ubicación: ${_mensajeDe(e)}',
      );
      return;
    }

    // 2. Posición real y apertura del trayecto.
    view.showLoading();
    try {
      final posicion = await ubicacionService.posicionActual();
      final idTrayecto = await apiService.iniciarTrayecto(
        idInspeccion,
        idInspector: idInspector,
        posicion: posicion,
      );
      _comenzarEnvioGps(idInspeccion, idTrayecto, ultimoEnvio: DateTime.now());
      view.showSuccessMessage(
        'Vas en camino. El cliente fue avisado y ya puede ver tu ubicación.',
      );
      await cargarRuta(idInspector, fecha);
    } on TimeoutException {
      view.showError(
        'No se pudo obtener tu ubicación. Revisa que el GPS esté encendido e inténtalo de nuevo.',
      );
    } catch (e) {
      view.showError(_mensajeDe(e));
    } finally {
      view.hideLoading();
    }
  }

  void _comenzarEnvioGps(
    int idInspeccion,
    int idTrayecto, {
    DateTime? ultimoEnvio,
  }) {
    _cancelarTimer();
    _idInspeccionGps = idInspeccion;
    _idTrayectoGps = idTrayecto;
    _programarTimer();
    view.showCompartiendoUbicacion(
      idInspeccion: idInspeccion,
      ultimoEnvio: ultimoEnvio,
    );
  }

  void _programarTimer() {
    if (_idTrayectoGps == null || _modoDemo || !_enPrimerPlano) return;
    if (_timerGps?.isActive == true) return;
    _timerGps = Timer.periodic(intervaloGps, (_) => _enviarPosicion());
  }

  void _cancelarTimer() {
    _timerGps?.cancel();
    _timerGps = null;
  }

  Future<void> _enviarPosicion() async {
    final idTrayecto = _idTrayectoGps;
    final idInspeccion = _idInspeccionGps;
    if (idTrayecto == null || _enviandoPunto) return;
    _enviandoPunto = true;
    try {
      final posicion = await ubicacionService.posicionActual();
      await apiService.enviarPuntoGps(idTrayecto, posicion);
      if (_idTrayectoGps != idTrayecto) return;
      view.showCompartiendoUbicacion(
        idInspeccion: idInspeccion,
        ultimoEnvio: DateTime.now(),
      );
    } on ApiException catch (e) {
      if (e.codigo == 'TRAYECTO_NO_ACTIVO_RN08') {
        // El trayecto ya se cerró (llegada, ausencia o cierre automático).
        detenerGps();
      } else if (_idTrayectoGps == idTrayecto) {
        view.showCompartiendoUbicacion(
          idInspeccion: idInspeccion,
          ultimoEnvioFallo: true,
        );
      }
    } catch (_) {
      // Sin GPS o sin red: se reintenta en el siguiente ciclo.
      if (_idTrayectoGps == idTrayecto) {
        view.showCompartiendoUbicacion(
          idInspeccion: idInspeccion,
          ultimoEnvioFallo: true,
        );
      }
    } finally {
      _enviandoPunto = false;
    }
  }

  void detenerGps() {
    _cancelarTimer();
    final estabaCompartiendo = _idTrayectoGps != null;
    _idInspeccionGps = null;
    _idTrayectoGps = null;
    if (estabaCompartiendo) view.showCompartiendoUbicacion(idInspeccion: null);
  }

  /// Modo demo: sin envío de GPS real; el avance se simula con botones.
  void cambiarModoDemo(bool activo) {
    _modoDemo = activo;
    if (activo) {
      _cancelarTimer();
    } else {
      _programarTimer();
    }
    view.showCompartiendoUbicacion(idInspeccion: _idInspeccionGps);
  }

  /// La app pasó a segundo plano: se pausa el envío (solo primer plano por ahora).
  void pausarGps() {
    _enPrimerPlano = false;
    _cancelarTimer();
  }

  void reanudarGps() {
    _enPrimerPlano = true;
    if (_idTrayectoGps == null || _modoDemo) return;
    _enviarPosicion();
    _programarTimer();
  }

  Future<void> abrirAjustesUbicacion({required bool gpsApagado}) async {
    try {
      if (gpsApagado) {
        await ubicacionService.abrirAjustesDeUbicacion();
      } else {
        await ubicacionService.abrirAjustesDeLaApp();
      }
    } catch (_) {
      view.showError(
        'No se pudieron abrir los ajustes. Ábrelos desde el teléfono.',
      );
    }
  }

  void dispose() {
    _cancelarTimer();
  }

  // ---------------------------------------------------------------------------

  Future<void> simularAvanceGps(
    int idInspeccion,
    int idInspector,
    String fecha, {
    bool acercar = false,
  }) async {
    try {
      await apiService.simularAvanceGps(
        idInspeccion,
        acercarPorLlegar: acercar,
      );
      view.showSuccessMessage(
        acercar
            ? 'Demo: el inspector quedó a menos de 1 km; el cliente recibió el aviso de que está por llegar.'
            : 'Demo: posición simulada enviada al cliente y al panel.',
      );
      await cargarRuta(idInspector, fecha);
    } catch (e) {
      view.showError(_mensajeDe(e));
    }
  }

  Future<void> registrarLlegada(
    int idInspeccion,
    int idInspector,
    String fecha,
  ) async {
    final idLocal = _idLocalLlegada.putIfAbsent(idInspeccion, generarIdLocal);
    view.showLoading();
    try {
      await apiService.registrarLlegada(
        idInspeccion,
        idInspector: idInspector,
        idLocal: idLocal,
      );
      _idLocalLlegada.remove(idInspeccion);
      if (_idInspeccionGps == idInspeccion) detenerGps();
      view.showSuccessMessage(
        'Llegada registrada. Se dejó de compartir tu ubicación con el cliente.',
      );
      await cargarRuta(idInspector, fecha);
    } catch (e) {
      view.showError('${_mensajeDe(e)}. Puedes volver a intentarlo.');
    } finally {
      view.hideLoading();
    }
  }

  /// Se registró el resultado o la ausencia desde la pantalla de captura.
  Future<void> operacionEnSitioRegistrada(
    int idInspeccion,
    int idInspector,
    String fecha,
  ) async {
    if (_idInspeccionGps == idInspeccion) detenerGps();
    await cargarRuta(idInspector, fecha);
  }
}
