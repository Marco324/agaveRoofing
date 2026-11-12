class HorarioDisponible {
  final String fecha;
  final String ventanaInicio;
  final String ventanaFin;

  HorarioDisponible({
    required this.fecha,
    required this.ventanaInicio,
    required this.ventanaFin,
  });

  String get etiqueta => '$fecha ($ventanaInicio - $ventanaFin)';

  factory HorarioDisponible.fromJson(Map<String, dynamic> json) {
    return HorarioDisponible(
      fecha: json['fecha'] ?? '',
      ventanaInicio: json['ventanaInicio'] ?? '',
      ventanaFin: json['ventanaFin'] ?? '',
    );
  }
}
