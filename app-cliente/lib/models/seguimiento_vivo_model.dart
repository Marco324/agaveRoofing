/// Seguimiento en vivo del inspector (respuesta de
/// `GET /api/inspecciones/:id/seguimiento`, también incluida en "mis citas").
///
/// Por privacidad, la API solo expone la ubicación del inspector mientras la
/// cita está en camino y el trayecto está activo (`ubicacionVisible`).
class PuntoGps {
  final double latitud;
  final double longitud;
  final String? capturadoEn;

  const PuntoGps({required this.latitud, required this.longitud, this.capturadoEn});

  static PuntoGps? fromJson(dynamic json) {
    if (json is! Map<String, dynamic>) return null;
    final lat = json['latitud'];
    final lon = json['longitud'];
    if (lat is! num || lon is! num) return null;
    return PuntoGps(
      latitud: lat.toDouble(),
      longitud: lon.toDouble(),
      capturadoEn: json['capturadoEn'] as String?,
    );
  }
}

class DestinoSeguimiento {
  final String direccionCompleta;
  final PuntoGps? ubicacion;

  const DestinoSeguimiento({required this.direccionCompleta, this.ubicacion});

  factory DestinoSeguimiento.fromJson(Map<String, dynamic> json) {
    return DestinoSeguimiento(
      direccionCompleta: (json['direccionCompleta'] as String?) ?? '',
      ubicacion: PuntoGps.fromJson(json),
    );
  }
}

class SeguimientoVivo {
  final int idInspeccion;
  final String estadoInspeccion;
  final bool ubicacionVisible;
  final DestinoSeguimiento? destino;

  // Solo presentes con trayecto activo
  final PuntoGps? ultimoPunto;
  final List<PuntoGps> rastroReciente;
  final int? etaMinutos;
  final bool etaAproximado;
  final int? distanciaRestanteM;
  final bool senalPerdida;
  final int? minutosDesdeUltimoPunto;

  const SeguimientoVivo({
    required this.idInspeccion,
    required this.estadoInspeccion,
    required this.ubicacionVisible,
    this.destino,
    this.ultimoPunto,
    this.rastroReciente = const [],
    this.etaMinutos,
    this.etaAproximado = false,
    this.distanciaRestanteM,
    this.senalPerdida = false,
    this.minutosDesdeUltimoPunto,
  });

  /// Hay datos suficientes para dibujar al inspector en el mapa.
  bool get tienePosicionInspector => ubicacionVisible && ultimoPunto != null;

  factory SeguimientoVivo.fromJson(Map<String, dynamic> json) {
    final trayecto = json['trayecto'] as Map<String, dynamic>?;
    final destinoJson = json['domicilioDestino'] as Map<String, dynamic>?;
    final rastroJson = trayecto?['rastroReciente'] as List<dynamic>? ?? const [];

    return SeguimientoVivo(
      idInspeccion: (json['idInspeccion'] as num?)?.toInt() ?? 0,
      estadoInspeccion: (json['estadoInspeccion'] as String?) ?? '',
      ubicacionVisible: json['ubicacionVisible'] == true,
      destino: destinoJson != null ? DestinoSeguimiento.fromJson(destinoJson) : null,
      ultimoPunto: PuntoGps.fromJson(trayecto?['ultimoPunto']),
      // La API entrega el rastro del más reciente al más antiguo; lo invertimos
      // para dibujar la línea en el orden del recorrido.
      rastroReciente: rastroJson.map(PuntoGps.fromJson).whereType<PuntoGps>().toList().reversed.toList(),
      etaMinutos: (trayecto?['etaMinutos'] as num?)?.toInt(),
      etaAproximado: trayecto?['etaAproximado'] == true,
      distanciaRestanteM: (trayecto?['distanciaRestanteM'] as num?)?.round(),
      senalPerdida: trayecto?['senalPerdida'] == true,
      minutosDesdeUltimoPunto: (trayecto?['minutosDesdeUltimoPunto'] as num?)?.toInt(),
    );
  }
}
