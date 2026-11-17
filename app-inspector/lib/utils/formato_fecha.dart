/// Formatos de fecha y hora legibles en español, sin depender de los datos
/// de locale de `intl` (no requieren `initializeDateFormatting`).
library;

const _dias = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

const _meses = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

DateTime? _parsear(String fechaIso) {
  final f = DateTime.tryParse(fechaIso.trim());
  return f == null ? null : DateTime(f.year, f.month, f.day);
}

/// `2026-11-12` → `Jueves 12 de noviembre`. Devuelve la cadena original si no
/// se puede interpretar.
String fechaLarga(String fechaIso) {
  final f = _parsear(fechaIso);
  if (f == null) return fechaIso;
  return '${_dias[f.weekday - 1]} ${f.day} de ${_meses[f.month - 1]}';
}

/// `2026-11-12` → `Jue 12 nov`.
String fechaCorta(String fechaIso) {
  final f = _parsear(fechaIso);
  if (f == null) return fechaIso;
  return '${_dias[f.weekday - 1].substring(0, 3)} ${f.day} '
      '${_meses[f.month - 1].substring(0, 3)}';
}

/// `14:30` → `2:30 pm`.
String hora12(String hhmm) {
  final partes = hhmm.trim().split(':');
  if (partes.length < 2) return hhmm;
  final h = int.tryParse(partes[0]);
  final m = int.tryParse(partes[1]);
  if (h == null || m == null) return hhmm;
  final sufijo = h < 12 ? 'am' : 'pm';
  final h12 = h % 12 == 0 ? 12 : h % 12;
  return '$h12:${m.toString().padLeft(2, '0')} $sufijo';
}

/// `14:30`, `16:30` → `2:30 – 4:30 pm` (el sufijo se omite en el inicio si
/// coincide con el del final).
String ventanaHoraria(String inicio, String fin) {
  final a = hora12(inicio);
  final b = hora12(fin);
  final sufA = a.endsWith('am') || a.endsWith('pm')
      ? a.substring(a.length - 2)
      : '';
  final sufB = b.endsWith('am') || b.endsWith('pm')
      ? b.substring(b.length - 2)
      : '';
  final inicioTexto = sufA.isNotEmpty && sufA == sufB
      ? a.substring(0, a.length - 3)
      : a;
  return '$inicioTexto – $b';
}

/// `1` → `1 parada`, `3` → `3 paradas`.
String plural(int n, String singular, [String? pluralForma]) =>
    '$n ${n == 1 ? singular : (pluralForma ?? '${singular}s')}';
