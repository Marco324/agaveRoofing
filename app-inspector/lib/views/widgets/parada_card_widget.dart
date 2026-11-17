import 'package:flutter/material.dart';
import '../../models/ruta_parada_model.dart';
import '../../utils/formato_fecha.dart';

class ParadaCardWidget extends StatelessWidget {
  final RutaParada parada;
  final int orden;
  final VoidCallback onIniciarTrayecto;
  final VoidCallback? onSimularAvanceGps;
  final VoidCallback? onAcercarUnKm;
  final VoidCallback? onVerMapaRuta;
  final VoidCallback? onAbrirAppMapas;
  final VoidCallback onRegistrarLlegada;
  final VoidCallback? onCapturarResultado;
  final VoidCallback onMarcarAusente;
  final VoidCallback? onLlamarCliente;
  final VoidCallback? onMensajeCliente;

  /// Este teléfono está enviando la ubicación de esta cita al cliente.
  final bool compartiendoUbicacion;

  static const Color agaveEmerald = Color(0xFF059669);

  const ParadaCardWidget({
    super.key,
    required this.parada,
    required this.orden,
    required this.onIniciarTrayecto,
    this.onSimularAvanceGps,
    this.onAcercarUnKm,
    this.onVerMapaRuta,
    this.onAbrirAppMapas,
    required this.onRegistrarLlegada,
    this.onCapturarResultado,
    required this.onMarcarAusente,
    this.onLlamarCliente,
    this.onMensajeCliente,
    this.compartiendoUbicacion = false,
  });

  static String _distancia(int? metros) {
    if (metros == null) return '—';
    return metros < 1000
        ? '$metros m'
        : '${(metros / 1000).toStringAsFixed(1)} km';
  }

  static String _coordenadas(double? lat, double? lng) =>
      lat == null || lng == null
      ? '—'
      : '${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}';

  Color _colorPorEstado(String estado) {
    switch (estado) {
      case 'CONFIRMADA':
        return agaveEmerald;
      case 'EN_CAMINO':
        return Colors.indigo;
      case 'EN_SITIO':
        return Colors.purple;
      case 'SIN_CONFIRMAR':
        return Colors.amber.shade800;
      case 'COMPLETADA':
        return Colors.teal;
      case 'CLIENTE_AUSENTE':
        return Colors.red.shade700;
      default:
        return Colors.blueGrey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final estadoColor = _colorPorEstado(parada.estado);

    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.all(14.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: Colors.blueGrey.shade800,
                        child: Text(
                          '$orden',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          parada.folio,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: estadoColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: estadoColor.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (parada.estaConfirmada) ...[
                        Icon(Icons.check, size: 12, color: estadoColor),
                        const SizedBox(width: 3),
                      ],
                      Text(
                        parada.etiquetaEstado,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: estadoColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (parada.clienteEnCasa && !parada.estaCompletada) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: agaveEmerald),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.home, size: 16, color: agaveEmerald),
                    SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '¡El cliente confirmó que ya está en su casa esperándote!',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: agaveEmerald,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const Divider(height: 18),
            Row(
              children: [
                const Icon(Icons.schedule, size: 16, color: Colors.blueGrey),
                const SizedBox(width: 6),
                Text(
                  ventanaHoraria(parada.ventanaInicio, parada.ventanaFin),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(
                  Icons.person_outline,
                  size: 16,
                  color: Colors.blueGrey,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        parada.cliente.nombre,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (parada.cliente.telefono.isNotEmpty)
                        Text(
                          parada.cliente.telefono,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade700,
                          ),
                        ),
                    ],
                  ),
                ),
                if (onLlamarCliente != null &&
                    parada.cliente.telefono.isNotEmpty) ...[
                  IconButton.filledTonal(
                    tooltip: 'Llamar al cliente',
                    onPressed: onLlamarCliente,
                    icon: const Icon(Icons.call, size: 20),
                  ),
                ],
                if (onMensajeCliente != null &&
                    parada.cliente.telefono.isNotEmpty) ...[
                  const SizedBox(width: 4),
                  IconButton.filledTonal(
                    tooltip: 'Enviar SMS al cliente',
                    onPressed: onMensajeCliente,
                    icon: const Icon(Icons.sms_outlined, size: 20),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 6),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  size: 16,
                  color: Colors.redAccent,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '${parada.domicilio.direccionCompleta}, ${parada.domicilio.colonia}, ${parada.domicilio.ciudad} TX',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                  ),
                ),
              ],
            ),
            if (onVerMapaRuta != null || onAbrirAppMapas != null) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  if (onVerMapaRuta != null)
                    InkWell(
                      onTap: onVerMapaRuta,
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.blue.shade200),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.map_outlined,
                              size: 14,
                              color: Colors.blue.shade800,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Ver Mapa Interno',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Colors.blue.shade800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  if (onAbrirAppMapas != null)
                    InkWell(
                      onTap: onAbrirAppMapas,
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: agaveEmerald.withValues(alpha: 0.4),
                          ),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.open_in_new,
                              size: 14,
                              color: agaveEmerald,
                            ),
                            SizedBox(width: 4),
                            Text(
                              'Abrir en App de Mapas',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: agaveEmerald,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ],
            const SizedBox(height: 14),
            if (parada.puedeIniciarTrayecto) ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.indigo.shade700,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onPressed: onIniciarTrayecto,
                  icon: const Icon(Icons.navigation, size: 20),
                  label: const Text(
                    'Voy en camino',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ] else if (parada.estaEnCamino) ...[
              // Mapa de Ruta del Trayecto Activo (E10)
              Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
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
                        Expanded(
                          child: Row(
                            children: [
                              Icon(
                                compartiendoUbicacion
                                    ? Icons.share_location
                                    : Icons.location_disabled,
                                size: 18,
                                color: compartiendoUbicacion
                                    ? Colors.cyanAccent
                                    : Colors.orangeAccent,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  compartiendoUbicacion
                                      ? 'Compartiendo ubicación con el cliente'
                                      : 'Ubicación sin enviar desde este teléfono',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: compartiendoUbicacion
                                        ? Colors.cyanAccent
                                        : Colors.orangeAccent,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.cyan.shade900,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            parada.trayectoActivo?.etaMinutos != null
                                ? 'Llegas en ${parada.trayectoActivo!.etaMinutos} min'
                                : 'Llegas en —',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    // Representación visual de la ruta Inspector -> Domicilio
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: Colors.cyan.shade600,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.local_shipping,
                                  size: 16,
                                  color: Colors.white,
                                ),
                              ),
                              const Expanded(
                                child: Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 8),
                                  child: Divider(
                                    color: Colors.cyanAccent,
                                    thickness: 2,
                                  ),
                                ),
                              ),
                              Text(
                                _distancia(
                                  parada.trayectoActivo?.distanciaRestanteM,
                                ),
                                style: const TextStyle(
                                  color: Colors.cyanAccent,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                              const Expanded(
                                child: Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 8),
                                  child: Divider(
                                    color: agaveEmerald,
                                    thickness: 2,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: agaveEmerald,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.home_work,
                                  size: 16,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  'Mi posición: ${_coordenadas(parada.trayectoActivo?.latitudActual, parada.trayectoActivo?.longitudActual)}',
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 10,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Destino: ${parada.domicilio.colonia}',
                                  textAlign: TextAlign.right,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 10,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (onSimularAvanceGps != null ||
                        onAcercarUnKm != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          if (onSimularAvanceGps != null)
                            Expanded(
                              child: OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.cyanAccent,
                                  side: const BorderSide(
                                    color: Colors.cyanAccent,
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 6,
                                    horizontal: 8,
                                  ),
                                ),
                                onPressed: onSimularAvanceGps,
                                icon: const Icon(Icons.my_location, size: 14),
                                label: const Text(
                                  'Demo: avanzar',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          if (onAcercarUnKm != null) ...[
                            const SizedBox(width: 8),
                            Expanded(
                              child: OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.amberAccent,
                                  side: const BorderSide(
                                    color: Colors.amberAccent,
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 6,
                                    horizontal: 8,
                                  ),
                                ),
                                onPressed: onAcercarUnKm,
                                icon: const Icon(Icons.near_me, size: 14),
                                label: const Text(
                                  'Demo: a menos de 1 km',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: agaveEmerald,
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      onPressed: onRegistrarLlegada,
                      icon: const Icon(Icons.place, size: 20),
                      label: const Text(
                        'Llegué',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red.shade700,
                      side: BorderSide(color: Colors.red.shade400),
                      minimumSize: const Size(0, 48),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onPressed: onMarcarAusente,
                    icon: const Icon(Icons.person_off, size: 18),
                    label: const Text(
                      'Ausente',
                      style: TextStyle(fontSize: 16),
                    ),
                  ),
                ],
              ),
            ] else if (parada.estaEnSitio) ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.purple.shade700,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(52),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onPressed: onCapturarResultado,
                  icon: const Icon(Icons.assignment_turned_in, size: 20),
                  label: const Text(
                    'Capturar resultado',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Center(
                child: TextButton.icon(
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.red.shade700,
                    minimumSize: const Size(0, 44),
                  ),
                  onPressed: onMarcarAusente,
                  icon: const Icon(Icons.person_off_outlined, size: 18),
                  label: const Text(
                    'El cliente no está (registrar ausencia)',
                    style: TextStyle(fontSize: 14),
                  ),
                ),
              ),
            ] else if (parada.estaCompletada) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.teal.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Inspección completada • Estado del techo: ${etiquetaEstadoTecho(parada.estadoTechoResultado)}',
                  style: const TextStyle(
                    color: Colors.teal,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
