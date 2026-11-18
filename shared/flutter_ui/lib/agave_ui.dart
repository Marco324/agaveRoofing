import 'package:flutter/material.dart';

const agaveGreen = Color(0xFF047857);
const agaveInk = Color(0xFF172C32);

ThemeData agaveTheme({bool dark = false}) {
  final scheme = ColorScheme.fromSeed(
    seedColor: agaveGreen,
    brightness: dark ? Brightness.dark : Brightness.light,
    primary: dark ? const Color(0xFF91CFAD) : agaveGreen,
    secondary: dark ? const Color(0xFF91CFAD) : agaveGreen,
    surface: dark ? const Color(0xFF172936) : Colors.white,
  );
  final line = dark ? const Color(0xFF30424F) : const Color(0xFFDCE4E4);
  final shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(10));
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    fontFamily: 'Roboto',
    scaffoldBackgroundColor: dark
        ? const Color(0xFF111F2C)
        : const Color(0xFFF3F6F5),
    dividerColor: line,
    appBarTheme: AppBarTheme(
      backgroundColor: dark ? const Color(0xFF111F2C) : Colors.white,
      foregroundColor: scheme.onSurface,
      surfaceTintColor: Colors.transparent,
      centerTitle: false,
      elevation: 0,
      scrolledUnderElevation: 0,
      toolbarHeight: 76,
    ),
    cardTheme: CardThemeData(
      color: scheme.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: shape.copyWith(side: BorderSide(color: line)),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: agaveGreen,
        foregroundColor: Colors.white,
        minimumSize: const Size(48, 48),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        elevation: 0,
        shape: shape,
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(48, 48),
        side: BorderSide(color: line),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        shape: shape,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(minimumSize: const Size(48, 44)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: dark ? const Color(0xFF1B2E3A) : const Color(0xFFF8FAF9),
      contentPadding: const EdgeInsets.all(16),
      labelStyle: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
      hintStyle: TextStyle(
        fontSize: 14,
        color: scheme.onSurfaceVariant.withValues(alpha: .75),
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: scheme.primary, width: 2),
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: scheme.surface,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      titleTextStyle: TextStyle(
        color: scheme.onSurface,
        fontSize: 20,
        fontWeight: FontWeight.w600,
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: shape,
    ),
    expansionTileTheme: const ExpansionTileThemeData(
      shape: Border(),
      collapsedShape: Border(),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: scheme.surface,
      selectedColor: scheme.primary.withValues(alpha: .09),
      side: BorderSide(color: line),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(7)),
      labelStyle: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: scheme.onSurface,
      ),
      checkmarkColor: scheme.primary,
    ),
    textTheme: TextTheme(
      headlineMedium: TextStyle(
        fontSize: 28,
        letterSpacing: -1,
        fontWeight: FontWeight.w600,
        color: scheme.onSurface,
      ),
      titleLarge: TextStyle(
        fontSize: 22,
        letterSpacing: -.5,
        fontWeight: FontWeight.w600,
        color: scheme.onSurface,
      ),
      titleMedium: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        color: scheme.onSurface,
      ),
      bodyLarge: TextStyle(fontSize: 15, height: 1.5, color: scheme.onSurface),
      bodyMedium: TextStyle(
        fontSize: 14,
        height: 1.5,
        color: scheme.onSurfaceVariant,
      ),
      bodySmall: TextStyle(
        fontSize: 12,
        height: 1.5,
        color: scheme.onSurfaceVariant,
      ),
    ),
  );
}

String agaveStateLabel(String state) =>
    const {
      'PROGRAMADA': 'Programada',
      'NOTIFICADA': 'Aviso enviado',
      'CONFIRMADA': 'Confirmada',
      'SIN_CONFIRMAR': 'Sin confirmar',
      'EN_CAMINO': 'En camino',
      'EN_SITIO': 'En domicilio',
      'COMPLETADA': 'Completada',
      'CANCELADA': 'Cancelada',
      'CLIENTE_AUSENTE': 'Cliente ausente',
      'REPROGRAMADA': 'Reprogramada',
      'REPROG_SOLICITADA': 'Cambio solicitado',
      'NO_REALIZADA': 'No realizada',
      'PENDIENTE_CIERRE': 'Sin cerrar',
    }[state] ??
    state;

String agaveDateLabel(String value) {
  final date = DateTime.tryParse(value);
  if (date == null) return value;
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  return '${date.day} de ${months[date.month - 1]}';
}

class AgaveStateChip extends StatelessWidget {
  final String state;
  const AgaveStateChip(this.state, {super.key});
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final attention = [
      'SIN_CONFIRMAR',
      'CLIENTE_AUSENTE',
      'PENDIENTE_CIERRE',
      'NO_REALIZADA',
    ].contains(state);
    final color = attention
        ? (scheme.brightness == Brightness.dark
              ? const Color(0xFFF2CB91)
              : const Color(0xFF966B20))
        : scheme.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .09),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(
        agaveStateLabel(state),
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class AgaveIntro extends StatelessWidget {
  final String eyebrow;
  final String title;
  final String subtitle;
  const AgaveIntro({
    super.key,
    required this.eyebrow,
    required this.title,
    required this.subtitle,
  });
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 24),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (eyebrow.isNotEmpty)
          Text(
            eyebrow.toUpperCase(),
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(letterSpacing: 1.3),
          ),
        if (eyebrow.isNotEmpty) const SizedBox(height: 6),
        Text(title, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 6),
        Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
      ],
    ),
  );
}

class AgaveBrand extends StatelessWidget {
  const AgaveBrand({super.key});
  @override
  Widget build(BuildContext context) => Center(
    child: SizedBox.square(
      dimension: 36,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: const Color(0xFF04949C),
          borderRadius: BorderRadius.circular(9),
        ),
        child: Padding(
          padding: const EdgeInsets.all(5),
          child: Image.asset(
            'assets/branding/agave_logo_blanco.png',
            semanticLabel: 'Agave Roofing',
          ),
        ),
      ),
    ),
  );
}

class AgaveDetail extends StatelessWidget {
  final IconData icon;
  final String text;
  const AgaveDetail(this.icon, this.text, {super.key});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 5),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 3),
          child: Icon(
            icon,
            size: 18,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(text, style: Theme.of(context).textTheme.bodyMedium),
        ),
      ],
    ),
  );
}
