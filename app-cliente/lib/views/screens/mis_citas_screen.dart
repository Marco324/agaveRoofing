import 'package:flutter/material.dart';
import '../../models/cita_cliente_model.dart';
import '../../models/horario_disponible_model.dart';
import '../../models/seguimiento_vivo_model.dart';
import '../../presenters/contracts/mis_citas_contract.dart';
import '../../presenters/mis_citas_presenter.dart';
import '../widgets/proxima_cita_widget.dart';
import '../widgets/reprogramar_dialog.dart';

class MisCitasScreen extends StatefulWidget {
  final int idCliente;
  final String nombreCliente;

  const MisCitasScreen({
    super.key,
    this.idCliente = 1,
    this.nombreCliente = 'Robert B. Martinez',
  });

  @override
  State<MisCitasScreen> createState() => _MisCitasScreenState();
}

class _MisCitasScreenState extends State<MisCitasScreen>
    with WidgetsBindingObserver
    implements MisCitasViewContract {
  late final MisCitasPresenter _presenter;
  bool _isLoading = false;
  int _idClienteActual = 1;
  CitaCliente? _proximaCita;
  List<CitaCliente> _historial = [];
  SeguimientoVivo? _seguimiento;

  static const Color agaveEmerald = Color(0xFF059669);

  @override
  void initState() {
    super.initState();
    _idClienteActual = widget.idCliente;
    WidgetsBinding.instance.addObserver(this);
    _presenter = MisCitasPresenter(this);
    _presenter.cargarMisCitas(_idClienteActual);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _presenter.dispose();
    super.dispose();
  }

  /// El mapa solo se actualiza mientras la app está en primer plano.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _presenter.reanudarSeguimiento();
    } else if (state == AppLifecycleState.paused || state == AppLifecycleState.hidden) {
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

  void _mostrarReporteDialog(CitaCliente cita) {
    final res = cita.resultado;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Reporte ${cita.folio}'),
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
              Text(
                'Estado del techo: ${etiquetaEstadoTecho(res.estadoTecho)}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: agaveEmerald),
              ),
              const SizedBox(height: 8),
              Text('Hallazgos: ${_textoOGuion(res.hallazgos)}', style: const TextStyle(fontSize: 16)),
              const SizedBox(height: 8),
              Text('Urgencia: ${etiquetaUrgencia(res.urgencia)}', style: const TextStyle(fontSize: 16)),
              const SizedBox(height: 8),
              Text('Recomendaciones: ${_textoOGuion(res.recomendaciones)}', style: const TextStyle(fontSize: 16)),
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
                  'Cliente #$_idClienteActual • Sesión activa',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: canalPreferido,
                  decoration: const InputDecoration(labelText: 'Cómo prefieres recibir avisos'),
                  items: const [
                    DropdownMenuItem(value: 'PUSH', child: Text('Notificación en la app')),
                    DropdownMenuItem(value: 'SMS', child: Text('Mensaje de texto (SMS)')),
                  ],
                  onChanged: (v) => setDialogState(() => canalPreferido = v ?? 'PUSH'),
                ),
                const Divider(height: 24),
                const Text(
                  'Encuesta rápida',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: agaveEmerald),
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('¿Entendiste la notificación?', style: TextStyle(fontSize: 12)),
                  value: entendioNotif,
                  onChanged: (v) => setDialogState(() => entendioNotif = v ?? true),
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('¿Fue fácil confirmar (≤3 toques)?', style: TextStyle(fontSize: 12)),
                  value: facilConfirmar,
                  onChanged: (v) => setDialogState(() => facilConfirmar = v ?? true),
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('¿Te sirvió ver el mapa en vivo?', style: TextStyle(fontSize: 12)),
                  value: sirvioMapa,
                  onChanged: (v) => setDialogState(() => sirvioMapa = v ?? true),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cerrar'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: agaveEmerald),
              onPressed: () {
                Navigator.of(ctx).pop();
                showSuccessMessage('¡Gracias! Guardamos tus preferencias y tu opinión.');
              },
              child: const Text('Guardar', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'AgaveAlerta',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
            ),
            Text(
              'San Antonio, TX • Cliente #$_idClienteActual',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
            ),
          ],
        ),
        backgroundColor: agaveEmerald,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.verified_user_outlined),
            tooltip: 'Mi perfil y opinión',
            onPressed: _mostrarPerfilYEncuestaDialog,
          ),
          PopupMenuButton<int>(
            icon: const Icon(Icons.person),
            onSelected: (idCli) {
              setState(() => _idClienteActual = idCli);
              _presenter.cargarMisCitas(idCli);
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 4, child: Text('Elena Rodriguez (inspector en camino)')),
              PopupMenuItem(value: 1, child: Text('Robert Martinez (con reporte)')),
              PopupMenuItem(value: 2, child: Text('Sarah Jenkins (inspector en sitio)')),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _presenter.cargarMisCitas(_idClienteActual),
          ),
        ],
      ),
      body: _isLoading && _proximaCita == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => _presenter.cargarMisCitas(_idClienteActual),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
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
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
                      const Icon(Icons.history, color: Colors.blueGrey, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Historial y reportes (${_historial.length})',
                          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.blueGrey),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (_historial.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Text('No hay inspecciones previas registradas.', style: TextStyle(color: Colors.grey, fontSize: 16)),
                    )
                  else
                    ..._historial.map((c) => Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          child: ListTile(
                            onTap: () => _mostrarReporteDialog(c),
                            leading: CircleAvatar(
                              backgroundColor: Colors.teal.shade50,
                              child: const Icon(Icons.picture_as_pdf, color: Colors.teal, size: 20),
                            ),
                            title: Text('${c.folio}  •  ${c.etiquetaEstado}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            subtitle: Text(
                              '${c.fechaProgramada} (${c.ventanaInicio} - ${c.ventanaFin})\nEstado del techo: ${etiquetaEstadoTecho(c.resultado?.estadoTecho)} • Toca para ver reporte',
                              style: const TextStyle(fontSize: 16),
                            ),
                            isThreeLine: true,
                          ),
                        )),
                ],
              ),
            ),
    );
  }
}
