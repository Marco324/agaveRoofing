import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
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
  late int _idInspectorActual;
  late String _nombreInspectorActual;
  String _fechaSeleccionada = '2026-11-12';
  List<RutaParada> _paradas = [];

  static const Color agaveEmerald = Color(0xFF059669);

  @override
  void initState() {
    super.initState();
    _idInspectorActual = widget.idInspector;
    _nombreInspectorActual = widget.nombreInspector;
    _presenter = RutaInspectorPresenter(this);
    _presenter.cargarRuta(_idInspectorActual, _fechaSeleccionada);
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
                'Inspector: $_nombreInspectorActual (#$_idInspectorActual)',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 6),
              Text(
                _idInspectorActual == 1
                    ? 'Vehículo: Placas TX-ROOF-01 • Tel: +1-210-555-0142'
                    : 'Vehículo: Placas TX-AGAVE-02 • Tel: +1-210-555-0188',
                style: const TextStyle(fontSize: 12),
              ),
              const SizedBox(height: 6),
              Text(
                _idInspectorActual == 1
                    ? 'Zonas Asignadas (E06): Norte (Stone Oak 78258) y Este (Alamo Heights 78209)'
                    : 'Zonas Asignadas (E06): Centro/Sur (Southtown 78204) y Noroeste (Medical Center 78229)',
                style: const TextStyle(fontSize: 12),
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

  void _mostrarMapaRutaDialog(RutaParada parada) {
    final latDestino = parada.domicilio.latitud ?? 29.6201;
    final lngDestino = parada.domicilio.longitud ?? -98.4864;
    final latInspector = parada.trayectoActivo?.latitudActual ?? 29.4241;
    final lngInspector = parada.trayectoActivo?.longitudActual ?? -98.4936;
    final eta = parada.trayectoActivo?.etaMinutos ?? 18;
    final distM = parada.trayectoActivo?.distanciaRestanteM ?? 9850;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.map, color: agaveEmerald, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Mapa de Ruta • ${parada.folio}',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Lienzo de Mapa de Navegación en San Antonio, TX
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.cyan.shade600, width: 1.5),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Expanded(
                          child: Text(
                            'SAN ANTONIO, TX (I-10 / US-281)',
                            style: TextStyle(
                              color: Colors.cyanAccent,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: parada.estaEnCamino ? agaveEmerald : Colors.blueGrey.shade700,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            parada.estaEnCamino ? 'GPS EN VIVO • ETA $eta min' : 'Ruta Estimada: $eta min',
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.cyan.shade600,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.local_shipping, color: Colors.white, size: 20),
                            ),
                            const SizedBox(height: 4),
                            const Text('Inspector', style: TextStyle(color: Colors.white70, fontSize: 10)),
                          ],
                        ),
                        Expanded(
                          child: Column(
                            children: [
                              Text(
                                '$distM m',
                                style: const TextStyle(
                                  color: Colors.cyanAccent,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                child: Divider(color: Colors.cyanAccent, thickness: 2),
                              ),
                              Text(
                                parada.estaEnCamino ? 'Compartiendo cada 15s' : 'Vía rápida sugerida',
                                style: const TextStyle(color: Colors.white60, fontSize: 9),
                              ),
                            ],
                          ),
                        ),
                        Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: agaveEmerald,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.home_work, color: Colors.white, size: 20),
                            ),
                            const SizedBox(height: 4),
                            const Text('Cliente', style: TextStyle(color: Colors.white70, fontSize: 10)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '📍 Mi GPS: (${latInspector.toStringAsFixed(5)}, ${lngInspector.toStringAsFixed(5)})',
                      style: const TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '🎯 Pin Destino: (${latDestino.toStringAsFixed(5)}, ${lngDestino.toStringAsFixed(5)})',
                      style: const TextStyle(color: Colors.cyanAccent, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Cliente: ${parada.cliente.nombre} (${parada.cliente.telefono})',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
              const SizedBox(height: 4),
              Text(
                'Dirección: ${parada.domicilio.direccionCompleta}, ${parada.domicilio.colonia}, ${parada.domicilio.ciudad}, TX ${parada.domicilio.codigoPostal}',
                style: const TextStyle(fontSize: 12),
              ),
              if (parada.domicilio.referencias != null && parada.domicilio.referencias!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  'Referencias: ${parada.domicilio.referencias}',
                  style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Colors.grey.shade700),
                ),
              ],
              const Divider(height: 22),
              const Text(
                'ABRIR NAVEGACIÓN EXTERNA (PASO A PASO)',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.blueGrey),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.black87,
                      side: BorderSide(color: Colors.grey.shade400),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    ),
                    onPressed: () => _abrirEnAppDeMapas(parada, 'apple'),
                    icon: const Icon(Icons.explore, size: 15, color: Colors.blue),
                    label: const Text('Apple Maps', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.black87,
                      side: BorderSide(color: Colors.grey.shade400),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    ),
                    onPressed: () => _abrirEnAppDeMapas(parada, 'google'),
                    icon: const Icon(Icons.map, size: 15, color: agaveEmerald),
                    label: const Text('Google Maps', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.black87,
                      side: BorderSide(color: Colors.grey.shade400),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    ),
                    onPressed: () => _abrirEnAppDeMapas(parada, 'waze'),
                    icon: const Icon(Icons.directions_car, size: 15, color: Colors.cyan),
                    label: const Text('Waze', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cerrar'),
          ),
          if (parada.puedeIniciarTrayecto)
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo.shade700),
              onPressed: () {
                Navigator.of(ctx).pop();
                _presenter.iniciarTrayecto(
                  parada.idInspeccion,
                  _idInspectorActual,
                  _fechaSeleccionada,
                );
              },
              icon: const Icon(Icons.navigation, size: 16, color: Colors.white),
              label: const Text('Iniciar Trayecto Aquí', style: TextStyle(color: Colors.white, fontSize: 12)),
            )
          else if (parada.estaEnCamino)
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: agaveEmerald),
              onPressed: () {
                Navigator.of(ctx).pop();
                _presenter.simularAvanceGps(
                  parada.idInspeccion,
                  _idInspectorActual,
                  _fechaSeleccionada,
                );
              },
              icon: const Icon(Icons.my_location, size: 16, color: Colors.white),
              label: const Text('Avanzar +1 Paso GPS', style: TextStyle(color: Colors.white, fontSize: 12)),
            ),
        ],
      ),
    );
  }

  Future<void> _abrirEnAppDeMapas(RutaParada parada, String proveedor) async {
    final latDestino = parada.domicilio.latitud ?? 29.6201;
    final lngDestino = parada.domicilio.longitud ?? -98.4864;
    final latInspector = parada.trayectoActivo?.latitudActual ?? 29.4241;
    final lngInspector = parada.trayectoActivo?.longitudActual ?? -98.4936;

    final Uri uri;
    if (proveedor == 'apple') {
      uri = Uri.parse(
        'http://maps.apple.com/?saddr=$latInspector,$lngInspector&daddr=$latDestino,$lngDestino&dirflg=d',
      );
    } else if (proveedor == 'waze') {
      uri = Uri.parse(
        'https://waze.com/ul?ll=$latDestino,$lngDestino&navigate=yes',
      );
    } else {
      uri = Uri.parse(
        'https://www.google.com/maps/dir/?api=1&origin=$latInspector,$lngInspector&destination=$latDestino,$lngDestino&travelmode=driving',
      );
    }

    try {
      final abierto = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!abierto && mounted) {
        showError('No se pudo abrir la aplicación de mapas seleccionada.');
      }
    } on MissingPluginException {
      if (mounted) {
        showError(
          'Para activar url_launcher en el simulador tras instalar el paquete, detén (q) y ejecuta flutter run nuevamente.',
        );
      }
    } catch (e) {
      if (mounted) {
        showError('Error al abrir mapa externo: $e');
      }
    }
  }

  void _mostrarSelectorAppsMapa(RutaParada parada) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.navigation, color: agaveEmerald, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Navegar hacia ${parada.domicilio.colonia} (${parada.folio})',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                '${parada.domicilio.direccionCompleta}, ${parada.domicilio.ciudad}, TX',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
              const Divider(height: 20),
              ListTile(
                dense: true,
                leading: const Icon(Icons.explore, color: Colors.blue),
                title: const Text('Abrir en Apple Maps', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: const Text('Navegación nativa paso a paso en iOS / macOS'),
                trailing: const Icon(Icons.open_in_new, size: 16),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _abrirEnAppDeMapas(parada, 'apple');
                },
              ),
              ListTile(
                dense: true,
                leading: const Icon(Icons.map, color: agaveEmerald),
                title: const Text('Abrir en Google Maps', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: const Text('Ruta en automóvil con tráfico en tiempo real'),
                trailing: const Icon(Icons.open_in_new, size: 16),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _abrirEnAppDeMapas(parada, 'google');
                },
              ),
              ListTile(
                dense: true,
                leading: const Icon(Icons.directions_car, color: Colors.cyan),
                title: const Text('Abrir en Waze', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: const Text('Navegación directa a coordenadas GPS del domicilio'),
                trailing: const Icon(Icons.open_in_new, size: 16),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _abrirEnAppDeMapas(parada, 'waze');
                },
              ),
            ],
          ),
        ),
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
              '$_nombreInspectorActual  •  $_fechaSeleccionada',
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        actions: [
          PopupMenuButton<int>(
            icon: const Icon(Icons.engineering),
            tooltip: 'Cambiar Inspector',
            onSelected: (idInsp) {
              setState(() {
                _idInspectorActual = idInsp;
                _nombreInspectorActual = idInsp == 1 ? 'Carlos Garza' : 'David Vance';
              });
              _presenter.cargarRuta(_idInspectorActual, _fechaSeleccionada);
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 1, child: Text('Insp #1: Carlos Garza (Stone Oak / Alamo)')),
              PopupMenuItem(value: 2, child: Text('Insp #2: David Vance (EN_CAMINO E10)')),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.badge_outlined),
            tooltip: 'Perfil y Permisos (E05 / E06)',
            onPressed: _mostrarPerfilYSesionDialog,
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.calendar_month),
            onSelected: (fecha) => _presenter.cargarRuta(_idInspectorActual, fecha),
            itemBuilder: (_) => const [
              PopupMenuItem(value: '2026-11-12', child: Text('Jue 12 Nov (E10 / E11)')),
              PopupMenuItem(value: '2026-11-05', child: Text('Jue 05 Nov (E10)')),
              PopupMenuItem(value: '2026-10-29', child: Text('Jue 29 Oct (E09)')),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _presenter.cargarRuta(_idInspectorActual, _fechaSeleccionada),
          ),
        ],
      ),
      body: _isLoading && _paradas.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => _presenter.cargarRuta(_idInspectorActual, _fechaSeleccionada),
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
                        onVerMapaRuta: () => _mostrarMapaRutaDialog(parada),
                        onAbrirAppMapas: () => _mostrarSelectorAppsMapa(parada),
                        onIniciarTrayecto: () => _presenter.iniciarTrayecto(
                          parada.idInspeccion,
                          _idInspectorActual,
                          _fechaSeleccionada,
                        ),
                        onSimularAvanceGps: () => _presenter.simularAvanceGps(
                          parada.idInspeccion,
                          _idInspectorActual,
                          _fechaSeleccionada,
                        ),
                        onAcercarUnKm: () => _presenter.simularAvanceGps(
                          parada.idInspeccion,
                          _idInspectorActual,
                          _fechaSeleccionada,
                          acercar: true,
                        ),
                        onRegistrarLlegada: () => _presenter.registrarLlegada(
                          parada.idInspeccion,
                          _idInspectorActual,
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
