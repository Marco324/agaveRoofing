import 'package:flutter/material.dart';
import 'package:agave_ui/agave_ui.dart';
import '../../models/cita_cliente_model.dart';
import '../../models/seguimiento_vivo_model.dart';
import '../../utils/formato_fecha.dart';
import 'mapa_seguimiento_widget.dart';

/// La misma cita y sus acciones, con una jerarquía única para todos los estados.
class ProximaCitaCard extends StatelessWidget {
  final CitaCliente cita;
  final SeguimientoVivo? seguimiento;
  final VoidCallback onConfirmar;
  final VoidCallback onReprogramar;
  final VoidCallback onEstoyEnCasa;
  const ProximaCitaCard({
    super.key,
    required this.cita,
    required this.seguimiento,
    required this.onConfirmar,
    required this.onReprogramar,
    required this.onEstoyEnCasa,
  });

  Widget _botonPresencia() => ElevatedButton.icon(
    onPressed: cita.clienteEnCasa ? null : onEstoyEnCasa,
    icon: Icon(
      cita.clienteEnCasa ? Icons.check : Icons.home_outlined,
      size: 20,
    ),
    label: Text(
      cita.clienteEnCasa
          ? 'Ya avisaste que estás en casa'
          : cita.estado == 'EN_SITIO'
          ? 'Ya voy a abrir'
          : 'Avisar que estoy en casa',
    ),
  );

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final enCasa = [
      'EN_CAMINO',
      'CONFIRMADA',
      'EN_SITIO',
    ].contains(cita.estado);
    final direccion = [
      cita.domicilio.direccionCompleta,
      cita.domicilio.colonia,
      cita.domicilio.ciudad,
    ].where((p) => p.trim().isNotEmpty).join(', ');
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            color: const Color(0xFFEDF6F0),
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'PRÓXIMA INSPECCIÓN',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF527161),
                    letterSpacing: 1.1,
                  ),
                ),
                const SizedBox(height: 9),
                Text(
                  agaveDateLabel(cita.fechaProgramada),
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: const Color(0xFF173F30),
                    fontSize: 25,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  ventanaHoraria(cita.ventanaInicio, cita.ventanaFin),
                  style: const TextStyle(
                    fontSize: 15,
                    color: Color(0xFF527161),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: AgaveStateChip(cita.estado),
                ),
                const SizedBox(height: 18),
                Text(
                  'Domicilio de la visita',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 6),
                Text(
                  direccion.isEmpty ? 'Domicilio por confirmar' : direccion,
                  style: theme.textTheme.bodyMedium,
                ),
                if (cita.inspector != null) ...[
                  const Divider(height: 30),
                  AgaveDetail(
                    Icons.person_outline,
                    cita.inspector!.nombre.isEmpty
                        ? 'Inspector por asignar'
                        : cita.inspector!.nombre,
                  ),
                  if (cita.inspector!.placaVehiculo?.isNotEmpty == true)
                    AgaveDetail(
                      Icons.directions_car_outlined,
                      'Vehículo ${cita.inspector!.placaVehiculo}',
                    ),
                ],
                if (cita.estaEnCamino) ...[
                  const SizedBox(height: 18),
                  _botonPresencia(),
                  const SizedBox(height: 16),
                  MapaSeguimientoWidget(seguimiento: seguimiento),
                ],
                if (cita.estado == 'EN_SITIO') ...[
                  const SizedBox(height: 16),
                  Text(
                    'Tu inspector ya está en tu domicilio.',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: agaveGreen,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
                if (cita.puedeConfirmar || enCasa || cita.puedeReprogramar)
                  const SizedBox(height: 22),
                if (cita.puedeConfirmar) ...[
                  ElevatedButton.icon(
                    onPressed: onConfirmar,
                    icon: const Icon(Icons.check, size: 20),
                    label: const Text('Confirmar asistencia'),
                  ),
                  const SizedBox(height: 9),
                ],
                if (enCasa && !cita.estaEnCamino) ...[
                  _botonPresencia(),
                  const SizedBox(height: 9),
                ],
                if (cita.puedeReprogramar)
                  OutlinedButton.icon(
                    onPressed: onReprogramar,
                    icon: const Icon(Icons.edit_calendar_outlined, size: 19),
                    label: const Text('Cambiar horario'),
                  ),
                const SizedBox(height: 16),
                Text(cita.folio, style: theme.textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
