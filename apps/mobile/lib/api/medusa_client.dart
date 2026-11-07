import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

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
  String? _token;
  Region? _region;

  bool get isLoggedIn => _token != null;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('medusa_token');
  }

  Future<void> _saveToken(String? token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token == null) {
      await prefs.remove('medusa_token');
    } else {
      await prefs.setString('medusa_token', token);
    }
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
  }) async {
    final reg = await post('/auth/customer/emailpass/register', {'email': email, 'password': password});
    _token = reg['token'] as String;
    await post('/store/customers', {
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'phone': phone,
      if (company != null && company.isNotEmpty) 'company_name': company,
    });
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
      'fields': '*variants.calculated_price,+variants.inventory_quantity,*images',
      'limit': '50',
    });
    return (res['products'] as List)
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
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

  Future<String> createCartWithItem(String variantId, int quantity) async {
    final r = await region();
    final cart = await post('/store/carts', {'region_id': r.id});
    final cartId = (cart['cart'] as Map)['id'] as String;
    await post('/store/carts/$cartId/line-items', {'variant_id': variantId, 'quantity': quantity});
    return cartId;
  }

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
