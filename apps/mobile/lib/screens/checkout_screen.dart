import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../cart.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';
import 'order_detail_screen.dart';

/// One-product checkout: address -> shipping method -> place order.
/// Money is collected afterwards through the payment plan, so the order is
/// completed with the "system" payment provider (no charge here).
class CheckoutScreen extends StatefulWidget {
  final List<CartItem> items;
  const CheckoutScreen({super.key, required this.items});
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
  final _postal = TextEditingController();

  // Province / regency / district pickers (Indonesian admin regions)
  List<Wilayah> _provinces = [];
  List<Wilayah> _regencies = [];
  List<Wilayah> _districts = [];
  Wilayah? _province;
  Wilayah? _regency;
  Wilayah? _district;

  String? _cartId;
  List<ShippingOption>? _options;
  String? _optionId;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    MedusaClient.instance.provinces().then((p) {
      if (mounted) setState(() => _provinces = p);
    }).catchError((_) {});
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
        'address_2': _district?.name ?? '',
        'city': _regency?.name ?? '',
        'province': _province?.name ?? '',
        'postal_code': _postal.text.trim(),
        'country_code': 'id',
        'metadata': {
          'province_code': _province?.code,
          'regency_code': _regency?.code,
          'district_code': _district?.code,
        },
      };

  Future<void> _pickProvince(Wilayah? p) async {
    setState(() {
      _province = p;
      _regency = null;
      _district = null;
      _regencies = [];
      _districts = [];
    });
    if (p == null) return;
    final r = await MedusaClient.instance.regencies(p.code);
    if (mounted) setState(() => _regencies = r);
  }

  Future<void> _pickRegency(Wilayah? r) async {
    setState(() {
      _regency = r;
      _district = null;
      _districts = [];
    });
    if (r == null) return;
    final d = await MedusaClient.instance.districts(r.code);
    if (mounted) setState(() => _districts = d);
  }

  Widget _regionDropdown({
    required String label,
    required List<Wilayah> items,
    required Wilayah? value,
    required ValueChanged<Wilayah?> onChanged,
  }) =>
      DropdownButtonFormField<Wilayah>(
        key: ValueKey('$label-${items.length}-${value?.code}'),
        initialValue: value,
        isExpanded: true,
        decoration: InputDecoration(labelText: label),
        items: items
            .map((w) => DropdownMenuItem(value: w, child: Text(w.name, overflow: TextOverflow.ellipsis)))
            .toList(),
        onChanged: items.isEmpty ? null : onChanged,
        validator: (v) => v == null ? '*' : null,
      );

  Future<void> _loadShipping() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      final api = MedusaClient.instance;
      _cartId ??= await api.createCartFromItems(widget.items);
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
      CartStore.instance.clear();
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
    final subtotal = widget.items.fold<num>(0, (s, i) => s + i.lineTotal);
    final currency = widget.items.isEmpty ? 'idr' : widget.items.first.currency;
    return Scaffold(
      appBar: AppBar(title: Text(S.t('checkout'))),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Column(
                children: [
                  ...widget.items.map((it) => ListTile(
                        dense: true,
                        leading: const Icon(Icons.water_outlined),
                        title: Text(it.productTitle),
                        subtitle: Text('${it.variantTitle} × ${it.quantity}'),
                        trailing: Text(money(it.lineTotal, it.currency)),
                      )),
                  ListTile(
                    title: Text(S.t('subtotal'), style: Theme.of(context).textTheme.titleSmall),
                    trailing: Text(money(subtotal, currency), style: Theme.of(context).textTheme.titleSmall),
                  ),
                ],
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
            _regionDropdown(label: S.t('province'), items: _provinces, value: _province, onChanged: _pickProvince),
            const SizedBox(height: 12),
            _regionDropdown(label: S.t('city'), items: _regencies, value: _regency, onChanged: _pickRegency),
            const SizedBox(height: 12),
            _regionDropdown(label: S.t('district'), items: _districts, value: _district, onChanged: (d) => setState(() => _district = d)),
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
                            subtitle: Text(o.amount == 0 ? '-' : money(o.amount, currency)),
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
