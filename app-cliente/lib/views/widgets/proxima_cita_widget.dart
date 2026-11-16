import 'package:flutter/material.dart';
import '../../models/cita_cliente_model.dart';
import '../../models/seguimiento_vivo_model.dart';
import 'mapa_seguimiento_widget.dart';

class ProximaCitaCard extends StatelessWidget {
  final CitaCliente cita;
  final SeguimientoVivo? seguimiento;
  final VoidCallback onConfirmar;
  final VoidCallback onReprogramar;
  final VoidCallback onEstoyEnCasa;

  static const Color agaveEmerald = Color(0xFF059669);

  /// Altura mínima de los botones principales (RNF-02).
  static const Size _botonMinimo = Size.fromHeight(48);

  const ProximaCitaCard({
    super.key,
    required this.cita,
    required this.seguimiento,
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
        return Colors.blueGrey;
    }
  }

  String _textoDireccion() {
    final d = cita.domicilio;
    final partes = [d.direccionCompleta, d.colonia, d.ciudad].where((p) => p.trim().isNotEmpty).toList();
    return partes.isEmpty ? '—' : partes.join(', ');
  }

  String _textoInspector(InspectorAsignado inspector) {
    final placa = inspector.placaVehiculo;
    final nombre = inspector.nombre.isNotEmpty ? inspector.nombre : '—';
    return placa != null && placa.isNotEmpty ? '$nombre · Placas $placa' : nombre;
  }

  Widget _botonEstoyEnCasa({required bool principal}) {
    final texto = cita.clienteEnCasa ? 'Ya avisaste que estás en casa' : 'Ya estoy en casa';
    final estilo = ElevatedButton.styleFrom(
      backgroundColor: cita.clienteEnCasa ? agaveEmerald : Colors.indigo,
      foregroundColor: Colors.white,
      minimumSize: _botonMinimo,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    );
    return ElevatedButton.icon(
      style: estilo,
      onPressed: cita.clienteEnCasa ? null : onEstoyEnCasa,
      icon: Icon(cita.clienteEnCasa ? Icons.check_circle : Icons.home, size: 22),
      label: Text(
        texto,
        style: TextStyle(fontSize: principal ? 18 : 16, fontWeight: FontWeight.bold),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final estadoColor = _colorPorEstado(cita.estado);
    final mostrarEnCasa =
        cita.estado == 'EN_CAMINO' || cita.estado == 'CONFIRMADA' || cita.estado == 'EN_SITIO';

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
                        child: const Icon(Icons.roofing, color: agaveEmerald, size: 26),
                      ),
                      const SizedBox(width: 10),
                      Flexible(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Próxima inspección',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              cita.folio.isNotEmpty ? cita.folio : '—',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
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
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: estadoColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: estadoColor.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    cita.etiquetaEstado,
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: estadoColor),
                  ),
                ),
              ],
            ),
            // Mapa en vivo mientras el inspector va en camino
            if (cita.estaEnCamino) ...[
              const SizedBox(height: 14),
              Text(
                cita.inspector != null && cita.inspector!.nombre.isNotEmpty
                    ? '${cita.inspector!.nombre} va en camino a tu domicilio'
                    : 'El inspector va en camino a tu domicilio',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.indigo),
              ),
              const SizedBox(height: 10),
              MapaSeguimientoWidget(seguimiento: seguimiento),
              const SizedBox(height: 14),
              _botonEstoyEnCasa(principal: true),
            ],
            const Divider(height: 28),
            Row(
              children: [
                const Icon(Icons.calendar_today_outlined, size: 20, color: Colors.indigo),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '${cita.fechaProgramada.isNotEmpty ? cita.fechaProgramada : '—'}  •  '
                    '${cita.ventanaInicio.isNotEmpty ? cita.ventanaInicio : '—'} - ${cita.ventanaFin.isNotEmpty ? cita.ventanaFin : '—'}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on_outlined, size: 20, color: Colors.redAccent),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _textoDireccion(),
                    style: TextStyle(fontSize: 16, color: Colors.grey.shade800),
                  ),
                ),
              ],
            ),
            if (cita.inspector != null) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.person_pin, size: 20, color: Colors.blueGrey),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Inspector: ${_textoInspector(cita.inspector!)}',
                      style: TextStyle(fontSize: 16, color: Colors.grey.shade800, fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 18),
            if (cita.puedeConfirmar) ...[
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: agaveEmerald,
                  foregroundColor: Colors.white,
                  minimumSize: _botonMinimo,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: onConfirmar,
                icon: const Icon(Icons.check_circle_outline, size: 22),
                label: const Text('Confirmar asistencia', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 10),
            ],
            if (mostrarEnCasa && !cita.estaEnCamino) ...[
              _botonEstoyEnCasa(principal: false),
              const SizedBox(height: 10),
            ],
            if (cita.puedeReprogramar)
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.indigo,
                  side: const BorderSide(color: Colors.indigo),
                  minimumSize: _botonMinimo,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: onReprogramar,
                icon: const Icon(Icons.edit_calendar, size: 22),
                label: Text(
                  'Cambiar horario (${3 - cita.vecesReprogramada} disponibles)',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
