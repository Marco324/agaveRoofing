/// Sesión iniciada en la app (RF-01, RF-03): quién es y con qué token habla con la API.
class SesionUsuario {
  final String token;
  final String idUsuario;
  final String nombre;
  final String rol;
  final String? correo;
  final String? telefono;
  final int? idCliente;
  final int? idInspector;

  const SesionUsuario({
    required this.token,
    required this.idUsuario,
    required this.nombre,
    required this.rol,
    this.correo,
    this.telefono,
    this.idCliente,
    this.idInspector,
  });

  /// [usuario] es el objeto `usuario` que devuelve `/auth/login` o `/auth/sesion`.
  factory SesionUsuario.desdeApi(String token, Map<String, dynamic> usuario) {
    return SesionUsuario(
      token: token,
      idUsuario: usuario['idUsuario'] as String? ?? '',
      nombre: usuario['nombre'] as String? ?? '',
      rol: usuario['rol'] as String? ?? '',
      correo: usuario['correo'] as String?,
      telefono: usuario['telefono'] as String?,
      idCliente: (usuario['idCliente'] as num?)?.toInt(),
      idInspector: (usuario['idInspector'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toJson() => {
        'token': token,
        'usuario': {
          'idUsuario': idUsuario,
          'nombre': nombre,
          'rol': rol,
          'correo': correo,
          'telefono': telefono,
          'idCliente': idCliente,
          'idInspector': idInspector,
        },
      };

  static SesionUsuario? fromJson(Map<String, dynamic> json) {
    final token = json['token'] as String?;
    final usuario = json['usuario'] as Map<String, dynamic>?;
    if (token == null || token.isEmpty || usuario == null) return null;
    return SesionUsuario.desdeApi(token, usuario);
  }

  /// Primer nombre para el saludo ("Robert B. Martinez" → "Robert").
  String get primerNombre {
    final partes = nombre.trim().split(RegExp(r'\s+'));
    return partes.isEmpty || partes.first.isEmpty ? '' : partes.first;
  }
}
