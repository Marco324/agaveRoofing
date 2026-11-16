import '../../models/foto_evidencia_model.dart';

abstract class CapturaEvidenciaViewContract {
  void showFotos(List<FotoEvidencia> fotos);
  void showEnviando(bool enviando);
  void showError(String message);

  /// La operación quedó registrada en la API; la pantalla puede cerrarse.
  void showEnviadoConExito(String message);
}
