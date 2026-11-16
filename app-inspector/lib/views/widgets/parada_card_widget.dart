import 'package:flutter/material.dart';
import '../../models/ruta_parada_model.dart';

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
  });

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
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          parada.folio,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: estadoColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: estadoColor.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (parada.estaConfirmada) ...[
                        Icon(Icons.check, size: 12, color: estadoColor),
                        const SizedBox(width: 3),
                      ],
                      Text(
                        parada.estado,
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: estadoColor),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (parada.clienteEnCasa) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
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
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: agaveEmerald),
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
                  '${parada.ventanaInicio} - ${parada.ventanaFin}',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.person_outline, size: 16, color: Colors.blueGrey),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '${parada.cliente.nombre} (${parada.cliente.telefono})',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on_outlined, size: 16, color: Colors.redAccent),
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
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.blue.shade200),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.map_outlined, size: 14, color: Colors.blue.shade800),
                            const SizedBox(width: 4),
                            Text(
                              'Ver Mapa Interno',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.blue.shade800),
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
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: agaveEmerald.withValues(alpha: 0.4)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.open_in_new, size: 14, color: agaveEmerald),
                            SizedBox(width: 4),
                            Text(
                              'Abrir en App de Mapas',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: agaveEmerald),
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
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: onIniciarTrayecto,
                  icon: const Icon(Icons.navigation, size: 18),
                  label: const Text(
                    'Voy en camino (Activar GPS 15s + Avisar al cliente)',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
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
                        const Expanded(
                          child: Row(
                            children: [
                              Icon(Icons.satellite_alt, size: 15, color: Colors.cyanAccent),
                              SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'RUTA ACTIVA • COMPARTIENDO GPS (15s)',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.cyanAccent,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.cyan.shade900,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            'ETA: ${parada.trayectoActivo?.etaMinutos ?? 12} min',
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
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
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
                                child: const Icon(Icons.local_shipping, size: 16, color: Colors.white),
                              ),
                              const Expanded(
                                child: Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 8),
                                  child: Divider(color: Colors.cyanAccent, thickness: 2),
                                ),
                              ),
                              Text(
                                '${parada.trayectoActivo?.distanciaRestanteM ?? 1150} m',
                                style: const TextStyle(
                                  color: Colors.cyanAccent,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                              const Expanded(
                                child: Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 8),
                                  child: Divider(color: agaveEmerald, thickness: 2),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: agaveEmerald,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.home_work, size: 16, color: Colors.white),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  'Mi GPS: (${(parada.trayectoActivo?.latitudActual ?? 29.5029).toStringAsFixed(4)}, ${(parada.trayectoActivo?.longitudActual ?? -98.5689).toStringAsFixed(4)})',
                                  style: const TextStyle(color: Colors.white70, fontSize: 10),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Destino: ${parada.domicilio.colonia}',
                                  textAlign: TextAlign.right,
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (onSimularAvanceGps != null)
                          Expanded(
                            child: OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.cyanAccent,
                                side: const BorderSide(color: Colors.cyanAccent),
                                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                              ),
                              onPressed: onSimularAvanceGps,
                              icon: const Icon(Icons.my_location, size: 14),
                              label: const Text(
                                '+1 Paso GPS (15s)',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        if (onAcercarUnKm != null) ...[
                          const SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.amberAccent,
                                side: const BorderSide(color: Colors.amberAccent),
                                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                              ),
                              onPressed: onAcercarUnKm,
                              icon: const Icon(Icons.near_me, size: 14),
                              label: const Text(
                                'Acercar < 1 km',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
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
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: onRegistrarLlegada,
                      icon: const Icon(Icons.place, size: 18),
                      label: const Text('Llegué (EN_SITIO)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red.shade700,
                      side: BorderSide(color: Colors.red.shade400),
                      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: onMarcarAusente,
                    icon: const Icon(Icons.person_off, size: 16),
                    label: const Text('Ausente', style: TextStyle(fontSize: 12)),
                  ),
                ],
              ),
            ] else if (parada.estaEnSitio) ...[
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple.shade700,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: onCapturarResultado,
                      icon: const Icon(Icons.assignment_turned_in, size: 18),
                      label: const Text(
                        'Capturar Resultado y Fotos (RN-11)',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: onMarcarAusente,
                    child: const Text('Ausente', style: TextStyle(fontSize: 12)),
                  ),
                ],
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
                  '✅ Inspección Completada • Estado del techo: ${parada.estadoTechoResultado ?? "REGULAR"}',
                  style: const TextStyle(color: Colors.teal, fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
