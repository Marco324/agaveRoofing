import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agave_app_inspector/models/ruta_parada_model.dart';
import 'package:agave_app_inspector/views/widgets/parada_card_widget.dart';

RutaParada _parada(String estado) => RutaParada.fromJson({
  'idInspeccion': 1,
  'folio': 'INS-2026-000011',
  'fechaProgramada': '2026-11-12',
  'ventanaInicio': '11:30',
  'ventanaFin': '13:30',
  'estado': estado,
  'cliente': {'nombre': 'Sarah Jenkins', 'telefono': '+1-210-555-0233'},
  'domicilio': {
    'direccionCompleta': 'Broadway St #5930',
    'colonia': 'Alamo Heights',
    'ciudad': 'San Antonio',
  },
});

Future<void> _pintar(
  WidgetTester tester,
  RutaParada parada, {
  bool esDeHoy = true,
  bool esPasada = false,
  VoidCallback? onCapturar,
  VoidCallback? onAusente,
}) async {
  tester.view.physicalSize = const Size(375 * 3, 1400 * 3);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: SingleChildScrollView(
          child: ParadaCardWidget(
            parada: parada,
            orden: 1,
            esDeHoy: esDeHoy,
            esPasada: esPasada,
            onIniciarTrayecto: () {},
            onRegistrarLlegada: () {},
            onCapturarResultado: onCapturar ?? () {},
            onMarcarAusente: onAusente ?? () {},
          ),
        ),
      ),
    ),
  );
}

void main() {
  testWidgets('Sin cerrar: aviso y botones para cerrar la visita', (
    tester,
  ) async {
    var capturar = 0, ausente = 0;
    await _pintar(
      tester,
      _parada('PENDIENTE_CIERRE'),
      esDeHoy: false,
      esPasada: true,
      onCapturar: () => capturar++,
      onAusente: () => ausente++,
    );
    expect(find.text('Sin cerrar'), findsOneWidget);
    expect(find.textContaining('quedó sin cerrar'), findsOneWidget);
    await tester.tap(find.text('Cerrar con resultado'));
    await tester.tap(find.textContaining('El cliente no estaba'));
    expect((capturar, ausente), (1, 1));
    expect(tester.takeException(), isNull);
  });

  testWidgets('No realizada: solo informa, sin acciones', (tester) async {
    await _pintar(
      tester,
      _parada('NO_REALIZADA'),
      esDeHoy: false,
      esPasada: true,
    );
    expect(find.text('No realizada'), findsOneWidget);
    expect(find.textContaining('No se realizó en su fecha'), findsOneWidget);
    expect(find.text('Voy en camino'), findsNothing);
    expect(find.text('Capturar resultado'), findsNothing);
  });

  testWidgets('"Voy en camino" solo el día de la visita', (tester) async {
    await _pintar(tester, _parada('CONFIRMADA'), esDeHoy: true);
    expect(find.text('Voy en camino'), findsOneWidget);

    await _pintar(tester, _parada('CONFIRMADA'), esDeHoy: false);
    expect(find.text('Voy en camino'), findsNothing);
    expect(find.textContaining('el día de la visita'), findsOneWidget);

    await _pintar(
      tester,
      _parada('CONFIRMADA'),
      esDeHoy: false,
      esPasada: true,
    );
    expect(find.textContaining('día anterior'), findsOneWidget);
  });
}
