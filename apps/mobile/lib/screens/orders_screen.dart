import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';
import 'order_detail_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});
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
        appBar: AppBar(title: Text(S.t('orders'))),
        body: FutureBuilder<List<Order>>(
          future: _future,
          builder: (context, snap) {
            if (snap.hasError) return ErrorRetry(error: snap.error!, onRetry: _reload);
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            final orders = snap.data!;
            if (orders.isEmpty) return Center(child: Text(S.t('no_orders')));
            return RefreshIndicator(
              onRefresh: _reload,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: orders.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, i) {
                  final o = orders[i];
                  final fs = o.fulfillmentStatus ?? 'not_fulfilled';
                  return Card(
                    child: ListTile(
                      title: Text('${S.t('order')} #${o.displayId}'),
                      subtitle: Text('${shortDate(o.createdAt)} · ${o.items.map((e) => '${e.title} ×${e.quantity}').join(', ')}'),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(money(o.total, o.currency), style: Theme.of(context).textTheme.titleSmall),
                          const SizedBox(height: 4),
                          StatusChip(S.t('fulfillment_$fs'), fulfillmentColor(fs)),
                        ],
                      ),
                      onTap: () => Navigator.of(context)
                          .push(MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: o.id)))
                          .then((_) => _reload()),
                    ),
                  );
                },
              ),
            );
          },
        ),
      );
}
