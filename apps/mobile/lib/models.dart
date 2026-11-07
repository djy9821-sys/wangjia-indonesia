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
  final String? description;
  final String? thumbnail;
  final List<String> images;
  final List<Variant> variants;
  Product({
    required this.id,
    required this.title,
    this.description,
    this.thumbnail,
    this.images = const [],
    this.variants = const [],
  });
  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: j['id'] as String,
        title: (j['title'] ?? '') as String,
        description: j['description'] as String?,
        thumbnail: j['thumbnail'] as String?,
        images: ((j['images'] as List?) ?? [])
            .map((e) => (e as Map<String, dynamic>)['url'] as String)
            .toList(),
        variants: ((j['variants'] as List?) ?? [])
            .map((e) => Variant.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

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
  OrderItem(this.title, this.variantTitle, this.quantity, this.unitPrice);
  factory OrderItem.fromJson(Map<String, dynamic> j) => OrderItem(
        (j['title'] ?? j['product_title'] ?? '') as String,
        j['variant_title'] as String?,
        _num(j['quantity']).toInt(),
        _num(j['unit_price']),
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
        (j['file_url'] ?? '') as String,
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
