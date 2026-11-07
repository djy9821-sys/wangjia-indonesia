import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/medusa_client.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';

/// Carrier history for the order's shipments (Biteship), with a link to the
/// carrier page when the warehouse entered one.
Future<void> showTrackingSheet(BuildContext context, String orderId) => showModalBottomSheet(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.6,
        maxChildSize: 0.95,
        builder: (context, controller) => _TrackingBody(orderId: orderId, controller: controller),
      ),
    );

class _TrackingBody extends StatefulWidget {
  final String orderId;
  final ScrollController controller;
  const _TrackingBody({required this.orderId, required this.controller});
  @override
  State<_TrackingBody> createState() => _TrackingBodyState();
}

class _TrackingBodyState extends State<_TrackingBody> {
  late Future<List<TrackingInfo>> _future = MedusaClient.instance.tracking(widget.orderId);

  @override
  Widget build(BuildContext context) => FutureBuilder<List<TrackingInfo>>(
        future: _future,
        builder: (context, snap) {
          if (snap.hasError) {
            return ErrorRetry(
              error: snap.error!,
              onRetry: () => setState(() {
                _future = MedusaClient.instance.tracking(widget.orderId);
              }),
            );
          }
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final list = snap.data!;
          return ListView(
            controller: widget.controller,
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            children: [
              Text(S.t('tracking'), style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              if (list.isEmpty) Text(S.t('no_tracking')),
              for (final t in list) ...[
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.local_shipping_outlined),
                  title: Text('${(t.courier ?? '').toUpperCase()} ${t.trackingNumber}'.trim()),
                  subtitle: t.status != null ? Text(t.status!) : null,
                  trailing: t.trackingUrl != null
                      ? IconButton(
                          onPressed: () => launchUrl(Uri.parse(t.trackingUrl!), mode: LaunchMode.externalApplication),
                          icon: const Icon(Icons.open_in_new),
                          tooltip: S.t('open_carrier'),
                        )
                      : null,
                ),
                if (t.history.isEmpty)
                  Padding(
                    padding: const EdgeInsets.only(left: 8, bottom: 12),
                    child: Text(S.t('no_history'), style: Theme.of(context).textTheme.bodySmall),
                  )
                else
                  ...t.history.reversed.map((h) => Padding(
                        padding: const EdgeInsets.only(left: 8, bottom: 10),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Padding(padding: EdgeInsets.only(top: 5), child: Icon(Icons.circle, size: 8)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(h.note ?? h.status ?? ''),
                                  Text(dateTime(h.time), style: Theme.of(context).textTheme.bodySmall),
                                ],
                              ),
                            ),
                          ],
                        ),
                      )),
                const Divider(),
              ],
            ],
          );
        },
      );
}
