import 'dart:math';

final Random _aleatorio = Random.secure();

/// Genera un identificador local único (UUID v4) para una operación capturada
/// en el teléfono. Se genera UNA sola vez por operación y se reúsa en cada
/// reintento, para que la API no la registre dos veces (RN-12).
String generarIdLocal() {
  final b = List<int>.generate(16, (_) => _aleatorio.nextInt(256));
  b[6] = (b[6] & 0x0f) | 0x40; // versión 4
  b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
  String hex(int i) => b[i].toRadixString(16).padLeft(2, '0');
  final s = List<String>.generate(16, hex).join();
  return '${s.substring(0, 8)}-${s.substring(8, 12)}-${s.substring(12, 16)}-'
      '${s.substring(16, 20)}-${s.substring(20)}';
}
