import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../l10n/strings.dart';
import '../models.dart';

/// Province → regency → district dropdowns backed by /store/wilayah.
class RegionSelection {
  Wilayah? province;
  Wilayah? regency;
  Wilayah? district;
  RegionSelection({this.province, this.regency, this.district});
  bool get complete => province != null && regency != null && district != null;
}

class RegionPicker extends StatefulWidget {
  final RegionSelection selection;
  final ValueChanged<RegionSelection> onChanged;
  /// Codes to preselect (e.g. from a saved address).
  final String? provinceCode;
  final String? regencyCode;
  final String? districtCode;
  const RegionPicker({
    super.key,
    required this.selection,
    required this.onChanged,
    this.provinceCode,
    this.regencyCode,
    this.districtCode,
  });
  @override
  State<RegionPicker> createState() => _RegionPickerState();
}

class _RegionPickerState extends State<RegionPicker> {
  List<Wilayah> _provinces = [];
  List<Wilayah> _regencies = [];
  List<Wilayah> _districts = [];
  final api = MedusaClient.instance;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      _provinces = await api.provinces();
      if (widget.provinceCode != null) {
        widget.selection.province = _provinces.where((p) => p.code == widget.provinceCode).firstOrNull;
        if (widget.selection.province != null) {
          _regencies = await api.regencies(widget.selection.province!.code);
          widget.selection.regency = _regencies.where((r) => r.code == widget.regencyCode).firstOrNull;
          if (widget.selection.regency != null) {
            _districts = await api.districts(widget.selection.regency!.code);
            widget.selection.district = _districts.where((d) => d.code == widget.districtCode).firstOrNull;
          }
        }
      }
      if (mounted) setState(() {});
    } catch (_) {}
  }

  Future<void> _pickProvince(Wilayah? p) async {
    setState(() {
      widget.selection
        ..province = p
        ..regency = null
        ..district = null;
      _regencies = [];
      _districts = [];
    });
    widget.onChanged(widget.selection);
    if (p == null) return;
    final r = await api.regencies(p.code);
    if (mounted) setState(() => _regencies = r);
  }

  Future<void> _pickRegency(Wilayah? r) async {
    setState(() {
      widget.selection
        ..regency = r
        ..district = null;
      _districts = [];
    });
    widget.onChanged(widget.selection);
    if (r == null) return;
    final d = await api.districts(r.code);
    if (mounted) setState(() => _districts = d);
  }

  Widget _dropdown(String label, List<Wilayah> items, Wilayah? value, ValueChanged<Wilayah?> onChanged) =>
      DropdownButtonFormField<Wilayah>(
        key: ValueKey('$label-${items.length}-${value?.code}'),
        initialValue: value,
        isExpanded: true,
        decoration: InputDecoration(labelText: label),
        items: items.map((w) => DropdownMenuItem(value: w, child: Text(w.name, overflow: TextOverflow.ellipsis))).toList(),
        onChanged: items.isEmpty ? null : onChanged,
        validator: (v) => v == null ? '*' : null,
      );

  @override
  Widget build(BuildContext context) => Column(
        children: [
          _dropdown(S.t('province'), _provinces, widget.selection.province, _pickProvince),
          const SizedBox(height: 12),
          _dropdown(S.t('city'), _regencies, widget.selection.regency, _pickRegency),
          const SizedBox(height: 12),
          _dropdown(S.t('district'), _districts, widget.selection.district, (d) {
            setState(() => widget.selection.district = d);
            widget.onChanged(widget.selection);
          }),
        ],
      );
}
