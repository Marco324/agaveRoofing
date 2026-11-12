import 'package:flutter/material.dart';
import 'views/screens/mis_citas_screen.dart';

void main() {
  runApp(const AgaveClienteApp());
}

class AgaveClienteApp extends StatelessWidget {
  const AgaveClienteApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AgaveAlerta — Cliente',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF059669), // Emerald Agave
          primary: const Color(0xFF059669),
          secondary: const Color(0xFF4F46E5), // Indigo
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        appBarTheme: const AppBarTheme(
          centerTitle: false,
          elevation: 0,
        ),
      ),
      home: const MisCitasScreen(
        idCliente: 1,
        nombreCliente: 'Robert B. Martinez',
      ),
    );
  }
}
