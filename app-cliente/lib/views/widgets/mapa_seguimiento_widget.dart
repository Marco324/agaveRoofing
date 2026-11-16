import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../models/seguimiento_vivo_model.dart';

/// Mapa en vivo (OpenStreetMap) con el domicilio, el inspector y su rastro.
/// Solo dibuja; los datos llegan del presenter cada 15 s.
class MapaSeguimientoWidget extends StatefulWidget {
  final SeguimientoVivo? seguimiento;

  const MapaSeguimientoWidget({super.key, required this.seguimiento});

  @override
  State<MapaSeguimientoWidget> createState() => _MapaSeguimientoWidgetState();
}

class _MapaSeguimientoWidgetState extends State<MapaSeguimientoWidget> {
  static const Color agaveEmerald = Color(0xFF059669);
  final MapController _mapController = MapController();
  bool _mapaListo = false;

  LatLng? get _destino {
    final u = widget.seguimiento?.destino?.ubicacion;
    return u == null ? null : LatLng(u.latitud, u.longitud);
  }

  LatLng? get _inspector {
    final s = widget.seguimiento;
    if (s == null || !s.tienePosicionInspector) return null;
    return LatLng(s.ultimoPunto!.latitud, s.ultimoPunto!.longitud);
  }

  List<LatLng> get _rastro {
    final s = widget.seguimiento;
    if (s == null || !s.ubicacionVisible) return const [];
    return s.rastroReciente.map((p) => LatLng(p.latitud, p.longitud)).toList();
  }

  List<LatLng> get _puntosVisibles => [?_destino, ?_inspector];

  @override
  void didUpdateWidget(covariant MapaSeguimientoWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Seguir al inspector: reencuadrar cada vez que llega una posición nueva.
    WidgetsBinding.instance.addPostFrameCallback((_) => _encuadrar());
  }

  void _encuadrar() {
    if (!_mapaListo || !mounted) return;
    final puntos = _puntosVisibles;
    if (puntos.isEmpty) return;
    if (puntos.length == 1) {
      _mapController.move(puntos.first, 15);
      return;
    }
    _mapController.fitCamera(
      CameraFit.coordinates(
        coordinates: puntos,
        padding: const EdgeInsets.all(48),
        maxZoom: 16,
      ),
    );
  }

  String _textoDistancia(int? metros) {
    if (metros == null) return '—';
    if (metros < 1000) return '$metros m';
    return '${(metros / 1000).toStringAsFixed(1)} km';
  }

  String _textoEta(SeguimientoVivo s) {
    if (s.etaMinutos == null) return '—';
    return s.etaAproximado ? 'Aprox. ${s.etaMinutos} min' : '${s.etaMinutos} min';
  }

  String _textoHace(int? minutos) {
    if (minutos == null) return '—';
    if (minutos < 1) return 'menos de 1 min';
    return minutos == 1 ? '1 min' : '$minutos min';
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.seguimiento;
    final destino = _destino;
    final inspector = _inspector;
    final centroInicial = inspector ?? destino;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.indigo.shade200),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            height: 240,
            child: centroInicial == null
                ? Container(
                    color: Colors.grey.shade100,
                    alignment: Alignment.center,
                    padding: const EdgeInsets.all(16),
                    child: const Text(
                      'Esperando la ubicación del inspector…',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 16, color: Colors.black54),
                    ),
                  )
                : Semantics(
                    label: 'Mapa con la ubicación del inspector y tu domicilio',
                    child: FlutterMap(
                      mapController: _mapController,
                      options: MapOptions(
                        initialCenter: centroInicial,
                        initialZoom: 14,
                        onMapReady: () {
                          _mapaListo = true;
                          _encuadrar();
                        },
                      ),
                      children: [
                        TileLayer(
                          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'com.agaveroofing.agave_app_cliente',
                        ),
                        if (_rastro.length >= 2)
                          PolylineLayer(
                            polylines: [
                              Polyline(
                                points: _rastro,
                                strokeWidth: 5,
                                color: Colors.indigo.withValues(alpha: 0.8),
                              ),
                            ],
                          ),
                        MarkerLayer(
                          markers: [
                            if (destino != null)
                              Marker(
                                point: destino,
                                width: 44,
                                height: 44,
                                alignment: Alignment.topCenter,
                                child: const Icon(Icons.home, color: agaveEmerald, size: 40),
                              ),
                            if (inspector != null)
                              Marker(
                                point: inspector,
                                width: 44,
                                height: 44,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: s!.senalPerdida ? Colors.grey.shade600 : Colors.indigo,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 3),
                                    boxShadow: const [BoxShadow(blurRadius: 4, color: Colors.black26)],
                                  ),
                                  child: const Icon(Icons.local_shipping, color: Colors.white, size: 22),
                                ),
                              ),
                          ],
                        ),
                        const RichAttributionWidget(
                          attributions: [TextSourceAttribution('© OpenStreetMap')],
                        ),
                      ],
                    ),
                  ),
          ),
          Container(
            color: const Color(0xFFEEF2FF),
            padding: const EdgeInsets.all(14),
            child: s == null || !s.ubicacionVisible
                ? const Text(
                    'El mapa se activa cuando el inspector sale hacia tu domicilio.',
                    style: TextStyle(fontSize: 16),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _Dato(
                              titulo: 'Llega en',
                              valor: _textoEta(s),
                              icono: Icons.schedule,
                            ),
                          ),
                          Expanded(
                            child: _Dato(
                              titulo: 'Distancia',
                              valor: _textoDistancia(s.distanciaRestanteM),
                              icono: Icons.straighten,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Icon(
                            s.senalPerdida ? Icons.signal_cellular_connected_no_internet_4_bar : Icons.update,
                            size: 20,
                            color: s.senalPerdida ? Colors.orange.shade800 : Colors.indigo,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              s.senalPerdida
                                  ? 'Última ubicación conocida hace ${_textoHace(s.minutosDesdeUltimoPunto)}'
                                  : 'Actualizado hace ${_textoHace(s.minutosDesdeUltimoPunto)}',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: s.senalPerdida ? FontWeight.bold : FontWeight.normal,
                                color: s.senalPerdida ? Colors.orange.shade900 : Colors.black87,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _Dato extends StatelessWidget {
  final String titulo;
  final String valor;
  final IconData icono;

  const _Dato({required this.titulo, required this.valor, required this.icono});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icono, size: 22, color: Colors.indigo),
        const SizedBox(width: 8),
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(titulo, style: const TextStyle(fontSize: 16, color: Colors.black54)),
              Text(valor, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ],
    );
  }
}
