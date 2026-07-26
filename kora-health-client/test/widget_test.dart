import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:kora_health_client/main.dart';

void main() {
  testWidgets('Home screen shows navigation to water-tracking screens', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: MyApp()));

    expect(find.text('Objetivo de agua'), findsOneWidget);
    expect(find.text('Historial de agua'), findsOneWidget);
  });
}
