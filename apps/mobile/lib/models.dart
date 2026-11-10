import 'config.dart';

/// Thin typed wrappers over Medusa JSON. Only the fields the app uses.
num _num(dynamic v) => v is num ? v : num.tryParse('${v ?? 0}') ?? 0;

class Region {
  final String id;
  final String currencyCode;
  Region(this.id, this.currencyCode);
  factory Region.fromJson(Map<String, dynamic> j) =>
      Region(j['id'] as String, (j['currency_code'] ?? 'idr') as String);
}

class Variant {
  final String id;
  final String title;
  final num? price;
  final String currency;
  Variant({required this.id, required this.title, this.price, this.currency = 'idr'});
  factory Variant.fromJson(Map<String, dynamic> j) {
    final cp = j['calculated_price'] as Map<String, dynamic>?;
    return Variant(
      id: j['id'] as String,
      title: (j['title'] ?? '') as String,
      price: cp == null ? null : _num(cp['calculated_amount']),
      currency: (cp?['currency_code'] ?? 'idr') as String,
    );
  }
}

class Product {
  final String id;
  final String title;
  final String? handle;
  final String? subtitle;
  final String? description;
  final String? thumbnail;
  final List<String> images;
  final List<Variant> variants;
  /// Ordered (label, value) pairs from metadata keys "spec:<label>".
  final List<(String, String)> specs;
  final List<String> categoryIds;
  Product({
    required this.id,
    required this.title,
    this.handle,
    this.subtitle,
    this.description,
    this.thumbnail,
    this.images = const [],
    this.variants = const [],
    this.specs = const [],
    this.categoryIds = const [],
  });
  factory Product.fromJson(Map<String, dynamic> j) {
    final meta = (j['metadata'] as Map<String, dynamic>?) ?? {};
    // Keys may carry a numeric prefix ("spec:03 Listrik") to fix the order.
    final specKeys = meta.keys.where((k) => k.startsWith('spec:') && meta[k] != null && '${meta[k]}'.isNotEmpty).toList()..sort();
    final specs = specKeys
        .map((k) => (k.substring(5).replaceFirst(RegExp(r'^\d+\s+'), ''), '${meta[k]}'))
        .toList();
    return Product(
      id: j['id'] as String,
      title: (j['title'] ?? '') as String,
      handle: j['handle'] as String?,
      subtitle: j['subtitle'] as String?,
      description: j['description'] as String?,
      thumbnail: reachableUrl(j['thumbnail'] as String?),
      images: ((j['images'] as List?) ?? [])
          .map((e) => reachableUrl((e as Map<String, dynamic>)['url'] as String)!)
          .toList(),
      variants: ((j['variants'] as List?) ?? [])
          .map((e) => Variant.fromJson(e as Map<String, dynamic>))
          .toList(),
      specs: specs,
      categoryIds: ((j['categories'] as List?) ?? [])
          .map((e) => (e as Map<String, dynamic>)['id'] as String)
          .toList(),
    );
  }

  num? get minPrice {
    final prices = variants.map((v) => v.price).whereType<num>().toList();
    if (prices.isEmpty) return null;
    prices.sort();
    return prices.first;
  }
}

class OrderItem {
  final String title;
  final String? variantTitle;
  final int quantity;
  final num unitPrice;
  final String? thumbnail;
  OrderItem(this.title, this.variantTitle, this.quantity, this.unitPrice, {this.thumbnail});
  factory OrderItem.fromJson(Map<String, dynamic> j) => OrderItem(
        (j['title'] ?? j['product_title'] ?? '') as String,
        j['variant_title'] as String?,
        _num(j['quantity']).toInt(),
        _num(j['unit_price']),
        thumbnail: reachableUrl(j['thumbnail'] as String?),
      );
}

class Fulfillment {
  final String id;
  final String? shippedAt;
  final String? deliveredAt;
  final List<String> trackingNumbers;
  Fulfillment(this.id, this.shippedAt, this.deliveredAt, this.trackingNumbers);
  factory Fulfillment.fromJson(Map<String, dynamic> j) => Fulfillment(
        j['id'] as String,
        j['shipped_at'] as String?,
        j['delivered_at'] as String?,
        ((j['labels'] as List?) ?? [])
            .map((l) => (l as Map<String, dynamic>)['tracking_number'] as String?)
            .whereType<String>()
            .toList(),
      );
}

class Order {
  final String id;
  final int displayId;
  final String status;
  final String? fulfillmentStatus;
  final String? paymentStatus;
  final String currency;
  final num total;
  final String createdAt;
  final List<OrderItem> items;
  final List<Fulfillment> fulfillments;
  Order({
    required this.id,
    required this.displayId,
    required this.status,
    this.fulfillmentStatus,
    this.paymentStatus,
    required this.currency,
    required this.total,
    required this.createdAt,
    this.items = const [],
    this.fulfillments = const [],
  });
  factory Order.fromJson(Map<String, dynamic> j) => Order(
        id: j['id'] as String,
        displayId: _num(j['display_id']).toInt(),
        status: (j['status'] ?? '') as String,
        fulfillmentStatus: j['fulfillment_status'] as String?,
        paymentStatus: j['payment_status'] as String?,
        currency: (j['currency_code'] ?? 'idr') as String,
        total: _num(j['total']),
        createdAt: (j['created_at'] ?? '') as String,
        items: ((j['items'] as List?) ?? [])
            .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        fulfillments: ((j['fulfillments'] as List?) ?? [])
            .map((e) => Fulfillment.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class PaymentProof {
  final String id;
  final String fileUrl;
  final String status;
  final String? reviewNote;
  final String? createdAt;
  PaymentProof(this.id, this.fileUrl, this.status, this.reviewNote, this.createdAt);
  factory PaymentProof.fromJson(Map<String, dynamic> j) => PaymentProof(
        j['id'] as String,
        reachableUrl((j['file_url'] ?? '') as String)!,
        (j['status'] ?? 'pending') as String,
        j['review_note'] as String?,
        j['created_at'] as String?,
      );
}

class Installment {
  final String id;
  final int sequence;
  final String label;
  final num amount;
  final String? dueDate;
  final String status;
  final String? paymentMethod;
  final String? paidAt;
  final num refundedAmount;
  final List<PaymentProof> proofs;
  Installment({
    required this.id,
    required this.sequence,
    required this.label,
    required this.amount,
    this.dueDate,
    required this.status,
    this.paymentMethod,
    this.paidAt,
    this.refundedAmount = 0,
    this.proofs = const [],
  });
  factory Installment.fromJson(Map<String, dynamic> j) => Installment(
        id: j['id'] as String,
        sequence: _num(j['sequence']).toInt(),
        label: (j['label'] ?? '') as String,
        amount: _num(j['amount']),
        dueDate: j['due_date'] as String?,
        status: (j['status'] ?? 'unpaid') as String,
        paymentMethod: j['payment_method'] as String?,
        paidAt: j['paid_at'] as String?,
        refundedAmount: _num(j['refunded_amount']),
        proofs: ((j['proofs'] as List?) ?? [])
            .map((e) => PaymentProof.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  bool get isOpen => status == 'unpaid' || status == 'awaiting_confirmation';
}

class PaymentPlan {
  final String id;
  final String currency;
  final num totalAmount;
  final String releasePolicy;
  final String status;
  final String? releasedAt;
  final String? note;
  final List<Installment> installments;
  PaymentPlan({
    required this.id,
    required this.currency,
    required this.totalAmount,
    required this.releasePolicy,
    required this.status,
    this.releasedAt,
    this.note,
    this.installments = const [],
  });
  factory PaymentPlan.fromJson(Map<String, dynamic> j) {
    final list = ((j['installments'] as List?) ?? [])
        .map((e) => Installment.fromJson(e as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => a.sequence.compareTo(b.sequence));
    return PaymentPlan(
      id: j['id'] as String,
      currency: (j['currency_code'] ?? 'idr') as String,
      totalAmount: _num(j['total_amount']),
      releasePolicy: (j['release_policy'] ?? 'deposit_paid') as String,
      status: (j['status'] ?? 'active') as String,
      releasedAt: j['released_at'] as String?,
      note: j['note'] as String?,
      installments: list,
    );
  }

  num get paidAmount => installments
      .where((i) => i.status == 'paid' || i.status == 'refunded')
      .fold<num>(0, (s, i) => s + i.amount - i.refundedAmount);
}

class ShippingOption {
  final String id;
  final String name;
  final num amount;
  ShippingOption(this.id, this.name, this.amount);
  factory ShippingOption.fromJson(Map<String, dynamic> j) => ShippingOption(
        j['id'] as String,
        (j['name'] ?? '') as String,
        _num(j['amount'] ?? j['calculated_price']?['calculated_amount']),
      );
}

/// Indonesian administrative region (province / regency / district).
class Wilayah {
  final String code;
  final String name;
  Wilayah(this.code, this.name);
  factory Wilayah.fromJson(Map<String, dynamic> j) =>
      Wilayah(j['code'] as String, j['name'] as String);
}

class QuoteMessage {
  final String id;
  final String text;
  final bool fromCustomer;
  final String? createdAt;
  QuoteMessage(this.id, this.text, this.fromCustomer, this.createdAt);
  factory QuoteMessage.fromJson(Map<String, dynamic> j) => QuoteMessage(
        j['id'] as String,
        (j['text'] ?? '') as String,
        j['customer_id'] != null,
        j['created_at'] as String?,
      );
}

/// A request-for-quote. Totals come from the draft order (or the order
/// preview while the merchant has unconfirmed edits).
class Quote {
  final String id;
  final String status;
  final String? createdAt;
  final String currency;
  final num total;
  final int? displayId;
  final List<OrderItem> items;
  final List<QuoteMessage> messages;
  Quote({
    required this.id,
    required this.status,
    this.createdAt,
    required this.currency,
    required this.total,
    this.displayId,
    this.items = const [],
    this.messages = const [],
  });

  factory Quote.fromJson(Map<String, dynamic> j, {Map<String, dynamic>? preview}) {
    final draft = (j['draft_order'] as Map<String, dynamic>?) ?? {};
    final source = preview ?? draft;
    final msgs = ((j['messages'] as List?) ?? [])
        .map((e) => QuoteMessage.fromJson(e as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => (a.createdAt ?? '').compareTo(b.createdAt ?? ''));
    return Quote(
      id: j['id'] as String,
      status: (j['status'] ?? 'pending_merchant') as String,
      createdAt: j['created_at'] as String?,
      currency: (draft['currency_code'] ?? 'idr') as String,
      total: _num(source['total'] ?? draft['total']),
      displayId: draft['display_id'] == null ? null : _num(draft['display_id']).toInt(),
      items: ((source['items'] as List?) ?? (draft['items'] as List?) ?? [])
          .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      messages: msgs,
    );
  }

  bool get awaitingCustomer => status == 'pending_customer';
  bool get awaitingMerchant => status == 'pending_merchant';
  bool get closed => status == 'accepted' || status.endsWith('rejected');
}

class Category {
  final String id;
  final String name;
  Category(this.id, this.name);
  factory Category.fromJson(Map<String, dynamic> j) =>
      Category(j['id'] as String, (j['name'] ?? '') as String);
}

/// Saved customer address (Medusa customer address).
class Address {
  final String? id;
  final String firstName;
  final String lastName;
  final String company;
  final String phone;
  final String address1;
  final String district; // stored in address_2
  final String city;
  final String province;
  final String postalCode;
  final String? provinceCode;
  final String? regencyCode;
  final String? districtCode;
  final double? lat; // pond / farm pin, stored in metadata
  final double? lng;
  final bool isDefaultShipping;
  const Address({
    this.id,
    this.firstName = '',
    this.lastName = '',
    this.company = '',
    this.phone = '',
    this.address1 = '',
    this.district = '',
    this.city = '',
    this.province = '',
    this.postalCode = '',
    this.provinceCode,
    this.regencyCode,
    this.districtCode,
    this.lat,
    this.lng,
    this.isDefaultShipping = false,
  });

  factory Address.fromJson(Map<String, dynamic> j) {
    final meta = (j['metadata'] as Map<String, dynamic>?) ?? {};
    return Address(
      id: j['id'] as String?,
      firstName: (j['first_name'] ?? '') as String,
      lastName: (j['last_name'] ?? '') as String,
      company: (j['company'] ?? '') as String,
      phone: (j['phone'] ?? '') as String,
      address1: (j['address_1'] ?? '') as String,
      district: (j['address_2'] ?? '') as String,
      city: (j['city'] ?? '') as String,
      province: (j['province'] ?? '') as String,
      postalCode: (j['postal_code'] ?? '') as String,
      provinceCode: meta['province_code'] as String?,
      regencyCode: meta['regency_code'] as String?,
      districtCode: meta['district_code'] as String?,
      lat: (meta['lat'] as num?)?.toDouble(),
      lng: (meta['lng'] as num?)?.toDouble(),
      isDefaultShipping: j['is_default_shipping'] == true,
    );
  }

  Map<String, dynamic> toJson() => {
        'first_name': firstName,
        'last_name': lastName,
        'company': company,
        'phone': phone,
        'address_1': address1,
        'address_2': district,
        'city': city,
        'province': province,
        'postal_code': postalCode,
        'country_code': 'id',
        'metadata': {
          'province_code': provinceCode,
          'regency_code': regencyCode,
          'district_code': districtCode,
          if (lat != null && lng != null) 'lat': lat,
          if (lat != null && lng != null) 'lng': lng,
        },
      };

  String get mapsUrl => 'https://www.google.com/maps/search/?api=1&query=$lat,$lng';

  String get oneLine => [address1, district, city, province, postalCode].where((e) => e.isNotEmpty).join(', ');
  String get fullName => [firstName, lastName].where((e) => e.isNotEmpty).join(' ');
}

/// One registered aerator / spare part with its warranty window.
class WarrantyUnit {
  final String id;
  final String serial;
  final String productTitle;
  final String? variantTitle;
  final String status;
  final String? registeredAt;
  final String? warrantyExpiresAt;
  final String? farmLocation;
  final bool registered;
  final bool registeredToMe;
  WarrantyUnit({
    required this.id,
    required this.serial,
    required this.productTitle,
    this.variantTitle,
    required this.status,
    this.registeredAt,
    this.warrantyExpiresAt,
    this.farmLocation,
    this.registered = false,
    this.registeredToMe = false,
  });
  factory WarrantyUnit.fromJson(Map<String, dynamic> j) => WarrantyUnit(
        id: (j['id'] ?? '') as String,
        serial: j['serial'] as String,
        productTitle: (j['product_title'] ?? '') as String,
        variantTitle: j['variant_title'] as String?,
        status: (j['status'] ?? 'registered') as String,
        registeredAt: j['registered_at'] as String?,
        warrantyExpiresAt: j['warranty_expires_at'] as String?,
        farmLocation: j['farm_location'] as String?,
        registered: j['registered'] == true || j['status'] == 'registered',
        registeredToMe: j['registered_to_me'] == true,
      );
  String get title => [productTitle, if ((variantTitle ?? '').isNotEmpty) variantTitle!].join(' · ');
  bool get expired =>
      warrantyExpiresAt != null && DateTime.tryParse(warrantyExpiresAt!)?.isBefore(DateTime.now()) == true;
}

/// Result of scanning a QR label.
class WarrantyCheck {
  final bool genuine;
  final String? reason; // invalid_code | unknown | void
  final String? serial;
  final String? code;
  final String? productTitle;
  final String? variantTitle;
  final int warrantyMonths;
  final bool registered;
  final bool registeredToMe;
  final String? warrantyExpiresAt;
  final int scanCount;
  WarrantyCheck({
    required this.genuine,
    this.reason,
    this.serial,
    this.code,
    this.productTitle,
    this.variantTitle,
    this.warrantyMonths = 12,
    this.registered = false,
    this.registeredToMe = false,
    this.warrantyExpiresAt,
    this.scanCount = 0,
  });
  factory WarrantyCheck.fromJson(Map<String, dynamic> j) {
    final u = j['unit'] as Map<String, dynamic>?;
    return WarrantyCheck(
      genuine: j['genuine'] == true,
      reason: j['reason'] as String?,
      serial: u?['serial'] as String?,
      code: u?['code'] as String?,
      productTitle: u?['product_title'] as String?,
      variantTitle: u?['variant_title'] as String?,
      warrantyMonths: (u?['warranty_months'] as num?)?.toInt() ?? 12,
      registered: u?['registered'] == true,
      registeredToMe: u?['registered_to_me'] == true,
      warrantyExpiresAt: u?['warranty_expires_at'] as String?,
      scanCount: (u?['scan_count'] as num?)?.toInt() ?? 0,
    );
  }
  String get title => [productTitle ?? '', if ((variantTitle ?? '').isNotEmpty) variantTitle!].join(' · ');
}

class TrackingEvent {
  final String? time;
  final String? status;
  final String? note;
  TrackingEvent(this.time, this.status, this.note);
  factory TrackingEvent.fromJson(Map<String, dynamic> j) =>
      TrackingEvent(j['time'] as String?, j['status'] as String?, j['note'] as String?);
}

class TrackingInfo {
  final String trackingNumber;
  final String? courier;
  final String? trackingUrl;
  final String? status;
  final List<TrackingEvent> history;
  TrackingInfo({
    required this.trackingNumber,
    this.courier,
    this.trackingUrl,
    this.status,
    this.history = const [],
  });
  factory TrackingInfo.fromJson(Map<String, dynamic> j) => TrackingInfo(
        trackingNumber: j['tracking_number'] as String,
        courier: j['courier'] as String?,
        trackingUrl: j['tracking_url'] as String?,
        status: j['status'] as String?,
        history: ((j['history'] as List?) ?? [])
            .map((e) => TrackingEvent.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

/// Patungan (group buy) as served by GET /store/group-buys.
class GroupBuy {
  final String id;
  final String title;
  final String productId;
  final String? productHandle;
  final String productTitle;
  final String variantId;
  final String? variantTitle;
  final String? thumbnail;
  final String currency;
  final num groupPrice;
  final num? regularPrice;
  final int minQuantity;
  final int? maxQuantity;
  final int joinedQuantity;
  final int participants;
  final int? remainingQuantity;
  final DateTime endsAt;
  final String status;
  final String? note;

  GroupBuy({
    required this.id,
    required this.title,
    required this.productId,
    required this.productTitle,
    required this.variantId,
    required this.currency,
    required this.groupPrice,
    required this.minQuantity,
    required this.joinedQuantity,
    required this.participants,
    required this.endsAt,
    required this.status,
    this.productHandle,
    this.variantTitle,
    this.thumbnail,
    this.regularPrice,
    this.maxQuantity,
    this.remainingQuantity,
    this.note,
  });

  factory GroupBuy.fromJson(Map<String, dynamic> j) => GroupBuy(
        id: j['id'] as String,
        title: j['title'] as String,
        productId: j['product_id'] as String,
        productHandle: j['product_handle'] as String?,
        productTitle: j['product_title'] as String? ?? '',
        variantId: j['variant_id'] as String,
        variantTitle: j['variant_title'] as String?,
        thumbnail: reachableUrl(j['thumbnail'] as String?),
        currency: (j['currency_code'] as String?) ?? 'idr',
        groupPrice: (j['group_price'] as num?) ?? 0,
        regularPrice: j['regular_price'] as num?,
        minQuantity: (j['min_quantity'] as num?)?.toInt() ?? 1,
        maxQuantity: (j['max_quantity'] as num?)?.toInt(),
        joinedQuantity: (j['joined_quantity'] as num?)?.toInt() ?? 0,
        participants: (j['participants'] as num?)?.toInt() ?? 0,
        remainingQuantity: (j['remaining_quantity'] as num?)?.toInt(),
        endsAt: DateTime.tryParse('${j['ends_at']}') ?? DateTime.now(),
        status: (j['status'] as String?) ?? 'open',
        note: j['note'] as String?,
      );

  int get missing => (minQuantity - joinedQuantity) < 0 ? 0 : minQuantity - joinedQuantity;
  double get progress => minQuantity == 0 ? 1 : (joinedQuantity / minQuantity).clamp(0, 1).toDouble();
  int get daysLeft {
    final d = endsAt.difference(DateTime.now()).inHours;
    return d <= 0 ? 0 : (d / 24).ceil();
  }
  int? get discountPercent =>
      regularPrice == null || regularPrice == 0 ? null : (100 - groupPrice * 100 / regularPrice!).round();
}
