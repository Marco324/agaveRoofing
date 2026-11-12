import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/ruta_parada_model.dart';

class InspectorApiService {
  final String baseUrl;

  InspectorApiService({this.baseUrl = 'http://localhost:4000/api'});

  Future<List<RutaParada>> getRutaDelDia({
    required int idInspector,
    required String fecha,
  }) async {
    final uri = Uri.parse('$baseUrl/inspecciones/mi-ruta?idInspector=$idInspector&fecha=$fecha');
    final response = await http.get(uri);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final paradasRaw = data['paradas'] as List<dynamic>? ?? [];
      return paradasRaw.map((e) => RutaParada.fromJson(e)).toList();
    } else {
      throw Exception('Error al obtener la ruta (${response.statusCode}): ${response.body}');
    }
  }

  Future<bool> iniciarTrayecto(int idInspeccion, {int idInspector = 1}) async {
    final uri = Uri.parse('$baseUrl/inspecciones/$idInspeccion/trayecto');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'idInspector': idInspector,
        'latitudInicial': 29.555,
        'longitudInicial': -98.485,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return true;
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error'] ?? 'No se pudo iniciar el trayecto');
    }
  }

  Future<bool> simularAvanceGps(int idInspeccion, {bool acercarAlDomicilio = false}) async {
    final uri = Uri.parse('$baseUrl/inspecciones/$idInspeccion/simular-avance');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'acercarAlDomicilio': acercarAlDomicilio}),
    );
    return response.statusCode == 200;
  }

  Future<bool> registrarLlegada(int idInspeccion, {int idInspector = 1}) async {
    final uri = Uri.parse('$baseUrl/inspecciones/$idInspeccion/llegada');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'idInspector': idInspector,
        'idLocal': 'loc-llegada-$idInspeccion-${DateTime.now().millisecondsSinceEpoch}',
      }),
    );

    if (response.statusCode == 200) {
      return true;
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error'] ?? 'No se pudo registrar la llegada');
    }
  }

  Future<bool> registrarResultado({
    required int idInspeccion,
    required String estadoTecho,
    required String hallazgos,
    required String urgencia,
    required String recomendaciones,
    required List<Map<String, dynamic>> evidencias,
    int idInspector = 1,
  }) async {
    final uri = Uri.parse('$baseUrl/inspecciones/$idInspeccion/resultado');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'idInspector': idInspector,
        'estadoTecho': estadoTecho,
        'hallazgos': hallazgos,
        'requiereReparacion': estadoTecho != 'BUENO',
        'urgencia': urgencia,
        'recomendaciones': recomendaciones,
        'idLocal': 'loc-res-$idInspeccion-${DateTime.now().millisecondsSinceEpoch}',
        'evidencias': evidencias,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return true;
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error'] ?? 'No se pudo registrar el resultado (RN-11)');
    }
  }

  Future<bool> registrarClienteAusente({
    required int idInspeccion,
    required String nota,
    required String fotoFachadaRuta,
    int idInspector = 1,
  }) async {
    final uri = Uri.parse('$baseUrl/inspecciones/$idInspeccion/ausente');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'idInspector': idInspector,
        'nota': nota,
        'fotoFachadaRuta': fotoFachadaRuta,
        'idLocal': 'loc-aus-$idInspeccion-${DateTime.now().millisecondsSinceEpoch}',
      }),
    );

    if (response.statusCode == 200) {
      return true;
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error'] ?? 'Error al registrar cliente ausente (RN-10)');
    }
  }

  Future<int> sincronizarLoteOffline({
    required int idInspector,
    required List<Map<String, dynamic>> operaciones,
  }) async {
    final uri = Uri.parse('$baseUrl/sincronizar');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'idInspector': idInspector,
        'operaciones': operaciones,
      }),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['procesadas'] ?? operaciones.length;
    } else {
      throw Exception('Error al sincronizar cola offline (${response.statusCode})');
    }
  }
}
