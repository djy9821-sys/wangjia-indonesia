import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';

/// Serial numbers the warehouse packed for this order, with one-tap warranty
/// registration (the unit is already tied to the buyer's order, so no QR scan
/// is needed).
class OrderUnitsSection extends StatefulWidget {
  final String orderId;
  const OrderUnitsSection({super.key, required this.orderId});
  @override
  State<OrderUnitsSection> createState() => _OrderUnitsSectionState();
}

class _OrderUnitsSectionState extends State<OrderUnitsSection> {
  late Future<List<WarrantyUnit>> _future = MedusaClient.instance.orderWarrantyUnits(widget.orderId);
  final _busy = <String>{};

  Future<void> _register(WarrantyUnit u) async {
    setState(() => _busy.add(u.id));
    try {
      await MedusaClient.instance.registerWarrantyUnit(u.id);
      if (!mounted) return;
      showSnack(context, S.t('registered_ok'));
      setState(() {
        _future = MedusaClient.instance.orderWarrantyUnits(widget.orderId);
      });
    } catch (e) {
      if (mounted) showSnack(context, friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy.remove(u.id));
    }
  }

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(S.t('order_units'), style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 4),
          Text(S.t('order_units_hint'), style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          FutureBuilder<List<WarrantyUnit>>(
            future: _future,
            builder: (context, snap) {
              if (snap.hasError) return Text('${snap.error}', style: Theme.of(context).textTheme.bodySmall);
              if (!snap.hasData) return const LinearProgressIndicator();
              final list = snap.data!;
              if (list.isEmpty) {
                return Text(S.t('order_units_none'), style: TextStyle(color: Theme.of(context).colorScheme.outline));
              }
              return Column(
                children: [
                  for (final u in list)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(u.registered ? Icons.verified : Icons.verified_outlined,
                          color: u.registered ? const Color(0xFF1B8A5A) : null),
                      title: Text(u.serial, style: const TextStyle(fontFamily: 'monospace')),
                      subtitle: Text(u.registered
                          ? '${u.title}\n${S.t('warranty_until')}: ${shortDate(u.warrantyExpiresAt)}'
                          : u.title),
                      isThreeLine: u.registered,
                      trailing: u.registered
                          ? StatusChip(u.registeredToMe ? S.t('registered_to_you') : S.t('active'), const Color(0xFF1B8A5A))
                          : FilledButton.tonal(
                              onPressed: _busy.contains(u.id) ? null : () => _register(u),
                              child: Text(S.t('register_now')),
                            ),
                    ),
                ],
              );
            },
          ),
        ],
      );
}
