import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wangjia_app/l10n/strings.dart';
import 'package:wangjia_app/screens/login_screen.dart';
import 'package:wangjia_app/widgets/common.dart';

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

  testWidgets('a list picture is decoded for its box on this screen, not at full size', (tester) async {
    late Widget picture;
    await tester.pumpWidget(MediaQuery(
      data: const MediaQueryData(devicePixelRatio: 3),
      child: Builder(builder: (context) {
        // Made but not shown: on screen it would go and fetch the picture.
        picture = productThumb(context, 'http://shop.test/kincir.jpg', width: 76);
        return const SizedBox();
      }),
    ));
    expect(
      picture,
      isA<CachedNetworkImage>()
          .having((p) => p.imageUrl, 'imageUrl', 'http://shop.test/kincir.jpg')
          .having((p) => p.fit, 'fit', BoxFit.contain)
          .having((p) => p.memCacheWidth, 'memCacheWidth', 228),
    );
  });
}
