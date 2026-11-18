import 'package:agave_ui/agave_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agave_app_inspector/views/screens/login_screen.dart';

void main() {
  testWidgets('El acceso del inspector muestra correo y contraseña', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(theme: agaveTheme(), home: const LoginScreen()),
    );
    expect(find.byType(TextField), findsNWidgets(2));
    expect(find.text('Correo'), findsOneWidget);
    expect(find.text('Contraseña'), findsOneWidget);
    expect(find.text('Entrar'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
