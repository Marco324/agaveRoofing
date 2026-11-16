class ClienteParada {
  final int idCliente;
  final String nombre;
  final String telefono;

  ClienteParada({
    required this.idCliente,
    required this.nombre,
    required this.telefono,
  });

  factory ClienteParada.fromJson(Map<String, dynamic> json) {
    return ClienteParada(
      idCliente: json['idCliente'] ?? 0,
      nombre: json['nombre'] ?? '',
      telefono: json['telefono'] ?? '',
    );
  }
}

class DomicilioParada {
  final int idDomicilio;
  final String direccionCompleta;
  final String colonia;
  final String ciudad;
  final String estado;
  final String codigoPostal;
  final double? latitud;
  final double? longitud;
  final String? referencias;

  DomicilioParada({
    required this.idDomicilio,
    required this.direccionCompleta,
    required this.colonia,
    required this.ciudad,
    required this.estado,
    required this.codigoPostal,
    this.latitud,
    this.longitud,
    this.referencias,
  });

  factory DomicilioParada.fromJson(Map<String, dynamic> json) {
    return DomicilioParada(
      idDomicilio: json['idDomicilio'] ?? 0,
      direccionCompleta: json['direccionCompleta'] ?? '',
      colonia: json['colonia'] ?? '',
      ciudad: json['ciudad'] ?? '',
      estado: json['estado'] ?? '',
      codigoPostal: json['codigoPostal'] ?? '',
      latitud: json['latitud'] != null ? (json['latitud'] as num).toDouble() : null,
      longitud: json['longitud'] != null ? (json['longitud'] as num).toDouble() : null,
      referencias: json['referencias'],
    );
  }
}

class TrayectoActivoParada {
  final int idTrayecto;
  final int etaMinutos;
  final bool etaAproximado;
  final int distanciaRestanteM;
  final double? latitudActual;
  final double? longitudActual;
  final String? capturadoEn;

  TrayectoActivoParada({
    required this.idTrayecto,
    required this.etaMinutos,
    this.etaAproximado = false,
    this.distanciaRestanteM = 0,
    this.latitudActual,
    this.longitudActual,
    this.capturadoEn,
  });

  factory TrayectoActivoParada.fromJson(Map<String, dynamic> json) {
    final ultimoPunto = json['ultimoPunto'] as Map<String, dynamic>?;
    return TrayectoActivoParada(
      idTrayecto: json['idTrayecto'] ?? 0,
      etaMinutos: json['etaMinutos'] ?? 10,
      etaAproximado: json['etaAproximado'] == true,
      distanciaRestanteM: (json['distanciaRestanteM'] as num?)?.round() ?? 0,
      latitudActual: ultimoPunto?['latitud'] != null ? (ultimoPunto!['latitud'] as num).toDouble() : null,
      longitudActual: ultimoPunto?['longitud'] != null ? (ultimoPunto!['longitud'] as num).toDouble() : null,
      capturadoEn: ultimoPunto?['capturadoEn'],
    );
  }
}

class RutaParada {
  final int idInspeccion;
  final String folio;
  final String fechaProgramada;
  final String ventanaInicio;
  final String ventanaFin;
  final String estado;
  final ClienteParada cliente;
  final DomicilioParada domicilio;
  final String? motivoVisita;
  final String? notas;
  final String? confirmadoEn;
  final int vecesReprogramada;
  final bool clienteEnCasa;
  final TrayectoActivoParada? trayectoActivo;
  final String? estadoTechoResultado;
  final String? urlReportePdf;

  RutaParada({
    required this.idInspeccion,
    required this.folio,
    required this.fechaProgramada,
    required this.ventanaInicio,
    required this.ventanaFin,
    required this.estado,
    required this.cliente,
    required this.domicilio,
    this.motivoVisita,
    this.notas,
    this.confirmadoEn,
    this.vecesReprogramada = 0,
    this.clienteEnCasa = false,
    this.trayectoActivo,
    this.estadoTechoResultado,
    this.urlReportePdf,
  });

  bool get estaConfirmada => estado == 'CONFIRMADA' || confirmadoEn != null;
  bool get puedeIniciarTrayecto =>
      estado == 'CONFIRMADA' ||
      estado == 'PROGRAMADA' ||
      estado == 'NOTIFICADA' ||
      estado == 'REPROGRAMADA';
  bool get estaEnCamino => estado == 'EN_CAMINO';
  bool get estaEnSitio => estado == 'EN_SITIO';
  bool get estaCompletada => estado == 'COMPLETADA';

  factory RutaParada.fromJson(Map<String, dynamic> json) {
    final resultado = json['resultado'] as Map<String, dynamic>?;
    final trayectoJson = json['trayectoActivo'] as Map<String, dynamic>?;
    return RutaParada(
      idInspeccion: json['idInspeccion'] ?? 0,
      folio: json['folio'] ?? '',
      fechaProgramada: json['fechaProgramada'] ?? '',
      ventanaInicio: json['ventanaInicio'] ?? '',
      ventanaFin: json['ventanaFin'] ?? '',
      estado: json['estado'] ?? 'PROGRAMADA',
      cliente: ClienteParada.fromJson(json['cliente'] ?? {}),
      domicilio: DomicilioParada.fromJson(json['domicilio'] ?? {}),
      motivoVisita: json['motivoVisita'],
      notas: json['notas'],
      confirmadoEn: json['confirmadoEn'],
      vecesReprogramada: json['vecesReprogramada'] ?? 0,
      clienteEnCasa: json['clienteEnCasa'] == true || json['presenciaConfirmadaEn'] != null,
      trayectoActivo: trayectoJson != null ? TrayectoActivoParada.fromJson(trayectoJson) : null,
      estadoTechoResultado: resultado?['estadoTecho'],
      urlReportePdf: resultado?['urlReportePdf'],
    );
  }
}
