import 'package:flutter/material.dart';
import '../../models/ruta_parada_model.dart';

class ParadaCardWidget extends StatelessWidget {
  final RutaParada parada;
  final int orden;
  final VoidCallback onIniciarTrayecto;
  final VoidCallback? onSimularAvanceGps;
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
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.indigo.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Expanded(
                      child: Text(
                        '🟢 Compartiendo ubicación cada 15 s',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.indigo),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (onSimularAvanceGps != null)
                      TextButton(
                        onPressed: onSimularAvanceGps,
                        child: const Text('+1 Paso GPS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
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
