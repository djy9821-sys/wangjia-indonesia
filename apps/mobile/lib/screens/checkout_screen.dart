import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';
import 'order_detail_screen.dart';

/// One-product checkout: address -> shipping method -> place order.
/// Money is collected afterwards through the payment plan, so the order is
/// completed with the "system" payment provider (no charge here).
class CheckoutScreen extends StatefulWidget {
  final Product product;
  final Variant variant;
  final int quantity;
  const CheckoutScreen({super.key, required this.product, required this.variant, required this.quantity});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _form = GlobalKey<FormState>();
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _company = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _address = TextEditingController();
  final _city = TextEditingController();
  final _province = TextEditingController();
  final _postal = TextEditingController();

  String? _cartId;
  List<ShippingOption>? _options;
  String? _optionId;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    MedusaClient.instance.me().then((c) {
      if (c == null || !mounted) return;
      setState(() {
        _first.text = '${c['first_name'] ?? ''}';
        _last.text = '${c['last_name'] ?? ''}';
        _phone.text = '${c['phone'] ?? ''}';
        _email.text = '${c['email'] ?? ''}';
        _company.text = '${c['company_name'] ?? ''}';
      });
    });
  }

  Map<String, dynamic> get _addressJson => {
        'first_name': _first.text.trim(),
        'last_name': _last.text.trim(),
        'company': _company.text.trim(),
        'phone': _phone.text.trim(),
        'address_1': _address.text.trim(),
        'city': _city.text.trim(),
        'province': _province.text.trim(),
        'postal_code': _postal.text.trim(),
        'country_code': 'id',
      };

  Future<void> _loadShipping() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      final api = MedusaClient.instance;
      _cartId ??= await api.createCartWithItem(widget.variant.id, widget.quantity);
      await api.setCartAddress(_cartId!, email: _email.text.trim(), address: _addressJson);
      final options = await api.shippingOptions(_cartId!);
      setState(() {
        _options = options;
        _optionId = options.isNotEmpty ? options.first.id : null;
      });
    } catch (e) {
      if (mounted) showSnack(context, '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _placeOrder() async {
    if (_cartId == null || _optionId == null) return;
    setState(() => _busy = true);
    try {
      final api = MedusaClient.instance;
      await api.addShippingMethod(_cartId!, _optionId!);
      final order = await api.completeCart(_cartId!);
      if (!mounted) return;
      showSnack(context, S.t('order_placed'));
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id)),
        (route) => route.isFirst,
      );
    } catch (e) {
      if (mounted) showSnack(context, '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String? _required(String? v) => (v == null || v.trim().isEmpty) ? '*' : null;

  @override
  Widget build(BuildContext context) {
    final price = widget.variant.price ?? 0;
    final subtotal = price * widget.quantity;
    return Scaffold(
      appBar: AppBar(title: Text(S.t('checkout'))),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: ListTile(
                leading: const Icon(Icons.local_shipping),
                title: Text(widget.product.title),
                subtitle: Text('${widget.variant.title} × ${widget.quantity}'),
                trailing: Text(money(subtotal, widget.variant.currency)),
              ),
            ),
            const SizedBox(height: 16),
            Text(S.t('shipping_address'), style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: TextFormField(controller: _first, validator: _required, decoration: InputDecoration(labelText: S.t('first_name')))),
              const SizedBox(width: 12),
              Expanded(child: TextFormField(controller: _last, decoration: InputDecoration(labelText: S.t('last_name')))),
            ]),
            const SizedBox(height: 12),
            TextFormField(controller: _company, decoration: InputDecoration(labelText: S.t('company'))),
            const SizedBox(height: 12),
            TextFormField(controller: _phone, validator: _required, keyboardType: TextInputType.phone, decoration: InputDecoration(labelText: S.t('phone'))),
            const SizedBox(height: 12),
            TextFormField(controller: _email, validator: _required, keyboardType: TextInputType.emailAddress, decoration: InputDecoration(labelText: S.t('email'))),
            const SizedBox(height: 12),
            TextFormField(controller: _address, validator: _required, maxLines: 2, decoration: InputDecoration(labelText: S.t('address'))),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: TextFormField(controller: _city, validator: _required, decoration: InputDecoration(labelText: S.t('city')))),
              const SizedBox(width: 12),
              Expanded(child: TextFormField(controller: _province, validator: _required, decoration: InputDecoration(labelText: S.t('province')))),
            ]),
            const SizedBox(height: 12),
            TextFormField(controller: _postal, keyboardType: TextInputType.number, decoration: InputDecoration(labelText: S.t('postal_code'))),
            const SizedBox(height: 20),
            if (_options == null)
              FilledButton(
                onPressed: _busy ? null : _loadShipping,
                child: Text(S.t('shipping_method')),
              )
            else ...[
              Text(S.t('shipping_method'), style: Theme.of(context).textTheme.titleMedium),
              RadioGroup<String>(
                groupValue: _optionId,
                onChanged: (v) => setState(() => _optionId = v),
                child: Column(
                  children: _options!
                      .map((o) => RadioListTile<String>(
                            value: o.id,
                            title: Text(o.name),
                            subtitle: Text(o.amount == 0 ? '-' : money(o.amount, widget.variant.currency)),
                          ))
                      .toList(),
                ),
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: _busy || _optionId == null ? null : _placeOrder,
                icon: const Icon(Icons.check),
                label: Text(S.t('place_order')),
              ),
            ],
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
