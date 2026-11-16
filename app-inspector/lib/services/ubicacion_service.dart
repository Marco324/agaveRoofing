import 'package:geolocator/geolocator.dart';

/// Resultado de pedir acceso a la ubicación del teléfono.
enum PermisoUbicacion {
  concedido,
  denegado,
  denegadoPermanente,
  servicioApagado,
}

/// Posición GPS lista para enviar a la API.
class PosicionGps {
  final double latitud;
  final double longitud;
  final double? precisionM;
  final double? velocidadMs;
  final DateTime capturadoEn;

  const PosicionGps({
    required this.latitud,
    required this.longitud,
    this.precisionM,
    this.velocidadMs,
    required this.capturadoEn,
  });
}

/// Acceso al GPS del teléfono (RF-08). Solo funciona con la app en primer plano.
class UbicacionService {
  Future<bool> tienePermiso() async {
    final permiso = await Geolocator.checkPermission();
    return permiso == LocationPermission.always ||
        permiso == LocationPermission.whileInUse;
  }

  /// Pide el permiso si hace falta y verifica que el GPS esté encendido.
  Future<PermisoUbicacion> asegurarPermiso() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      return PermisoUbicacion.servicioApagado;
    }
    var permiso = await Geolocator.checkPermission();
    if (permiso == LocationPermission.denied) {
      permiso = await Geolocator.requestPermission();
    }
    switch (permiso) {
      case LocationPermission.always:
      case LocationPermission.whileInUse:
        return PermisoUbicacion.concedido;
      case LocationPermission.deniedForever:
        return PermisoUbicacion.denegadoPermanente;
      case LocationPermission.denied:
      case LocationPermission.unableToDetermine:
        return PermisoUbicacion.denegado;
    }
  }

  Future<PosicionGps> posicionActual() async {
    final p = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 12),
      ),
    );
    return PosicionGps(
      latitud: p.latitude,
      longitud: p.longitude,
      precisionM: p.accuracy >= 0 ? p.accuracy : null,
      // Geolocator reporta velocidad negativa cuando no la conoce.
      velocidadMs: p.speed >= 0 ? p.speed : null,
      capturadoEn: p.timestamp.toUtc(),
    );
  }

  Future<void> abrirAjustesDeLaApp() => Geolocator.openAppSettings();

  Future<void> abrirAjustesDeUbicacion() => Geolocator.openLocationSettings();
}
