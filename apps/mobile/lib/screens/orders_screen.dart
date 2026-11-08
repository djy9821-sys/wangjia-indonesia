import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';
import '../widgets/wangjia_logo.dart';
import 'order_detail_screen.dart';

class OrdersScreen extends StatefulWidget {
  final bool embedded;
  /// Shown on the empty state ("Lihat produk") to jump back to the catalogue.
  final VoidCallback? onBrowse;
  const OrdersScreen({super.key, this.embedded = false, this.onBrowse});
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  late Future<List<Order>> _future = MedusaClient.instance.orders();

  Future<void> _reload() async {
    setState(() {
      _future = MedusaClient.instance.orders();
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: widget.embedded ? null : AppBar(title: Text(S.t('orders'))),
        body: FutureBuilder<List<Order>>(
          future: _future,
          builder: (context, snap) {
            if (snap.hasError) return ErrorRetry(error: snap.error!, onRetry: _reload);
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            final orders = snap.data!;
            if (orders.isEmpty) {
              return EmptyState(
                icon: Icons.receipt_long_outlined,
                title: S.t('no_orders'),
                subtitle: S.t('no_orders_hint'),
                actionLabel: widget.onBrowse == null ? null : S.t('browse_products'),
                onAction: widget.onBrowse,
              );
            }
            return RefreshIndicator(
              onRefresh: _reload,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: orders.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, i) => _OrderCard(
                  order: orders[i],
                  onTap: () => Navigator.of(context)
                      .push(MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: orders[i].id)))
                      .then((_) => _reload()),
                ),
              ),
            );
          },
        ),
      );
}

class _OrderCard extends StatelessWidget {
  final Order order;
  final VoidCallback onTap;
  const _OrderCard({required this.order, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final fs = order.fulfillmentStatus ?? 'not_fulfilled';
    final ps = order.paymentStatus;
    final thumb = order.items.map((e) => e.thumbnail).where((t) => t != null && t.isNotEmpty).firstOrNull;
    final qty = order.items.fold<int>(0, (a, e) => a + e.quantity);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: 64,
                  height: 64,
                  color: const Color(0xFFF4F8FB),
                  child: thumb != null
                      ? CachedNetworkImage(imageUrl: thumb, fit: BoxFit.cover)
                      : const Center(child: WangjiaLogo(size: 36, withText: false)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text('${S.t('order')} #${order.displayId}',
                              style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                        ),
                        Text(money(order.total, order.currency),
                            style: theme.textTheme.titleSmall?.copyWith(color: const Color(0xFF0E5A8A), fontWeight: FontWeight.w700)),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${shortDate(order.createdAt)} · $qty ${S.t('items_count')}',
                      style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      order.items.map((e) => '${e.title} ×${e.quantity}').join(', '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall,
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        StatusChip(S.t('fulfillment_$fs'), fulfillmentColor(fs)),
                        if (ps != null && ps.isNotEmpty) StatusChip(S.t('payment_$ps'), paymentColor(ps)),
                      ],
                    ),
                  ],
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(left: 4, top: 20),
                child: Icon(Icons.chevron_right, color: Colors.black38),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
