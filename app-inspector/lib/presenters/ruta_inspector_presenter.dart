import 'contracts/ruta_inspector_contract.dart';
import '../services/inspector_api_service.dart';

class RutaInspectorPresenter {
  final RutaInspectorViewContract view;
  final InspectorApiService apiService;

  RutaInspectorPresenter(this.view, {InspectorApiService? service})
      : apiService = service ?? InspectorApiService();

  Future<void> cargarRuta(int idInspector, String fecha) async {
    view.showLoading();
    try {
      final paradas = await apiService.getRutaDelDia(
        idInspector: idInspector,
        fecha: fecha,
      );
      view.showRuta(paradas, fecha);
    } catch (e) {
      view.showError(e.toString().replaceAll('Exception: ', ''));
    } finally {
      view.hideLoading();
    }
  }

  Future<void> iniciarTrayecto(int idInspeccion, int idInspector, String fecha) async {
    view.showLoading();
    try {
      await apiService.iniciarTrayecto(idInspeccion, idInspector: idInspector);
      view.showSuccessMessage('Trayecto iniciado (E10). El cliente ha sido notificado y el GPS (15s) está activo.');
      await cargarRuta(idInspector, fecha);
    } catch (e) {
      view.showError(e.toString().replaceAll('Exception: ', ''));
      view.hideLoading();
    }
  }

  Future<void> simularAvanceGps(int idInspeccion, int idInspector, String fecha, {bool acercar = false}) async {
    try {
      await apiService.simularAvanceGps(idInspeccion, acercarAlDomicilio: acercar);
      view.showSuccessMessage(
        acercar
            ? '📍 Inspector a < 1 km (RN-02): Se disparó notificación POR_LLEGAR al cliente.'
            : '🛰️ Punto GPS enviado en tiempo real al cliente y al monitor del panel.',
      );
      await cargarRuta(idInspector, fecha);
    } catch (e) {
      view.showError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> registrarLlegada(int idInspeccion, int idInspector, String fecha) async {
    view.showLoading();
    try {
      await apiService.registrarLlegada(idInspeccion, idInspector: idInspector);
      view.showSuccessMessage('¡Llegada registrada! Estado EN_SITIO y transmisión GPS detenida por privacidad (RN-08).');
      await cargarRuta(idInspector, fecha);
    } catch (e) {
      view.showError(e.toString().replaceAll('Exception: ', ''));
      view.hideLoading();
    }
  }

  Future<void> registrarResultado({
    required int idInspeccion,
    required String estadoTecho,
    required String hallazgos,
    required String urgencia,
    required String recomendaciones,
    required List<Map<String, dynamic>> evidencias,
    required int idInspector,
    required String fecha,
  }) async {
    view.showLoading();
    try {
      await apiService.registrarResultado(
        idInspeccion: idInspeccion,
        estadoTecho: estadoTecho,
        hallazgos: hallazgos,
        urgencia: urgencia,
        recomendaciones: recomendaciones,
        evidencias: evidencias,
        idInspector: idInspector,
      );
      view.showSuccessMessage('✅ Inspección completada (RN-11). Reporte PDF generado y cliente notificado.');
      await cargarRuta(idInspector, fecha);
    } catch (e) {
      view.showError(e.toString().replaceAll('Exception: ', ''));
      view.hideLoading();
    }
  }

  Future<void> registrarClienteAusente({
    required int idInspeccion,
    required String motivo,
    required String fotoEvidencia,
    required int idInspector,
    required String fecha,
  }) async {
    view.showLoading();
    try {
      await apiService.registrarClienteAusente(
        idInspeccion: idInspeccion,
        nota: motivo,
        fotoFachadaRuta: fotoEvidencia,
        idInspector: idInspector,
      );
      view.showSuccessMessage('Visita fallida registrada con foto de fachada y nota (RN-10).');
      await cargarRuta(idInspector, fecha);
    } catch (e) {
      view.showError(e.toString().replaceAll('Exception: ', ''));
      view.hideLoading();
    }
  }
}
