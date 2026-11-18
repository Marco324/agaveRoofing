import 'package:flutter/material.dart';

import '../../models/sesion_model.dart';
import '../../presenters/contracts/login_contract.dart';
import '../../presenters/login_presenter.dart';
import 'mis_citas_screen.dart';

/// Inicio de sesión del cliente con teléfono y contraseña (RF-01).
class LoginScreen extends StatefulWidget {
  /// Mensaje opcional arriba del formulario (por ejemplo, "Tu sesión terminó").
  final String? aviso;

  const LoginScreen({super.key, this.aviso});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> implements LoginViewContract {
  static const Color agaveEmerald = Color(0xFF059669);

  late final LoginPresenter _presenter;
  final _telefonoCtrl = TextEditingController();
  final _contrasenaCtrl = TextEditingController();
  bool _cargando = false;
  bool _verContrasena = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _presenter = LoginPresenter(this);
    _error = widget.aviso;
  }

  @override
  void dispose() {
    _telefonoCtrl.dispose();
    _contrasenaCtrl.dispose();
    super.dispose();
  }

  void _entrar() {
    FocusScope.of(context).unfocus();
    setState(() => _error = null);
    _presenter.iniciarSesion(telefono: _telefonoCtrl.text, contrasena: _contrasenaCtrl.text);
  }

  @override
  void showCargando(bool cargando) {
    if (mounted) setState(() => _cargando = cargando);
  }

  @override
  void showError(String mensaje) {
    if (mounted) setState(() => _error = mensaje);
  }

  @override
  void irAInicio(SesionUsuario sesion) {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => MisCitasScreen(idCliente: sesion.idCliente!, nombreCliente: sesion.nombre),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: AutofillGroup(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(
                      child: Container(
                        width: 84,
                        height: 84,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF04949C),
                          borderRadius: BorderRadius.circular(22),
                        ),
                        child: Image.asset(
                          'assets/branding/agave_logo_blanco.png',
                          semanticLabel: 'Agave Roofing',
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Bienvenido a AgaveAlerta',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Entra con el teléfono que registraste en Agave Roofing para ver y confirmar tu inspección.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 16, color: Colors.black54),
                    ),
                    const SizedBox(height: 28),
                    TextField(
                      controller: _telefonoCtrl,
                      enabled: !_cargando,
                      keyboardType: TextInputType.phone,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.telephoneNumber],
                      style: const TextStyle(fontSize: 18),
                      decoration: const InputDecoration(
                        labelText: 'Teléfono',
                        hintText: '210 555 0201',
                        prefixIcon: Icon(Icons.phone),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _contrasenaCtrl,
                      enabled: !_cargando,
                      obscureText: !_verContrasena,
                      textInputAction: TextInputAction.done,
                      autofillHints: const [AutofillHints.password],
                      onSubmitted: (_) => _entrar(),
                      style: const TextStyle(fontSize: 18),
                      decoration: InputDecoration(
                        labelText: 'Contraseña',
                        prefixIcon: const Icon(Icons.lock_outline),
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          tooltip: _verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña',
                          icon: Icon(_verContrasena ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => _verContrasena = !_verContrasena),
                        ),
                      ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Text(
                          _error!,
                          style: TextStyle(fontSize: 16, color: Colors.red.shade800),
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: agaveEmerald,
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(52),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _cargando ? null : _entrar,
                      child: _cargando
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                            )
                          : const Text('Entrar', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      '¿No tienes contraseña? Llama a Agave Roofing y te la damos de alta.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 15, color: Colors.black54),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
