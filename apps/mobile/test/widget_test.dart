import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wangjia_app/l10n/strings.dart';
import 'package:wangjia_app/screens/login_screen.dart';

void main() {
  testWidgets('login screen renders in Indonesian', (tester) async {
    await tester.pumpWidget(MaterialApp(home: LoginScreen(onLoggedIn: () {})));
    expect(find.text(S.t('login')), findsWidgets);
    expect(find.text(S.t('email')), findsOneWidget);
  });
}
