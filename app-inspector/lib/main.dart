import 'package:flutter/material.dart';
import 'views/screens/ruta_del_dia_screen.dart';

void main() {
  runApp(const AgaveInspectorApp());
}

class AgaveInspectorApp extends StatelessWidget {
  const AgaveInspectorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
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
        appBarTheme: const AppBarTheme(
          centerTitle: false,
          elevation: 0,
        ),
      ),
      home: const RutaDelDiaScreen(
        idInspector: 1,
        nombreInspector: 'Carlos Garza',
      ),
    );
  }
}
