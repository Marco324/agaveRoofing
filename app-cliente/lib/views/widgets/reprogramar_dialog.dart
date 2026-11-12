import 'package:flutter/material.dart';
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
      title: const Row(
        children: [
          Icon(Icons.calendar_month, color: Colors.indigo),
          SizedBox(width: 8),
          Text('Mover cita'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Selecciona un nuevo horario disponible según la zona de tu domicilio:',
              style: TextStyle(fontSize: 13, color: Colors.black87),
            ),
            const SizedBox(height: 12),
            if (widget.horarios.isEmpty)
              const Text(
                'No hay horarios alternativos en este momento. Por favor llame a la oficina.',
                style: TextStyle(color: Colors.red, fontSize: 13),
              )
            else
              DropdownButtonFormField<HorarioDisponible>(
                initialValue: _horarioSeleccionado,
                isExpanded: true,
                decoration: const InputDecoration(
                  labelText: 'Nuevo horario',
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                items: widget.horarios.map((h) {
                  return DropdownMenuItem(
                    value: h,
                    child: Text(h.etiqueta, style: const TextStyle(fontSize: 13)),
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
                labelText: 'Motivo del cambio (opcional)',
                border: OutlineInputBorder(),
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
          style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo),
          onPressed: _horarioSeleccionado == null
              ? null
              : () {
                  final h = _horarioSeleccionado!;
                  final ventana = '${h.ventanaInicio} - ${h.ventanaFin}';
                  widget.onConfirmar(h.fecha, ventana, _motivoController.text.trim());
                  Navigator.of(context).pop();
                },
          child: const Text('Enviar solicitud', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
