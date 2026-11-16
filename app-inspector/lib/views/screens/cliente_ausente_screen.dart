import 'package:flutter/material.dart';

import '../../models/foto_evidencia_model.dart';
import '../../models/ruta_parada_model.dart';
import '../../presenters/captura_evidencia_presenter.dart';
import '../../presenters/contracts/captura_evidencia_contract.dart';
import '../widgets/fotos_evidencia_widget.dart';

/// Registro de cliente ausente: foto de la fachada y nota obligatorias (RN-10).
/// Devuelve `true` al cerrarse si quedó registrado.
class ClienteAusenteScreen extends StatefulWidget {
  final RutaParada parada;
  final int idInspector;

  const ClienteAusenteScreen({
    super.key,
    required this.parada,
    required this.idInspector,
  });

  @override
  State<ClienteAusenteScreen> createState() => _ClienteAusenteScreenState();
}

class _ClienteAusenteScreenState extends State<ClienteAusenteScreen>
    implements CapturaEvidenciaViewContract {
  late final CapturaEvidenciaPresenter _presenter;
  final _notaCtrl = TextEditingController();
  List<FotoEvidencia> _fotos = const [];
  bool _enviando = false;

  @override
  void initState() {
    super.initState();
    _presenter = CapturaEvidenciaPresenter(this, maxFotos: 1);
    _notaCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _notaCtrl.dispose();
    super.dispose();
  }

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
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final listo = _fotos.isNotEmpty && _notaCtrl.text.trim().isNotEmpty;

    return PopScope(
      canPop: !_enviando,
      child: Scaffold(
        appBar: AppBar(
          title: Text('Cliente ausente · ${widget.parada.folio}'),
          backgroundColor: Colors.red.shade800,
          foregroundColor: Colors.white,
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'Para marcar la visita como no realizada necesitas una foto de la fachada o la puerta y una nota de lo que pasó.',
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 20),
            const Text(
              'Foto de la fachada',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            FotosEvidenciaWidget(
              fotos: _fotos,
              maxFotos: 1,
              habilitado: !_enviando,
              onTomarFoto: () => _presenter.agregarFoto(desdeCamara: true),
              onElegirDeGaleria: () =>
                  _presenter.agregarFoto(desdeCamara: false),
              onQuitar: _presenter.quitarFoto,
            ),
            const SizedBox(height: 24),
            const Text(
              'Nota',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _notaCtrl,
              enabled: !_enviando,
              minLines: 3,
              maxLines: 5,
              style: const TextStyle(fontSize: 16),
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                hintText:
                    'Ejemplo: toqué el timbre y llamé por teléfono; nadie respondió.',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade700,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(52),
              ),
              onPressed: !listo || _enviando
                  ? null
                  : () => _presenter.enviarClienteAusente(
                      idInspeccion: widget.parada.idInspeccion,
                      idInspector: widget.idInspector,
                      nota: _notaCtrl.text,
                    ),
              icon: _enviando
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.person_off),
              label: Text(
                _enviando ? 'Enviando…' : 'Registrar cliente ausente',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
