import 'dart:async';

import 'package:flutter/material.dart';
import 'services/sesion_service.dart';
import 'views/screens/arranque_screen.dart';
import 'views/screens/login_screen.dart';

void main() {
  runApp(const AgaveInspectorApp());
}

class AgaveInspectorApp extends StatefulWidget {
  const AgaveInspectorApp({super.key});

  @override
  State<AgaveInspectorApp> createState() => _AgaveInspectorAppState();
}

class _AgaveInspectorAppState extends State<AgaveInspectorApp> {
  final _navegador = GlobalKey<NavigatorState>();
  StreamSubscription<void>? _subExpirada;

  @override
  void initState() {
    super.initState();
    // Si la API rechaza el token, se vuelve a pedir la contraseña.
    _subExpirada = SesionService.instancia.alExpirar.listen((_) {
      _navegador.currentState?.pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (_) => const LoginScreen(aviso: 'Tu sesión terminó. Vuelve a entrar con tu correo y contraseña.'),
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
      title: 'AgaveAlerta — Inspector',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F172A), // Slate 900
          primary: const Color(0xFF0F172A),
          secondary: const Color(0xFF059669), // Emerald
        ),
        scaffoldBackgroundColor: const Color(0xFFF1F5F9),
        appBarTheme: const AppBarTheme(centerTitle: false, elevation: 0),
      ),
      home: const ArranqueScreen(),
    );
  }
}
