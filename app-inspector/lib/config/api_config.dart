import 'package:flutter/foundation.dart';

/// URL base de la API de AgaveAlerta.
///
/// Se puede fijar al compilar con:
/// `flutter run --dart-define=API_URL=http://IP_DE_TU_COMPUTADORA:4000/api`
///
/// Si no se indica, se usa `10.0.2.2` en el emulador de Android (es la
/// dirección con la que el emulador ve a la computadora) y `localhost` en el
/// resto de plataformas (simulador de iOS, web, escritorio).
class ApiConfig {
  static const String _apiUrlDefinida = String.fromEnvironment('API_URL');

  static String get baseUrl {
    if (_apiUrlDefinida.isNotEmpty) return _apiUrlDefinida;
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:4000/api';
    }
    return 'http://localhost:4000/api';
  }
}
