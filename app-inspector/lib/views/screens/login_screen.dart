import 'package:flutter/material.dart';
import 'package:agave_ui/agave_ui.dart';

import '../../models/sesion_model.dart';
import '../../presenters/contracts/login_contract.dart';
import '../../presenters/login_presenter.dart';
import 'ruta_del_dia_screen.dart';

/// Inicio de sesión del inspector con correo y contraseña (RF-01).
class LoginScreen extends StatefulWidget {
  /// Mensaje opcional arriba del formulario (por ejemplo, "Tu sesión terminó").
  final String? aviso;

  const LoginScreen({super.key, this.aviso});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    implements LoginViewContract {
  late final LoginPresenter _presenter;
  final _correoCtrl = TextEditingController();
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
    _correoCtrl.dispose();
    _contrasenaCtrl.dispose();
    super.dispose();
  }

  void _entrar() {
    FocusScope.of(context).unfocus();
    setState(() => _error = null);
    _presenter.iniciarSesion(
      correo: _correoCtrl.text,
      contrasena: _contrasenaCtrl.text,
    );
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
        builder: (_) => RutaDelDiaScreen(
          idInspector: sesion.idInspector!,
          nombreInspector: sesion.nombre,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
                        width: 64,
                        height: 64,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF04949C),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Image.asset(
                          'assets/branding/agave_logo_blanco.png',
                          semanticLabel: 'Agave Roofing',
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'AgaveAlerta',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 25,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Entra con tu correo para consultar tu ruta.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 15, color: Color(0xFF687A70)),
                    ),
                    const SizedBox(height: 28),
                    TextField(
                      controller: _correoCtrl,
                      enabled: !_cargando,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autocorrect: false,
                      autofillHints: const [
                        AutofillHints.email,
                        AutofillHints.username,
                      ],
                      style: const TextStyle(fontSize: 16),
                      decoration: const InputDecoration(
                        labelText: 'Correo',
                        hintText: 'nombre@agaveroofing.com',
                        prefixIcon: Icon(Icons.email_outlined),
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
                      style: const TextStyle(fontSize: 16),
                      decoration: InputDecoration(
                        labelText: 'Contraseña',
                        prefixIcon: const Icon(Icons.lock_outline),
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          tooltip: _verContrasena
                              ? 'Ocultar contraseña'
                              : 'Mostrar contraseña',
                          icon: Icon(
                            _verContrasena
                                ? Icons.visibility_off
                                : Icons.visibility,
                          ),
                          onPressed: () =>
                              setState(() => _verContrasena = !_verContrasena),
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
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.red.shade800,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: agaveGreen,
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(52),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      onPressed: _cargando ? null : _entrar,
                      child: _cargando
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            )
                          : const Text(
                              'Entrar',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      '¿Olvidaste tu contraseña? Pídela a la oficina.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: Color(0xFF687A70)),
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
