import 'dart:async';
import 'dart:convert';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';

/// Aviso push recibido mientras la app está abierta (o al tocar la notificación).
class AvisoPush {
  final String? titulo;
  final String? cuerpo;
  final int? idInspeccion;
  final String? tipo;

  /// true si el cliente tocó la notificación para abrir la app.
  final bool abiertaDesdeNotificacion;

  const AvisoPush({
    this.titulo,
    this.cuerpo,
    this.idInspeccion,
    this.tipo,
    this.abiertaDesdeNotificacion = false,
  });
}

/// Manda el acuse a la API: la notificación llegó al teléfono.
Future<void> _enviarAcuse(RemoteMessage mensaje) async {
  final id = mensaje.data['idNotificacion'];
  if (id == null) return;
  try {
    await http
        .post(
          Uri.parse('${ApiConfig.baseUrl}/notificaciones/$id/acuse'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({}),
        )
        .timeout(const Duration(seconds: 8));
  } catch (e) {
    debugPrint('PushService: no se pudo mandar el acuse de #$id: $e');
  }
}

/// Se ejecuta en un isolate aparte cuando llega un push con la app en segundo plano
/// (Android; en iOS solo si la app no fue cerrada a la fuerza).
@pragma('vm:entry-point')
Future<void> manejarPushEnSegundoPlano(RemoteMessage mensaje) async {
  await Firebase.initializeApp();
  await _enviarAcuse(mensaje);
}

/// E08 — Notificaciones push reales con Firebase Cloud Messaging.
///
/// Si el proyecto no tiene `google-services.json` (Android) o
/// `GoogleService-Info.plist` (iOS), Firebase no arranca y la app sigue
/// funcionando igual, solo que sin notificaciones push.
class PushService {
  PushService._();
  static final PushService instancia = PushService._();

  bool _firebaseListo = false;
  bool _escuchando = false;
  int? _idClienteRegistrado;
  int? _idClienteActual;
  final _avisos = StreamController<AvisoPush>.broadcast();

  /// Avisos para la pantalla (mostrar un mensaje y recargar las citas).
  Stream<AvisoPush> get avisos => _avisos.stream;

  bool get disponible => _firebaseListo;

  /// Llamar una vez en `main()` antes de `runApp`.
  Future<void> inicializarFirebase() async {
    if (kIsWeb) return; // El simulador web usa sus notificaciones simuladas.
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(manejarPushEnSegundoPlano);
      _firebaseListo = true;
    } catch (e) {
      debugPrint(
        'PushService: Firebase no está configurado, se sigue sin push '
        '(falta google-services.json / GoogleService-Info.plist). $e',
      );
    }
  }

  /// Pide permiso, obtiene el token y lo registra en la API para [idCliente].
  /// Se puede llamar de nuevo al cambiar de cliente.
  Future<void> registrarCliente(int idCliente) async {
    _idClienteActual = idCliente;
    if (!_firebaseListo) return;
    final messaging = FirebaseMessaging.instance;

    try {
      final permiso = await messaging.requestPermission(alert: true, badge: true, sound: true);
      if (permiso.authorizationStatus == AuthorizationStatus.denied) {
        // RES-05: sin permiso, la API usa el respaldo por SMS.
        debugPrint('PushService: el cliente negó las notificaciones; se usará SMS.');
        return;
      }

      // En iOS, con la app abierta no se muestra el banner del sistema: la pantalla
      // ya enseña su propio aviso (igual que en Android, que no lo muestra en primer plano).
      await messaging.setForegroundNotificationPresentationOptions(
        alert: false,
        badge: true,
        sound: true,
      );

      if (defaultTargetPlatform == TargetPlatform.iOS) {
        // El token de FCM en iOS necesita antes el de APNs (no existe en el simulador sin cuenta de Apple).
        final apns = await messaging.getAPNSToken();
        if (apns == null) {
          debugPrint('PushService: aún no hay token de APNs; se reintentará cuando FCM refresque el token.');
        }
      }

      _escuchar();

      // Token clásico de registro de FCM: es el que acepta la API HTTP v1 en `message.token`.
      // firebase_messaging 17 lo marca obsoleto a favor de register()/onRegistered (ID de instalación),
      // pero sigue funcionando; se migrará cuando la API del servidor documente ese destino.
      // ignore: deprecated_member_use
      final token = await messaging.getToken();
      if (token != null && _idClienteRegistrado != idCliente) {
        await _registrarToken(idCliente, token);
      }

      // Si la app se abrió tocando una notificación con la app cerrada.
      final inicial = await messaging.getInitialMessage();
      if (inicial != null) _emitir(inicial, abierta: true);
    } catch (e) {
      debugPrint('PushService: no se pudo registrar el dispositivo: $e');
    }
  }

  void _escuchar() {
    if (_escuchando) return;
    _escuchando = true;

    // ignore: deprecated_member_use
    FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      final id = _idClienteActual;
      if (id != null) _registrarToken(id, token);
    });

    FirebaseMessaging.onMessage.listen((mensaje) {
      _enviarAcuse(mensaje);
      _emitir(mensaje, abierta: false);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((mensaje) {
      _enviarAcuse(mensaje);
      _emitir(mensaje, abierta: true);
    });
  }

  void _emitir(RemoteMessage mensaje, {required bool abierta}) {
    _avisos.add(AvisoPush(
      titulo: mensaje.notification?.title,
      cuerpo: mensaje.notification?.body,
      idInspeccion: int.tryParse(mensaje.data['idInspeccion'] ?? ''),
      tipo: mensaje.data['tipo'],
      abiertaDesdeNotificacion: abierta,
    ));
  }

  Future<void> _registrarToken(int idCliente, String token) async {
    final plataforma = defaultTargetPlatform == TargetPlatform.iOS ? 'IOS' : 'ANDROID';
    try {
      final resp = await http
          .post(
            Uri.parse('${ApiConfig.baseUrl}/dispositivos'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({
              'idCliente': idCliente,
              'tokenPush': token,
              'plataforma': plataforma,
              'versionApp': '1.0.0',
            }),
          )
          .timeout(const Duration(seconds: 10));
      if (resp.statusCode == 201) {
        _idClienteRegistrado = idCliente;
        debugPrint('PushService: dispositivo registrado para el cliente #$idCliente.');
      } else {
        debugPrint('PushService: la API respondió ${resp.statusCode} al registrar el token: ${resp.body}');
      }
    } catch (e) {
      debugPrint('PushService: no se pudo registrar el token en la API: $e');
    }
  }
}
