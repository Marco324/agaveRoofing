import 'package:http/http.dart' as http;

import 'sesion_service.dart';

/// Cliente HTTP para la API: agrega el token de la sesión a cada petición
/// (`Authorization: Bearer …`) y, si la API responde 401, cierra la sesión
/// local para volver a pedir la contraseña (RF-07).
class ApiHttp extends http.BaseClient {
  ApiHttp._();
  static final ApiHttp instancia = ApiHttp._();

  final http.Client _interno = http.Client();

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final token = SesionService.instancia.actual?.token;
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    final respuesta = await _interno.send(request);
    if (respuesta.statusCode == 401 && !request.url.path.contains('/auth/')) {
      SesionService.instancia.marcarExpirada();
    }
    return respuesta;
  }
}
