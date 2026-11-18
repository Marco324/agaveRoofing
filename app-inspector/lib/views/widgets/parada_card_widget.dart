import 'package:flutter/material.dart';
import 'package:agave_ui/agave_ui.dart';
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
  final bool esDeHoy;
  final bool esPasada;
  final bool compartiendoUbicacion;
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
    this.esDeHoy = true,
    this.esPasada = false,
    this.compartiendoUbicacion = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final activa = parada.estaEnCamino || parada.estaEnSitio;
    final trayecto = parada.trayectoActivo;
    return Card(
      margin: const EdgeInsets.only(bottom: 18),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(
          color: activa ? const Color(0xFF7FB29A) : theme.dividerColor,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            color: const Color(0xFFF0F5F2),
            child: Wrap(
              spacing: 12,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text(
                  '$orden'.padLeft(2, '0'),
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: agaveGreen,
                  ),
                ),
                Text(
                  ventanaHoraria(parada.ventanaInicio, parada.ventanaFin),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                AgaveStateChip(parada.estado),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  parada.cliente.nombre,
                  style: theme.textTheme.titleMedium?.copyWith(fontSize: 19),
                ),
                const SizedBox(height: 6),
                Text(
                  '${parada.domicilio.direccionCompleta}\n${parada.domicilio.colonia}, ${parada.domicilio.ciudad}',
                  style: theme.textTheme.bodyMedium,
                ),
                if (parada.clienteEnCasa && !parada.estaCerrada) ...[
                  const SizedBox(height: 12),
                  Text(
                    'El cliente está en casa',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: agaveGreen,
                    ),
                  ),
                ],
                const SizedBox(height: 18),
                if (parada.puedeIniciarTrayecto && esDeHoy)
                  ElevatedButton.icon(
                    onPressed: onIniciarTrayecto,
                    icon: const Icon(Icons.navigation_outlined, size: 19),
                    label: const Text('Voy en camino'),
                  ),
                if (parada.puedeIniciarTrayecto && !esDeHoy)
                  _Aviso(
                    esPasada
                        ? 'La visita corresponde a un día anterior. La oficina puede actualizar su fecha.'
                        : 'Podrás iniciar el trayecto el día de la visita.',
                  ),
                if (parada.estaEnCamino) ...[
                  Text(
                    compartiendoUbicacion
                        ? 'Compartiendo ubicación durante el trayecto'
                        : 'Trayecto activo',
                    style: theme.textTheme.bodySmall,
                  ),
                  if (trayecto?.etaMinutos != null)
                    Text(
                      'Llegada estimada: ${trayecto!.etaMinutos} min${trayecto.etaAproximado ? ' aprox.' : ''}',
                      style: theme.textTheme.bodyMedium,
                    ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: onRegistrarLlegada,
                    icon: const Icon(Icons.place_outlined, size: 19),
                    label: const Text('Registrar llegada'),
                  ),
                ],
                if (parada.estaEnSitio)
                  ElevatedButton.icon(
                    onPressed: onCapturarResultado,
                    icon: const Icon(Icons.assignment_outlined, size: 19),
                    label: const Text('Capturar resultado'),
                  ),
                if (parada.estaPendienteCierre) ...[
                  const _Aviso(
                    'Esta visita quedó sin cerrar. Captura el resultado o registra que el cliente no estaba.',
                  ),
                  const SizedBox(height: 14),
                  ElevatedButton.icon(
                    onPressed: onCapturarResultado,
                    icon: const Icon(Icons.assignment_outlined, size: 19),
                    label: const Text('Cerrar con resultado'),
                  ),
                ],
                if (activa || parada.estaPendienteCierre)
                  TextButton(
                    onPressed: onMarcarAusente,
                    child: Text(
                      parada.estaPendienteCierre
                          ? 'El cliente no estaba'
                          : 'El cliente no está',
                    ),
                  ),
                if (parada.estaNoRealizada)
                  const _Aviso(
                    'No se realizó en su fecha. La oficina le asignará una nueva.',
                  ),
                if (parada.estaCompletada)
                  AgaveDetail(
                    Icons.task_alt,
                    'Inspección completada · Techo ${etiquetaEstadoTecho(parada.estadoTechoResultado)}',
                  ),
                if (onVerMapaRuta != null) ...[
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: onVerMapaRuta,
                    icon: const Icon(Icons.map_outlined, size: 19),
                    label: const Text('Ver ruta'),
                  ),
                ],
                const SizedBox(height: 8),
                ExpansionTile(
                  tilePadding: EdgeInsets.zero,
                  childrenPadding: const EdgeInsets.only(bottom: 16),
                  title: Text(
                    'Contacto y detalles',
                    style: theme.textTheme.bodyMedium,
                  ),
                  children: [
                    if (parada.cliente.telefono.isNotEmpty)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(
                          parada.cliente.telefono,
                          style: theme.textTheme.bodyMedium,
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (onLlamarCliente != null)
                              IconButton(
                                tooltip: 'Llamar al cliente',
                                onPressed: onLlamarCliente,
                                icon: const Icon(Icons.call_outlined),
                              ),
                            if (onMensajeCliente != null)
                              IconButton(
                                tooltip: 'Enviar SMS al cliente',
                                onPressed: onMensajeCliente,
                                icon: const Icon(Icons.sms_outlined),
                              ),
                          ],
                        ),
                      ),
                    AgaveDetail(Icons.tag, parada.folio),
                    if (parada.motivoVisita?.isNotEmpty == true)
                      AgaveDetail(Icons.notes_outlined, parada.motivoVisita!),
                    if (parada.domicilio.referencias?.isNotEmpty == true)
                      AgaveDetail(
                        Icons.info_outline,
                        parada.domicilio.referencias!,
                      ),
                    if (onAbrirAppMapas != null)
                      TextButton.icon(
                        onPressed: onAbrirAppMapas,
                        icon: const Icon(Icons.open_in_new, size: 18),
                        label: const Text('Abrir en app de mapas'),
                      ),
                    if (parada.estaEnCamino && onSimularAvanceGps != null)
                      TextButton(
                        onPressed: onSimularAvanceGps,
                        child: const Text('Demo: avanzar ubicación'),
                      ),
                    if (parada.estaEnCamino && onAcercarUnKm != null)
                      TextButton(
                        onPressed: onAcercarUnKm,
                        child: const Text('Demo: acercar a menos de 1 km'),
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

class _Aviso extends StatelessWidget {
  final String text;
  const _Aviso(this.text);
  @override
  Widget build(BuildContext context) =>
      Text(text, style: Theme.of(context).textTheme.bodyMedium);
}
