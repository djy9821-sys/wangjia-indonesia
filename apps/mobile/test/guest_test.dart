import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
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
import 'package:wangjia_app/screens/products_screen.dart';
import 'package:wangjia_app/screens/warranty_screen.dart';

const _login = '/auth/customer/emailpass';
const _renew = '/auth/token/refresh';
const _me = '/store/customers/me';
const _products = '/store/products';
const _groupBuys = '/store/group-buys';
const _orders = '/store/orders';
const _quotes = '/store/quotes';
const _units = '/store/warranty/units';

// Nothing checks these: the backend below is a stand-in.
const _email = 'budi@tambak.id';
const _secret = 'tambak-udang-2026';
const _budi = {'id': 'cus_1', 'first_name': 'Budi', 'last_name': 'Santoso', 'email': _email};

/// A session token shaped like the backend's: the payload carries the
/// customer id and, when [age] is given, when the login was issued and when
/// it ends.
String _token(String customerId, {Duration? age, Duration life = const Duration(days: 60)}) {
  final issued = age == null ? null : DateTime.now().subtract(age).millisecondsSinceEpoch ~/ 1000;
  final payload = {
    'actor_id': customerId,
    if (issued != null) ...{'iat': issued, 'exp': issued + life.inSeconds},
  };
  return 'h.${base64Url.encode(utf8.encode(jsonEncode(payload))).replaceAll('=', '')}.s';
}

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
  // The shop's catalogue, and a way to keep its answer waiting (slow network).
  late Map<String, dynamic> catalogue;
  Completer<void>? catalogueHeld;
  // The patungan the shop is running, with the same way to keep them waiting.
  late List<Map<String, dynamic>> patungan;
  Completer<void>? patunganHeld;
  // The token a sign-in hands out, and what a request for a fresh one gets
  // (with a way to keep that answer waiting).
  late String loginToken;
  late http.Response renewal;
  Completer<void>? renewalHeld;

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
    catalogue = {'products': []};
    catalogueHeld = null;
    patungan = [];
    patunganHeld = null;
    loginToken = _token('cus_1');
    renewal = _ok({'token': _token('cus_1', age: Duration.zero)});
    renewalHeld = null;
    calls = [];
    // A shop with an empty catalogue and one customer.
    http.Response answer(String path) {
      switch (path) {
        case _login:
          return _ok({'token': loginToken});
        case _renew:
          return renewal;
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
          return _ok(catalogue);
        case _groupBuys:
          return _ok({'group_buys': patungan});
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
        case _quotes:
          return _ok({});
        default:
          return _refused(404);
      }
    }

    api.httpClient = MockClient((req) async {
      calls.add(req);
      if (offline) throw http.ClientException('No route to host');
      final path = req.url.path;
      final held = {_me: sessionCheckHeld, _products: catalogueHeld, _groupBuys: patunganHeld, _renew: renewalHeld}[path];
      if (held != null) await held.future;
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

    testWidgets('that is a few days old is renewed while the app opens, and the customer stays', (tester) async {
      loginToken = _token('cus_1', age: const Duration(days: 3));
      await savedLogin(tester);
      await openApp(tester);
      expect(requests(_renew), 1);
      // Only the token changed: no second check, no login page.
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

    testWidgets('has the shop open while it is still being checked', (tester) async {
      await savedLogin(tester);
      final held = sessionCheckHeld = Completer<void>();
      await openApp(tester);
      expect(find.text(S.t('no_products')), findsOneWidget);

      // The customer's own pages wait: no guest page, no second check.
      await tab(tester, 'orders');
      expect(find.text(S.t('orders_guest')), findsNothing);
      await tab(tester, 'account');
      expect(find.text(S.t('account_guest')), findsNothing);
      expect(find.byType(LoginScreen), findsNothing);
      expect(requests(_me), 1);

      held.complete();
      await settle(tester);
      expect(find.text('Budi Santoso'), findsOneWidget);
      expect(find.byType(OrdersHubScreen, skipOffstage: false), findsOneWidget);
      // The token already said whose prices to fetch: once was enough.
      expect(requests(_products), 1);
    });

    testWidgets('that ends while it is still being checked stays ended', (tester) async {
      await savedLogin(tester);
      final held = sessionCheckHeld = Completer<void>();
      await openApp(tester);

      // Meanwhile another request is told that the session is over.
      ordersRefused = true;
      api.orders().then((_) {}, onError: (_) {});
      await settle(tester);
      expect(api.isLoggedIn, isFalse);
      await tab(tester, 'account');
      expect(find.text(S.t('account_guest')), findsOneWidget);

      // The late answer to the first check still names the customer.
      held.complete();
      await settle(tester);
      expect(find.text(S.t('account_guest')), findsOneWidget);
      expect(find.text('Budi Santoso'), findsNothing);
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

  group('the catalogue kept on the device', () {
    Map<String, dynamic> shelf(String title) => {
          'products': [
            {
              'id': 'prod_1',
              'title': title,
              'variants': [
                {
                  'id': 'variant_1',
                  'title': '1 HP',
                  'calculated_price': {'calculated_amount': 4500000, 'currency_code': 'idr'}
                }
              ]
            }
          ]
        };

    /// Opens the shop once, so that it keeps a catalogue, and closes it.
    Future<void> earlierVisit(WidgetTester tester) async {
      catalogue = shelf('Kincir 1 HP');
      await openApp(tester);
      expect(find.text('Kincir 1 HP'), findsOneWidget);
      await tester.pumpWidget(const SizedBox());
    }

    /// Opens the shop again on a slow network: the new catalogue is held back.
    Future<Completer<void>> slowStart(WidgetTester tester) async {
      catalogue = shelf('Kincir 2 HP');
      final held = catalogueHeld = Completer<void>();
      await openApp(tester);
      return held;
    }

    testWidgets('is on screen before the network answers, then gives way to the fresh one', (tester) async {
      await earlierVisit(tester);
      final held = await slowStart(tester);
      expect(find.text('Kincir 1 HP'), findsOneWidget);

      held.complete();
      await settle(tester);
      expect(find.text('Kincir 1 HP'), findsNothing);
      expect(find.text('Kincir 2 HP'), findsOneWidget);
    });

    testWidgets('is there for a returning customer as well', (tester) async {
      await savedLogin(tester);
      await earlierVisit(tester);
      final held = await slowStart(tester);
      expect(find.text('Kincir 1 HP'), findsOneWidget);
      held.complete();
      await settle(tester);
    });

    testWidgets('is not shown after signing out: prices can differ per customer', (tester) async {
      await savedLogin(tester);
      await earlierVisit(tester);
      await tester.runAsync(api.logout);
      final held = await slowStart(tester);
      expect(find.text('Kincir 1 HP'), findsNothing);

      held.complete();
      await settle(tester);
      expect(find.text('Kincir 2 HP'), findsOneWidget);
    });

    testWidgets('goes away when the login it was kept for ends', (tester) async {
      await savedLogin(tester);
      await earlierVisit(tester);
      sessionAccepted = false;
      final held = await slowStart(tester);
      // The saved login was refused meanwhile: this is a guest now.
      expect(api.isLoggedIn, isFalse);
      expect(find.text('Kincir 1 HP'), findsNothing);

      held.complete();
      await settle(tester);
      expect(find.text('Kincir 2 HP'), findsOneWidget);
    });

    testWidgets('stands in for the shop without signal, and says so', (tester) async {
      await earlierVisit(tester);
      offline = true;
      await openApp(tester);
      expect(find.text('Kincir 1 HP'), findsOneWidget);
      expect(find.text(S.t('offline_catalog')), findsOneWidget);
    });

    testWidgets('does not stand in for someone else, even without signal', (tester) async {
      await savedLogin(tester);
      await earlierVisit(tester);
      await tester.runAsync(api.logout);
      offline = true;
      await openApp(tester);
      expect(find.text('Kincir 1 HP'), findsNothing);
      expect(find.text(S.t('err_offline')), findsOneWidget);
    });
  });

  group('the shop page', () {
    // Their names differ from the shortcut labels, and only one holds "kincir".
    const Map<String, dynamic> parts = {'id': 'pcat_parts', 'name': 'Suku Cadang & Aksesori', 'rank': 1};
    const Map<String, dynamic> aerators = {'id': 'pcat_aerator', 'name': 'Kincir Air (Aerator)', 'rank': 2};

    Map<String, dynamic> product(String id, String title, num price, List<Map<String, dynamic>> categories) => {
          'id': 'prod_$id',
          'title': title,
          'categories': categories,
          'variants': [
            {
              'id': 'variant_$id',
              'title': 'Default',
              'calculated_price': {'calculated_amount': price, 'currency_code': 'idr'}
            }
          ]
        };

    /// A machine and a spare part, each in its own category and in one the
    /// shop does not show. The dearer machine comes first on the page, while
    /// the shop puts the spare parts category first.
    Map<String, dynamic> shop() => {
          'products': [
            product('kincir', 'Kincir 1 HP', 4500000, [
              aerators,
              {'id': 'pcat_promo', 'name': 'Promo internal', 'rank': 0, 'is_internal': true}
            ]),
            product('impeller', 'Impeller', 150000, [
              parts,
              {'id': 'pcat_old', 'name': 'Arsip', 'rank': 0, 'is_active': false}
            ]),
          ]
        };

    Map<String, dynamic> groupBuy(String title, {Duration ends = const Duration(days: 3)}) => {
          'id': 'gb_1',
          'title': title,
          'product_id': 'prod_kincir',
          'variant_id': 'variant_kincir',
          'group_price': 4000000,
          'regular_price': 4500000,
          'min_quantity': 10,
          'joined_quantity': 4,
          'participants': 2,
          'ends_at': DateTime.now().add(ends).toIso8601String(),
          'status': 'open',
        };

    setUp(() => catalogue = shop());

    /// Opens the shop once, so that it keeps what it was sent, and closes it.
    Future<void> visit(WidgetTester tester) async {
      await openApp(tester);
      await tester.pumpWidget(const SizedBox());
    }

    testWidgets('opens whole from the last visit: nothing moves when the fresh answers come', (tester) async {
      patungan = [groupBuy('Patungan Kincir')];
      await visit(tester);

      final slowCatalogue = catalogueHeld = Completer<void>();
      final slowPatungan = patunganHeld = Completer<void>();
      await openApp(tester);
      // The patungan, the list's title, a category and a product.
      final landmarks = ['Patungan Kincir', S.t('all_products'), 'Kincir Air (Aerator)', 'Kincir 1 HP'];
      // Some lie past the edge of the test phone: built all the same, and not to move.
      List<Offset> places() => [for (final text in landmarks) tester.getTopLeft(find.text(text, skipOffstage: false))];
      final before = places();

      slowCatalogue.complete();
      slowPatungan.complete();
      await settle(tester);
      expect(places(), before);
    });

    testWidgets('shows the patungan of the last visit until the fresh ones are in', (tester) async {
      patungan = [groupBuy('Patungan Lama')];
      await visit(tester);

      patungan = [groupBuy('Patungan Baru')];
      final held = patunganHeld = Completer<void>();
      await openApp(tester);
      expect(find.text('Patungan Lama'), findsOneWidget);

      held.complete();
      await settle(tester);
      expect(find.text('Patungan Lama'), findsNothing);
      expect(find.text('Patungan Baru'), findsOneWidget);
    });

    testWidgets('does not bring back a patungan whose time ran out', (tester) async {
      // Only this stand-in hands out one that is over; the shop never does.
      patungan = [groupBuy('Patungan Kincir', ends: const Duration(seconds: -1))];
      await visit(tester);
      offline = true;
      await openApp(tester);
      expect(find.text('Kincir 1 HP'), findsOneWidget);
      expect(find.text('Patungan Kincir'), findsNothing);
    });

    testWidgets('keeps the patungan of the last visit without signal', (tester) async {
      patungan = [groupBuy('Patungan Kincir')];
      await visit(tester);
      offline = true;
      await openApp(tester);
      expect(find.text('Patungan Kincir'), findsOneWidget);
    });

    testWidgets('says so when the Patungan shortcut finds none running', (tester) async {
      await openApp(tester);
      await tester.tap(find.text(S.t('group_buy')));
      await settle(tester);
      expect(find.text(S.t('no_group_buy')), findsOneWidget);
    });

    testWidgets('is quiet when the Patungan shortcut finds one running', (tester) async {
      patungan = [groupBuy('Patungan Kincir')];
      await openApp(tester);
      await tester.tap(find.text(S.t('group_buy')));
      await settle(tester);
      expect(find.text(S.t('no_group_buy')), findsNothing);
      expect(find.text('Patungan Kincir'), findsOneWidget);
    });

    testWidgets('takes its category row from the catalogue, in the order the shop gives', (tester) async {
      await openApp(tester);
      // The test font is wide: the last pill is built past the edge of the screen.
      double left(String text) => tester.getTopLeft(find.text(text, skipOffstage: false)).dx;
      expect(left(S.t('all')), lessThan(left('Suku Cadang & Aksesori')));
      expect(left('Suku Cadang & Aksesori'), lessThan(left('Kincir Air (Aerator)')));
      // Hidden and internal categories get no pill, and no list is asked for.
      expect(find.text('Promo internal', skipOffstage: false), findsNothing);
      expect(find.text('Arsip', skipOffstage: false), findsNothing);
      expect(requests('/store/product-categories'), 0);
    });

    testWidgets('shows the category of a shortcut, also without signal, and Semua brings all back', (tester) async {
      await visit(tester);
      offline = true;
      await openApp(tester);
      await tester.tap(find.text(S.t('quick_parts')));
      await settle(tester);
      expect(find.text('Impeller'), findsOneWidget);
      expect(find.text('Kincir 1 HP'), findsNothing);

      await tester.tap(find.text(S.t('all')));
      await settle(tester);
      expect(find.text('Kincir 1 HP'), findsOneWidget);
    });

    testWidgets('opened for spare parts, shows those', (tester) async {
      phone(tester);
      await tester.pumpWidget(const MaterialApp(home: ProductsScreen(initialCategoryName: 'suku cadang')));
      await settle(tester);
      expect(find.text('Impeller'), findsOneWidget);
      expect(find.text('Kincir 1 HP'), findsNothing);
    });

    testWidgets('holds when the system font is set larger: no box cuts its text', (tester) async {
      // A picture brings the banner on, and long names fill their two lines.
      catalogue = {
        'products': [
          {
            ...product('kincir', 'Kincir Air WANGJIA 1 HP 3 Phase', 4500000, [aerators]),
            'thumbnail': 'http://shop.test/kincir.jpg',
          },
          product('impeller', 'Impeller Kincir Air WANGJIA', 150000, [parts]),
        ]
      };
      patungan = [groupBuy('Patungan Kincir 1 HP 3 Phase')];
      addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
      // 1.3 is the largest step on most Android phones, 2 the largest there is.
      for (final scale in [1.0, 1.3, 2.0]) {
        tester.platformDispatcher.textScaleFactorTestValue = scale;
        await openApp(tester);
        expect(tester.takeException(), isNull, reason: 'the top of the page at $scale');
        // The banner and the patungan card are among what was laid out.
        expect(find.text(S.t('official_store').toUpperCase()), findsOneWidget);
        expect(find.text('Patungan Kincir 1 HP 3 Phase', skipOffstage: false), findsOneWidget);

        // Text in a box that is too low is cut without a word from Flutter. The
        // search field has always taken 4 px off the empty part of its line and
        // may take no more; a category pill has to give its text the whole line.
        final field = tester.renderObject<RenderBox>(find.byType(EditableText));
        expect(field.size.height, greaterThanOrEqualTo(field.getMaxIntrinsicHeight(field.size.width) - 4), reason: 'the search field at $scale');
        await tester.dragUntilVisible(find.text(S.t('all')), find.byType(CustomScrollView), const Offset(0, -300));
        final pill = tester.renderObject<RenderBox>(find.text(S.t('all')));
        expect(pill.size.height, greaterThanOrEqualTo(pill.getMaxIntrinsicHeight(pill.size.width)), reason: 'a pill at $scale');

        // The product cards lie further down the page.
        await tester.dragUntilVisible(find.text('Impeller Kincir Air WANGJIA'), find.byType(CustomScrollView), const Offset(0, -300));
        await settle(tester);
        expect(tester.takeException(), isNull, reason: 'the page at $scale');
        // A price shrinks to its line; it is not cut short with an ellipsis.
        final price = tester.renderObject<RenderParagraph>(find.textContaining('150.000', skipOffstage: false));
        expect(price.didExceedMaxLines, isFalse, reason: 'a price at $scale');

        await tester.pumpWidget(const SizedBox());
      }
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

  group('MedusaClient.renewSession', () {
    /// Signs in with a login that was issued [age] ago.
    Future<String> signedIn({required Duration age, Duration life = const Duration(days: 60)}) async {
      loginToken = _token('cus_1', age: age, life: life);
      await api.login(_email, _secret);
      return loginToken;
    }

    /// The login a request goes out with once the app has been started again.
    Future<String?> afterRestart() async {
      await api.init();
      await api.me();
      return calls.last.headers['Authorization'];
    }

    test('trades a login that is a day old for a fresh one, without a word', () async {
      final old = await signedIn(age: const Duration(hours: 25));
      final fresh = _token('cus_1', age: Duration.zero);
      renewal = _ok({'token': fresh});
      var changes = 0;
      api.onSessionChanged = () async => changes++;

      await api.renewSession();
      expect(calls.singleWhere((c) => c.url.path == _renew).headers['Authorization'], 'Bearer $old');
      // The app is not told: the customer is the same.
      expect(changes, 0);
      // The fresh login is the one in use, now and after the next start.
      await api.me();
      expect(calls.last.headers['Authorization'], 'Bearer $fresh');
      expect(await afterRestart(), 'Bearer $fresh');
    });

    test('waits until a login is a day old, or half way through a short one', () async {
      // Nothing to renew for a guest, nor for a login that does not say when it was issued.
      await api.renewSession();
      await api.login(_email, _secret);
      await api.renewSession();
      await signedIn(age: const Duration(hours: 23));
      await api.renewSession();
      await signedIn(age: const Duration(hours: 5), life: const Duration(hours: 12));
      await api.renewSession();
      expect(requests(_renew), 0);

      await signedIn(age: const Duration(hours: 7), life: const Duration(hours: 12));
      await api.renewSession();
      expect(requests(_renew), 1);
    });

    test('keeps the login when the renewal is refused, empty or lost', () async {
      final old = await signedIn(age: const Duration(days: 40));
      renewal = _refused(401);
      await api.renewSession();
      renewal = _ok({});
      await api.renewSession();
      offline = true;
      await api.renewSession();
      offline = false;

      expect(requests(_renew), 3);
      expect(api.isLoggedIn, isTrue);
      expect(await afterRestart(), 'Bearer $old');
    });

    test('does not take a login for someone else, or for nobody', () async {
      final old = await signedIn(age: const Duration(days: 40));
      renewal = _ok({'token': _token('cus_2', age: Duration.zero)});
      await api.renewSession();
      renewal = _ok({'token': _token('', age: Duration.zero)});
      await api.renewSession();
      renewal = _ok({'token': 'not a token'});
      await api.renewSession();

      expect(requests(_renew), 3);
      expect(await afterRestart(), 'Bearer $old');
    });

    test('is dropped when the customer signed out while it was on its way', () async {
      await signedIn(age: const Duration(days: 40));
      final held = renewalHeld = Completer<void>();
      final renewing = api.renewSession();
      await pumpEventQueue();
      await api.logout();
      held.complete();
      await renewing;

      expect(api.isLoggedIn, isFalse);
      await api.init();
      expect(api.isLoggedIn, isFalse);
    });

    test('is dropped when someone else signed in while it was on its way', () async {
      await signedIn(age: const Duration(days: 40));
      final held = renewalHeld = Completer<void>();
      final renewing = api.renewSession();
      await pumpEventQueue();
      loginToken = _token('cus_2');
      await api.login(_email, _secret);
      held.complete();
      await renewing;

      expect(api.customerId, 'cus_2');
      await api.init();
      expect(api.customerId, 'cus_2');
    });
  });
}
