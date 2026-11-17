import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agave_app_inspector/views/widgets/selector_dias_widget.dart';

void main() {
  for (final ancho in [320.0, 375.0, 430.0]) {
    testWidgets('selector sin desbordes a $ancho', (tester) async {
      tester.view.physicalSize = Size(ancho * 3, 900 * 3);
      tester.view.devicePixelRatio = 3;
      tester.platformDispatcher.textScaleFactorTestValue = 1.3;
      final conteo = ValueNotifier<Map<String, int>>({
        '2026-11-12': 2,
        '2026-11-20': 1,
      });
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) => Scaffold(
              appBar: AppBar(
                title: const Text('Mi ruta'),
                bottom: PreferredSize(
                  preferredSize: const Size.fromHeight(
                    SelectorSemanaWidget.alto,
                  ),
                  child: SelectorSemanaWidget(
                    seleccionada: DateTime(2026, 11, 12),
                    paradasPorDia: conteo.value,
                    onSeleccionar: (_) {},
                    onAbrirCalendario: () => mostrarCalendarioMes(
                      context,
                      seleccionada: DateTime(2026, 11, 12),
                      paradasPorDia: conteo,
                      cargarMes: (_, _) {},
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
      expect(find.text('12'), findsOneWidget);
      await tester.tap(find.text('Noviembre 2026'));
      await tester.pumpAndSettle();
      expect(find.text('3 paradas este mes'), findsOneWidget);
      await tester.tap(find.byTooltip('Mes siguiente'));
      await tester.pumpAndSettle();
      expect(find.text('Diciembre 2026'), findsOneWidget);
      tester.view.reset();
    });
  }
}
