import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/main.dart';

void main() {
  testWidgets('Login navigates to home', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: PassportScannerApp()));
    await tester.pumpAndSettle();

    expect(find.text('Documentation Officer Login'), findsOneWidget);

    await tester.tap(find.text('Login (Step 1 Mock)'));
    await tester.pumpAndSettle();

    expect(find.text('Home placeholder\nStep 1 complete'), findsOneWidget);
  });
}
