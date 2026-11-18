import 'dart:convert';
import '../config/api_config.dart';
import '../models/cita_cliente_model.dart';
import '../models/horario_disponible_model.dart';
import '../models/seguimiento_vivo_model.dart';
import 'api_http.dart';

class ClienteApiService {
  final String baseUrl;

  ClienteApiService({String? baseUrl}) : baseUrl = baseUrl ?? ApiConfig.baseUrl;

  Future<Map<String, dynamic>> getMisCitas(int idCliente) async {
    final uri = Uri.parse('$baseUrl/inspecciones/mias?idCliente=$idCliente');
    final response = await ApiHttp.instancia.get(uri);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final proximaRaw = data['proximaCita'];
      final historialRaw = data['historial'] as List<dynamic>? ?? [];

      return {
        'proximaCita': proximaRaw != null ? CitaCliente.fromJson(proximaRaw) : null,
        'historial': historialRaw.map((e) => CitaCliente.fromJson(e)).toList(),
      };
    } else {
      throw Exception('Error al obtener citas (${response.statusCode}): ${response.body}');
    }
  }

  Future<bool> confirmarAsistencia(int idInspeccion) async {
    final uri = Uri.parse('$baseUrl/inspecciones/$idInspeccion/confirmar');
    final response = await ApiHttp.instancia.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'origen': 'APP_CLI'}),
    );

    if (response.statusCode == 200) {
      return true;
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error'] ?? 'No se pudo confirmar la cita');
    }
  }

  Future<List<HorarioDisponible>> getHorariosDisponibles(int idInspeccion) async {
    final uri = Uri.parse('$baseUrl/inspecciones/$idInspeccion/horarios-disponibles');
    final response = await ApiHttp.instancia.get(uri);

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final list = (data['horarios'] ?? data['horariosDisponibles']) as List<dynamic>? ?? [];
      return list.map((e) => HorarioDisponible.fromJson(e)).toList();
    } else {
      throw Exception('Error al obtener horarios disponibles: ${response.body}');
    }
  }

  Future<bool> solicitarReprogramacion({
    required int idInspeccion,
    required String nuevaFecha,
    required String nuevaVentana,
    required String motivo,
  }) async {
    final partes = nuevaVentana.split(' - ');
    final inicio = partes.isNotEmpty ? partes[0].trim() : '09:00';
    final fin = partes.length > 1 ? partes[1].trim() : '11:00';

    final uri = Uri.parse('$baseUrl/inspecciones/$idInspeccion/reprogramacion');
    final response = await ApiHttp.instancia.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'fechaSolicitada': nuevaFecha,
        'ventanaInicioSolicitada': inicio,
        'ventanaFinSolicitada': fin,
        'motivo': motivo,
        'solicitadaPor': 'CLIENTE',
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return true;
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error'] ?? 'Error al solicitar reprogramación');
    }
  }

  Future<bool> confirmarEstoyEnCasa(int idInspeccion) async {
    final uri = Uri.parse('$baseUrl/inspecciones/$idInspeccion/presencia');
    final response = await ApiHttp.instancia.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({}),
    );
    return response.statusCode == 200;
  }

  /// Seguimiento en vivo del inspector (mapa del cliente).
  Future<SeguimientoVivo> getSeguimiento(int idInspeccion) async {
    final uri = Uri.parse('$baseUrl/inspecciones/$idInspeccion/seguimiento');
    final response = await ApiHttp.instancia.get(uri);

    if (response.statusCode == 200) {
      return SeguimientoVivo.fromJson(json.decode(response.body) as Map<String, dynamic>);
    } else {
      throw Exception('No se pudo consultar la ubicación del inspector (${response.statusCode})');
    }
  }
}
