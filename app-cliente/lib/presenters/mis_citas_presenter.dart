import 'contracts/mis_citas_contract.dart';
import '../services/cliente_api_service.dart';

class MisCitasPresenter {
  final MisCitasViewContract view;
  final ClienteApiService apiService;

  MisCitasPresenter(this.view, {ClienteApiService? service})
      : apiService = service ?? ClienteApiService();

  Future<void> cargarMisCitas(int idCliente) async {
    view.showLoading();
    try {
      final resultado = await apiService.getMisCitas(idCliente);
      view.showCitas(
        proximaCita: resultado['proximaCita'],
        historial: resultado['historial'],
      );
    } catch (e) {
      view.showError(e.toString().replaceAll('Exception: ', ''));
    } finally {
      view.hideLoading();
    }
  }

  Future<void> confirmarAsistencia(int idInspeccion, int idCliente) async {
    view.showLoading();
    try {
      await apiService.confirmarAsistencia(idInspeccion);
      view.showSuccessMessage('¡Asistencia confirmada exitosamente! El inspector ha sido notificado.');
      await cargarMisCitas(idCliente);
    } catch (e) {
      view.showError(e.toString().replaceAll('Exception: ', ''));
      view.hideLoading();
    }
  }

  Future<void> abrirModalReprogramacion(int idInspeccion) async {
    view.showLoading();
    try {
      final horarios = await apiService.getHorariosDisponibles(idInspeccion);
      view.hideLoading();
      view.showHorariosModal(horarios, idInspeccion);
    } catch (e) {
      view.hideLoading();
      view.showError('No se pudieron obtener horarios: ${e.toString().replaceAll('Exception: ', '')}');
    }
  }

  Future<void> enviarSolicitudReprogramacion({
    required int idInspeccion,
    required String nuevaFecha,
    required String nuevaVentana,
    required String motivo,
    required int idCliente,
  }) async {
    view.showLoading();
    try {
      await apiService.solicitarReprogramacion(
        idInspeccion: idInspeccion,
        nuevaFecha: nuevaFecha,
        nuevaVentana: nuevaVentana,
        motivo: motivo,
      );
      view.showSuccessMessage('Solicitud de cambio enviada. El administrador revisará el nuevo horario.');
      await cargarMisCitas(idCliente);
    } catch (e) {
      view.showError(e.toString().replaceAll('Exception: ', ''));
      view.hideLoading();
    }
  }

  Future<void> avisarEstoyEnCasa(int idInspeccion, int idCliente) async {
    view.showLoading();
    try {
      await apiService.confirmarEstoyEnCasa(idInspeccion);
      view.showSuccessMessage('¡Aviso enviado! El inspector sabe que ya estás en tu domicilio.');
      await cargarMisCitas(idCliente);
    } catch (e) {
      view.showError(e.toString().replaceAll('Exception: ', ''));
      view.hideLoading();
    }
  }
}
