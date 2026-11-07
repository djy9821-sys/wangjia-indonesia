import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';
import '../widgets/region_picker.dart';
import 'map_picker_screen.dart';

class AddressesScreen extends StatefulWidget {
  const AddressesScreen({super.key});
  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> {
  late Future<List<Address>> _future = MedusaClient.instance.addresses();

  Future<void> _reload() async {
    setState(() {
      _future = MedusaClient.instance.addresses();
    });
    await _future;
  }

  Future<void> _edit([Address? a]) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => AddressFormScreen(address: a)),
    );
    if (changed == true) _reload();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(S.t('addresses'))),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _edit(),
          icon: const Icon(Icons.add_location_alt_outlined),
          label: Text(S.t('add_address')),
        ),
        body: FutureBuilder<List<Address>>(
          future: _future,
          builder: (context, snap) {
            if (snap.hasError) return ErrorRetry(error: snap.error!, onRetry: _reload);
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            final list = snap.data!;
            if (list.isEmpty) return Center(child: Text(S.t('no_addresses')));
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final a = list[i];
                return Card(
                  child: ListTile(
                    leading: Icon(a.isDefaultShipping ? Icons.home : Icons.location_on_outlined),
                    title: Text([a.fullName, if (a.company.isNotEmpty) a.company].join(' · ')),
                    subtitle: Text('${a.oneLine}\n${a.phone}'),
                    isThreeLine: true,
                    trailing: a.isDefaultShipping
                        ? StatusChip(S.t('default_address'), const Color(0xFF1B8A5A))
                        : null,
                    onTap: () => _edit(a),
                  ),
                );
              },
            );
          },
        ),
      );
}

class AddressFormScreen extends StatefulWidget {
  final Address? address;
  const AddressFormScreen({super.key, this.address});
  @override
  State<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends State<AddressFormScreen> {
  final _form = GlobalKey<FormState>();
  late final a = widget.address ?? const Address();
  late final _first = TextEditingController(text: a.firstName);
  late final _last = TextEditingController(text: a.lastName);
  late final _company = TextEditingController(text: a.company);
  late final _phone = TextEditingController(text: a.phone);
  late final _address = TextEditingController(text: a.address1);
  late final _postal = TextEditingController(text: a.postalCode);
  late bool _default = a.isDefaultShipping;
  late double? _lat = a.lat;
  late double? _lng = a.lng;
  final _region = RegionSelection();
  bool _busy = false;

  String? _required(String? v) => (v == null || v.trim().isEmpty) ? '*' : null;

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await MedusaClient.instance.saveAddress(Address(
        id: a.id,
        firstName: _first.text.trim(),
        lastName: _last.text.trim(),
        company: _company.text.trim(),
        phone: _phone.text.trim(),
        address1: _address.text.trim(),
        district: _region.district?.name ?? a.district,
        city: _region.regency?.name ?? a.city,
        province: _region.province?.name ?? a.province,
        postalCode: _postal.text.trim(),
        provinceCode: _region.province?.code ?? a.provinceCode,
        regencyCode: _region.regency?.code ?? a.regencyCode,
        districtCode: _region.district?.code ?? a.districtCode,
        lat: _lat,
        lng: _lng,
        isDefaultShipping: _default,
      ));
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) showSnack(context, friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete() async {
    if (a.id == null) return;
    setState(() => _busy = true);
    try {
      await MedusaClient.instance.deleteAddress(a.id!);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) showSnack(context, friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: Text(a.id == null ? S.t('add_address') : S.t('edit_address')),
          actions: [
            if (a.id != null)
              IconButton(onPressed: _busy ? null : _delete, icon: const Icon(Icons.delete_outline), tooltip: S.t('delete')),
          ],
        ),
        body: Form(
          key: _form,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
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
              TextFormField(controller: _address, validator: _required, maxLines: 2, decoration: InputDecoration(labelText: S.t('address'))),
              const SizedBox(height: 12),
              RegionPicker(
                selection: _region,
                onChanged: (_) => setState(() {}),
                provinceCode: a.provinceCode,
                regencyCode: a.regencyCode,
                districtCode: a.districtCode,
              ),
              const SizedBox(height: 12),
              TextFormField(controller: _postal, keyboardType: TextInputType.number, decoration: InputDecoration(labelText: S.t('postal_code'))),
              MapPinTile(
                lat: _lat,
                lng: _lng,
                addressHint: [
                  _region.district?.name ?? a.district,
                  _region.regency?.name ?? a.city,
                  _region.province?.name ?? a.province,
                ].where((e) => e.isNotEmpty).join(', '),
                onChanged: (p) => setState(() {
                  _lat = p?.latitude;
                  _lng = p?.longitude;
                }),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(S.t('set_default')),
                value: _default,
                onChanged: (v) => setState(() => _default = v),
              ),
              const SizedBox(height: 8),
              FilledButton(onPressed: _busy ? null : _save, child: Text(S.t('save'))),
              const SizedBox(height: 32),
            ],
          ),
        ),
      );
}
