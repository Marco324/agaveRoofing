import 'dart:typed_data';

/// Foto ya reducida y codificada, lista para mostrarse como miniatura y enviarse.
class FotoEvidencia {
  /// Identificador local de esta foto, generado una sola vez al capturarla.
  /// Si se reintenta el envío, la API reconoce la foto y no la duplica (RN-12).
  final String idLocal;
  final Uint8List bytes;
  final String dataUri;
  final DateTime capturadaEn;

  const FotoEvidencia({
    required this.idLocal,
    required this.bytes,
    required this.dataUri,
    required this.capturadaEn,
  });
}
