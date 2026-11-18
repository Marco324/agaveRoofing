import 'package:agave_ui/agave_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agave_app_cliente/models/cita_cliente_model.dart';
import 'package:agave_app_cliente/views/widgets/proxima_cita_widget.dart';
import 'package:agave_app_cliente/views/screens/login_screen.dart';

CitaCliente cita(String estado) => CitaCliente.fromJson({
  'idInspeccion': 1,
  'folio': 'INS-2026-000010',
  'fechaProgramada': '2026-11-12',
  'ventanaInicio': '09:00',
  'ventanaFin': '11:00',
  'estado': estado,
  'domicilio': {
    'direccionCompleta': 'Stone Oak Pkwy #19202',
    'colonia': 'Stone Oak',
    'ciudad': 'San Antonio',
  },
});
void main() {
  testWidgets(
    'El acceso conserva los campos y valida antes de consultar la API',
    (tester) async {
      await tester.pumpWidget(
        MaterialApp(theme: agaveTheme(), home: const LoginScreen()),
      );
      expect(find.byType(TextField), findsNWidgets(2));
      await tester.tap(find.text('Entrar'));
      await tester.pump();
      expect(find.textContaining('10 dígitos'), findsOneWidget);
    },
  );
  testWidgets(
    'Confirmar y cambiar horario conservan sus acciones en pantalla estrecha',
    (tester) async {
      tester.view.physicalSize = const Size(320, 1000);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      var confirmadas = 0, cambios = 0;
      await tester.pumpWidget(
        MaterialApp(
          theme: agaveTheme(),
          home: Scaffold(
            body: SingleChildScrollView(
              child: ProximaCitaCard(
                cita: cita('NOTIFICADA'),
                seguimiento: null,
                onConfirmar: () => confirmadas++,
                onReprogramar: () => cambios++,
                onEstoyEnCasa: () {},
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Confirmar asistencia'));
      await tester.tap(find.text('Cambiar horario'));
      expect((confirmadas, cambios), (1, 1));
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets(
    'En camino ofrece presencia y conserva el mapa sin permitir reprogramar',
    (tester) async {
      var presencia = 0;
      await tester.pumpWidget(
        MaterialApp(
          theme: agaveTheme(),
          home: Scaffold(
            body: SingleChildScrollView(
              child: ProximaCitaCard(
                cita: cita('EN_CAMINO'),
                seguimiento: null,
                onConfirmar: () {},
                onReprogramar: () {},
                onEstoyEnCasa: () => presencia++,
              ),
            ),
          ),
        ),
      );
      expect(find.text('Cambiar horario'), findsNothing);
      expect(
        find.text('Esperando la ubicación del inspector…'),
        findsOneWidget,
      );
      await tester.ensureVisible(find.text('Avisar que estoy en casa'));
      await tester.tap(find.text('Avisar que estoy en casa'));
      expect(presencia, 1);
    },
  );
}
