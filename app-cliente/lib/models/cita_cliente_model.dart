class DomicilioCliente {
  final String direccionCompleta;
  final String colonia;
  final String ciudad;
  final String codigoPostal;

  DomicilioCliente({
    required this.direccionCompleta,
    required this.colonia,
    required this.ciudad,
    required this.codigoPostal,
  });

  factory DomicilioCliente.fromJson(Map<String, dynamic> json) {
    return DomicilioCliente(
      direccionCompleta: json['direccionCompleta'] ?? '',
      colonia: json['colonia'] ?? '',
      ciudad: json['ciudad'] ?? '',
      codigoPostal: json['codigoPostal'] ?? '',
    );
  }
}

class InspectorAsignado {
  final int idInspector;
  final String nombre;
  final String telefono;
  final String? placaVehiculo;
  final String? urlFoto;

  InspectorAsignado({
    required this.idInspector,
    required this.nombre,
    required this.telefono,
    this.placaVehiculo,
    this.urlFoto,
  });

  factory InspectorAsignado.fromJson(Map<String, dynamic> json) {
    return InspectorAsignado(
      idInspector: json['idInspector'] ?? 0,
      nombre: json['nombre'] ?? '',
      telefono: json['telefono'] ?? '',
      placaVehiculo: json['placaVehiculo'],
      urlFoto: json['urlFoto'],
    );
  }
}

class SeguimientoVivoCliente {
  final bool activo;
  final int? etaMinutos;
  final bool etaAproximado;
  final int? distanciaMetros;
  final bool porLlegar;
  final bool sinSenalGps;

  SeguimientoVivoCliente({
    required this.activo,
    this.etaMinutos,
    this.etaAproximado = false,
    this.distanciaMetros,
    this.porLlegar = false,
    this.sinSenalGps = false,
  });

  factory SeguimientoVivoCliente.fromJson(Map<String, dynamic> json) {
    return SeguimientoVivoCliente(
      activo: json['activo'] == true,
      etaMinutos: json['etaMinutos'],
      etaAproximado: json['etaAproximado'] == true,
      distanciaMetros: json['distanciaMetros'],
      porLlegar: json['porLlegar'] == true,
      sinSenalGps: json['sinSenalGps'] == true,
    );
  }
}

class ResultadoInspeccionCliente {
  final String estadoTecho;
  final String hallazgos;
  final bool requiereReparacion;
  final String? urgencia;
  final String? recomendaciones;
  final String? urlReportePdf;

  ResultadoInspeccionCliente({
    required this.estadoTecho,
    required this.hallazgos,
    required this.requiereReparacion,
    this.urgencia,
    this.recomendaciones,
    this.urlReportePdf,
  });

  factory ResultadoInspeccionCliente.fromJson(Map<String, dynamic> json) {
    return ResultadoInspeccionCliente(
      estadoTecho: json['estadoTecho'] ?? 'REGULAR',
      hallazgos: json['hallazgos'] ?? '',
      requiereReparacion: json['requiereReparacion'] == true,
      urgencia: json['urgencia'],
      recomendaciones: json['recomendaciones'],
      urlReportePdf: json['urlReportePdf'],
    );
  }
}

class EventoLineaTiempo {
  final String estado;
  final String fechaHora;
  final String descripcion;

  EventoLineaTiempo({
    required this.estado,
    required this.fechaHora,
    required this.descripcion,
  });

  factory EventoLineaTiempo.fromJson(Map<String, dynamic> json) {
    return EventoLineaTiempo(
      estado: json['estado'] ?? '',
      fechaHora: json['fechaHora'] ?? '',
      descripcion: json['descripcion'] ?? '',
    );
  }
}

class CitaCliente {
  final int idInspeccion;
  final String folio;
  final String fechaProgramada;
  final String ventanaInicio;
  final String ventanaFin;
  final String estado;
  final String? motivoVisita;
  final int vecesReprogramada;
  final String? confirmadoEn;
  final bool clienteEnCasa;
  final DomicilioCliente domicilio;
  final InspectorAsignado? inspector;
  final SeguimientoVivoCliente? seguimientoVivo;
  final ResultadoInspeccionCliente? resultado;
  final List<EventoLineaTiempo> lineaDeTiempo;

  CitaCliente({
    required this.idInspeccion,
    required this.folio,
    required this.fechaProgramada,
    required this.ventanaInicio,
    required this.ventanaFin,
    required this.estado,
    this.motivoVisita,
    this.vecesReprogramada = 0,
    this.confirmadoEn,
    this.clienteEnCasa = false,
    required this.domicilio,
    this.inspector,
    this.seguimientoVivo,
    this.resultado,
    required this.lineaDeTiempo,
  });

  bool get estaConfirmada => estado == 'CONFIRMADA' || confirmadoEn != null;
  bool get puedeConfirmar => estado == 'NOTIFICADA' || estado == 'SIN_CONFIRMAR' || estado == 'PROGRAMADA';
  bool get puedeReprogramar =>
      vecesReprogramada < 3 &&
      estado != 'EN_CAMINO' &&
      estado != 'EN_SITIO' &&
      estado != 'COMPLETADA' &&
      estado != 'CLIENTE_AUSENTE';

  factory CitaCliente.fromJson(Map<String, dynamic> json) {
    return CitaCliente(
      idInspeccion: json['idInspeccion'] ?? 0,
      folio: json['folio'] ?? '',
      fechaProgramada: json['fechaProgramada'] ?? '',
      ventanaInicio: json['ventanaInicio'] ?? '',
      ventanaFin: json['ventanaFin'] ?? '',
      estado: json['estado'] ?? 'PROGRAMADA',
      motivoVisita: json['motivoVisita'],
      vecesReprogramada: json['vecesReprogramada'] ?? 0,
      confirmadoEn: json['confirmadoEn'],
      clienteEnCasa: json['clienteEnCasa'] == true,
      domicilio: DomicilioCliente.fromJson(json['domicilio'] ?? {}),
      inspector: json['inspector'] != null ? InspectorAsignado.fromJson(json['inspector']) : null,
      seguimientoVivo: json['seguimientoVivo'] != null
          ? SeguimientoVivoCliente.fromJson(json['seguimientoVivo'])
          : null,
      resultado: json['resultado'] != null
          ? ResultadoInspeccionCliente.fromJson(json['resultado'])
          : null,
      lineaDeTiempo: (json['lineaDeTiempo'] as List<dynamic>? ?? [])
          .map((item) => EventoLineaTiempo.fromJson(item))
          .toList(),
    );
  }
}
