import 'package:flutter/material.dart';
import '../../models/cita_cliente_model.dart';

class ProximaCitaCard extends StatelessWidget {
  final CitaCliente cita;
  final VoidCallback onConfirmar;
  final VoidCallback onReprogramar;
  final VoidCallback onEstoyEnCasa;

  static const Color agaveEmerald = Color(0xFF059669);

  const ProximaCitaCard({
    super.key,
    required this.cita,
    required this.onConfirmar,
    required this.onReprogramar,
    required this.onEstoyEnCasa,
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
      default:
        return Colors.indigo;
    }
  }

  @override
  Widget build(BuildContext context) {
    final estadoColor = _colorPorEstado(cita.estado);

    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.roofing, color: agaveEmerald, size: 24),
                      ),
                      const SizedBox(width: 10),
                      Flexible(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Próxima Inspección',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              cita.folio,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: estadoColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: estadoColor.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    cita.estado,
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: estadoColor),
                  ),
                ),
              ],
            ),
            // E10: Mapa / Tarjeta de Seguimiento en Vivo con ETA cuando el inspector va EN_CAMINO
            if (cita.estado == 'EN_CAMINO' && cita.seguimientoVivo != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.indigo.shade400),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '🛰️ SEGUIMIENTO EN VIVO (E10)',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amberAccent),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Distancia: ${cita.seguimientoVivo!.distanciaMetros ?? 1200} m',
                            style: const TextStyle(fontSize: 12, color: Colors.white),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: agaveEmerald,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        'ETA: ${cita.seguimientoVivo!.etaMinutos ?? 8} min',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const Divider(height: 24),
            Row(
              children: [
                const Icon(Icons.calendar_today_outlined, size: 18, color: Colors.indigo),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${cita.fechaProgramada}  •  ${cita.ventanaInicio} - ${cita.ventanaFin}',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on_outlined, size: 18, color: Colors.redAccent),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${cita.domicilio.direccionCompleta}, ${cita.domicilio.colonia}, ${cita.domicilio.ciudad} TX',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                  ),
                ),
              ],
            ),
            if (cita.inspector != null) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.person_pin, size: 18, color: Colors.blueGrey),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Inspector: ${cita.inspector!.nombre} (${cita.inspector!.placaVehiculo ?? "TX-ROOF"})',
                      style: TextStyle(fontSize: 13, color: Colors.grey.shade800, fontWeight: FontWeight.w500),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 18),
            if (cita.puedeConfirmar) ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: agaveEmerald,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: onConfirmar,
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('Confirmar asistencia (1 toque)', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 8),
            ],
            Row(
              children: [
                if (cita.puedeReprogramar)
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.indigo,
                        side: const BorderSide(color: Colors.indigo),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: onReprogramar,
                      icon: const Icon(Icons.edit_calendar, size: 18),
                      label: Text(
                        'Mover cita (${3 - cita.vecesReprogramada} disp.)',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                if (cita.estado == 'EN_CAMINO' || cita.estado == 'CONFIRMADA' || cita.estado == 'EN_SITIO') ...[
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: cita.clienteEnCasa ? agaveEmerald : Colors.indigo,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: onEstoyEnCasa,
                      icon: const Icon(Icons.home, size: 18),
                      label: Text(
                        cita.clienteEnCasa ? 'En casa confirmado' : 'Ya estoy en casa',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
