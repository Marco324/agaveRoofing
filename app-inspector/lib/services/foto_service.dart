import 'dart:convert';

import 'package:image_picker/image_picker.dart';

import '../models/foto_evidencia_model.dart';
import 'id_local.dart';

/// Toma o elige fotos y las prepara para enviarlas a la API.
///
/// La API no tiene subida de archivos: la foto se reduce a 1280 px como máximo
/// y calidad 70, y se envía como `data:image/jpeg;base64,...` en `rutaArchivo`.
class FotoService {
  static const double ladoMaximoPx = 1280;
  static const int calidadJpeg = 70;

  final ImagePicker _picker;

  FotoService({ImagePicker? picker}) : _picker = picker ?? ImagePicker();

  /// Devuelve `null` si el inspector cancela.
  Future<FotoEvidencia?> obtenerFoto({required bool desdeCamara}) async {
    final archivo = await _picker.pickImage(
      source: desdeCamara ? ImageSource.camera : ImageSource.gallery,
      maxWidth: ladoMaximoPx,
      maxHeight: ladoMaximoPx,
      imageQuality: calidadJpeg,
      requestFullMetadata: false,
    );
    if (archivo == null) return null;

    final bytes = await archivo.readAsBytes();
    final mime = _mimeDe(archivo);
    return FotoEvidencia(
      idLocal: generarIdLocal(),
      bytes: bytes,
      dataUri: 'data:$mime;base64,${base64Encode(bytes)}',
      capturadaEn: DateTime.now().toUtc(),
    );
  }

  String _mimeDe(XFile archivo) {
    final declarado = archivo.mimeType;
    if (declarado != null && declarado.startsWith('image/')) return declarado;
    final nombre = archivo.name.toLowerCase();
    if (nombre.endsWith('.png')) return 'image/png';
    if (nombre.endsWith('.webp')) return 'image/webp';
    if (nombre.endsWith('.heic')) return 'image/heic';
    return 'image/jpeg';
  }
}
