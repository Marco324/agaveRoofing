import '../../models/sesion_model.dart';

abstract class LoginViewContract {
  void showCargando(bool cargando);
  void showError(String mensaje);

  /// La sesión quedó iniciada: abrir la pantalla principal.
  void irAInicio(SesionUsuario sesion);
}
