import 'seguimiento_vivo_model.dart';

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

class ResultadoInspeccionCliente {
  final String? estadoTecho;
  final String? hallazgos;
  final bool requiereReparacion;
  final String? urgencia;
  final String? recomendaciones;
  final String? urlReportePdf;

  ResultadoInspeccionCliente({
    this.estadoTecho,
    this.hallazgos,
    required this.requiereReparacion,
    this.urgencia,
    this.recomendaciones,
    this.urlReportePdf,
  });

  factory ResultadoInspeccionCliente.fromJson(Map<String, dynamic> json) {
    return ResultadoInspeccionCliente(
      estadoTecho: json['estadoTecho'],
      hallazgos: json['hallazgos'],
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
  final SeguimientoVivo? seguimientoVivo;
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

  bool get estaEnCamino => estado == 'EN_CAMINO';

  /// Texto para el cliente; nunca se muestra el código interno del estado.
  String get etiquetaEstado => etiquetaDeEstado(estado);

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
      estado: json['estado'] ?? '',
      motivoVisita: json['motivoVisita'],
      vecesReprogramada: json['vecesReprogramada'] ?? 0,
      confirmadoEn: json['confirmadoEn'],
      clienteEnCasa: json['clienteEnCasa'] == true,
      domicilio: DomicilioCliente.fromJson(json['domicilio'] ?? {}),
      inspector: json['inspector'] != null ? InspectorAsignado.fromJson(json['inspector']) : null,
      seguimientoVivo: json['seguimientoVivo'] != null
          ? SeguimientoVivo.fromJson(json['seguimientoVivo'])
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

/// Traduce el estado interno de una cita a una frase para el cliente.
String etiquetaDeEstado(String estado) {
  switch (estado) {
    case 'PROGRAMADA':
      return 'Programada';
    case 'NOTIFICADA':
      return 'Por confirmar';
    case 'SIN_CONFIRMAR':
      return 'Sin confirmar';
    case 'CONFIRMADA':
      return 'Confirmada';
    case 'REPROGRAMADA':
      return 'Cambio de horario';
    case 'EN_CAMINO':
      return 'En camino';
    case 'EN_SITIO':
      return 'Inspector llegó';
    case 'COMPLETADA':
      return 'Completada';
    case 'CLIENTE_AUSENTE':
      return 'Visita no realizada';
    case 'CANCELADA':
      return 'Cancelada';
    default:
      return '—';
  }
}

/// Traduce el estado del techo del reporte a una frase legible.
String etiquetaEstadoTecho(String? estadoTecho) {
  switch (estadoTecho) {
    case 'BUENO':
      return 'Bueno';
    case 'REGULAR':
      return 'Regular';
    case 'MALO':
      return 'Malo';
    case 'CRITICO':
      return 'Crítico';
    default:
      return '—';
  }
}

/// Traduce la urgencia de reparación a una frase legible.
String etiquetaUrgencia(String? urgencia) {
  switch (urgencia) {
    case 'BAJA':
      return 'Baja';
    case 'MEDIA':
      return 'Media';
    case 'ALTA':
      return 'Alta';
    case 'INMEDIATA':
      return 'Inmediata';
    default:
      return '—';
  }
}
