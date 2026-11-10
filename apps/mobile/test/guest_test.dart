import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wangjia_app/api/medusa_client.dart';
import 'package:wangjia_app/cart.dart';
import 'package:wangjia_app/l10n/strings.dart';
import 'package:wangjia_app/main.dart' show AuthGate;
import 'package:wangjia_app/models.dart';
import 'package:wangjia_app/screens/checkout_screen.dart';
import 'package:wangjia_app/screens/login_screen.dart';
import 'package:wangjia_app/screens/orders_hub_screen.dart';
import 'package:wangjia_app/screens/product_detail_screen.dart';
import 'package:wangjia_app/screens/warranty_screen.dart';

const _login = '/auth/customer/emailpass';
const _me = '/store/customers/me';
const _products = '/store/products';
const _orders = '/store/orders';
const _quotes = '/store/quotes';
const _units = '/store/warranty/units';

// Nothing checks these: the backend below is a stand-in.
const _email = 'budi@tambak.id';
const _secret = 'tambak-udang-2026';
const _budi = {'id': 'cus_1', 'first_name': 'Budi', 'last_name': 'Santoso', 'email': _email};

/// A session token shaped like the backend's: the payload carries the
/// customer id.
String _token(String customerId) =>
    'h.${base64Url.encode(utf8.encode(jsonEncode({'actor_id': customerId}))).replaceAll('=', '')}.s';

http.Response _ok(Map<String, dynamic> body) => http.Response(jsonEncode(body), 200);
http.Response _refused(int status) => http.Response(jsonEncode({'message': 'Refused'}), status);

void main() {
  // Made before the test binding: afterwards a real HTTP client can only be
  // created inside a running test.
  final api = MedusaClient.instance;
  TestWidgetsFlutterBinding.ensureInitialized();
  // The session token goes to an in-memory store instead of the keychain.
  FlutterSecureStorage.setMockInitialValues({});
  late List<http.Request> calls;
  // How the stand-in backend behaves; every test starts with a working one.
  late bool offline;
  late bool sessionAccepted;
  late bool ordersRefused;
  // While set, the check of a saved login gets no answer.
  Completer<void>? sessionCheckHeld;

  int requests(String path) => calls.where((c) => c.url.path == path).length;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    api.onSessionChanged = null;
    await api.logout();
    CartStore.instance.clear();
    offline = false;
    sessionAccepted = true;
    ordersRefused = false;
    sessionCheckHeld = null;
    calls = [];
    // A shop with an empty catalogue and one customer.
    http.Response answer(String path) {
      switch (path) {
        case _login:
          return _ok({'token': _token('cus_1')});
        case _me:
          return sessionAccepted ? _ok({'customer': _budi}) : _refused(401);
        case _orders:
          return ordersRefused ? _refused(401) : _ok({'orders': []});
        case '/store/regions':
          return _ok({
            'regions': [
              {
                'id': 'reg_1',
                'currency_code': 'idr',
                'countries': [
                  {'iso_2': 'id'}
                ]
              }
            ]
          });
        case _products:
          return _ok({'products': []});
        case '/store/group-buys':
          return _ok({'group_buys': []});
        case '/store/product-categories':
          return _ok({'product_categories': []});
        case '/store/customers/me/addresses':
          return _ok({'addresses': []});
        case '/store/wilayah':
          return _ok({'provinces': []});
        case _units:
          return _ok({'units': []});
        case '/store/carts':
          return _ok({
            'cart': {'id': 'cart_1'}
          });
        case '/store/carts/cart_1/line-items':
        case _quotes:
          return _ok({});
        default:
          return _refused(404);
      }
    }

    api.httpClient = MockClient((req) async {
      calls.add(req);
      if (offline) throw http.ClientException('No route to host');
      final held = sessionCheckHeld;
      if (held != null && req.url.path == _me) await held.future;
      final res = answer(req.url.path);
      // A real client hands the request back with the answer, and the app
      // reads the path from it.
      return http.Response(res.body, res.statusCode, request: req);
    });
  });

  /// Lets requests and page transitions finish. Not pumpAndSettle: a page that
  /// is still loading shows a spinner, which never settles.
  Future<void> settle(WidgetTester tester) async {
    for (var i = 0; i < 10; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
  }

  void phone(WidgetTester tester) {
    tester.view.physicalSize = const Size(1080, 2340);
    tester.view.devicePixelRatio = 3.0;
    addTearDown(tester.view.reset);
  }

  Future<void> openApp(WidgetTester tester) async {
    phone(tester);
    await tester.pumpWidget(const MaterialApp(home: AuthGate()));
    await settle(tester);
  }

  /// A login kept on the device by an earlier run of the app.
  Future<void> savedLogin(WidgetTester tester) => tester.runAsync(() => api.login(_email, _secret));

  Future<void> tab(WidgetTester tester, String label) async {
    await tester.tap(find.descendant(of: find.byType(NavigationBar), matching: find.text(S.t(label))));
    await settle(tester);
  }

  /// Fills in the login page that is on screen and sends it.
  Future<void> signIn(WidgetTester tester) async {
    await tester.enterText(find.widgetWithText(TextField, S.t('email')), _email);
    await tester.enterText(find.widgetWithText(TextField, S.t('password')), _secret);
    final button = find.widgetWithText(FilledButton, S.t('login'));
    await tester.ensureVisible(button);
    await tester.pump();
    await tester.tap(button);
    await settle(tester);
  }

  /// The account page is a long list: bring a row into view before judging it.
  Future<void> scrollTo(WidgetTester tester, Finder row) async {
    await tester.dragUntilVisible(row, find.byType(ListView), const Offset(0, -200));
    await settle(tester);
  }

  group('a guest', () {
    testWidgets('lands in the shop, not on a login page', (tester) async {
      await openApp(tester);
      expect(find.byType(LoginScreen), findsNothing);
      expect(find.byType(NavigationBar), findsOneWidget);
      expect(find.text(S.t('no_products')), findsOneWidget);
      expect(requests(_products), 1);
      expect(requests(_me), 0);

      await tab(tester, 'orders');
      expect(find.text(S.t('orders_guest')), findsOneWidget);
      expect(requests(_orders), 0);

      await tab(tester, 'account');
      expect(find.text(S.t('account_guest')), findsOneWidget);
      await scrollTo(tester, find.textContaining(S.t('app_version')));
      expect(find.text(S.t('logout')), findsNothing);
    });

    testWidgets('who signs in from the account page comes back to it as the customer', (tester) async {
      await openApp(tester);
      await tab(tester, 'account');
      await tester.tap(find.widgetWithText(FilledButton, S.t('login_or_register')));
      await settle(tester);
      expect(find.byType(LoginScreen), findsOneWidget);

      await signIn(tester);
      expect(find.byType(LoginScreen), findsNothing);
      expect(find.text('Budi Santoso'), findsOneWidget);
      expect(find.byType(OrdersHubScreen, skipOffstage: false), findsOneWidget);
      // Prices can differ per customer: the catalogue was fetched again.
      expect(requests(_products), 2);

      await scrollTo(tester, find.text(S.t('logout')));
      await tester.tap(find.text(S.t('logout')));
      await settle(tester);
      expect(api.isLoggedIn, isFalse);
      expect(find.text(S.t('account_guest')), findsOneWidget);
      expect(find.byType(OrdersHubScreen, skipOffstage: false), findsNothing);
    });

    testWidgets('is asked to sign in at checkout, and then goes on to it', (tester) async {
      CartStore.instance.add(CartItem(
        variantId: 'variant_1',
        productId: 'prod_1',
        productTitle: 'Kincir Air 1 HP',
        variantTitle: '1 HP',
        price: 4500000,
        currency: 'idr',
      ));
      await openApp(tester);
      await tab(tester, 'cart');
      await tester.tap(find.widgetWithText(FilledButton, '${S.t('checkout_short')} (1)'));
      await settle(tester);
      expect(find.byType(LoginScreen), findsOneWidget);
      expect(find.byType(CheckoutScreen), findsNothing);

      await signIn(tester);
      expect(find.byType(LoginScreen), findsNothing);
      expect(find.byType(CheckoutScreen), findsOneWidget);
    });

    testWidgets('is asked to sign in before a quote request, which then goes out', (tester) async {
      phone(tester);
      await tester.pumpWidget(MaterialApp(
        home: ProductDetailScreen(
          product: Product(
            id: 'prod_1',
            title: 'Kincir Air 1 HP',
            variants: [Variant(id: 'variant_1', title: '1 HP', price: 4500000)],
          ),
        ),
      ));
      await settle(tester);
      final link = find.text(S.t('wholesale_quote'));
      await tester.dragUntilVisible(link, find.byType(ListView), const Offset(0, -200));
      await settle(tester);
      await tester.tap(link);
      await settle(tester);
      expect(find.byType(LoginScreen), findsOneWidget);
      expect(requests(_quotes), 0);

      await signIn(tester);
      expect(find.byType(LoginScreen), findsNothing);
      expect(requests(_quotes), 1);
      expect(find.text(S.t('quote_requested')), findsOneWidget);
    });

    testWidgets('sees no machine list on the warranty page until signed in', (tester) async {
      phone(tester);
      await tester.pumpWidget(const MaterialApp(home: WarrantyScreen()));
      await settle(tester);
      expect(requests(_units), 0);

      await tester.tap(find.widgetWithText(OutlinedButton, S.t('units_guest')));
      await settle(tester);
      await signIn(tester);
      expect(find.byType(LoginScreen), findsNothing);
      expect(requests(_units), 1);
      expect(find.text(S.t('no_units')), findsOneWidget);
    });
  });

  group('a saved login', () {
    testWidgets('opens the app as that customer', (tester) async {
      await savedLogin(tester);
      await openApp(tester);
      expect(requests(_me), 1);
      await tab(tester, 'account');
      expect(find.text('Budi Santoso'), findsOneWidget);
    });

    testWidgets('that cannot be checked without signal is kept and tried again', (tester) async {
      await savedLogin(tester);
      offline = true;
      await openApp(tester);
      expect(find.byType(NavigationBar), findsOneWidget);
      expect(api.isLoggedIn, isTrue);

      await tab(tester, 'orders');
      expect(find.descendant(of: find.byType(SnackBar), matching: find.text(S.t('err_offline'))), findsOneWidget);
      expect(find.byType(LoginScreen), findsNothing);

      offline = false;
      await tab(tester, 'account');
      expect(find.text('Budi Santoso'), findsOneWidget);
      expect(find.byType(OrdersHubScreen, skipOffstage: false), findsOneWidget);
    });

    testWidgets('that the backend no longer accepts becomes a guest', (tester) async {
      await savedLogin(tester);
      sessionAccepted = false;
      await openApp(tester);
      expect(api.isLoggedIn, isFalse);
      expect(find.byType(NavigationBar), findsOneWidget);
      await tab(tester, 'account');
      expect(find.text(S.t('account_guest')), findsOneWidget);
    });

    testWidgets('that ends while it is still being checked stays ended', (tester) async {
      await savedLogin(tester);
      final held = sessionCheckHeld = Completer<void>();
      phone(tester);
      await tester.pumpWidget(const MaterialApp(home: AuthGate()));
      await settle(tester);
      expect(find.byType(NavigationBar), findsNothing);

      // Meanwhile another request is told that the session is over.
      ordersRefused = true;
      api.orders().then((_) {}, onError: (_) {});
      await settle(tester);
      expect(api.isLoggedIn, isFalse);
      expect(find.byType(NavigationBar), findsOneWidget);

      // The late answer to the first check still names the customer.
      held.complete();
      await settle(tester);
      await tab(tester, 'account');
      expect(find.text(S.t('account_guest')), findsOneWidget);
    });

    testWidgets('that ends while the app is open becomes a guest', (tester) async {
      await savedLogin(tester);
      ordersRefused = true;
      await openApp(tester);
      expect(api.isLoggedIn, isFalse);
      await tab(tester, 'orders');
      expect(find.text(S.t('orders_guest')), findsOneWidget);
      await tab(tester, 'account');
      expect(find.text(S.t('account_guest')), findsOneWidget);
    });
  });

  testWidgets('ensureSignedIn asks only a guest and reports how it went', (tester) async {
    phone(tester);
    bool? answer;
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: Builder(
          builder: (context) => TextButton(
            onPressed: () async => answer = await ensureSignedIn(context),
            child: const Text('go'),
          ),
        ),
      ),
    ));

    // Backing out of the login page: still a guest.
    await tester.tap(find.text('go'));
    await settle(tester);
    expect(find.byType(LoginScreen), findsOneWidget);
    await tester.pageBack();
    await settle(tester);
    expect(answer, isFalse);

    // Signing in on it closes the page.
    await tester.tap(find.text('go'));
    await settle(tester);
    await signIn(tester);
    expect(answer, isTrue);
    expect(find.byType(LoginScreen), findsNothing);

    // Already signed in: no page at all.
    answer = null;
    await tester.tap(find.text('go'));
    await settle(tester);
    expect(answer, isTrue);
    expect(find.byType(LoginScreen), findsNothing);
  });

  group('MedusaClient.onSessionChanged', () {
    late int changes;
    void listen() {
      changes = 0;
      api.onSessionChanged = () async => changes++;
    }

    test('fires once for each sign-in and sign-out', () async {
      listen();
      await api.login(_email, _secret);
      expect(changes, 1);
      await api.logout();
      expect(changes, 2);
      await api.logout();
      expect(changes, 2);
    });

    test('fires once when the backend ends the session', () async {
      await api.login(_email, _secret);
      listen();
      sessionAccepted = false;
      expect(await api.me(), isNull);
      await pumpEventQueue();
      expect(api.isLoggedIn, isFalse);
      expect(changes, 1);
    });

    test('stays quiet when a guest is refused', () async {
      listen();
      ordersRefused = true;
      await expectLater(api.orders(), throwsA(isA<MedusaException>()));
      await pumpEventQueue();
      expect(changes, 0);
    });
  });
}
