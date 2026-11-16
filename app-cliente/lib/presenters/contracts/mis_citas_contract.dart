import '../../models/cita_cliente_model.dart';
import '../../models/horario_disponible_model.dart';
import '../../models/seguimiento_vivo_model.dart';

abstract class MisCitasViewContract {
  void showLoading();
  void hideLoading();
  void showCitas({
    required CitaCliente? proximaCita,
    required List<CitaCliente> historial,
  });
  void showError(String message);
  void showSuccessMessage(String message);
  void showHorariosModal(List<HorarioDisponible> horarios, int idInspeccion);

  /// Último estado del seguimiento en vivo; `null` apaga el mapa.
  void showSeguimiento(SeguimientoVivo? seguimiento);
}
