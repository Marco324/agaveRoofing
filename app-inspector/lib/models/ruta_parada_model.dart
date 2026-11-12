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
      clienteEnCasa: json['clienteEnCasa'] == true,
      estadoTechoResultado: resultado?['estadoTecho'],
      urlReportePdf: resultado?['urlReportePdf'],
    );
  }
}
