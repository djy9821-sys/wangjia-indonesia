import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'models.dart';

/// One line in the local cart. Only variant ids go to the backend; the rest
/// is cached for display while offline.
class CartItem {
  final String variantId;
  final String productId;
  final String productTitle;
  final String variantTitle;
  final num? price;
  final String currency;
  final String? thumbnail;
  int quantity;

  CartItem({
    required this.variantId,
    required this.productId,
    required this.productTitle,
    required this.variantTitle,
    required this.price,
    required this.currency,
    this.thumbnail,
    this.quantity = 1,
  });

  num get lineTotal => (price ?? 0) * quantity;

  Map<String, dynamic> toJson() => {
        'variantId': variantId,
        'productId': productId,
        'productTitle': productTitle,
        'variantTitle': variantTitle,
        'price': price,
        'currency': currency,
        'thumbnail': thumbnail,
        'quantity': quantity,
      };

  factory CartItem.fromJson(Map<String, dynamic> j) => CartItem(
        variantId: j['variantId'] as String,
        productId: j['productId'] as String,
        productTitle: j['productTitle'] as String,
        variantTitle: j['variantTitle'] as String,
        price: j['price'] as num?,
        currency: (j['currency'] ?? 'idr') as String,
        thumbnail: j['thumbnail'] as String?,
        quantity: (j['quantity'] as num).toInt(),
      );

  factory CartItem.fromProduct(Product p, Variant v, int qty) => CartItem(
        variantId: v.id,
        productId: p.id,
        productTitle: p.title,
        variantTitle: v.title,
        price: v.price,
        currency: v.currency,
        thumbnail: p.thumbnail,
        quantity: qty,
      );
}

/// Local cart persisted on the device. The Medusa cart is created only at
/// checkout / quote time, so abandoned carts never hit the backend.
class CartStore extends ChangeNotifier {
  CartStore._();
  static final CartStore instance = CartStore._();
  static const _key = 'wangjia_cart_v1';

  final List<CartItem> items = [];

  Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null) return;
      items
        ..clear()
        ..addAll((jsonDecode(raw) as List).map((e) => CartItem.fromJson(e as Map<String, dynamic>)));
      notifyListeners();
    } catch (_) {}
  }

  Future<void> _save() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, jsonEncode(items.map((e) => e.toJson()).toList()));
    } catch (_) {}
  }

  int get count => items.fold(0, (s, i) => s + i.quantity);
  num get total => items.fold<num>(0, (s, i) => s + i.lineTotal);
  String get currency => items.isEmpty ? 'idr' : items.first.currency;
  bool get isEmpty => items.isEmpty;

  void add(CartItem item) {
    final existing = items.where((i) => i.variantId == item.variantId).firstOrNull;
    if (existing != null) {
      existing.quantity += item.quantity;
    } else {
      items.add(item);
    }
    notifyListeners();
    _save();
  }

  void setQuantity(String variantId, int qty) {
    final i = items.where((e) => e.variantId == variantId).firstOrNull;
    if (i == null) return;
    if (qty <= 0) {
      items.remove(i);
    } else {
      i.quantity = qty;
    }
    notifyListeners();
    _save();
  }

  void remove(String variantId) => setQuantity(variantId, 0);

  void clear() {
    items.clear();
    notifyListeners();
    _save();
  }
}
