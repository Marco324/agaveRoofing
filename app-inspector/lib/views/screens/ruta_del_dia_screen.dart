import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/ruta_parada_model.dart';
import '../../presenters/contracts/ruta_inspector_contract.dart';
import '../../presenters/ruta_inspector_presenter.dart';
import '../../utils/formato_fecha.dart';
import '../widgets/parada_card_widget.dart';
import '../widgets/selector_dias_widget.dart';
import 'capturar_resultado_screen.dart';
import 'cliente_ausente_screen.dart';

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

class _RutaDelDiaScreenState extends State<RutaDelDiaScreen>
    with WidgetsBindingObserver
    implements RutaInspectorViewContract {
  late final RutaInspectorPresenter _presenter;
  bool _isLoading = false;
  late int _idInspectorActual;
  late String _nombreInspectorActual;

  /// "Hoy" según la API; mientras responde, la fecha del teléfono.
  String _hoy = fechaIso(DateTime.now());
  bool _fechaSimulada = false;
  late String _fechaSeleccionada = _hoy;
  List<RutaParada> _paradas = [];

  // Envío de ubicación al cliente
  int? _idInspeccionCompartiendo;
  DateTime? _ultimoEnvioGps;
  bool _ultimoEnvioFallo = false;
  bool _modoDemo = false;

  static const Color agaveEmerald = Color(0xFF059669);

  @override
  void initState() {
    super.initState();
    _idInspectorActual = widget.idInspector;
    _nombreInspectorActual = widget.nombreInspector;
    WidgetsBinding.instance.addObserver(this);
    _presenter = RutaInspectorPresenter(this);
    _presenter.iniciar(_idInspectorActual, fechaPorDefecto: _hoy);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _presenter.dispose();
    _paradasPorDia.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Calendario
  // ---------------------------------------------------------------------------

  /// Paradas por día de los meses ya consultados.
  final ValueNotifier<ConteoDias> _paradasPorDia = ValueNotifier(
    const ConteoDias(),
  );

  /// Meses ya consultados (`2026-11`), para no repetir la petición.
  final Set<String> _mesesConConteo = {};

  @override
  void showFechaReferencia(String hoy, {required bool simulada}) {
    if (!mounted) return;
    setState(() {
      _hoy = hoy;
      _fechaSimulada = simulada;
      _fechaSeleccionada = hoy;
    });
    _cargarConteosDeSemana(fechaDesdeIso(hoy)!);
  }

  @override
  void showParadasPorDia(Map<String, int> conteo, Map<String, int> sinCerrar) {
    if (!mounted) return;
    _paradasPorDia.value = _paradasPorDia.value.unir(
      ConteoDias(total: conteo, sinCerrar: sinCerrar),
    );
    setState(() {});
  }

  /// Pide los conteos del mes (o los dos meses) que toca la semana de [dia].
  void _cargarConteosDeSemana(DateTime dia) {
    final lunes = inicioDeSemana(dia);
    final domingo = DateTime(lunes.year, lunes.month, lunes.day + 6);
    for (final f in {lunes, domingo}) {
      final clave = fechaIso(f).substring(0, 7);
      if (_mesesConConteo.add(clave)) {
        _presenter.cargarParadasPorDia(
          _idInspectorActual,
          fechaIso(DateTime(f.year, f.month, 1)),
          fechaIso(DateTime(f.year, f.month + 1, 0)),
        );
      }
    }
  }

  /// Vuelve a pedir los conteos del mes visible (p. ej. tras cerrar una visita).
  void _refrescarConteosDelMes() {
    final dia = fechaDesdeIso(_fechaSeleccionada)!;
    _mesesConConteo.remove(_fechaSeleccionada.substring(0, 7));
    _cargarConteosDeSemana(dia);
  }

  /// Vuelve a pedir los conteos (al cambiar de inspector o recargar).
  void _reiniciarConteos() {
    _mesesConConteo.clear();
    _paradasPorDia.value = const ConteoDias();
    _cargarConteosDeSemana(fechaDesdeIso(_fechaSeleccionada)!);
  }

  void _seleccionarDia(DateTime dia) {
    final fecha = fechaIso(dia);
    _cargarConteosDeSemana(dia);
    if (fecha == _fechaSeleccionada) return;
    // Se marca de inmediato para que la tira responda sin esperar a la API.
    setState(() {
      _fechaSeleccionada = fecha;
      _paradas = [];
    });
    _presenter.cargarRuta(_idInspectorActual, fecha);
  }

  Future<void> _abrirCalendario() async {
    final elegido = await mostrarCalendarioMes(
      context,
      seleccionada: fechaDesdeIso(_fechaSeleccionada)!,
      hoy: fechaDesdeIso(_hoy)!,
      paradasPorDia: _paradasPorDia,
      cargarMes: (inicio, fin) {
        final clave = fechaIso(
          DateTime(inicio.year, inicio.month, inicio.day + 7),
        ).substring(0, 7);
        if (_mesesConConteo.add(clave)) {
          _presenter.cargarParadasPorDia(
            _idInspectorActual,
            fechaIso(inicio),
            fechaIso(fin),
          );
        }
      },
    );
    if (elegido != null) _seleccionarDia(elegido);
  }

  Future<void> _recargar() async {
    _reiniciarConteos();
    await _presenter.cargarRuta(_idInspectorActual, _fechaSeleccionada);
  }

  /// La ubicación se envía solo con la app en primer plano.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _presenter.reanudarGps();
    } else if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.hidden) {
      _presenter.pausarGps();
    }
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

  @override
  Future<bool> confirmarUsoDeUbicacion() async {
    if (!mounted) return false;
    final acepta = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.location_on, color: agaveEmerald, size: 36),
        title: const Text('Compartir tu ubicación'),
        content: const Text(
          'Mientras vas en camino, AgaveAlerta envía tu ubicación cada 15 segundos para que el cliente '
          'vea en el mapa cuánto falta para que llegues.\n\n'
          'Se deja de compartir en cuanto registras la llegada o marcas al cliente como ausente. '
          'Por ahora solo funciona con la app abierta.',
          style: TextStyle(fontSize: 16),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Ahora no'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: agaveEmerald,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Continuar'),
          ),
        ],
      ),
    );
    return acepta == true;
  }

  @override
  void showPermisoUbicacionNegado({
    required bool permanente,
    required bool gpsApagado,
  }) {
    if (!mounted) return;
    final String mensaje;
    if (gpsApagado) {
      mensaje =
          'El GPS del teléfono está apagado. Enciéndelo para poder avisar al cliente que vas en camino.';
    } else if (permanente) {
      mensaje =
          'La app no tiene permiso de ubicación. Actívalo en los ajustes del teléfono para poder iniciar el trayecto.';
    } else {
      mensaje =
          'Sin permiso de ubicación no se puede iniciar el trayecto, porque el cliente no podría ver cuándo llegas.';
    }
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: Icon(Icons.location_off, color: Colors.red.shade700, size: 36),
        title: const Text('No se puede iniciar el trayecto'),
        content: Text(mensaje, style: const TextStyle(fontSize: 16)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cerrar'),
          ),
          if (gpsApagado || permanente)
            ElevatedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                _presenter.abrirAjustesUbicacion(gpsApagado: gpsApagado);
              },
              child: const Text('Abrir ajustes'),
            ),
        ],
      ),
    );
  }

  @override
  void showCompartiendoUbicacion({
    required int? idInspeccion,
    DateTime? ultimoEnvio,
    bool ultimoEnvioFallo = false,
  }) {
    if (!mounted) return;
    setState(() {
      _idInspeccionCompartiendo = idInspeccion;
      if (idInspeccion == null) {
        _ultimoEnvioGps = null;
        _ultimoEnvioFallo = false;
      } else {
        if (ultimoEnvio != null) _ultimoEnvioGps = ultimoEnvio;
        _ultimoEnvioFallo = ultimoEnvioFallo;
      }
    });
  }

  int _paradasTerminadas() => _paradas.where((p) => p.estaCerrada).length;

  int _paradasSinCerrar() =>
      _paradas.where((p) => p.estaPendienteCierre).length;

  /// Abre el marcador o la app de mensajes con el teléfono del cliente.
  Future<void> _contactarCliente(RutaParada parada, String esquema) async {
    final numero = parada.cliente.telefono.replaceAll(RegExp(r'[^0-9+]'), '');
    if (numero.isEmpty) {
      showError('Este cliente no tiene teléfono registrado.');
      return;
    }
    try {
      final abierto = await launchUrl(Uri(scheme: esquema, path: numero));
      if (!abierto && mounted) {
        showError(
          esquema == 'tel'
              ? 'Este dispositivo no puede hacer llamadas ($numero).'
              : 'Este dispositivo no puede enviar SMS ($numero).',
        );
      }
    } catch (_) {
      if (mounted) {
        showError(
          'No se pudo abrir ${esquema == 'tel' ? 'el marcador' : 'los mensajes'}.',
        );
      }
    }
  }

  /// Antes de registrar la ausencia, sugiere llamar al cliente.
  Future<void> _confirmarAusente(RutaParada parada) async {
    final opcion = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: Icon(Icons.person_off_outlined, color: Colors.red.shade700),
        title: const Text('¿El cliente no está?'),
        content: Text(
          'Antes de registrar la ausencia, intenta llamar a '
          '${parada.cliente.nombre}. Después necesitarás una foto de la '
          'fachada y una nota.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          if (parada.cliente.telefono.isNotEmpty)
            TextButton.icon(
              onPressed: () => Navigator.pop(ctx, 'llamar'),
              icon: const Icon(Icons.call, size: 18),
              label: const Text('Llamar'),
            ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red.shade700),
            onPressed: () => Navigator.pop(ctx, 'registrar'),
            child: const Text('Registrar ausencia'),
          ),
        ],
      ),
    );
    if (!mounted) return;
    if (opcion == 'llamar') {
      await _contactarCliente(parada, 'tel');
    } else if (opcion == 'registrar') {
      await _abrirClienteAusente(parada);
    }
  }

  Future<void> _abrirClienteAusente(RutaParada parada) async {
    final registrado = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => ClienteAusenteScreen(
          parada: parada,
          idInspector: _idInspectorActual,
        ),
      ),
    );
    if (registrado == true) {
      _presenter.operacionEnSitioRegistrada(
        parada.idInspeccion,
        _idInspectorActual,
        _fechaSeleccionada,
      );
      _refrescarConteosDelMes();
    }
  }

  Future<void> _abrirCapturaResultado(RutaParada parada) async {
    final registrado = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CapturarResultadoScreen(
          parada: parada,
          idInspector: _idInspectorActual,
        ),
      ),
    );
    if (registrado == true) {
      _presenter.operacionEnSitioRegistrada(
        parada.idInspeccion,
        _idInspectorActual,
        _fechaSeleccionada,
      );
      _refrescarConteosDelMes();
    }
  }

  void _mostrarPerfilYSesionDialog() {
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Perfil'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Inspector: $_nombreInspectorActual (#$_idInspectorActual)',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Ubicación: se comparte con el cliente solo mientras vas en camino a su domicilio, '
                  'y únicamente con la app abierta.',
                  style: TextStyle(fontSize: 14, color: Colors.black87),
                ),
                const Divider(height: 24),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _modoDemo,
                  title: const Text(
                    'Modo demo',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: const Text(
                    'Muestra botones para simular el avance en el mapa. Mientras está activo no se envía el GPS real.',
                  ),
                  onChanged: (valor) {
                    setDialogState(() {});
                    setState(() => _modoDemo = valor);
                    _presenter.cambiarModoDemo(valor);
                  },
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
      ),
    );
  }

  String _coordenadas(double? lat, double? lng) => lat == null || lng == null
      ? '—'
      : '${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}';

  String _distancia(int? metros) {
    if (metros == null) return '—';
    return metros < 1000
        ? '$metros m'
        : '${(metros / 1000).toStringAsFixed(1)} km';
  }

  void _mostrarMapaRutaDialog(RutaParada parada) {
    final t = parada.trayectoActivo;
    final compartiendo = _idInspeccionCompartiendo == parada.idInspeccion;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.map, color: agaveEmerald, size: 22),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Ruta · ${parada.folio}',
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                ),
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
              if (parada.estaEnCamino) ...[
                Text(
                  'Llegas en: ${t?.etaMinutos != null ? '${t!.etaAproximado ? 'aprox. ' : ''}${t.etaMinutos} min' : '—'}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Distancia restante: ${_distancia(t?.distanciaRestanteM)}',
                  style: const TextStyle(fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  'Mi última posición enviada: ${_coordenadas(t?.latitudActual, t?.longitudActual)}',
                  style: const TextStyle(fontSize: 14),
                ),
                const SizedBox(height: 4),
                Text(
                  _modoDemo
                      ? 'Modo demo: la posición se simula.'
                      : compartiendo
                      ? 'Compartiendo tu ubicación con el cliente cada 15 s.'
                      : 'Tu ubicación no se está enviando desde este teléfono.',
                  style: TextStyle(
                    fontSize: 14,
                    color: compartiendo ? agaveEmerald : Colors.orange.shade800,
                  ),
                ),
                const Divider(height: 22),
              ],
              Text(
                'Cliente: ${parada.cliente.nombre} (${parada.cliente.telefono})',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${parada.domicilio.direccionCompleta}, ${parada.domicilio.colonia}, ${parada.domicilio.ciudad}, TX ${parada.domicilio.codigoPostal}',
                style: const TextStyle(fontSize: 15),
              ),
              const SizedBox(height: 4),
              Text(
                'Coordenadas del domicilio: ${_coordenadas(parada.domicilio.latitud, parada.domicilio.longitud)}',
                style: const TextStyle(fontSize: 14),
              ),
              if (parada.domicilio.referencias != null &&
                  parada.domicilio.referencias!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  'Referencias: ${parada.domicilio.referencias}',
                  style: TextStyle(
                    fontSize: 14,
                    fontStyle: FontStyle.italic,
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
              const Divider(height: 22),
              const Text(
                'Navegar con',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.blueGrey,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final app in const [
                    ('apple', 'Apple Maps', Icons.explore),
                    ('google', 'Google Maps', Icons.map),
                    ('waze', 'Waze', Icons.directions_car),
                  ])
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 44),
                      ),
                      onPressed: () => _abrirEnAppDeMapas(parada, app.$1),
                      icon: Icon(app.$3, size: 18),
                      label: Text(
                        app.$2,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
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
            child: const Text('Cerrar'),
          ),
          if (parada.puedeIniciarTrayecto)
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo.shade700,
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                Navigator.of(ctx).pop();
                _presenter.iniciarTrayecto(
                  parada.idInspeccion,
                  _idInspectorActual,
                  _fechaSeleccionada,
                );
              },
              icon: const Icon(Icons.navigation, size: 18),
              label: const Text('Voy en camino'),
            )
          else if (parada.estaEnCamino && _modoDemo)
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: agaveEmerald,
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                Navigator.of(ctx).pop();
                _presenter.simularAvanceGps(
                  parada.idInspeccion,
                  _idInspectorActual,
                  _fechaSeleccionada,
                );
              },
              icon: const Icon(Icons.my_location, size: 18),
              label: const Text('Demo: avanzar'),
            ),
        ],
      ),
    );
  }

  Future<void> _abrirEnAppDeMapas(RutaParada parada, String proveedor) async {
    final latDestino = parada.domicilio.latitud;
    final lngDestino = parada.domicilio.longitud;
    final tieneCoordenadas = latDestino != null && lngDestino != null;
    final direccion = Uri.encodeComponent(
      '${parada.domicilio.direccionCompleta}, ${parada.domicilio.ciudad}, TX ${parada.domicilio.codigoPostal}',
    );
    final destino = tieneCoordenadas ? '$latDestino,$lngDestino' : direccion;

    // Sin origen: cada app usa la ubicación actual del teléfono.
    final Uri uri;
    if (proveedor == 'apple') {
      uri = Uri.parse('http://maps.apple.com/?daddr=$destino&dirflg=d');
    } else if (proveedor == 'waze') {
      uri = Uri.parse(
        tieneCoordenadas
            ? 'https://waze.com/ul?ll=$destino&navigate=yes'
            : 'https://waze.com/ul?q=$direccion&navigate=yes',
      );
    } else {
      uri = Uri.parse(
        'https://www.google.com/maps/dir/?api=1&destination=$destino&travelmode=driving',
      );
    }

    try {
      final abierto = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
      if (!abierto && mounted) {
        showError('No se pudo abrir la aplicación de mapas seleccionada.');
      }
    } on MissingPluginException {
      if (mounted) {
        showError(
          'Reinicia la app (detén y vuelve a ejecutar flutter run) para abrir mapas externos.',
        );
      }
    } catch (e) {
      if (mounted) {
        showError('Error al abrir el mapa externo: $e');
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
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
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
                title: const Text(
                  'Abrir en Apple Maps',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: const Text(
                  'Navegación nativa paso a paso en iOS / macOS',
                ),
                trailing: const Icon(Icons.open_in_new, size: 16),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _abrirEnAppDeMapas(parada, 'apple');
                },
              ),
              ListTile(
                dense: true,
                leading: const Icon(Icons.map, color: agaveEmerald),
                title: const Text(
                  'Abrir en Google Maps',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: const Text(
                  'Ruta en automóvil con tráfico en tiempo real',
                ),
                trailing: const Icon(Icons.open_in_new, size: 16),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _abrirEnAppDeMapas(parada, 'google');
                },
              ),
              ListTile(
                dense: true,
                leading: const Icon(Icons.directions_car, color: Colors.cyan),
                title: const Text(
                  'Abrir en Waze',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: const Text(
                  'Navegación directa a coordenadas GPS del domicilio',
                ),
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

  Widget _bannerCompartiendoUbicacion() {
    final ultimo = _ultimoEnvioGps;
    final hora = ultimo == null
        ? null
        : '${ultimo.hour.toString().padLeft(2, '0')}:${ultimo.minute.toString().padLeft(2, '0')}:${ultimo.second.toString().padLeft(2, '0')}';
    final String detalle;
    if (_modoDemo) {
      detalle = 'Modo demo: el GPS real está en pausa.';
    } else if (_ultimoEnvioFallo) {
      detalle = 'No se pudo enviar la última posición; se reintenta en 15 s.';
    } else if (hora != null) {
      detalle = 'Última posición enviada a las $hora';
    } else {
      detalle = 'Se envía cada 15 segundos.';
    }
    final color = _ultimoEnvioFallo || _modoDemo
        ? Colors.orange.shade800
        : agaveEmerald;

    return Semantics(
      liveRegion: true,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color),
        ),
        child: Row(
          children: [
            Icon(Icons.share_location, color: color, size: 28),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Compartiendo ubicación con el cliente',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  Text(detalle, style: const TextStyle(fontSize: 14)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        leading: Padding(
          padding: const EdgeInsets.all(10),
          child: Image.asset(
            'assets/branding/agave_logo_blanco.png',
            semanticLabel: 'Agave Roofing',
          ),
        ),
        titleSpacing: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Mi ruta',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
            ),
            Text(
              _fechaSimulada
                  ? '$_nombreInspectorActual · fecha de demo'
                  : _nombreInspectorActual,
              style: const TextStyle(fontSize: 12),
              overflow: TextOverflow.ellipsis,
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
              if (idInsp != _idInspectorActual) _presenter.detenerGps();
              setState(() {
                _idInspectorActual = idInsp;
                _nombreInspectorActual = idInsp == 1
                    ? 'Carlos Garza'
                    : 'David Vance';
              });
              _reiniciarConteos();
              _presenter.cargarRuta(_idInspectorActual, _fechaSeleccionada);
            },
            itemBuilder: (_) => const [
              PopupMenuItem(
                value: 1,
                child: Text('Carlos Garza (Stone Oak / Alamo Heights)'),
              ),
              PopupMenuItem(
                value: 2,
                child: Text('David Vance (Southtown / Medical Center)'),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.badge_outlined),
            tooltip: 'Perfil y modo demo',
            onPressed: _mostrarPerfilYSesionDialog,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Actualizar',
            onPressed: _recargar,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(SelectorSemanaWidget.alto),
          child: SelectorSemanaWidget(
            seleccionada: fechaDesdeIso(_fechaSeleccionada)!,
            hoy: fechaDesdeIso(_hoy)!,
            paradasPorDia: _paradasPorDia.value,
            onSeleccionar: _seleccionarDia,
            onAbrirCalendario: _abrirCalendario,
          ),
        ),
      ),
      body: _isLoading && _paradas.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _recargar,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
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
                              const Icon(
                                Icons.pin_drop,
                                color: agaveEmerald,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${plural(_paradas.length, 'parada')} · ${fechaLarga(_fechaSeleccionada)}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    if (_paradas.isNotEmpty)
                                      Text(
                                        _paradasSinCerrar() > 0
                                            ? '${_paradasTerminadas()} de ${_paradas.length} cerradas · ${_paradasSinCerrar()} sin cerrar'
                                            : '${_paradasTerminadas()} de ${_paradas.length} cerradas',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: _paradasSinCerrar() > 0
                                              ? FontWeight.bold
                                              : FontWeight.normal,
                                          color: _paradasSinCerrar() > 0
                                              ? const Color(0xFFA21CAF)
                                              : Colors.grey.shade700,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (_modoDemo) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.amber.shade100,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'Modo demo',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.amber.shade900,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (_idInspeccionCompartiendo != null) ...[
                    const SizedBox(height: 10),
                    _bannerCompartiendoUbicacion(),
                  ],
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
                        compartiendoUbicacion:
                            _idInspeccionCompartiendo == parada.idInspeccion,
                        // El avance simulado solo existe en modo demo.
                        onSimularAvanceGps: _modoDemo
                            ? () => _presenter.simularAvanceGps(
                                parada.idInspeccion,
                                _idInspectorActual,
                                _fechaSeleccionada,
                              )
                            : null,
                        onAcercarUnKm: _modoDemo
                            ? () => _presenter.simularAvanceGps(
                                parada.idInspeccion,
                                _idInspectorActual,
                                _fechaSeleccionada,
                                acercar: true,
                              )
                            : null,
                        onRegistrarLlegada: () => _presenter.registrarLlegada(
                          parada.idInspeccion,
                          _idInspectorActual,
                          _fechaSeleccionada,
                        ),
                        onCapturarResultado: () =>
                            _abrirCapturaResultado(parada),
                        onMarcarAusente: () => _confirmarAusente(parada),
                        esDeHoy: _fechaSeleccionada == _hoy,
                        esPasada: _fechaSeleccionada.compareTo(_hoy) < 0,
                        onLlamarCliente: () => _contactarCliente(parada, 'tel'),
                        onMensajeCliente: () =>
                            _contactarCliente(parada, 'sms'),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
