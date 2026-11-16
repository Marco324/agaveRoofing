import '../../models/ruta_parada_model.dart';

abstract class RutaInspectorViewContract {
  void showLoading();
  void hideLoading();
  void showRuta(List<RutaParada> paradas, String fecha);
  void showError(String message);
  void showSuccessMessage(String message);

  /// Explica para qué se usa la ubicación antes de pedir el permiso (RF-08).
  /// Devuelve `true` si el inspector acepta continuar.
  Future<bool> confirmarUsoDeUbicacion();

  /// El permiso de ubicación fue negado: no se puede iniciar el trayecto.
  /// [permanente] indica que hay que habilitarlo desde los ajustes del teléfono.
  void showPermisoUbicacionNegado({
    required bool permanente,
    required bool gpsApagado,
  });

  /// Estado del envío de ubicación. [idInspeccion] es `null` si no se comparte.
  void showCompartiendoUbicacion({
    required int? idInspeccion,
    DateTime? ultimoEnvio,
    bool ultimoEnvioFallo = false,
  });
}
