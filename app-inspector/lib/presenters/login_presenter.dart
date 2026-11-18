import '../services/sesion_service.dart';
import 'contracts/login_contract.dart';

class LoginPresenter {
  final LoginViewContract view;
  final SesionService _sesion;
  bool _enviando = false;

  LoginPresenter(this.view, {SesionService? sesion}) : _sesion = sesion ?? SesionService.instancia;

  Future<void> iniciarSesion({required String correo, required String contrasena}) async {
    if (_enviando) return;
    final limpio = correo.trim();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(limpio)) {
      view.showError('Escribe tu correo de Agave Roofing.');
      return;
    }
    if (contrasena.isEmpty) {
      view.showError('Escribe tu contraseña.');
      return;
    }

    _enviando = true;
    view.showCargando(true);
    try {
      final sesion = await _sesion.iniciar(correo: limpio, contrasena: contrasena);
      view.irAInicio(sesion);
    } on SesionException catch (e) {
      view.showError(e.mensaje);
    } catch (e) {
      view.showError('No se pudo iniciar sesión. Intenta de nuevo.');
    } finally {
      _enviando = false;
      view.showCargando(false);
    }
  }
}
