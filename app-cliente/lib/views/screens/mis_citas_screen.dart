import 'dart:async';

import 'package:flutter/material.dart';
import 'package:agave_ui/agave_ui.dart';
import '../../models/cita_cliente_model.dart';
import '../../models/horario_disponible_model.dart';
import '../../models/seguimiento_vivo_model.dart';
import '../../presenters/contracts/mis_citas_contract.dart';
import '../../presenters/mis_citas_presenter.dart';
import '../../services/push_service.dart';
import '../../services/sesion_service.dart';
import '../../utils/formato_fecha.dart';
import '../widgets/proxima_cita_widget.dart';
import '../widgets/reprogramar_dialog.dart';
import 'login_screen.dart';

class MisCitasScreen extends StatefulWidget {
  final int idCliente;
  final String nombreCliente;

  /// El cliente de la sesión iniciada (RF-03): la app muestra solo sus citas.
  const MisCitasScreen({
    super.key,
    required this.idCliente,
    required this.nombreCliente,
  });

  @override
  State<MisCitasScreen> createState() => _MisCitasScreenState();
}

class _MisCitasScreenState extends State<MisCitasScreen>
    with WidgetsBindingObserver
    implements MisCitasViewContract {
  late final MisCitasPresenter _presenter;
  bool _isLoading = false;
  late final int _idClienteActual;
  late final String _nombreCliente;
  StreamSubscription<AvisoPush>? _subAvisosPush;
  CitaCliente? _proximaCita;
  List<CitaCliente> _historial = [];
  SeguimientoVivo? _seguimiento;

  static const Color agaveEmerald = Color(0xFF059669);

  @override
  void initState() {
    super.initState();
    _idClienteActual = widget.idCliente;
    _nombreCliente = widget.nombreCliente;
    WidgetsBinding.instance.addObserver(this);
    _presenter = MisCitasPresenter(this);
    _presenter.cargarMisCitas(_idClienteActual);
    _subAvisosPush = PushService.instancia.avisos.listen(_alRecibirPush);
    PushService.instancia.registrarCliente(_idClienteActual);
  }

  /// E08 — Push recibido con la app abierta, o el cliente tocó la notificación.
  void _alRecibirPush(AvisoPush aviso) {
    if (!mounted) return;
    _presenter.cargarMisCitas(_idClienteActual);
    if (aviso.abiertaDesdeNotificacion) {
      return; // Ya la vio en la barra de notificaciones.
    }
    final texto = [aviso.titulo, aviso.cuerpo].whereType<String>().join(' — ');
    if (texto.isEmpty) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.notifications_active, color: Colors.white),
            const SizedBox(width: 10),
            Expanded(child: Text(texto)),
          ],
        ),
        backgroundColor: agaveEmerald,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 6),
      ),
    );
  }

  @override
  void dispose() {
    _subAvisosPush?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    _presenter.dispose();
    super.dispose();
  }

  /// El mapa solo se actualiza mientras la app está en primer plano.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _presenter.reanudarSeguimiento();
    } else if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.hidden) {
      _presenter.pausarSeguimiento();
    }
  }

  @override
  void showSeguimiento(SeguimientoVivo? seguimiento) {
    if (mounted) setState(() => _seguimiento = seguimiento);
  }

  @override
  void showLoading() {
    if (mounted) setState(() => _isLoading = true);
  }

  @override
  void hideLoading() {
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  void showCitas({
    required CitaCliente? proximaCita,
    required List<CitaCliente> historial,
  }) {
    if (mounted) {
      setState(() {
        _proximaCita = proximaCita;
        _historial = historial;
      });
    }
  }

  @override
  void showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  void showSuccessMessage(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: agaveEmerald,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  void showHorariosModal(List<HorarioDisponible> horarios, int idInspeccion) {
    showDialog(
      context: context,
      builder: (context) => ReprogramarDialog(
        horarios: horarios,
        onConfirmar: (nuevaFecha, nuevaVentana, motivo) {
          _presenter.enviarSolicitudReprogramacion(
            idInspeccion: idInspeccion,
            nuevaFecha: nuevaFecha,
            nuevaVentana: nuevaVentana,
            motivo: motivo,
            idCliente: _idClienteActual,
          );
        },
      ),
    );
  }

  String _textoOGuion(String? texto) =>
      texto == null || texto.trim().isEmpty ? '—' : texto.trim();

  /// Texto del historial para una visita sin reporte, según lo que pasó.
  String _detalleSinReporte(CitaCliente c) {
    switch (c.estado) {
      case 'NO_REALIZADA':
        return 'No se realizó esta visita';
      case 'PENDIENTE_CIERRE':
        return 'En revisión · tu inspector está terminando el reporte';
      case 'REPROG_SOLICITADA':
        return 'Pediste otra fecha · esperando respuesta de la oficina';
      case 'CLIENTE_AUSENTE':
        return 'No te encontramos en casa';
      default:
        return '${c.etiquetaEstado} · Sin reporte';
    }
  }

  /// Para una visita no realizada: pedir otra fecha, o llamar si ya se usaron
  /// los 3 cambios permitidos (RN-06).
  Widget _botonNuevaVisita(CitaCliente c) {
    if (c.vecesReprogramada >= 3) {
      return Text(
        'Ya usaste los 3 cambios de fecha. Llama a Agave Roofing para agendar otra visita.',
        style: TextStyle(fontSize: 14, color: Colors.grey.shade800),
      );
    }
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        style: OutlinedButton.styleFrom(
          foregroundColor: agaveGreen,
          minimumSize: const Size.fromHeight(46),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        onPressed: () => _presenter.abrirModalReprogramacion(c.idInspeccion),
        icon: const Icon(Icons.edit_calendar, size: 20),
        label: const Text(
          'Agendar nueva visita',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        ),
      ),
    );
  }

  Widget _datoReporte(String etiqueta, String valor) => Text.rich(
    TextSpan(
      children: [
        TextSpan(
          text: '$etiqueta\n',
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF687A70),
            fontWeight: FontWeight.w500,
          ),
        ),
        TextSpan(text: valor),
      ],
    ),
    style: const TextStyle(fontSize: 15, height: 1.5, color: agaveInk),
  );

  void _mostrarReporteDialog(CitaCliente cita) {
    final res = cita.resultado;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        scrollable: true,
        title: Text.rich(
          TextSpan(
            children: [
              const TextSpan(text: 'Reporte de inspección\n'),
              TextSpan(
                text: cita.folio,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w400,
                  color: Color(0xFF687A70),
                  height: 2,
                ),
              ),
            ],
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (res == null)
              const Text(
                'El reporte de esta visita todavía no está disponible.',
                style: TextStyle(fontSize: 16),
              )
            else ...[
              _datoReporte(
                'Estado del techo',
                etiquetaEstadoTecho(res.estadoTecho),
              ),
              const SizedBox(height: 18),
              _datoReporte('Hallazgos', _textoOGuion(res.hallazgos)),
              const SizedBox(height: 18),
              _datoReporte('Urgencia', etiquetaUrgencia(res.urgencia)),
              const SizedBox(height: 18),
              _datoReporte(
                'Recomendaciones',
                _textoOGuion(res.recomendaciones),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cerrar'),
          ),
        ],
      ),
    );
  }

  void _mostrarPerfilYEncuestaDialog() {
    String canalPreferido = 'PUSH';
    bool entendioNotif = true;
    bool facilConfirmar = true;
    bool sirvioMapa = true;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Mi perfil y opinión'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _nombreCliente,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                if (SesionService.instancia.actual?.telefono != null)
                  Text(
                    'Teléfono: ${SesionService.instancia.actual!.telefono}',
                    style: const TextStyle(fontSize: 14, color: Colors.black54),
                  ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: canalPreferido,
                  decoration: const InputDecoration(
                    labelText: 'Cómo prefieres recibir avisos',
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: 'PUSH',
                      child: Text('Notificación en la app'),
                    ),
                    DropdownMenuItem(
                      value: 'SMS',
                      child: Text('Mensaje de texto (SMS)'),
                    ),
                  ],
                  onChanged: (v) =>
                      setDialogState(() => canalPreferido = v ?? 'PUSH'),
                ),
                const Divider(height: 24),
                const Text(
                  'Encuesta rápida',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: agaveEmerald,
                  ),
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text(
                    '¿Entendiste la notificación?',
                    style: TextStyle(fontSize: 12),
                  ),
                  value: entendioNotif,
                  onChanged: (v) =>
                      setDialogState(() => entendioNotif = v ?? true),
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text(
                    '¿Fue fácil confirmar (≤3 toques)?',
                    style: TextStyle(fontSize: 12),
                  ),
                  value: facilConfirmar,
                  onChanged: (v) =>
                      setDialogState(() => facilConfirmar = v ?? true),
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text(
                    '¿Te sirvió ver el mapa en vivo?',
                    style: TextStyle(fontSize: 12),
                  ),
                  value: sirvioMapa,
                  onChanged: (v) =>
                      setDialogState(() => sirvioMapa = v ?? true),
                ),
              ],
            ),
          ),
          actions: [
            TextButton.icon(
              style: TextButton.styleFrom(foregroundColor: Colors.red.shade700),
              onPressed: () {
                Navigator.of(ctx).pop();
                _confirmarCerrarSesion();
              },
              icon: const Icon(Icons.logout),
              label: const Text('Cerrar sesión'),
            ),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cerrar'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: agaveEmerald),
              onPressed: () {
                Navigator.of(ctx).pop();
                showSuccessMessage(
                  '¡Gracias! Guardamos tus preferencias y tu opinión.',
                );
              },
              child: const Text(
                'Guardar',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmarCerrarSesion() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('¿Cerrar sesión?'),
        content: const Text(
          'Para volver a entrar necesitarás tu teléfono y tu contraseña.',
          style: TextStyle(fontSize: 16),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade700,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Cerrar sesión'),
          ),
        ],
      ),
    );
    if (ok == true) _presenter.cerrarSesion();
  }

  @override
  void irAInicioDeSesion() {
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const AgaveBrand(),
        titleSpacing: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hola, ${_nombreCliente.split(' ').first}',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
            ),
            const Text(
              'AgaveAlerta · San Antonio, TX',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
            ),
          ],
        ),

        actions: [
          IconButton(
            icon: const Icon(Icons.verified_user_outlined),
            tooltip: 'Mi perfil y opinión',
            onPressed: _mostrarPerfilYEncuestaDialog,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Actualizar',
            onPressed: () => _presenter.cargarMisCitas(_idClienteActual),
          ),
        ],
      ),
      body: _isLoading && _proximaCita == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => _presenter.cargarMisCitas(_idClienteActual),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.symmetric(
                  horizontal: MediaQuery.sizeOf(context).width > 680
                      ? (MediaQuery.sizeOf(context).width - 640) / 2
                      : 20,
                  vertical: 24,
                ),
                children: [
                  const AgaveIntro(
                    eyebrow: '',
                    title: 'Mis inspecciones',
                    subtitle: 'Tu próxima visita y los reportes de tu techo.',
                  ),
                  if (_proximaCita != null) ...[
                    ProximaCitaCard(
                      cita: _proximaCita!,
                      seguimiento: _seguimiento,
                      onConfirmar: () => _presenter.confirmarAsistencia(
                        _proximaCita!.idInspeccion,
                        _idClienteActual,
                      ),
                      onReprogramar: () => _presenter.abrirModalReprogramacion(
                        _proximaCita!.idInspeccion,
                      ),
                      onEstoyEnCasa: () => _presenter.avisarEstoyEnCasa(
                        _proximaCita!.idInspeccion,
                        _idClienteActual,
                      ),
                    ),
                    const SizedBox(height: 24),
                  ] else ...[
                    Card(
                      elevation: 1,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Padding(
                        padding: EdgeInsets.all(24.0),
                        child: Center(
                          child: Text(
                            'No tienes citas de inspección activas.',
                            style: TextStyle(color: Colors.grey, fontSize: 16),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                  Row(
                    children: [
                      const Icon(
                        Icons.history,
                        color: Colors.blueGrey,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Inspecciones anteriores (${_historial.length})',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w500,
                            color: agaveInk,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (_historial.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Text(
                        'No hay inspecciones previas registradas.',
                        style: TextStyle(color: Colors.grey, fontSize: 16),
                      ),
                    )
                  else
                    ..._historial.map((c) {
                      final tieneReporte = c.resultado != null;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: ListTile(
                          // Sin reporte no hay nada que abrir.
                          onTap: tieneReporte
                              ? () => _mostrarReporteDialog(c)
                              : null,
                          leading: CircleAvatar(
                            backgroundColor: tieneReporte
                                ? Colors.teal.shade50
                                : Colors.grey.shade200,
                            child: Icon(
                              tieneReporte
                                  ? Icons.description_outlined
                                  : Icons.event_note_outlined,
                              color: tieneReporte
                                  ? Colors.teal
                                  : Colors.grey.shade600,
                              size: 20,
                            ),
                          ),
                          title: Text(
                            fechaLarga(c.fechaProgramada),
                            style: const TextStyle(
                              fontWeight: FontWeight.w500,
                              fontSize: 15,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                tieneReporte
                                    ? 'Techo: ${etiquetaEstadoTecho(c.resultado!.estadoTecho)} · Ver reporte'
                                    : _detalleSinReporte(c),
                                style: TextStyle(
                                  fontSize: 14,
                                  color: tieneReporte
                                      ? Colors.teal.shade800
                                      : const Color(0xFF687A70),
                                ),
                              ),
                              if (c.estado == 'NO_REALIZADA') ...[
                                const SizedBox(height: 8),
                                _botonNuevaVisita(c),
                              ],
                            ],
                          ),
                          trailing: tieneReporte
                              ? const Icon(Icons.chevron_right)
                              : null,
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
