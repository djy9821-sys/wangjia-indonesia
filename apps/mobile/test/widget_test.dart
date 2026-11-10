import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wangjia_app/l10n/strings.dart';
import 'package:wangjia_app/screens/login_screen.dart';

void main() {
  testWidgets('login screen renders in Indonesian', (tester) async {
    await tester.pumpWidget(MaterialApp(home: LoginScreen(onLoggedIn: () {})));
    expect(find.text(S.t('login')), findsWidgets);
    expect(find.text(S.t('email')), findsOneWidget);
  });

  test('the language chosen last time is back at the next start, and a change is saved', () async {
    addTearDown(() => S.locale.value = 'id');
    SharedPreferences.setMockInitialValues({'wangjia_locale': 'en'});
    await S.load();
    expect(S.locale.value, 'en');

    S.locale.value = 'id';
    final saved = await SharedPreferences.getInstance();
    expect(saved.getString('wangjia_locale'), 'id');
  });
}
