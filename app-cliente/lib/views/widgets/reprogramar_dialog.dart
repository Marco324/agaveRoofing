import 'package:flutter/material.dart';
import 'package:agave_ui/agave_ui.dart';
import '../../models/horario_disponible_model.dart';

class ReprogramarDialog extends StatefulWidget {
  final List<HorarioDisponible> horarios;
  final Function(String fecha, String ventana, String motivo) onConfirmar;

  const ReprogramarDialog({
    super.key,
    required this.horarios,
    required this.onConfirmar,
  });

  @override
  State<ReprogramarDialog> createState() => _ReprogramarDialogState();
}

class _ReprogramarDialogState extends State<ReprogramarDialog> {
  HorarioDisponible? _horarioSeleccionado;
  final TextEditingController _motivoController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.horarios.isNotEmpty) {
      _horarioSeleccionado = widget.horarios.first;
    }
  }

  @override
  void dispose() {
    _motivoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Cambiar horario'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Elige uno de los horarios disponibles para tu domicilio.',
              style: TextStyle(fontSize: 14, color: Color(0xFF687A70)),
            ),
            const SizedBox(height: 12),
            if (widget.horarios.isEmpty)
              const Text(
                'No hay horarios disponibles. Contacta a la oficina para encontrar otra opción.',
                style: TextStyle(color: Color(0xFF687A70), fontSize: 14),
              )
            else
              DropdownButtonFormField<HorarioDisponible>(
                initialValue: _horarioSeleccionado,
                isExpanded: true,
                isDense: false,
                itemHeight: 72,
                menuMaxHeight: 288,
                decoration: const InputDecoration(
                  labelText: 'Nuevo horario',
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                ),
                items: widget.horarios.map((h) {
                  return DropdownMenuItem(
                    value: h,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Text(
                        h.etiqueta.replaceFirst(' · ', '\n'),
                        style: const TextStyle(fontSize: 14, height: 1.4),
                      ),
                    ),
                  );
                }).toList(),
                onChanged: (val) {
                  setState(() {
                    _horarioSeleccionado = val;
                  });
                },
              ),
            const SizedBox(height: 16),
            TextField(
              controller: _motivoController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Motivo (opcional)',
                hintText: 'Ej. Compromiso de trabajo en esa hora',
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: agaveGreen),
          onPressed: _horarioSeleccionado == null
              ? null
              : () {
                  final h = _horarioSeleccionado!;
                  final ventana = '${h.ventanaInicio} - ${h.ventanaFin}';
                  widget.onConfirmar(
                    h.fecha,
                    ventana,
                    _motivoController.text.trim(),
                  );
                  Navigator.of(context).pop();
                },
          child: const Text(
            'Enviar solicitud',
            style: TextStyle(color: Colors.white),
          ),
        ),
      ],
    );
  }
}
