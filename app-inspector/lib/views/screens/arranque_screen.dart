import 'package:flutter/material.dart';

import '../../services/sesion_service.dart';
import 'login_screen.dart';
import 'ruta_del_dia_screen.dart';

/// Primera pantalla: si hay una sesión guardada y sigue vigente, entra directo;
/// si no, pide correo y contraseña (RF-05).
class ArranqueScreen extends StatefulWidget {
  const ArranqueScreen({super.key});

  @override
  State<ArranqueScreen> createState() => _ArranqueScreenState();
}

class _ArranqueScreenState extends State<ArranqueScreen> {
  @override
  void initState() {
    super.initState();
    _decidir();
  }

  Future<void> _decidir() async {
    final sesion = await SesionService.instancia.restaurar();
    if (!mounted) return;
    final Widget destino = sesion != null && sesion.idInspector != null
        ? RutaDelDiaScreen(idInspector: sesion.idInspector!, nombreInspector: sesion.nombre)
        : const LoginScreen();
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => destino));
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
