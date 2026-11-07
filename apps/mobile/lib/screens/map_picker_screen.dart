import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

import '../l10n/strings.dart';

/// Lets the customer drop a pin on their pond / farm so the cargo driver gets
/// exact coordinates. OpenStreetMap tiles, no API key. The map opens on the
/// previous pin, else on the typed address (Nominatim geocoding), else on
/// Indonesia.
class MapPickerScreen extends StatefulWidget {
  final LatLng? initial;
  final String? addressHint;
  const MapPickerScreen({super.key, this.initial, this.addressHint});
  @override
  State<MapPickerScreen> createState() => _MapPickerScreenState();
}

class _MapPickerScreenState extends State<MapPickerScreen> {
  final _map = MapController();
  late LatLng _center = widget.initial ?? const LatLng(-2.5, 118.0);
  late double _zoom = widget.initial != null ? 16 : 4.5;
  bool _locating = false;

  @override
  void initState() {
    super.initState();
    if (widget.initial == null && (widget.addressHint ?? '').trim().isNotEmpty) {
      _geocode(widget.addressHint!);
    }
  }

  Future<void> _geocode(String query) async {
    setState(() => _locating = true);
    try {
      final uri = Uri.https('nominatim.openstreetmap.org', '/search', {
        'q': query,
        'format': 'json',
        'limit': '1',
        'countrycodes': 'id',
      });
      final res = await http.get(uri, headers: {
        // Nominatim usage policy: identify the application.
        'User-Agent': 'WANGJIA-App/1.0 (id.co.wangjia.wangjiaApp)',
        'Accept-Language': 'id',
      }).timeout(const Duration(seconds: 8));
      final list = jsonDecode(res.body) as List;
      if (list.isNotEmpty && mounted) {
        final hit = list.first as Map<String, dynamic>;
        final p = LatLng(double.parse(hit['lat'] as String), double.parse(hit['lon'] as String));
        _map.move(p, 13);
        setState(() {
          _center = p;
          _zoom = 13;
        });
      }
    } catch (_) {
      // Offline or rate limited: the user can still pan manually.
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(S.t('map_pin'))),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _map,
            options: MapOptions(
              initialCenter: _center,
              initialZoom: _zoom,
              onPositionChanged: (camera, _) => setState(() => _center = camera.center),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'id.co.wangjia.wangjiaApp',
                maxZoom: 19,
              ),
              const RichAttributionWidget(
                attributions: [TextSourceAttribution('© OpenStreetMap contributors')],
              ),
            ],
          ),
          // Fixed pin in the middle: pan the map under it.
          IgnorePointer(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 36),
                child: Icon(Icons.location_pin, size: 44, color: scheme.error),
              ),
            ),
          ),
          if (_locating)
            const Positioned(top: 12, left: 0, right: 0, child: Center(child: CircularProgressIndicator())),
          Positioned(
            left: 16,
            right: 16,
            bottom: 24,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(S.t('map_pin_hint'), style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: 4),
                    Text('${_center.latitude.toStringAsFixed(5)}, ${_center.longitude.toStringAsFixed(5)}',
                        style: const TextStyle(fontFamily: 'monospace')),
                    const SizedBox(height: 8),
                    FilledButton.icon(
                      onPressed: () => Navigator.of(context).pop(_center),
                      icon: const Icon(Icons.check),
                      label: Text(S.t('use_point')),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Small form row showing the current pin and opening the picker.
class MapPinTile extends StatelessWidget {
  final double? lat;
  final double? lng;
  final String addressHint;
  final ValueChanged<LatLng?> onChanged;
  const MapPinTile({super.key, this.lat, this.lng, required this.addressHint, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final has = lat != null && lng != null;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(has ? Icons.location_on : Icons.add_location_alt_outlined,
          color: has ? const Color(0xFF1B8A5A) : null),
      title: Text(S.t('map_pin')),
      subtitle: Text(has ? '${lat!.toStringAsFixed(5)}, ${lng!.toStringAsFixed(5)}' : S.t('not_pinned')),
      trailing: has
          ? IconButton(onPressed: () => onChanged(null), icon: const Icon(Icons.clear), tooltip: S.t('delete'))
          : const Icon(Icons.chevron_right),
      onTap: () async {
        final picked = await Navigator.of(context).push<LatLng>(
          MaterialPageRoute(
            builder: (_) => MapPickerScreen(initial: has ? LatLng(lat!, lng!) : null, addressHint: addressHint),
          ),
        );
        if (picked != null) onChanged(picked);
      },
    );
  }
}
