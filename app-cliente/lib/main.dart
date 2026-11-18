import 'dart:async';

import 'package:flutter/material.dart';
import 'package:agave_ui/agave_ui.dart';
import 'services/push_service.dart';
import 'services/sesion_service.dart';
import 'views/screens/arranque_screen.dart';
import 'views/screens/login_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Notificaciones push con Firebase (si el proyecto no está configurado, la app sigue sin push).
  await PushService.instancia.inicializarFirebase();
  runApp(const AgaveClienteApp());
}

class AgaveClienteApp extends StatefulWidget {
  const AgaveClienteApp({super.key});

  @override
  State<AgaveClienteApp> createState() => _AgaveClienteAppState();
}

class _AgaveClienteAppState extends State<AgaveClienteApp> {
  final _navegador = GlobalKey<NavigatorState>();
  StreamSubscription<void>? _subExpirada;

  @override
  void initState() {
    super.initState();
    // Si la API rechaza el token, se vuelve a pedir la contraseña.
    _subExpirada = SesionService.instancia.alExpirar.listen((_) {
      _navegador.currentState?.pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (_) => const LoginScreen(
            aviso:
                'Tu sesión terminó. Vuelve a entrar con tu teléfono y contraseña.',
          ),
        ),
        (_) => false,
      );
    });
  }

  @override
  void dispose() {
    _subExpirada?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: _navegador,
      title: 'AgaveAlerta — Cliente',
      debugShowCheckedModeBanner: false,
      theme: agaveTheme(),
      home: const ArranqueScreen(),
    );
  }
}
