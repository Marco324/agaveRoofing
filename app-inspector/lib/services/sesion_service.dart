import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';
import '../models/sesion_model.dart';

/// Error al iniciar sesión, con un mensaje listo para mostrar.
class SesionException implements Exception {
  final String mensaje;
  SesionException(this.mensaje);

  @override
  String toString() => mensaje;
}

/// Inicio y cierre de sesión del inspector (RF-01, RF-05).
///
/// El inspector entra con su correo y contraseña. La sesión se guarda en el
/// teléfono y sigue activa al cerrar y abrir la app hasta que sale o el token vence.
class SesionService {
  SesionService._();
  static final SesionService instancia = SesionService._();

  static const String rol = 'INSPECTOR';
  static const String app = 'APP_INSP';
  static const String _clave = 'agave.sesion.inspector';
  static const Duration _tiempoMaximo = Duration(seconds: 15);

  SesionUsuario? _actual;
  final _expirada = StreamController<void>.broadcast();

  SesionUsuario? get actual => _actual;

  /// Avisa cuando la API rechaza el token (sesión vencida o cerrada en otro lado).
  Stream<void> get alExpirar => _expirada.stream;

  /// Recupera la sesión guardada y la valida con la API.
  /// Sin conexión, se usa la guardada; las pantallas avisan que no hay red.
  Future<SesionUsuario?> restaurar() async {
    final prefs = await SharedPreferences.getInstance();
    final texto = prefs.getString(_clave);
    if (texto == null) return null;

    SesionUsuario? guardada;
    try {
      guardada = SesionUsuario.fromJson(json.decode(texto) as Map<String, dynamic>);
    } catch (_) {
      guardada = null;
    }
    if (guardada == null || guardada.rol != rol || guardada.idInspector == null) {
      await prefs.remove(_clave);
      return null;
    }

    try {
      final resp = await http
          .get(
            Uri.parse('${ApiConfig.baseUrl}/auth/sesion'),
            headers: {'Authorization': 'Bearer ${guardada.token}'},
          )
          .timeout(_tiempoMaximo);
      if (resp.statusCode == 200) {
        final data = json.decode(resp.body) as Map<String, dynamic>;
        final vigente = SesionUsuario.desdeApi(guardada.token, data['usuario'] as Map<String, dynamic>);
        if (vigente.rol != rol || vigente.idInspector == null) {
          await prefs.remove(_clave);
          return null;
        }
        _actual = vigente;
        await prefs.setString(_clave, json.encode(_actual!.toJson()));
        return _actual;
      }
      if (resp.statusCode == 401) {
        await prefs.remove(_clave);
        return null;
      }
    } catch (e) {
      debugPrint('SesionService: no se pudo validar la sesión, se usa la guardada. $e');
    }
    _actual = guardada;
    return _actual;
  }

  Future<SesionUsuario> iniciar({required String correo, required String contrasena}) async {
    final http.Response resp;
    try {
      resp = await http
          .post(
            Uri.parse('${ApiConfig.baseUrl}/auth/login'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({
              'correo': correo,
              'contrasena': contrasena,
              'exigirRol': rol,
              'app': app,
            }),
          )
          .timeout(_tiempoMaximo);
    } catch (_) {
      throw SesionException('No hay conexión con el servidor. Revisa tu internet o la URL de la API.');
    }

    Map<String, dynamic> data = const {};
    try {
      data = json.decode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      // Cuerpo no JSON
    }
    if (resp.statusCode != 200 || data['token'] == null) {
      throw SesionException(
        (data['error'] as String?) ?? 'No se pudo iniciar sesión (${resp.statusCode}).',
      );
    }

    final usuario = data['usuario'];
    final nueva = usuario is Map<String, dynamic>
        ? SesionUsuario.desdeApi(data['token'] as String, usuario)
        : null;
    // Una API anterior a RF-01 responde sin rol ni idInspector: no se puede abrir la app.
    if (nueva == null || nueva.rol != rol || nueva.idInspector == null) {
      throw SesionException(
        'El servidor no devolvió tu perfil de inspector. Reinicia la API (npm run api) con la versión actual e intenta de nuevo.',
      );
    }
    _actual = nueva;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_clave, json.encode(_actual!.toJson()));
    return _actual!;
  }

  /// Cierra la sesión en la API (si hay red) y la borra del teléfono.
  Future<void> cerrar() async {
    final token = _actual?.token;
    await _borrar();
    if (token == null) return;
    try {
      await http
          .post(
            Uri.parse('${ApiConfig.baseUrl}/auth/logout'),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(_tiempoMaximo);
    } catch (_) {
      // Sin red: la sesión ya se borró del teléfono y vencerá sola en la API.
    }
  }

  /// La API rechazó el token: se borra y se avisa para volver al inicio de sesión.
  Future<void> marcarExpirada() async {
    if (_actual == null) return;
    await _borrar();
    _expirada.add(null);
  }

  Future<void> _borrar() async {
    _actual = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_clave);
  }
}
