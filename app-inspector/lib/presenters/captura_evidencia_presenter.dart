import 'package:flutter/services.dart';

import 'contracts/captura_evidencia_contract.dart';
import '../models/foto_evidencia_model.dart';
import '../services/foto_service.dart';
import '../services/id_local.dart';
import '../services/inspector_api_service.dart';

/// Captura del resultado de la inspección o del cliente ausente.
///
/// El `idLocal` de la operación se genera una sola vez al abrir la captura y se
/// reúsa en cada reintento de envío (RN-12).
class CapturaEvidenciaPresenter {
  final CapturaEvidenciaViewContract view;
  final InspectorApiService apiService;
  final FotoService fotoService;
  final int maxFotos;
  final String idLocal = generarIdLocal();

  final List<FotoEvidencia> _fotos = [];
  bool _enviando = false;

  CapturaEvidenciaPresenter(
    this.view, {
    required this.maxFotos,
    InspectorApiService? service,
    FotoService? fotos,
  }) : apiService = service ?? InspectorApiService(),
       fotoService = fotos ?? FotoService();

  List<FotoEvidencia> get fotos => List.unmodifiable(_fotos);

  Future<void> agregarFoto({required bool desdeCamara}) async {
    if (_fotos.length >= maxFotos) {
      view.showError(
        maxFotos == 1
            ? 'Solo se necesita una foto.'
            : 'Puedes adjuntar hasta $maxFotos fotos.',
      );
      return;
    }
    try {
      final foto = await fotoService.obtenerFoto(desdeCamara: desdeCamara);
      if (foto == null) return; // canceló
      _fotos.add(foto);
      view.showFotos(fotos);
    } on PlatformException catch (e) {
      if (e.code == 'camera_access_denied') {
        view.showError(
          'La app no tiene permiso para usar la cámara. Actívalo en los ajustes del teléfono.',
        );
      } else if (e.code == 'photo_access_denied') {
        view.showError(
          'La app no tiene permiso para ver tus fotos. Actívalo en los ajustes del teléfono.',
        );
      } else if (e.code == 'no_available_camera') {
        view.showError(
          'Este dispositivo no tiene cámara disponible. Elige una foto de la galería.',
        );
      } else {
        view.showError('No se pudo obtener la foto: ${e.message ?? e.code}');
      }
    } catch (e) {
      view.showError('No se pudo obtener la foto: $e');
    }
  }

  void quitarFoto(int indice) {
    if (indice < 0 || indice >= _fotos.length) return;
    _fotos.removeAt(indice);
    view.showFotos(fotos);
  }

  Future<void> enviarResultado({
    required int idInspeccion,
    required int idInspector,
    required String? estadoTecho,
    required String hallazgos,
    required String? urgencia,
    required String recomendaciones,
  }) async {
    if (_enviando) return;
    if (estadoTecho == null) {
      view.showError('Elige el estado del techo.');
      return;
    }
    if (estadoTecho != 'BUENO' && urgencia == null) {
      view.showError('Indica la urgencia de la reparación.');
      return;
    }
    if (hallazgos.trim().isEmpty) {
      view.showError('Escribe los hallazgos de la inspección.');
      return;
    }
    if (_fotos.isEmpty) {
      view.showError('Agrega al menos una foto del techo.');
      return;
    }

    await _enviar(
      () => apiService.registrarResultado(
        idInspeccion: idInspeccion,
        idLocal: idLocal,
        estadoTecho: estadoTecho,
        hallazgos: hallazgos.trim(),
        urgencia: estadoTecho == 'BUENO' ? null : urgencia,
        recomendaciones: recomendaciones,
        fotos: _fotos,
        idInspector: idInspector,
      ),
      'Inspección completada. El reporte con tus fotos ya está disponible para el cliente.',
    );
  }

  Future<void> enviarClienteAusente({
    required int idInspeccion,
    required int idInspector,
    required String nota,
  }) async {
    if (_enviando) return;
    if (_fotos.isEmpty) {
      view.showError('Toma una foto de la fachada o de la puerta.');
      return;
    }
    if (nota.trim().isEmpty) {
      view.showError('Escribe una nota explicando qué pasó.');
      return;
    }

    await _enviar(
      () => apiService.registrarClienteAusente(
        idInspeccion: idInspeccion,
        idLocal: idLocal,
        nota: nota.trim(),
        fotoFachadaDataUri: _fotos.first.dataUri,
        idInspector: idInspector,
      ),
      'Visita registrada como cliente ausente, con foto y nota.',
    );
  }

  Future<void> _enviar(
    Future<void> Function() operacion,
    String mensajeExito,
  ) async {
    _enviando = true;
    view.showEnviando(true);
    try {
      await operacion();
      view.showEnviadoConExito(mensajeExito);
    } catch (e) {
      view.showError(
        'No se pudo enviar: ${e.toString().replaceAll('Exception: ', '')}. '
        'Tus datos siguen aquí; vuelve a intentarlo.',
      );
    } finally {
      _enviando = false;
      view.showEnviando(false);
    }
  }
}
