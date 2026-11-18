import 'package:flutter/material.dart';

import '../../utils/formato_fecha.dart';

const Color _agaveEmerald = Color(0xFF059669);
const Color _slate = Color(0xFF0F172A);
const Color _rojoSinCerrar = Color(0xFFDC2626);

/// Paradas por día (`2026-11-12` → 2) y, de ellas, cuántas quedaron sin cerrar.
class ConteoDias {
  final Map<String, int> total;
  final Map<String, int> sinCerrar;

  const ConteoDias({this.total = const {}, this.sinCerrar = const {}});

  /// Agrega los conteos de [otro]. Los días que trae [otro] reemplazan a los
  /// anteriores (un día que ya se cerró deja de marcarse como pendiente).
  ConteoDias unir(ConteoDias otro) {
    final pendientes = {...sinCerrar}
      ..removeWhere((dia, _) => otro.total.containsKey(dia));
    return ConteoDias(
      total: {...total, ...otro.total},
      sinCerrar: {...pendientes, ...otro.sinCerrar},
    );
  }
}

/// Tira con los 7 días de la semana de [seleccionada]. Cada día muestra
/// cuántas paradas tiene; las flechas cambian de semana.
class SelectorSemanaWidget extends StatelessWidget {
  final DateTime seleccionada;

  /// "Hoy" según la API (puede ser una fecha de demo).
  final DateTime hoy;
  final ConteoDias paradasPorDia;
  final ValueChanged<DateTime> onSeleccionar;
  final VoidCallback onAbrirCalendario;

  const SelectorSemanaWidget({
    super.key,
    required this.seleccionada,
    required this.hoy,
    required this.paradasPorDia,
    required this.onSeleccionar,
    required this.onAbrirCalendario,
  });

  static const double alto = 128;

  @override
  Widget build(BuildContext context) {
    final lunes = inicioDeSemana(seleccionada);
    final dias = List.generate(
      7,
      (i) => DateTime(lunes.year, lunes.month, lunes.day + i),
    );
    final esSemanaDeHoy = dias.any((d) => mismoDia(d, hoy));

    return Container(
      color: _slate,
      padding: const EdgeInsets.fromLTRB(8, 0, 8, 10),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                tooltip: 'Semana anterior',
                color: Colors.white,
                onPressed: () => onSeleccionar(
                  DateTime(
                    seleccionada.year,
                    seleccionada.month,
                    seleccionada.day - 7,
                  ),
                ),
                icon: const Icon(Icons.chevron_left),
              ),
              Expanded(
                child: InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: onAbrirCalendario,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Flexible(
                          child: Text(
                            _capitalizar(mesAnio(seleccionada)),
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.expand_more,
                          color: Colors.white70,
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              if (!esSemanaDeHoy)
                TextButton(
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white,
                    minimumSize: const Size(0, 36),
                  ),
                  onPressed: () => onSeleccionar(hoy),
                  child: const Text('Hoy'),
                ),
              IconButton(
                tooltip: 'Semana siguiente',
                color: Colors.white,
                onPressed: () => onSeleccionar(
                  DateTime(
                    seleccionada.year,
                    seleccionada.month,
                    seleccionada.day + 7,
                  ),
                ),
                icon: const Icon(Icons.chevron_right),
              ),
            ],
          ),
          Row(
            children: [
              for (final dia in dias)
                Expanded(
                  child: _CeldaDia(
                    dia: dia,
                    seleccionado: mismoDia(dia, seleccionada),
                    esHoy: mismoDia(dia, hoy),
                    paradas: paradasPorDia.total[fechaIso(dia)] ?? 0,
                    sinCerrar: paradasPorDia.sinCerrar[fechaIso(dia)] ?? 0,
                    oscuro: true,
                    onTap: () => onSeleccionar(dia),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Celda de un día: inicial, número y cuántas paradas tiene.
class _CeldaDia extends StatelessWidget {
  final DateTime dia;
  final bool seleccionado;
  final bool esHoy;
  final int paradas;
  final int sinCerrar;
  final bool oscuro;
  final bool fueraDelMes;
  final VoidCallback onTap;

  const _CeldaDia({
    required this.dia,
    required this.seleccionado,
    required this.esHoy,
    required this.paradas,
    this.sinCerrar = 0,
    required this.oscuro,
    required this.onTap,
    this.fueraDelMes = false,
  });

  @override
  Widget build(BuildContext context) {
    final colorTexto = seleccionado
        ? Colors.white
        : oscuro
        ? (fueraDelMes ? Colors.white38 : Colors.white)
        : (fueraDelMes ? Colors.grey.shade400 : _slate);
    final colorSecundario = seleccionado
        ? Colors.white70
        : (oscuro ? Colors.white60 : Colors.grey.shade600);

    return Padding(
      padding: const EdgeInsets.all(2),
      child: Semantics(
        button: true,
        selected: seleccionado,
        label:
            '${fechaLarga(fechaIso(dia))}, ${paradas == 0 ? 'sin paradas' : plural(paradas, 'parada')}'
            '${sinCerrar > 0 ? ', ${sinCerrar == 1 ? '1 sin cerrar' : '$sinCerrar sin cerrar'}' : ''}',
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(vertical: 6),
            decoration: BoxDecoration(
              color: seleccionado ? _agaveEmerald : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
              border: esHoy && !seleccionado
                  ? Border.all(
                      color: oscuro ? Colors.white70 : _agaveEmerald,
                      width: 1.5,
                    )
                  : null,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (oscuro)
                  Text(
                    inicialDia(dia),
                    style: TextStyle(fontSize: 11, color: colorSecundario),
                  ),
                Text(
                  '${dia.day}',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: colorTexto,
                  ),
                ),
                const SizedBox(height: 2),
                _MarcaParadas(
                  paradas: paradas,
                  sinCerrar: sinCerrar,
                  seleccionado: seleccionado,
                  oscuro: oscuro,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Insignia con el número de paradas del día (vacía si no hay). En rojo si
/// alguna quedó sin cerrar.
class _MarcaParadas extends StatelessWidget {
  final int paradas;
  final int sinCerrar;
  final bool seleccionado;
  final bool oscuro;

  const _MarcaParadas({
    required this.paradas,
    required this.seleccionado,
    required this.oscuro,
    this.sinCerrar = 0,
  });

  @override
  Widget build(BuildContext context) {
    if (paradas == 0) return const SizedBox(height: 16);
    final alerta = sinCerrar > 0;
    final fondo = alerta
        ? _rojoSinCerrar
        : seleccionado
        ? Colors.white
        : (oscuro ? Colors.amber.shade400 : _agaveEmerald);
    final texto = alerta
        ? Colors.white
        : seleccionado
        ? _agaveEmerald
        : (oscuro ? _slate : Colors.white);
    return Container(
      height: 16,
      constraints: const BoxConstraints(minWidth: 16),
      padding: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: fondo,
        borderRadius: BorderRadius.circular(8),
      ),
      alignment: Alignment.center,
      child: Text(
        alerta ? '!$paradas' : '$paradas',
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: texto,
        ),
      ),
    );
  }
}

String _capitalizar(String s) =>
    s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1)}';

/// Calendario mensual en hoja inferior. Devuelve el día elegido.
///
/// [cargarMes] se llama al cambiar de mes para pedir los conteos de ese rango;
/// los conteos llegan por [paradasPorDia], que se vuelve a leer en cada cambio.
Future<DateTime?> mostrarCalendarioMes(
  BuildContext context, {
  required DateTime seleccionada,
  required DateTime hoy,
  required ValueNotifier<ConteoDias> paradasPorDia,
  required void Function(DateTime inicio, DateTime fin) cargarMes,
}) {
  return showModalBottomSheet<DateTime>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    builder: (_) => _CalendarioMes(
      seleccionada: seleccionada,
      hoy: hoy,
      paradasPorDia: paradasPorDia,
      cargarMes: cargarMes,
    ),
  );
}

class _CalendarioMes extends StatefulWidget {
  final DateTime seleccionada;
  final DateTime hoy;
  final ValueNotifier<ConteoDias> paradasPorDia;
  final void Function(DateTime inicio, DateTime fin) cargarMes;

  const _CalendarioMes({
    required this.seleccionada,
    required this.hoy,
    required this.paradasPorDia,
    required this.cargarMes,
  });

  @override
  State<_CalendarioMes> createState() => _CalendarioMesState();
}

class _CalendarioMesState extends State<_CalendarioMes> {
  late DateTime _mes;

  @override
  void initState() {
    super.initState();
    _mes = DateTime(widget.seleccionada.year, widget.seleccionada.month);
    _pedirConteos();
  }

  /// Rango visible: del lunes de la primera semana al domingo de la última.
  (DateTime, DateTime) get _rango {
    final inicio = inicioDeSemana(_mes);
    final ultimoDelMes = DateTime(_mes.year, _mes.month + 1, 0);
    final fin = DateTime(
      ultimoDelMes.year,
      ultimoDelMes.month,
      ultimoDelMes.day + (7 - ultimoDelMes.weekday),
    );
    return (inicio, fin);
  }

  void _pedirConteos() {
    final (inicio, fin) = _rango;
    widget.cargarMes(inicio, fin);
  }

  void _cambiarMes(int delta) {
    setState(() => _mes = DateTime(_mes.year, _mes.month + delta));
    _pedirConteos();
  }

  @override
  Widget build(BuildContext context) {
    final (inicio, fin) = _rango;
    final totalDias = fin.difference(inicio).inDays + 1;
    final dias = List.generate(
      totalDias,
      (i) => DateTime(inicio.year, inicio.month, inicio.day + i),
    );
    final hoy = widget.hoy;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: ValueListenableBuilder<ConteoDias>(
          valueListenable: widget.paradasPorDia,
          builder: (context, conteoDias, _) {
            final conteo = conteoDias.total;
            final paradasDelMes = conteo.entries
                .where((e) {
                  final f = fechaDesdeIso(e.key);
                  return f != null &&
                      f.year == _mes.year &&
                      f.month == _mes.month;
                })
                .fold<int>(0, (s, e) => s + e.value);

            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    IconButton(
                      tooltip: 'Mes anterior',
                      onPressed: () => _cambiarMes(-1),
                      icon: const Icon(Icons.chevron_left),
                    ),
                    Expanded(
                      child: Column(
                        children: [
                          Text(
                            _capitalizar(mesAnio(_mes)),
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            paradasDelMes == 0
                                ? 'Sin paradas este mes'
                                : '${plural(paradasDelMes, 'parada')} este mes',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade700,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      tooltip: 'Mes siguiente',
                      onPressed: () => _cambiarMes(1),
                      icon: const Icon(Icons.chevron_right),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    for (final l in const ['L', 'M', 'M', 'J', 'V', 'S', 'D'])
                      Expanded(
                        child: Center(
                          child: Text(
                            l,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                for (var semana = 0; semana < dias.length ~/ 7; semana++)
                  Row(
                    children: [
                      for (final dia in dias.sublist(
                        semana * 7,
                        semana * 7 + 7,
                      ))
                        Expanded(
                          child: _CeldaDia(
                            dia: dia,
                            seleccionado: mismoDia(dia, widget.seleccionada),
                            esHoy: mismoDia(dia, hoy),
                            paradas: conteo[fechaIso(dia)] ?? 0,
                            sinCerrar: conteoDias.sinCerrar[fechaIso(dia)] ?? 0,
                            oscuro: false,
                            fueraDelMes: dia.month != _mes.month,
                            onTap: () => Navigator.of(context).pop(dia),
                          ),
                        ),
                    ],
                  ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(46),
                      foregroundColor: _agaveEmerald,
                      side: const BorderSide(color: _agaveEmerald),
                    ),
                    onPressed: () => Navigator.of(
                      context,
                    ).pop(DateTime(hoy.year, hoy.month, hoy.day)),
                    icon: const Icon(Icons.today),
                    label: const Text('Ir a hoy'),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
