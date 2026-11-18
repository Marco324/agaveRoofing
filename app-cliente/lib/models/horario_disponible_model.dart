import '../utils/formato_fecha.dart';

class HorarioDisponible {
  final String fecha;
  final String ventanaInicio;
  final String ventanaFin;

  HorarioDisponible({
    required this.fecha,
    required this.ventanaInicio,
    required this.ventanaFin,
  });

  /// `Martes 24 de noviembre · 9:00 – 11:00 am`
  String get etiqueta => '${fechaLarga(fecha)} · ${ventanaHoraria(ventanaInicio, ventanaFin)}';

  factory HorarioDisponible.fromJson(Map<String, dynamic> json) {
    return HorarioDisponible(
      fecha: json['fecha'] ?? '',
      ventanaInicio: json['ventanaInicio'] ?? '',
      ventanaFin: json['ventanaFin'] ?? '',
    );
  }
}
