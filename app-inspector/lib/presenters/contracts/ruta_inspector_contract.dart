import '../../models/ruta_parada_model.dart';

abstract class RutaInspectorViewContract {
  void showLoading();
  void hideLoading();
  void showRuta(List<RutaParada> paradas, String fecha);
  void showError(String message);
  void showSuccessMessage(String message);
}
