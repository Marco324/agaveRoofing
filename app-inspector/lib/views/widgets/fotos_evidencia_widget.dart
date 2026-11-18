import 'package:flutter/material.dart';

import '../../models/foto_evidencia_model.dart';

/// Miniaturas de las fotos capturadas, con botón para quitar cada una y
/// botones para tomar una foto o elegirla de la galería.
class FotosEvidenciaWidget extends StatelessWidget {
  final List<FotoEvidencia> fotos;
  final int maxFotos;
  final bool habilitado;
  final VoidCallback onTomarFoto;
  final VoidCallback onElegirDeGaleria;
  final ValueChanged<int> onQuitar;

  const FotosEvidenciaWidget({
    super.key,
    required this.fotos,
    required this.maxFotos,
    required this.onTomarFoto,
    required this.onElegirDeGaleria,
    required this.onQuitar,
    this.habilitado = true,
  });

  @override
  Widget build(BuildContext context) {
    final puedeAgregar = habilitado && fotos.length < maxFotos;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          maxFotos == 1
              ? '${fotos.length} de 1 foto'
              : '${fotos.length} de $maxFotos fotos',
          style: const TextStyle(fontSize: 13, color: Color(0xFF687A70)),
        ),
        const SizedBox(height: 10),
        if (fotos.isEmpty)
          Container(
            height: 110,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAF9),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFDCE4E4)),
            ),
            child: const Text(
              'Agrega una foto de la visita',
              style: TextStyle(fontSize: 14, color: Color(0xFF687A70)),
            ),
          )
        else
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              for (var i = 0; i < fotos.length; i++)
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.memory(
                        fotos[i].bytes,
                        width: 96,
                        height: 96,
                        fit: BoxFit.cover,
                        semanticLabel: 'Foto ${i + 1}',
                      ),
                    ),
                    Positioned(
                      top: -10,
                      right: -10,
                      child: IconButton.filled(
                        style: IconButton.styleFrom(
                          backgroundColor: const Color(0xFF203439),
                          minimumSize: const Size(44, 44),
                        ),
                        tooltip: 'Quitar foto ${i + 1}',
                        onPressed: habilitado ? () => onQuitar(i) : null,
                        icon: const Icon(
                          Icons.close,
                          size: 18,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
            ],
          ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                ),
                onPressed: puedeAgregar ? onTomarFoto : null,
                icon: const Icon(Icons.photo_camera_outlined, size: 20),
                label: const Text('Tomar foto', style: TextStyle(fontSize: 14)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                ),
                onPressed: puedeAgregar ? onElegirDeGaleria : null,
                icon: const Icon(Icons.photo_library_outlined, size: 20),
                label: const Text('Galería', style: TextStyle(fontSize: 14)),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
