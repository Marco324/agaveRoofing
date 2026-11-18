import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/foto_evidencia_model.dart';
import '../models/ruta_parada_model.dart';
import 'ubicacion_service.dart';

/// Error de la API con su código (por ejemplo `TRAYECTO_NO_ACTIVO_RN08`).
class ApiException implements Exception {
  final int statusCode;
  final String mensaje;
  final String? codigo;

  ApiException(this.statusCode, this.mensaje, {this.codigo});

  @override
  String toString() => mensaje;
}

class InspectorApiService {
  final String baseUrl;

  InspectorApiService({String? baseUrl})
    : baseUrl = baseUrl ?? ApiConfig.baseUrl;

  static const Duration _tiempoMaximo = Duration(seconds: 30);
  static const Map<String, String> _jsonHeaders = {
    'Content-Type': 'application/json',
  };

  ApiException _error(http.Response response, String porDefecto) {
    try {
      final data = json.decode(response.body);
      if (data is Map<String, dynamic>) {
        return ApiException(
          response.statusCode,
          (data['error'] as String?) ?? porDefecto,
          codigo: data['codigo'] as String?,
        );
      }
    } catch (_) {
      // Cuerpo no JSON
    }
    return ApiException(
      response.statusCode,
      '$porDefecto (${response.statusCode})',
    );
  }

  Future<Map<String, dynamic>> _post(
    String ruta,
    Map<String, dynamic> cuerpo,
    String errorPorDefecto,
  ) async {
    final response = await http
        .post(
          Uri.parse('$baseUrl$ruta'),
          headers: _jsonHeaders,
          body: json.encode(cuerpo),
        )
        .timeout(_tiempoMaximo);
    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body) as Map<String, dynamic>;
    }
    throw _error(response, errorPorDefecto);
  }

  Future<List<RutaParada>> getRutaDelDia({
    required int idInspector,
    required String fecha,
  }) async {
    final uri = Uri.parse(
      '$baseUrl/inspecciones/mi-ruta?idInspector=$idInspector&fecha=$fecha',
    );
    final response = await http.get(uri).timeout(_tiempoMaximo);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final paradasRaw = data['paradas'] as List<dynamic>? ?? [];
      return paradasRaw.map((e) => RutaParada.fromJson(e)).toList();
    } else {
      throw _error(response, 'No se pudo obtener la ruta');
    }
  }

  /// "Hoy" según la API: `(hoy: '2026-11-12', simulada: true)`.
  Future<({String hoy, bool simulada})> getFechaReferencia() async {
    final response = await http
        .get(Uri.parse('$baseUrl/sistema/fecha'))
        .timeout(const Duration(seconds: 5));
    if (response.statusCode != 200) {
      throw _error(response, 'No se pudo obtener la fecha del sistema');
    }
    final data = json.decode(response.body) as Map<String, dynamic>;
    return (
      hoy: data['hoy'] as String,
      simulada: data['simulada'] as bool? ?? false,
    );
  }

  /// Cuántas paradas tiene el inspector en cada día del rango
  /// (`2026-11-12` → 2) y cuántas quedaron sin cerrar. Las canceladas no cuentan.
  Future<({Map<String, int> total, Map<String, int> sinCerrar})>
  getParadasPorDia({
    required int idInspector,
    required String fechaInicio,
    required String fechaFin,
  }) async {
    final uri = Uri.parse(
      '$baseUrl/inspecciones?idInspector=$idInspector'
      '&fechaInicio=$fechaInicio&fechaFin=$fechaFin',
    );
    final response = await http.get(uri).timeout(_tiempoMaximo);
    if (response.statusCode != 200) {
      throw _error(response, 'No se pudo obtener el calendario');
    }
    final data = json.decode(response.body) as Map<String, dynamic>;
    final conteo = <String, int>{};
    final sinCerrar = <String, int>{};
    for (final i in data['inspecciones'] as List<dynamic>? ?? const []) {
      final fila = i as Map<String, dynamic>;
      if (fila['estado'] == 'CANCELADA') continue;
      final fecha = fila['fecha_programada'] as String?;
      if (fecha == null) continue;
      conteo[fecha] = (conteo[fecha] ?? 0) + 1;
      if (fila['estado'] == 'PENDIENTE_CIERRE') {
        sinCerrar[fecha] = (sinCerrar[fecha] ?? 0) + 1;
      }
    }
    return (total: conteo, sinCerrar: sinCerrar);
  }

  /// "Voy en camino" con la posición real. Devuelve el `id_trayecto` abierto.
  Future<int> iniciarTrayecto(
    int idInspeccion, {
    required int idInspector,
    required PosicionGps posicion,
  }) async {
    final data = await _post('/inspecciones/$idInspeccion/trayecto', {
      'idInspector': idInspector,
      'latitudInicial': posicion.latitud,
      'longitudInicial': posicion.longitud,
    }, 'No se pudo iniciar el trayecto');
    final trayecto = data['trayecto'] as Map<String, dynamic>?;
    final idTrayecto = (trayecto?['id_trayecto'] as num?)?.toInt();
    if (idTrayecto == null) {
      throw ApiException(500, 'La API no devolvió el trayecto abierto.');
    }
    return idTrayecto;
  }

  /// Envía un punto GPS del trayecto activo.
  Future<void> enviarPuntoGps(int idTrayecto, PosicionGps posicion) async {
    await _post('/trayectos/$idTrayecto/punto', {
      'latitud': posicion.latitud,
      'longitud': posicion.longitud,
      'precisionM': ?posicion.precisionM,
      'velocidadMs': ?posicion.velocidadMs,
      'capturadoEn': posicion.capturadoEn.toIso8601String(),
    }, 'No se pudo enviar la ubicación');
  }

  /// Modo demo: la API acerca al inspector hacia el domicilio sin GPS real.
  Future<void> simularAvanceGps(
    int idInspeccion, {
    bool acercarPorLlegar = false,
  }) async {
    await _post(
      '/inspecciones/$idInspeccion/simular-avance',
      {'acercarPorLlegar': acercarPorLlegar},
      'No se pudo simular el avance',
    );
  }

  Future<void> registrarLlegada(
    int idInspeccion, {
    required int idInspector,
    required String idLocal,
  }) async {
    await _post('/inspecciones/$idInspeccion/llegada', {
      'idInspector': idInspector,
      'idLocal': idLocal,
    }, 'No se pudo registrar la llegada');
  }

  Future<void> registrarResultado({
    required int idInspeccion,
    required String idLocal,
    required String estadoTecho,
    required String hallazgos,
    required String? urgencia,
    required String recomendaciones,
    required List<FotoEvidencia> fotos,
    required int idInspector,
  }) async {
    await _post('/inspecciones/$idInspeccion/resultado', {
      'idInspector': idInspector,
      'idLocal': idLocal,
      'estadoTecho': estadoTecho,
      'hallazgos': hallazgos,
      'requiereReparacion': estadoTecho != 'BUENO',
      'urgencia': ?urgencia,
      if (recomendaciones.trim().isNotEmpty)
        'recomendaciones': recomendaciones.trim(),
      'evidencias': [
        for (var i = 0; i < fotos.length; i++)
          {
            'tipo': 'FOTO_TECHO',
            'rutaArchivo': fotos[i].dataUri,
            'descripcion': 'Fotografía del techo ${i + 1}',
            'idLocal': fotos[i].idLocal,
            'capturadaEn': fotos[i].capturadaEn.toIso8601String(),
          },
      ],
    }, 'No se pudo guardar el resultado');
  }

  Future<void> registrarClienteAusente({
    required int idInspeccion,
    required String idLocal,
    required String nota,
    required String fotoFachadaDataUri,
    required int idInspector,
  }) async {
    await _post(
      '/inspecciones/$idInspeccion/ausente',
      {
        'idInspector': idInspector,
        'idLocal': idLocal,
        'nota': nota,
        'rutaFotoEvidencia': fotoFachadaDataUri,
        'descripcionFoto': 'Foto de la fachada: $nota',
      },
      'No se pudo registrar al cliente ausente',
    );
  }

  Future<int> sincronizarLoteOffline({
    required int idInspector,
    required List<Map<String, dynamic>> operaciones,
  }) async {
    final data = await _post('/sincronizar', {
      'idInspector': idInspector,
      'operaciones': operaciones,
    }, 'Error al sincronizar las operaciones pendientes');
    return (data['procesadas'] as num?)?.toInt() ?? operaciones.length;
  }
}
