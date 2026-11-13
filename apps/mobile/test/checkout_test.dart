import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:image_picker_platform_interface/image_picker_platform_interface.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wangjia_app/api/medusa_client.dart';
import 'package:wangjia_app/cart.dart';
import 'package:wangjia_app/l10n/strings.dart';
import 'package:wangjia_app/screens/checkout_screen.dart';
import 'package:wangjia_app/screens/order_detail_screen.dart';
import 'package:wangjia_app/screens/upload_proof_sheet.dart';

const _cart = '/store/carts/cart_1';
const _order = '/store/orders/order_1';
const _proofs = '/store/payment-installments/inst_1/proofs';
const _addresses = '/store/customers/me/addresses';

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
const _paid = {
  'id': 'plan_1',
  'currency_code': 'idr',
  'total_amount': 4500000,
  'status': 'completed',
  'installments': [
    {'id': 'inst_1', 'sequence': 1, 'label': 'Pelunasan', 'amount': 4500000, 'status': 'paid'}
  ],
};
// What the shop answers to a receipt for an instalment that is settled.
const _settled = 'Tagihan ini sudah lunas atau dibatalkan. Bukti transfer tidak perlu dikirim lagi.';

String _token(String customerId) =>
    'h.${base64Url.encode(utf8.encode(jsonEncode({'actor_id': customerId}))).replaceAll('=', '')}.s';

http.Response _ok(Map<String, dynamic> body) => http.Response(jsonEncode(body), 200);

/// Stands in for the phone's camera and gallery.
class _Phone extends ImagePickerPlatform {
  /// Where each photo was asked from, in order.
  final asked = <ImageSource>[];

  /// A phone without a camera, or one where the permission was refused.
  bool refuses = false;

  @override
  Future<XFile?> getImageFromSource({
    required ImageSource source,
    ImagePickerOptions options = const ImagePickerOptions(),
  }) async {
    asked.add(source);
    if (refuses) throw PlatformException(code: 'camera_access_denied');
    return XFile.fromData(Uint8List.fromList([1, 2, 3]), path: '/photos/bukti.jpg');
  }
}

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
  // The order's payment plan. Null while the staff have not made one yet.
  Map<String, dynamic>? plan;
  // The addresses the customer has saved.
  late List<Map<String, dynamic>> saved;
  // While set, the shop takes no receipt: the instalment is settled already.
  late bool proofRefused;
  // While set, the request that saves an address is left unanswered.
  Completer<void>? saveHeld;
  // While set, the shop does not save an address.
  late bool saveRefused;

  int requests(String path) => calls.where((c) => c.url.path == path).length;

  /// How many times the app asked the shop to keep an address.
  int saves() => calls.where((c) => c.method == 'POST' && c.url.path == _addresses).length;

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
    plan = _plan;
    saved = [_home];
    proofRefused = false;
    saveHeld = null;
    saveRefused = false;
    calls = [];
    // A shop with one customer, one saved address and one delivery option.
    http.Response answer(String path) {
      switch (path) {
        case '/auth/customer/emailpass':
          return _ok({'token': _token('cus_1')});
        case '/store/customers/me':
          return _ok({'customer': _budi});
        case _addresses:
          return _ok({'addresses': saved});
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
            'payment_plan': plan == null ? null : {...?plan, if (methods != null) 'payment_methods': methods}
          });
        case _proofs:
          return proofRefused ? http.Response(jsonEncode({'message': _settled}), 400) : _ok({'payment_plan': plan});
        case '$_order/warranty-units':
          return _ok({'units': []});
        case _cart:
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
      var res = answer(req.url.path);
      if (req.method == 'POST' && req.url.path == _addresses) {
        await saveHeld?.future;
        if (saveRefused) res = http.Response(jsonEncode({'message': 'Tidak tersimpan'}), 500);
      }
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

  CartItem machine(int hp, {int quantity = 1}) => CartItem(
        variantId: 'variant_$hp',
        productId: 'prod_$hp',
        productTitle: 'Kincir Air $hp HP',
        variantTitle: '$hp HP',
        price: 4500000 * hp,
        currency: 'idr',
        quantity: quantity,
      );

  /// The checkout, with one machine in the cart unless told otherwise: a form
  /// longer than the screen.
  Future<void> openCheckout(WidgetTester tester, {List<CartItem>? items}) =>
      open(tester, CheckoutScreen(items: items ?? [machine(1)]));

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
      // It is one of the saved ones: it is not saved a second time.
      expect(saves(), 0);
    });

    testWidgets('the cart is made in one request, with every machine and how many', (tester) async {
      await openCheckout(tester, items: [machine(1), machine(2, quantity: 3)]);
      await press(tester, 'shipping_method');

      final made = calls.where((c) => c.url.path == '/store/carts').toList();
      expect(made, hasLength(1));
      expect(jsonDecode(made.single.body), {
        'region_id': 'reg_1',
        'items': [
          {'variant_id': 'variant_1', 'quantity': 1},
          {'variant_id': 'variant_2', 'quantity': 3},
        ],
      });
      expect(calls.where((c) => c.url.path.endsWith('/line-items')), isEmpty);
    });

    testWidgets('the order page opens without waiting for the address to be saved', (tester) async {
      saveHeld = Completer<void>();
      await openCheckout(tester);
      await press(tester, 'save_this_address');
      await press(tester, 'shipping_method');
      await press(tester, 'place_order');

      // The address is on its way, and the customer is on the order already.
      expect(saves(), 1);
      expect(find.byType(OrderDetailScreen), findsOneWidget);
      saveHeld!.complete();
      await settle(tester);
    });

    testWidgets('an address the shop did not save does not disturb the order', (tester) async {
      saveRefused = true;
      await openCheckout(tester);
      await press(tester, 'save_this_address');
      await press(tester, 'shipping_method');
      await press(tester, 'place_order');

      expect(saves(), 1);
      expect(find.byType(OrderDetailScreen), findsOneWidget);
    });

    testWidgets('a field left empty is named and shown, and nothing is sent', (tester) async {
      await openCheckout(tester);
      await type(tester, 'first_name', '');
      await type(tester, 'phone', '0812');
      await type(tester, 'email', 'budi@tambak');
      await press(tester, 'shipping_method');

      expect(requests('/store/carts'), 0);
      expect(find.text(S.t('err_required')), findsOneWidget);
      expect(find.text(S.t('err_phone_invalid')), findsOneWidget);
      expect(find.text(S.t('err_email_invalid')), findsOneWidget);
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

    testWidgets('a first order names the street and each region that was not picked', (tester) async {
      saved = [];
      await openCheckout(tester);
      await press(tester, 'shipping_method');

      // The street, the province, the regency and the district.
      expect(find.text(S.t('err_required')), findsNWidgets(4));
      expect(requests('/store/carts'), 0);
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
      plan = null;
      await openOrder(tester);
      // The page asks for the plan once more before it says there is none yet.
      await tester.pump(const Duration(seconds: 1));
      await settle(tester);
      expect(find.text(S.t('no_payment_plan')), findsOneWidget);
      expect(find.text(S.t('chat_whatsapp')), findsOneWidget);
    });

    testWidgets('an order paid in full no longer shows where to transfer', (tester) async {
      plan = _paid;
      methods = {'bank_transfer': account, 'online': false};
      await openOrder(tester);
      expect(find.text('1. Pelunasan'), findsOneWidget);
      expect(find.text(account), findsNothing);
      expect(find.text(S.t('upload_proof')), findsNothing);
    });

    final sheet = find.byType(UploadProofSheet);
    Finder inSheet(Finder what) => find.descendant(of: sheet, matching: what);

    /// Puts a stand-in in place of the phone's camera and gallery.
    _Phone usePhone() {
      final real = ImagePickerPlatform.instance;
      addTearDown(() => ImagePickerPlatform.instance = real);
      final phone = _Phone();
      ImagePickerPlatform.instance = phone;
      return phone;
    }

    testWidgets('the receipt is photographed or picked, shown, and sent with the amount', (tester) async {
      final phone = usePhone();
      await openOrder(tester);
      await press(tester, 'upload_proof');
      // Nothing to send before there is a photo.
      expect(tester.widget<FilledButton>(inSheet(find.byType(FilledButton))).onPressed, isNull);

      await press(tester, 'take_photo');
      await press(tester, 'from_gallery');
      expect(phone.asked, [ImageSource.camera, ImageSource.gallery]);
      expect(inSheet(find.byType(Image)), findsOneWidget);

      await press(tester, 'submit');
      final sent = jsonDecode(calls.lastWhere((c) => c.url.path == _proofs).body) as Map;
      expect(sent['file'], {'name': 'bukti.jpg', 'mime_type': 'image/jpeg', 'content': base64Encode([1, 2, 3])});
      expect(sent['amount'], 4500000);
      expect(sheet, findsNothing);
      expect(find.text(S.t('proof_sent')), findsOneWidget);
    });

    testWidgets('a camera that will not open says so in the sheet', (tester) async {
      usePhone().refuses = true;
      await openOrder(tester);
      await press(tester, 'upload_proof');
      await press(tester, 'take_photo');
      expect(inSheet(find.text(S.t('err_photo'))), findsOneWidget);
      expect(inSheet(find.byType(Image)), findsNothing);
    });

    testWidgets('a receipt the shop does not take says why in the sheet, which stays open', (tester) async {
      usePhone();
      proofRefused = true;
      await openOrder(tester);
      await press(tester, 'upload_proof');
      await press(tester, 'from_gallery');
      await press(tester, 'submit');
      expect(inSheet(find.text(_settled)), findsOneWidget);
    });
  });
}
