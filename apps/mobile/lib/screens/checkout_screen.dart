import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../cart.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';
import '../widgets/region_picker.dart';
import 'map_picker_screen.dart';
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

  RegionSelection _region = RegionSelection();
  Key _regionKey = UniqueKey();
  List<Address> _saved = [];
  Address? _picked;
  double? _lat;
  double? _lng;
  bool _saveAddress = true;

  String? _cartId;
  List<ShippingOption>? _options;
  String? _optionId;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    MedusaClient.instance.addresses().then((list) {
      if (!mounted) return;
      setState(() => _saved = list);
      final def = list.where((a) => a.isDefaultShipping).firstOrNull ?? list.firstOrNull;
      if (def != null) _applyAddress(def);
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

  void _applyAddress(Address a) {
    setState(() {
      _picked = a;
      _first.text = a.firstName;
      _last.text = a.lastName;
      _company.text = a.company;
      _phone.text = a.phone;
      _address.text = a.address1;
      _postal.text = a.postalCode;
      _region = RegionSelection();
      _regionKey = UniqueKey(); // rebuild picker with the saved codes
      _lat = a.lat;
      _lng = a.lng;
      _saveAddress = false;
    });
  }

  Address get _currentAddress => Address(
        firstName: _first.text.trim(),
        lastName: _last.text.trim(),
        company: _company.text.trim(),
        phone: _phone.text.trim(),
        address1: _address.text.trim(),
        district: _region.district?.name ?? _picked?.district ?? '',
        city: _region.regency?.name ?? _picked?.city ?? '',
        province: _region.province?.name ?? _picked?.province ?? '',
        postalCode: _postal.text.trim(),
        provinceCode: _region.province?.code ?? _picked?.provinceCode,
        regencyCode: _region.regency?.code ?? _picked?.regencyCode,
        districtCode: _region.district?.code ?? _picked?.districtCode,
        lat: _lat,
        lng: _lng,
      );

  Map<String, dynamic> get _addressJson => _currentAddress.toJson();

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
      if (_saveAddress) {
        // Best effort: keep the address for the next order.
        await api.saveAddress(_currentAddress).catchError((_) {});
      }
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
            if (_saved.isNotEmpty) ...[
              const SizedBox(height: 8),
              DropdownButtonFormField<Address>(
                key: ValueKey('saved-${_picked?.id}'),
                initialValue: _picked,
                isExpanded: true,
                decoration: InputDecoration(labelText: S.t('saved_address')),
                items: _saved
                    .map((a) => DropdownMenuItem(
                          value: a,
                          child: Text('${a.fullName} · ${a.oneLine}', overflow: TextOverflow.ellipsis),
                        ))
                    .toList(),
                onChanged: (a) => a == null ? null : _applyAddress(a),
              ),
            ],
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
            RegionPicker(
              key: _regionKey,
              selection: _region,
              onChanged: (_) => setState(() {}),
              provinceCode: _picked?.provinceCode,
              regencyCode: _picked?.regencyCode,
              districtCode: _picked?.districtCode,
            ),
            const SizedBox(height: 12),
            TextFormField(controller: _postal, keyboardType: TextInputType.number, decoration: InputDecoration(labelText: S.t('postal_code'))),
            MapPinTile(
              lat: _lat,
              lng: _lng,
              addressHint: [
                _region.district?.name ?? _picked?.district ?? '',
                _region.regency?.name ?? _picked?.city ?? '',
                _region.province?.name ?? _picked?.province ?? '',
              ].where((e) => e.isNotEmpty).join(', '),
              onChanged: (p) => setState(() {
                _lat = p?.latitude;
                _lng = p?.longitude;
              }),
            ),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: Text(S.t('save_this_address')),
              value: _saveAddress,
              onChanged: (v) => setState(() => _saveAddress = v ?? false),
            ),
            const SizedBox(height: 8),
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
