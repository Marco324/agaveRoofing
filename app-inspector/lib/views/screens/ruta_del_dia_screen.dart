import 'package:flutter/material.dart';
import '../../models/ruta_parada_model.dart';
import '../../presenters/contracts/ruta_inspector_contract.dart';
import '../../presenters/ruta_inspector_presenter.dart';
import '../widgets/parada_card_widget.dart';

class RutaDelDiaScreen extends StatefulWidget {
  final int idInspector;
  final String nombreInspector;

  const RutaDelDiaScreen({
    super.key,
    this.idInspector = 1,
    this.nombreInspector = 'Carlos Garza',
  });

  @override
  State<RutaDelDiaScreen> createState() => _RutaDelDiaScreenState();
}

class _RutaDelDiaScreenState extends State<RutaDelDiaScreen> implements RutaInspectorViewContract {
  late final RutaInspectorPresenter _presenter;
  bool _isLoading = false;
  String _fechaSeleccionada = '2026-11-12';
  List<RutaParada> _paradas = [];

  static const Color agaveEmerald = Color(0xFF059669);

  @override
  void initState() {
    super.initState();
    _presenter = RutaInspectorPresenter(this);
    _presenter.cargarRuta(widget.idInspector, _fechaSeleccionada);
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
  void showRuta(List<RutaParada> paradas, String fecha) {
    if (mounted) {
      setState(() {
        _paradas = paradas;
        _fechaSeleccionada = fecha;
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

  void _confirmarAusente(int idInspeccion) {
    final notaCtrl = TextEditingController(text: 'No hubo respuesta en puerta tras 15 min de espera');
    final fotoCtrl = TextEditingController(text: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Registrar cliente ausente (RN-10)'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'RN-10 exige foto obligatoria de la fachada y nota explicativa antes de marcar la visita como fallida.',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: fotoCtrl,
              decoration: const InputDecoration(labelText: 'URL Foto Fachada (Obligatoria)'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: notaCtrl,
              decoration: const InputDecoration(labelText: 'Nota Explicativa (Obligatoria)'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade700),
            onPressed: () {
              Navigator.of(ctx).pop();
              _presenter.registrarClienteAusente(
                idInspeccion: idInspeccion,
                motivo: notaCtrl.text,
                fotoEvidencia: fotoCtrl.text,
                idInspector: widget.idInspector,
                fecha: _fechaSeleccionada,
              );
            },
            child: const Text('Confirmar ausente', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _capturarResultadoDialog(int idInspeccion) {
    String estadoTecho = 'REGULAR';
    String urgencia = 'MEDIA';
    final hallazgosCtrl = TextEditingController(
      text: 'Desprendimiento de tejas asfálticas en vertiente norte y desgaste de sellador en cumbrera.',
    );
    final recomCtrl = TextEditingController(
      text: 'Reemplazo de faldón norte y resellado elastomérico.',
    );

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Capturar Resultado de Inspección (RN-11)'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: estadoTecho,
                  decoration: const InputDecoration(labelText: 'Estado del Techo'),
                  items: ['BUENO', 'REGULAR', 'MALO', 'CRITICO']
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (v) => setDialogState(() => estadoTecho = v ?? 'REGULAR'),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: urgencia,
                  decoration: const InputDecoration(labelText: 'Urgencia de Reparación'),
                  items: ['BAJA', 'MEDIA', 'ALTA', 'INMEDIATA']
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (v) => setDialogState(() => urgencia = v ?? 'MEDIA'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: hallazgosCtrl,
                  maxLines: 2,
                  decoration: const InputDecoration(labelText: 'Hallazgos Técnicos'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: recomCtrl,
                  decoration: const InputDecoration(labelText: 'Recomendaciones al Cliente'),
                ),
                const SizedBox(height: 10),
                const Row(
                  children: [
                    Icon(Icons.photo_camera, size: 16, color: agaveEmerald),
                    SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '2 fotografías de evidencia adjuntas (RN-11 >= 1 foto)',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: agaveEmerald),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: agaveEmerald),
              onPressed: () {
                Navigator.of(ctx).pop();
                _presenter.registrarResultado(
                  idInspeccion: idInspeccion,
                  estadoTecho: estadoTecho,
                  hallazgos: hallazgosCtrl.text,
                  urgencia: urgencia,
                  recomendaciones: recomCtrl.text,
                  evidencias: [
                    {
                      'tipo': 'TECHO',
                      'rutaArchivo': 'https://images.unsplash.com/photo-1632759145351-1d592919f522',
                      'descripcion': 'Evidencia de tejas asfálticas y cumbrera',
                    },
                    {
                      'tipo': 'CANALETA',
                      'rutaArchivo': 'https://images.unsplash.com/photo-1513694203232-719a280e022f',
                      'descripcion': 'Detalle de canaleta pluvial',
                    },
                  ],
                  idInspector: widget.idInspector,
                  fecha: _fechaSeleccionada,
                );
              },
              child: const Text('Finalizar y Generar PDF', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  void _mostrarPerfilYSesionDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Perfil y Permisos (E05 · E06)'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Inspector: ${widget.nombreInspector}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 6),
              const Text('Vehículo: Placas TX-ROOF-01 • Tel: +1-210-555-0142', style: TextStyle(fontSize: 12)),
              const SizedBox(height: 6),
              const Text(
                'Zonas Asignadas (E06): Norte (Stone Oak 78258) y Este (Alamo Heights 78209)',
                style: TextStyle(fontSize: 12),
              ),
              const Divider(height: 20),
              const Row(
                children: [
                  Icon(Icons.verified_user, size: 16, color: agaveEmerald),
                  SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Sesión Persistente JWT Activa (E05)',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: agaveEmerald),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Permiso de Ubicación (E06 / RN-08): Configurado en "Permitir siempre" únicamente mientras exista un trayecto ACTIVO.',
                style: TextStyle(fontSize: 11, color: Colors.black87),
              ),
            ],
          ),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Ruta del Día — Agave Roofing',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            Text(
              '${widget.nombreInspector}  •  $_fechaSeleccionada',
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.badge_outlined),
            tooltip: 'Perfil y Permisos (E05 / E06)',
            onPressed: _mostrarPerfilYSesionDialog,
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.calendar_month),
            onSelected: (fecha) => _presenter.cargarRuta(widget.idInspector, fecha),
            itemBuilder: (_) => const [
              PopupMenuItem(value: '2026-11-12', child: Text('Jue 12 Nov (E10 / E11)')),
              PopupMenuItem(value: '2026-11-05', child: Text('Jue 05 Nov (E10)')),
              PopupMenuItem(value: '2026-10-29', child: Text('Jue 29 Oct (E09)')),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _presenter.cargarRuta(widget.idInspector, _fechaSeleccionada),
          ),
        ],
      ),
      body: _isLoading && _paradas.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => _presenter.cargarRuta(widget.idInspector, _fechaSeleccionada),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              const Icon(Icons.pin_drop, color: agaveEmerald, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '${_paradas.length} paradas ($_fechaSeleccionada)',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'SQLite + GPS Activo',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: agaveEmerald),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  if (_paradas.isEmpty)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32.0),
                        child: Text(
                          'No hay paradas programadas para esta fecha.',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ),
                    )
                  else
                    ..._paradas.asMap().entries.map((entry) {
                      final index = entry.key + 1;
                      final parada = entry.value;

                      return ParadaCardWidget(
                        orden: index,
                        parada: parada,
                        onIniciarTrayecto: () => _presenter.iniciarTrayecto(
                          parada.idInspeccion,
                          widget.idInspector,
                          _fechaSeleccionada,
                        ),
                        onSimularAvanceGps: () => _presenter.simularAvanceGps(
                          parada.idInspeccion,
                          widget.idInspector,
                          _fechaSeleccionada,
                        ),
                        onRegistrarLlegada: () => _presenter.registrarLlegada(
                          parada.idInspeccion,
                          widget.idInspector,
                          _fechaSeleccionada,
                        ),
                        onCapturarResultado: () => _capturarResultadoDialog(parada.idInspeccion),
                        onMarcarAusente: () => _confirmarAusente(parada.idInspeccion),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
