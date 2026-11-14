import 'dart:convert';
import 'dart:math' show min;

import 'package:flutter/foundation.dart' show visibleForTesting;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../cart.dart';

import '../config.dart';
import '../models.dart';

class MedusaException implements Exception {
  final int status;
  final String message;
  MedusaException(this.status, this.message);
  @override
  String toString() => message;
}

/// The login exists but its customer profile was never created: a sign-up
/// that stopped half way. Sending the sign-up form again finishes it.
class SignupIncomplete implements Exception {}

/// HTTP client for the Medusa store API plus this project's custom routes.
class MedusaClient {
  MedusaClient._();
  static final MedusaClient instance = MedusaClient._();

  http.Client _http = http.Client();

  /// Lets tests answer requests without a network.
  @visibleForTesting
  set httpClient(http.Client client) => _http = client;

  // iOS Keychain / Android Keystore-backed storage for the session token.
  static const _secure = FlutterSecureStorage(
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock_this_device),
  );
  static const _tokenKey = 'medusa_token';
  String? _token;
  Region? _region;

  /// Called after the session changed: signed in, signed out, or the backend
  /// rejected the stored token (expired / revoked). Must not throw.
  Future<void> Function()? onSessionChanged;

  bool get isLoggedIn => _token != null;

  /// The customer behind the saved login, null for a guest. Read from the
  /// token, so it is known before the backend has answered.
  String? get customerId {
    final id = _token == null ? '' : _customerIdOf(_token!);
    return id.isEmpty ? null : id;
  }

  Future<void> init() async {
    try {
      _token = await _secure.read(key: _tokenKey);
      // Migrate a token saved by the first builds in plain preferences.
      if (_token == null) {
        final prefs = await SharedPreferences.getInstance();
        final legacy = prefs.getString(_tokenKey);
        if (legacy != null) {
          await _saveToken(legacy);
          await prefs.remove(_tokenKey);
        }
      }
    } catch (_) {
      _token = null;
    }
  }

  Future<void> _saveToken(String? token) async {
    final changed = token != _token;
    _token = token;
    try {
      if (token == null) {
        await _secure.delete(key: _tokenKey);
      } else {
        await _secure.write(key: _tokenKey, value: token);
      }
    } catch (_) {}
    if (changed) await onSessionChanged?.call();
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-publishable-api-key': AppConfig.publishableKey,
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Uri _uri(String path, [Map<String, String>? query]) =>
      Uri.parse('${AppConfig.backendUrl}$path').replace(queryParameters: query);

  Map<String, dynamic> _decode(http.Response res) {
    final body = res.body.isEmpty ? <String, dynamic>{} : jsonDecode(res.body);
    if (res.statusCode == 401 && _token != null && !res.request!.url.path.startsWith('/auth/')) {
      // Session is gone: drop the token; the app is told through onSessionChanged.
      _saveToken(null);
    }
    if (res.statusCode >= 400) {
      final msg = body is Map && body['message'] != null
          ? body['message'].toString()
          : 'HTTP ${res.statusCode}';
      throw MedusaException(res.statusCode, msg);
    }
    return body is Map<String, dynamic> ? body : <String, dynamic>{};
  }

  /// Rural networks stall more often than they fail: cap every call.
  static const _timeout = Duration(seconds: 25);

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? query}) async =>
      _decode(await _http.get(_uri(path, query), headers: _headers).timeout(_timeout));

  Future<Map<String, dynamic>> post(String path, [Object? body]) async => _decode(
        await _http.post(_uri(path), headers: _headers, body: jsonEncode(body ?? {})).timeout(_timeout),
      );

  // ---------- auth ----------

  /// What a session token says about itself; empty when it cannot be read.
  static Map<String, dynamic> _claims(String token) {
    try {
      final payload = jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(token.split('.')[1]))));
      return payload as Map<String, dynamic>;
    } catch (_) {
      return const {};
    }
  }

  /// Customer id inside a session token; empty while the login has no
  /// customer profile.
  static String _customerIdOf(String token) => (_claims(token)['actor_id'] ?? '').toString();

  Future<void> login(String email, String password) async {
    final res = await post('/auth/customer/emailpass', {'email': email, 'password': password});
    final token = res['token'] as String;
    if (_customerIdOf(token).isEmpty) throw SignupIncomplete();
    await _saveToken(token);
  }

  Future<void> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String phone,
    String? company,
    String? phoneVerificationToken,
  }) async {
    final credentials = {'email': email, 'password': password};
    String token;
    try {
      token = (await post('/auth/customer/emailpass/register', credentials))['token'] as String;
    } on MedusaException catch (e) {
      if (e.status != 401) rethrow;
      // The email already has a login. Same password and no customer profile
      // yet means an earlier sign-up stopped half way: finish it. A wrong
      // password or an existing profile leaves the 401 to the caller.
      token = (await post('/auth/customer/emailpass', credentials))['token'] as String;
      if (_customerIdOf(token).isNotEmpty) rethrow;
    }
    _token = token;
    try {
      final res = await _http
          .post(
            _uri('/store/customers'),
            headers: {
              ..._headers,
              if (phoneVerificationToken != null) 'x-phone-verification': phoneVerificationToken,
            },
            body: jsonEncode({
              'email': email,
              'first_name': firstName,
              'last_name': lastName,
              'phone': phone,
              if (company != null && company.isNotEmpty) 'company_name': company,
            }),
          )
          .timeout(_timeout);
      _decode(res);
      await login(email, password);
    } catch (_) {
      // Wherever it stopped, a login without a customer is not a session.
      _token = null;
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> me() async {
    if (_token == null) return null;
    try {
      final res = await get('/store/customers/me');
      return res['customer'] as Map<String, dynamic>?;
    } on MedusaException catch (e) {
      if (e.status == 401) await _saveToken(null);
      return null;
    }
  }

  /// Trades the saved login for a fresh one, so a customer who keeps coming
  /// back is never sent to the login page. Quiet either way: a refusal or a
  /// lost connection leaves the login as it is.
  Future<void> renewSession() async {
    final token = _token;
    if (token == null) return;
    final claims = _claims(token);
    final issued = claims['iat'], expires = claims['exp'];
    if (issued is! int || expires is! int) return;
    // Once a day is plenty; a login that lasts under two days waits for half its life.
    final age = DateTime.now().millisecondsSinceEpoch ~/ 1000 - issued;
    if (age < min(Duration.secondsPerDay, (expires - issued) ~/ 2)) return;
    try {
      final fresh = (await post('/auth/token/refresh'))['token'];
      // Only for the same customer, and only while the login that asked is still the one in use.
      if (fresh is! String || _token != token || _customerIdOf(fresh) != _customerIdOf(token)) return;
      _token = fresh;
      await _secure.write(key: _tokenKey, value: fresh);
    } catch (_) {}
  }

  Future<void> logout() => _saveToken(null);

  /// Sends the reset email (handled by the backend subscriber). The answer is
  /// the plain word "Created", the same for known and unknown addresses, so
  /// only the status is read.
  Future<void> requestPasswordReset(String email) async {
    final res = await _http
        .post(
          _uri('/auth/customer/emailpass/reset-password'),
          headers: _headers,
          body: jsonEncode({'identifier': email}),
        )
        .timeout(_timeout);
    if (res.statusCode >= 400) throw MedusaException(res.statusCode, 'HTTP ${res.statusCode}');
  }

  // ---------- phone verification (WhatsApp OTP) ----------

  Future<int> requestOtp(String phone) async {
    final res = await post('/store/otp/request', {'phone': phone});
    return (res['expires_in'] as num?)?.toInt() ?? 300;
  }

  Future<String> verifyOtp(String phone, String code) async {
    final res = await post('/store/otp/verify', {'phone': phone, 'code': code});
    return res['verification_token'] as String;
  }

  // ---------- push tokens ----------

  Future<void> registerPushToken(String token, String platform) =>
      post('/store/push-tokens', {'token': token, 'platform': platform});

  Future<void> deletePushToken(String token) async {
    final res = await _http.delete(_uri('/store/push-tokens/${Uri.encodeComponent(token)}'), headers: _headers);
    _decode(res);
  }

  // ---------- saved addresses ----------

  Future<List<Address>> addresses() async {
    final res = await get('/store/customers/me/addresses', query: {'limit': '50'});
    return (res['addresses'] as List).map((e) => Address.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> saveAddress(Address a) async {
    final body = {...a.toJson(), 'is_default_shipping': a.isDefaultShipping};
    if (a.id == null) {
      await post('/store/customers/me/addresses', body);
    } else {
      await post('/store/customers/me/addresses/${a.id}', body);
    }
  }

  Future<void> deleteAddress(String id) async {
    final res = await _http.delete(_uri('/store/customers/me/addresses/$id'), headers: _headers);
    _decode(res);
  }

  // ---------- catalog ----------

  Future<Region> region() async {
    if (_region != null) return _region!;
    final res = await get('/store/regions');
    final regions = (res['regions'] as List).cast<Map<String, dynamic>>();
    final idn = regions.firstWhere(
      (r) => ((r['countries'] as List?) ?? []).any((c) => c['iso_2'] == 'id'),
      orElse: () => regions.first,
    );
    return _region = Region.fromJson(idn);
  }

  /// True when the last catalogue came from the on-device cache (offline).
  bool productsFromCache = false;
  static const _productsCacheKey = 'cache_products_v1';

  static List<Product> _parseProducts(Map<String, dynamic> res) {
    final products = (res['products'] as List)
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
    // Main machines first (highest price), spare parts after.
    products.sort((a, b) => (b.minPrice ?? 0).compareTo(a.minPrice ?? 0));
    return products;
  }

  /// The catalogue kept by the last visit. Prices can differ per customer:
  /// null unless it was fetched for the current viewer.
  List<Product>? _keptProducts(SharedPreferences prefs) {
    try {
      final res = jsonDecode(prefs.getString(_productsCacheKey) ?? 'null');
      return res is Map<String, dynamic> && res['viewer'] == (customerId ?? '') ? _parseProducts(res) : null;
    } catch (_) {
      return null; // unreadable: as good as none
    }
  }

  /// The kept catalogue, to show while the fresh one is on its way.
  Future<List<Product>?> savedProducts() async {
    try {
      return _keptProducts(await SharedPreferences.getInstance());
    } catch (_) {
      return null;
    }
  }

  /// Pond owners often have patchy signal: the last catalogue is kept on the
  /// device and shown (with an offline banner) when the network fails.
  Future<List<Product>> products() async {
    final prefs = await SharedPreferences.getInstance();
    try {
      final r = await region();
      // The login this request goes out with decides whose prices come back.
      final viewer = customerId ?? '';
      final res = await get('/store/products', query: {
        'region_id': r.id,
        'fields': '*variants.calculated_price,+variants.inventory_quantity,*images,*categories,+metadata,+subtitle',
        'limit': '50',
      });
      final products = _parseProducts(res);
      productsFromCache = false;
      prefs.setString(_productsCacheKey, jsonEncode({...res, 'viewer': viewer})).catchError((_) => false);
      return products;
    } catch (e) {
      final kept = _keptProducts(prefs);
      if (kept == null) rethrow;
      productsFromCache = true;
      return kept;
    }
  }

  // ---------- regions (province / regency / district) ----------

  Future<List<Wilayah>> provinces() async {
    final res = await get('/store/wilayah');
    return (res['provinces'] as List).map((e) => Wilayah.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Wilayah>> regencies(String provinceCode) async {
    final res = await get('/store/wilayah/$provinceCode');
    return (res['regencies'] as List).map((e) => Wilayah.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Wilayah>> districts(String regencyCode) async {
    final res = await get('/store/wilayah/$regencyCode');
    return (res['districts'] as List).map((e) => Wilayah.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ---------- cart & checkout ----------

  Future<String> createCartWithItem(String variantId, int quantity) =>
      createCartWithLines([(variantId, quantity)]);

  /// Creates a Medusa cart holding every (variantId, quantity) pair, in one
  /// request: a line the shop cannot sell fails the cart as a whole.
  Future<String> createCartWithLines(List<(String, int)> lines) async {
    final r = await region();
    final cart = await post('/store/carts', {
      'region_id': r.id,
      'items': [
        for (final (variantId, qty) in lines) {'variant_id': variantId, 'quantity': qty},
      ],
    });
    return (cart['cart'] as Map)['id'] as String;
  }

  Future<String> createCartFromItems(List<CartItem> items) =>
      createCartWithLines(items.map((i) => (i.variantId, i.quantity)).toList());

  Future<void> setCartAddress(
    String cartId, {
    required String email,
    required Map<String, dynamic> address,
  }) async {
    await post('/store/carts/$cartId', {
      'email': email,
      'shipping_address': address,
      'billing_address': address,
    });
  }

  Future<List<ShippingOption>> shippingOptions(String cartId) async {
    final res = await get('/store/shipping-options', query: {'cart_id': cartId});
    return (res['shipping_options'] as List)
        .map((e) => ShippingOption.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> addShippingMethod(String cartId, String optionId) =>
      post('/store/carts/$cartId/shipping-methods', {'option_id': optionId});

  Future<Order> completeCart(String cartId) async {
    final pc = await post('/store/payment-collections', {'cart_id': cartId});
    final pcId = (pc['payment_collection'] as Map)['id'] as String;
    await post('/store/payment-collections/$pcId/payment-sessions', {'provider_id': 'pp_system_default'});
    final res = await post('/store/carts/$cartId/complete');
    if (res['type'] != 'order') {
      final err = res['error'];
      throw MedusaException(400, err is Map ? '${err['message']}' : 'Checkout failed');
    }
    return Order.fromJson(res['order'] as Map<String, dynamic>);
  }

  Future<void> requestQuote(String cartId) => post('/store/quotes', {'cart_id': cartId});

  // ---- Patungan (group buy) ----
  static const _groupBuysCacheKey = 'cache_group_buys_v1';

  static List<GroupBuy> _parseGroupBuys(Map<String, dynamic> res) => ((res['group_buys'] as List?) ?? [])
      .map((e) => GroupBuy.fromJson(e as Map<String, dynamic>))
      .toList();

  /// The open patungan, the same for every visitor. The answer is kept on the
  /// device: without signal the kept ones stand in.
  Future<List<GroupBuy>> groupBuys() async {
    try {
      final res = await get('/store/group-buys');
      final list = _parseGroupBuys(res);
      SharedPreferences.getInstance()
          .then((prefs) => prefs.setString(_groupBuysCacheKey, jsonEncode(res)))
          .catchError((_) => false);
      return list;
    } catch (_) {
      return savedGroupBuys();
    }
  }

  /// The patungan kept by the last visit that are still running, to show while
  /// the fresh list is on its way.
  Future<List<GroupBuy>> savedGroupBuys() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final res = jsonDecode(prefs.getString(_groupBuysCacheKey) ?? 'null');
      if (res is! Map<String, dynamic>) return [];
      final kept = _parseGroupBuys(res);
      final now = DateTime.now();
      return kept.where((g) => g.endsAt.isAfter(now)).toList();
    } catch (_) {
      return []; // unreadable: as good as none
    }
  }

  /// Creates a cart with [quantity] units at the group price; returns the cart
  /// id so the normal checkout can finish it.
  Future<String> joinGroupBuy(String id, int quantity) async {
    final r = await region();
    final res = await post('/store/group-buys/$id/join', {'quantity': quantity, 'region_id': r.id});
    return res['cart_id'] as String;
  }

  // ---------- quotes ----------

  Future<List<Quote>> quotes() async {
    final res = await get('/store/quotes', query: {'limit': '50', 'order': '-created_at'});
    return (res['quotes'] as List)
        .map((e) => Quote.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Quote with the merchant's latest (possibly unconfirmed) prices applied.
  Future<Quote> quote(String id) async {
    final res = await get('/store/quotes/$id/preview');
    final q = res['quote'] as Map<String, dynamic>;
    final preview = q['order_preview'] as Map<String, dynamic>?;
    return Quote.fromJson(q, preview: preview);
  }

  Future<void> acceptQuote(String id) => post('/store/quotes/$id/accept', {});
  Future<void> rejectQuote(String id) => post('/store/quotes/$id/reject', {});
  Future<void> sendQuoteMessage(String id, String text) =>
      post('/store/quotes/$id/messages', {'text': text});

  // ---------- orders ----------

  static const _orderFields =
      'id,display_id,status,fulfillment_status,payment_status,currency_code,total,created_at,*items';

  Future<List<Order>> orders() async {
    final res = await get('/store/orders', query: {
      'fields': _orderFields,
      'order': '-created_at',
      'limit': '50',
    });
    return (res['orders'] as List)
        .map((e) => Order.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Order detail plus shipments (the store order endpoint hides tracking
  /// labels, so they come from this project's /shipments route).
  Future<Order> order(String id) async {
    final results = await Future.wait([
      get('/store/orders/$id', query: {'fields': _orderFields}),
      get('/store/orders/$id/shipments'),
    ]);
    final json = Map<String, dynamic>.from(results[0]['order'] as Map);
    json['fulfillments'] = results[1]['shipments'] ?? [];
    return Order.fromJson(json);
  }

  Future<String> invoiceLink(String orderId) async {
    final res = await get('/store/orders/$orderId/invoice-link');
    return reachableUrl(res['url'] as String)!;
  }

  // ---------- payment plan (custom routes) ----------

  Future<PaymentPlan?> paymentPlan(String orderId) async {
    final res = await get('/store/orders/$orderId/payment-plan');
    final p = res['payment_plan'];
    return p == null ? null : PaymentPlan.fromJson(p as Map<String, dynamic>);
  }

  Future<String> midtransRedirectUrl(String installmentId) async {
    final res = await post('/store/payment-installments/$installmentId/midtrans', {
      'finish_url': AppConfig.midtransFinishUrl,
    });
    return res['redirect_url'] as String;
  }

  Future<PaymentPlan?> uploadProof(
    String installmentId, {
    required List<int> bytes,
    required String filename,
    required String mimeType,
    String? bankName,
    String? senderName,
    num? amount,
    String? transferredAt,
    String? note,
  }) async {
    final res = await post('/store/payment-installments/$installmentId/proofs', {
      'file': {'name': filename, 'mime_type': mimeType, 'content': base64Encode(bytes)},
      'bank_name': bankName,
      'sender_name': senderName,
      'amount': amount,
      'transferred_at': transferredAt,
      'note': note,
    });
    final p = res['payment_plan'];
    return p == null ? null : PaymentPlan.fromJson(p as Map<String, dynamic>);
  }

  // ---------- warranty / anti-counterfeit ----------

  /// Public check of a scanned QR (URL or bare code). Works before login too.
  Future<WarrantyCheck> verifyWarranty(String raw) async {
    final res = await get('/store/warranty/verify/${Uri.encodeComponent(raw.trim())}');
    return WarrantyCheck.fromJson(res);
  }

  Future<WarrantyUnit> registerWarranty(String code, {String? farmLocation}) async {
    final res = await post('/store/warranty/register', {
      'code': code,
      if (farmLocation != null && farmLocation.isNotEmpty) 'farm_location': farmLocation,
    });
    return WarrantyUnit.fromJson(res['unit'] as Map<String, dynamic>);
  }

  Future<List<WarrantyUnit>> myWarrantyUnits() async {
    final res = await get('/store/warranty/units');
    return (res['units'] as List).map((e) => WarrantyUnit.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Carrier tracking for every shipment of an order (Biteship when enabled).
  Future<List<TrackingInfo>> tracking(String orderId) async {
    final res = await get('/store/orders/$orderId/tracking');
    return [
      for (final s in (res['shipments'] as List? ?? []))
        for (final l in ((s as Map<String, dynamic>)['labels'] as List? ?? []))
          TrackingInfo.fromJson(l as Map<String, dynamic>),
    ];
  }

  /// Machines shipped in an order (linked by the warehouse at packing time).
  Future<List<WarrantyUnit>> orderWarrantyUnits(String orderId) async {
    final res = await get('/store/orders/$orderId/warranty-units');
    return (res['units'] as List).map((e) => WarrantyUnit.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// One-tap registration of a unit that sits in one of my orders.
  Future<WarrantyUnit> registerWarrantyUnit(String unitId) async {
    final res = await post('/store/warranty/register', {'unit_id': unitId});
    return WarrantyUnit.fromJson(res['unit'] as Map<String, dynamic>);
  }

  /// Deletes the account (anonymises the customer, revokes the login).
  Future<void> deleteAccount() async {
    final res = await _http.delete(_uri('/store/account'), headers: _headers);
    _decode(res);
    await _saveToken(null);
  }
}
