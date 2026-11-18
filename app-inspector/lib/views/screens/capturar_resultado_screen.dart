import 'package:flutter/material.dart';

import '../../models/foto_evidencia_model.dart';
import '../../models/ruta_parada_model.dart';
import '../../presenters/captura_evidencia_presenter.dart';
import '../../presenters/contracts/captura_evidencia_contract.dart';
import '../widgets/fotos_evidencia_widget.dart';

/// Captura del resultado en pasos: estado del techo → hallazgos → fotos → enviar.
/// Devuelve `true` al cerrarse si el resultado quedó registrado.
class CapturarResultadoScreen extends StatefulWidget {
  final RutaParada parada;
  final int idInspector;

  const CapturarResultadoScreen({
    super.key,
    required this.parada,
    required this.idInspector,
  });

  @override
  State<CapturarResultadoScreen> createState() =>
      _CapturarResultadoScreenState();
}

class _CapturarResultadoScreenState extends State<CapturarResultadoScreen>
    implements CapturaEvidenciaViewContract {
  static const int maxFotos = 5;
  static const Color agaveEmerald = Color(0xFF059669);

  static const Map<String, String> _estadosTecho = {
    'BUENO': 'Bueno',
    'REGULAR': 'Regular',
    'MALO': 'Malo',
    'CRITICO': 'Crítico',
  };
  static const Map<String, String> _urgencias = {
    'BAJA': 'Baja',
    'MEDIA': 'Media',
    'ALTA': 'Alta',
  };

  late final CapturaEvidenciaPresenter _presenter;
  final _hallazgosCtrl = TextEditingController();
  final _recomendacionesCtrl = TextEditingController();

  int _paso = 0;
  String? _estadoTecho;
  String? _urgencia;
  List<FotoEvidencia> _fotos = const [];
  bool _enviando = false;

  @override
  void initState() {
    super.initState();
    _presenter = CapturaEvidenciaPresenter(this, maxFotos: maxFotos);
  }

  @override
  void dispose() {
    _hallazgosCtrl.dispose();
    _recomendacionesCtrl.dispose();
    super.dispose();
  }

  // --- Contrato -------------------------------------------------------------

  @override
  void showFotos(List<FotoEvidencia> fotos) {
    if (mounted) setState(() => _fotos = fotos);
  }

  @override
  void showEnviando(bool enviando) {
    if (mounted) setState(() => _enviando = enviando);
  }

  @override
  void showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  void showEnviadoConExito(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: agaveEmerald,
        behavior: SnackBarBehavior.floating,
      ),
    );
    Navigator.of(context).pop(true);
  }

  // --- Pasos ----------------------------------------------------------------

  bool get _requiereUrgencia => _estadoTecho != null && _estadoTecho != 'BUENO';

  String? _faltanteDelPaso(int paso) {
    switch (paso) {
      case 0:
        if (_estadoTecho == null) return 'Elige el estado del techo.';
        if (_requiereUrgencia && _urgencia == null) {
          return 'Indica la urgencia de la reparación.';
        }
        return null;
      case 1:
        return _hallazgosCtrl.text.trim().isEmpty
            ? 'Escribe los hallazgos de la inspección.'
            : null;
      case 2:
        return _fotos.isEmpty ? 'Agrega al menos una foto del techo.' : null;
      default:
        return null;
    }
  }

  void _continuar() {
    final faltante = _faltanteDelPaso(_paso);
    if (faltante != null) {
      showError(faltante);
      return;
    }
    if (_paso < 3) {
      setState(() => _paso++);
    } else {
      _enviar();
    }
  }

  void _enviar() {
    _presenter.enviarResultado(
      idInspeccion: widget.parada.idInspeccion,
      idInspector: widget.idInspector,
      estadoTecho: _estadoTecho,
      hallazgos: _hallazgosCtrl.text,
      urgencia: _urgencia,
      recomendaciones: _recomendacionesCtrl.text,
    );
  }

  Widget _opciones(
    Map<String, String> opciones,
    String? seleccion,
    ValueChanged<String> onSelect,
  ) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (final entry in opciones.entries)
          ChoiceChip(
            label: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
              child: Text(entry.value, style: const TextStyle(fontSize: 16)),
            ),
            selected: seleccion == entry.key,
            onSelected: _enviando ? null : (_) => onSelect(entry.key),
          ),
      ],
    );
  }

  Widget _filaResumen(String titulo, String valor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text.rich(
        TextSpan(
          children: [
            TextSpan(
              text: '$titulo: ',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            TextSpan(text: valor),
          ],
        ),
        style: const TextStyle(fontSize: 16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final recomendaciones = _recomendacionesCtrl.text.trim();

    return PopScope(
      canPop: !_enviando,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Registrar inspección'),
          backgroundColor: const Color(0xFF0F172A),
          foregroundColor: Colors.white,
        ),
        body: Stepper(
          currentStep: _paso,
          onStepTapped: _enviando
              ? null
              : (destino) {
                  // Se puede volver atrás libremente; avanzar exige completar cada paso.
                  for (var p = 0; p < destino; p++) {
                    final faltante = _faltanteDelPaso(p);
                    if (faltante != null) {
                      setState(() => _paso = p);
                      showError(faltante);
                      return;
                    }
                  }
                  setState(() => _paso = destino);
                },
          onStepContinue: _enviando ? null : _continuar,
          onStepCancel: _enviando || _paso == 0
              ? null
              : () => setState(() => _paso--),
          controlsBuilder: (context, details) {
            final esUltimo = details.stepIndex == 3;
            return Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: esUltimo
                            ? agaveEmerald
                            : const Color(0xFF0F172A),
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(48),
                      ),
                      onPressed: details.onStepContinue,
                      icon: _enviando && esUltimo
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Icon(esUltimo ? Icons.send : Icons.arrow_forward),
                      label: Text(
                        esUltimo
                            ? (_enviando ? 'Enviando…' : 'Enviar resultado')
                            : 'Continuar',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  if (details.stepIndex > 0) ...[
                    const SizedBox(width: 10),
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(100, 48),
                      ),
                      onPressed: details.onStepCancel,
                      child: const Text(
                        'Atrás',
                        style: TextStyle(fontSize: 16),
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
          steps: [
            Step(
              title: const Text(
                'Estado del techo',
                style: TextStyle(fontSize: 16),
              ),
              isActive: _paso >= 0,
              state: _paso > 0 ? StepState.complete : StepState.indexed,
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _opciones(
                    _estadosTecho,
                    _estadoTecho,
                    (v) => setState(() {
                      _estadoTecho = v;
                      if (v == 'BUENO') _urgencia = null;
                    }),
                  ),
                  if (_requiereUrgencia) ...[
                    const SizedBox(height: 16),
                    const Text(
                      'Urgencia de la reparación',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _opciones(
                      _urgencias,
                      _urgencia,
                      (v) => setState(() => _urgencia = v),
                    ),
                  ],
                ],
              ),
            ),
            Step(
              title: const Text('Hallazgos', style: TextStyle(fontSize: 16)),
              isActive: _paso >= 1,
              state: _paso > 1 ? StepState.complete : StepState.indexed,
              content: Column(
                children: [
                  TextField(
                    controller: _hallazgosCtrl,
                    enabled: !_enviando,
                    maxLines: 4,
                    minLines: 3,
                    style: const TextStyle(fontSize: 16),
                    textCapitalization: TextCapitalization.sentences,
                    decoration: const InputDecoration(
                      labelText: 'Hallazgos (obligatorio)',
                      hintText: 'Qué encontraste en el techo',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _recomendacionesCtrl,
                    enabled: !_enviando,
                    maxLines: 3,
                    minLines: 2,
                    style: const TextStyle(fontSize: 16),
                    textCapitalization: TextCapitalization.sentences,
                    decoration: const InputDecoration(
                      labelText: 'Recomendaciones al cliente (opcional)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
            Step(
              title: const Text(
                'Fotos del techo',
                style: TextStyle(fontSize: 16),
              ),
              subtitle: const Text('De 1 a 5 fotos'),
              isActive: _paso >= 2,
              state: _paso > 2 ? StepState.complete : StepState.indexed,
              content: FotosEvidenciaWidget(
                fotos: _fotos,
                maxFotos: maxFotos,
                habilitado: !_enviando,
                onTomarFoto: () => _presenter.agregarFoto(desdeCamara: true),
                onElegirDeGaleria: () =>
                    _presenter.agregarFoto(desdeCamara: false),
                onQuitar: _presenter.quitarFoto,
              ),
            ),
            Step(
              title: const Text(
                'Revisar y enviar',
                style: TextStyle(fontSize: 16),
              ),
              isActive: _paso >= 3,
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _filaResumen(
                    'Estado del techo',
                    _estadosTecho[_estadoTecho] ?? '—',
                  ),
                  if (_requiereUrgencia)
                    _filaResumen('Urgencia', _urgencias[_urgencia] ?? '—'),
                  _filaResumen(
                    'Hallazgos',
                    _hallazgosCtrl.text.trim().isEmpty
                        ? '—'
                        : _hallazgosCtrl.text.trim(),
                  ),
                  _filaResumen(
                    'Recomendaciones',
                    recomendaciones.isEmpty ? '—' : recomendaciones,
                  ),
                  _filaResumen('Fotos', '${_fotos.length}'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
