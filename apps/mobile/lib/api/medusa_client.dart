import 'dart:convert';

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

/// HTTP client for the Medusa store API plus this project's custom routes.
class MedusaClient {
  MedusaClient._();
  static final MedusaClient instance = MedusaClient._();

  final _http = http.Client();
  // iOS Keychain / Android Keystore-backed storage for the session token.
  static const _secure = FlutterSecureStorage(
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock_this_device),
  );
  static const _tokenKey = 'medusa_token';
  String? _token;
  Region? _region;

  /// Called when the backend rejects the stored token (expired / revoked).
  void Function()? onUnauthorized;

  bool get isLoggedIn => _token != null;

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
    _token = token;
    try {
      if (token == null) {
        await _secure.delete(key: _tokenKey);
      } else {
        await _secure.write(key: _tokenKey, value: token);
      }
    } catch (_) {}
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
      // Session is gone: drop the token and send the app back to login.
      _saveToken(null);
      onUnauthorized?.call();
    }
    if (res.statusCode >= 400) {
      final msg = body is Map && body['message'] != null
          ? body['message'].toString()
          : 'HTTP ${res.statusCode}';
      throw MedusaException(res.statusCode, msg);
    }
    return body is Map<String, dynamic> ? body : <String, dynamic>{};
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? query}) async =>
      _decode(await _http.get(_uri(path, query), headers: _headers));

  Future<Map<String, dynamic>> post(String path, [Object? body]) async => _decode(
        await _http.post(_uri(path), headers: _headers, body: jsonEncode(body ?? {})),
      );

  // ---------- auth ----------

  Future<void> login(String email, String password) async {
    final res = await post('/auth/customer/emailpass', {'email': email, 'password': password});
    await _saveToken(res['token'] as String);
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
    final reg = await post('/auth/customer/emailpass/register', {'email': email, 'password': password});
    _token = reg['token'] as String;
    final res = await _http.post(
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
    );
    try {
      _decode(res);
    } catch (e) {
      _token = null;
      rethrow;
    }
    await login(email, password);
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

  Future<void> logout() => _saveToken(null);

  /// Sends the reset email (handled by the backend subscriber).
  Future<void> requestPasswordReset(String email) =>
      post('/auth/customer/emailpass/reset-password', {'identifier': email});

  // ---------- phone verification (WhatsApp OTP) ----------

  Future<int> requestOtp(String phone) async {
    final res = await post('/store/otp/request', {'phone': phone});
    return (res['expires_in'] as num?)?.toInt() ?? 300;
  }

  Future<String> verifyOtp(String phone, String code) async {
    final res = await post('/store/otp/verify', {'phone': phone, 'code': code});
    return res['verification_token'] as String;
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

  Future<List<Product>> products() async {
    final r = await region();
    final res = await get('/store/products', query: {
      'region_id': r.id,
      'fields': '*variants.calculated_price,+variants.inventory_quantity,*images,*categories,+metadata,+subtitle',
      'limit': '50',
    });
    final products = (res['products'] as List)
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
    // Main machines first (highest price), spare parts after.
    products.sort((a, b) => (b.minPrice ?? 0).compareTo(a.minPrice ?? 0));
    return products;
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

  Future<List<Category>> categories() async {
    final res = await get('/store/product-categories', query: {'limit': '50', 'fields': 'id,name,rank'});
    return (res['product_categories'] as List)
        .map((e) => Category.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ---------- cart & checkout ----------

  Future<String> createCartWithItem(String variantId, int quantity) =>
      createCartWithLines([(variantId, quantity)]);

  /// Creates a Medusa cart holding every (variantId, quantity) pair.
  Future<String> createCartWithLines(List<(String, int)> lines) async {
    final r = await region();
    final cart = await post('/store/carts', {'region_id': r.id});
    final cartId = (cart['cart'] as Map)['id'] as String;
    for (final (variantId, qty) in lines) {
      await post('/store/carts/$cartId/line-items', {'variant_id': variantId, 'quantity': qty});
    }
    return cartId;
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
}
