import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wangjia_app/api/medusa_client.dart';
import 'package:wangjia_app/cart.dart';
import 'package:wangjia_app/l10n/strings.dart';
import 'package:wangjia_app/screens/checkout_screen.dart';
import 'package:wangjia_app/screens/order_detail_screen.dart';

const _cart = '/store/carts/cart_1';
const _order = '/store/orders/order_1';

// Nothing checks these: the backend below is a stand-in.
const _email = 'budi@tambak.id';
const _secret = 'not-checked';
const _budi = {
  'id': 'cus_1',
  'first_name': 'Budi',
  'last_name': 'Santoso',
  'email': _email,
  'phone': '+62 812-3456-7890',
};
const _home = {
  'id': 'addr_1',
  'first_name': 'Budi',
  'last_name': 'Santoso',
  'phone': '+62 812-3456-7890',
  'address_1': 'Jl. Tambak 1',
  'address_2': 'Muncar',
  'city': 'Banyuwangi',
  'province': 'Jawa Timur',
  'postal_code': '68472',
  'is_default_shipping': true,
  'metadata': {'province_code': '35', 'regency_code': '35.10', 'district_code': '35.10.14'},
};
const _placed = {
  'id': 'order_1',
  'display_id': 7,
  'status': 'pending',
  'fulfillment_status': 'not_fulfilled',
  'currency_code': 'idr',
  'total': 4500000,
  'created_at': '2026-11-10T05:00:00.000Z',
  'items': [
    {'title': 'Kincir Air 1 HP', 'variant_title': '1 HP', 'quantity': 1, 'unit_price': 4500000}
  ],
};
const _plan = {
  'id': 'plan_1',
  'currency_code': 'idr',
  'total_amount': 4500000,
  'status': 'active',
  'installments': [
    {'id': 'inst_1', 'sequence': 1, 'label': 'Pelunasan', 'amount': 4500000, 'status': 'unpaid'}
  ],
};

String _token(String customerId) =>
    'h.${base64Url.encode(utf8.encode(jsonEncode({'actor_id': customerId}))).replaceAll('=', '')}.s';

http.Response _ok(Map<String, dynamic> body) => http.Response(jsonEncode(body), 200);

void main() {
  // Made before the test binding: afterwards a real HTTP client can only be
  // created inside a running test.
  final api = MedusaClient.instance;
  TestWidgetsFlutterBinding.ensureInitialized();
  FlutterSecureStorage.setMockInitialValues({});
  late List<http.Request> calls;
  // While set, the lists of provinces, regencies and districts do not load.
  late bool regionsDown;
  // How the shop says an instalment can be paid. Null: a backend that does not say.
  Map<String, dynamic>? methods;
  // False for an order whose payment plan the staff have not made yet.
  late bool planned;

  int requests(String path) => calls.where((c) => c.url.path == path).length;

  /// The street lines put on the server's cart, in the order they were sent.
  List<String> sentAddresses() => [
        for (final c in calls)
          if (c.url.path == _cart) (jsonDecode(c.body)['shipping_address'] as Map)['address_1'] as String,
      ];

  setUpAll(() => initializeDateFormatting('id_ID'));

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    api.onSessionChanged = null;
    await api.logout();
    CartStore.instance.clear();
    regionsDown = false;
    methods = null;
    planned = true;
    calls = [];
    // A shop with one customer, one saved address and one delivery option.
    http.Response answer(String path) {
      switch (path) {
        case '/auth/customer/emailpass':
          return _ok({'token': _token('cus_1')});
        case '/store/customers/me':
          return _ok({'customer': _budi});
        case '/store/customers/me/addresses':
          return _ok({
            'addresses': [_home]
          });
        case '/store/wilayah':
          return _ok({
            'provinces': [
              {'code': '35', 'name': 'Jawa Timur'}
            ]
          });
        case '/store/wilayah/35':
          return _ok({
            'regencies': [
              {'code': '35.10', 'name': 'Banyuwangi'}
            ]
          });
        case '/store/wilayah/35.10':
          return _ok({
            'districts': [
              {'code': '35.10.14', 'name': 'Muncar'}
            ]
          });
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
        case '/store/carts':
          return _ok({
            'cart': {'id': 'cart_1'}
          });
        case '/store/shipping-options':
          return _ok({
            'shipping_options': [
              {'id': 'so_1', 'name': 'Ekspedisi / Kargo', 'amount': 0}
            ]
          });
        case '/store/payment-collections':
          return _ok({
            'payment_collection': {'id': 'paycol_1'}
          });
        case '$_cart/complete':
          return _ok({'type': 'order', 'order': _placed});
        case _order:
          return _ok({'order': _placed});
        case '$_order/shipments':
          return _ok({'shipments': []});
        case '$_order/payment-plan':
          return _ok({
            'payment_plan': planned ? {..._plan, if (methods != null) 'payment_methods': methods} : null
          });
        case '$_order/warranty-units':
          return _ok({'units': []});
        case _cart:
        case '$_cart/line-items':
        case '$_cart/shipping-methods':
        case '/store/payment-collections/paycol_1/payment-sessions':
          return _ok({});
        default:
          return http.Response(jsonEncode({'message': 'Not found'}), 404);
      }
    }

    api.httpClient = MockClient((req) async {
      calls.add(req);
      if (regionsDown && req.url.path.startsWith('/store/wilayah')) throw http.ClientException('No route to host');
      final res = answer(req.url.path);
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

  /// Shows a page to a signed-in customer on a phone-sized screen.
  Future<void> open(WidgetTester tester, Widget page) async {
    tester.view.physicalSize = const Size(1080, 2340);
    tester.view.devicePixelRatio = 3.0;
    addTearDown(tester.view.reset);
    await tester.runAsync(() => api.login(_email, _secret));
    await tester.pumpWidget(MaterialApp(home: page));
    await settle(tester);
  }

  /// The checkout with one machine in the cart: a form longer than the screen.
  Future<void> openCheckout(WidgetTester tester) => open(
        tester,
        CheckoutScreen(items: [
          CartItem(
            variantId: 'variant_1',
            productId: 'prod_1',
            productTitle: 'Kincir Air 1 HP',
            variantTitle: '1 HP',
            price: 4500000,
            currency: 'idr',
          ),
        ]),
      );

  Future<void> openOrder(WidgetTester tester) => open(tester, const OrderDetailScreen(orderId: 'order_1'));

  Finder field(String label) => find.widgetWithText(TextFormField, S.t(label));

  /// Types into a field of the form. The page scrolls to the cursor while that
  /// happens, and takes no taps until it has stopped.
  Future<void> type(WidgetTester tester, String label, String text) async {
    await tester.enterText(field(label), text);
    await settle(tester);
  }

  /// Scrolls to the button with this label and presses it.
  Future<void> press(WidgetTester tester, String label) async {
    final button = find.text(S.t(label));
    await tester.ensureVisible(button);
    await tester.pump();
    await tester.tap(button);
    await settle(tester);
  }

  group('at checkout', () {
    testWidgets('an address corrected after the delivery options loaded is the one the order gets', (tester) async {
      await openCheckout(tester);
      await press(tester, 'shipping_method');
      expect(sentAddresses(), ['Jl. Tambak 1']);

      await type(tester, 'address', 'Jl. Tambak 99');
      await press(tester, 'place_order');
      expect(sentAddresses(), ['Jl. Tambak 1', 'Jl. Tambak 99']);
      // It is on the cart before the order is made from that cart.
      final paths = calls.map((c) => c.url.path).toList();
      expect(paths.lastIndexOf(_cart), lessThan(paths.indexOf('$_cart/shipping-methods')));
      expect(paths.indexOf('$_cart/shipping-methods'), lessThan(paths.indexOf('$_cart/complete')));
      expect(find.byType(OrderDetailScreen), findsOneWidget);
    });

    testWidgets('an address left as it was is sent once', (tester) async {
      await openCheckout(tester);
      await press(tester, 'shipping_method');
      await press(tester, 'place_order');
      expect(sentAddresses(), ['Jl. Tambak 1']);
      expect(find.byType(OrderDetailScreen), findsOneWidget);
    });

    testWidgets('a field left empty is named and shown, and nothing is sent', (tester) async {
      await openCheckout(tester);
      await type(tester, 'first_name', '');
      await type(tester, 'phone', '0812');
      await press(tester, 'shipping_method');

      expect(requests('/store/carts'), 0);
      expect(find.text(S.t('err_required')), findsOneWidget);
      expect(find.text(S.t('err_phone_invalid')), findsOneWidget);
      // The button is at the end of the form, the name at its start: the page
      // goes back up to it.
      final name = tester.getRect(field('first_name'));
      expect(name.top, greaterThanOrEqualTo(0));
      expect(name.bottom, lessThanOrEqualTo(780));
    });

    testWidgets('an address emptied after the delivery options loaded stops the order', (tester) async {
      await openCheckout(tester);
      await press(tester, 'shipping_method');
      await type(tester, 'address', ' ');
      await press(tester, 'place_order');

      expect(find.text(S.t('err_required')), findsOneWidget);
      expect(sentAddresses(), ['Jl. Tambak 1']);
      expect(requests('$_cart/shipping-methods'), 0);
      expect(find.byType(OrderDetailScreen), findsNothing);
    });

    testWidgets('a region list that did not load says why and can be asked for again', (tester) async {
      regionsDown = true;
      await openCheckout(tester);
      expect(find.text(S.t('err_offline')), findsOneWidget);
      expect(find.text('Jawa Timur'), findsNothing);

      regionsDown = false;
      await press(tester, 'retry');
      expect(find.text(S.t('err_offline')), findsNothing);
      // The saved address's province, regency and district are picked again.
      expect(find.text('Jawa Timur'), findsOneWidget);
      expect(find.text('Banyuwangi'), findsOneWidget);
      expect(find.text('Muncar'), findsOneWidget);
    });
  });

  group('paying an order', () {
    const account = 'BCA 8850123456 a.n. PT Contoh Tambak';

    testWidgets('a shop without online payment offers the bank transfer, with the account to copy', (tester) async {
      methods = {'bank_transfer': account, 'online': false};
      String? copied;
      final platform = tester.binding.defaultBinaryMessenger;
      platform.setMockMethodCallHandler(SystemChannels.platform, (call) async {
        if (call.method == 'Clipboard.setData') copied = (call.arguments as Map)['text'] as String;
        return null;
      });
      addTearDown(() => platform.setMockMethodCallHandler(SystemChannels.platform, null));

      await openOrder(tester);
      expect(find.text(account), findsOneWidget);
      expect(find.text(S.t('pay_midtrans')), findsNothing);
      expect(find.text(S.t('upload_proof')), findsOneWidget);

      await press(tester, 'copy_account');
      expect(copied, '8850123456');
      expect(find.text(S.t('account_copied')), findsOneWidget);
    });

    testWidgets('a shop with online payment and no account set offers both ways and names no account', (tester) async {
      methods = {'bank_transfer': null, 'online': true};
      await openOrder(tester);
      expect(find.text(S.t('pay_midtrans')), findsOneWidget);
      expect(find.text(S.t('upload_proof')), findsOneWidget);
      expect(find.text(S.t('transfer_to')), findsNothing);
    });

    testWidgets('an order still waiting for its payment plan offers a chat with sales', (tester) async {
      planned = false;
      await openOrder(tester);
      // The page asks for the plan once more before it says there is none yet.
      await tester.pump(const Duration(seconds: 1));
      await settle(tester);
      expect(find.text(S.t('no_payment_plan')), findsOneWidget);
      expect(find.text(S.t('chat_whatsapp')), findsOneWidget);
    });

    testWidgets('the receipt can come from the camera or the gallery', (tester) async {
      await openOrder(tester);
      await press(tester, 'upload_proof');
      expect(find.text(S.t('take_photo')), findsOneWidget);
      expect(find.text(S.t('from_gallery')), findsOneWidget);
    });
  });
}
