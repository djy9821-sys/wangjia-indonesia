import 'package:flutter/material.dart';

import '../l10n/strings.dart';
import 'orders_screen.dart';
import 'quotes_screen.dart';

/// "Pesanan" tab: orders and quotes side by side.
class OrdersHubScreen extends StatefulWidget {
  final int initialTab;
  const OrdersHubScreen({super.key, this.initialTab = 0});
  @override
  State<OrdersHubScreen> createState() => OrdersHubScreenState();
}

class OrdersHubScreenState extends State<OrdersHubScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 2, vsync: this, initialIndex: widget.initialTab);
  final _quotesKey = GlobalKey<QuotesScreenState>();

  void showQuotes() {
    _tabs.animateTo(1);
    _quotesKey.currentState?.reload();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: Text(S.t('orders')),
          bottom: TabBar(
            controller: _tabs,
            tabs: [Tab(text: S.t('orders')), Tab(text: S.t('quotes'))],
          ),
        ),
        body: TabBarView(
          controller: _tabs,
          children: [
            const OrdersScreen(embedded: true),
            QuotesScreen(key: _quotesKey),
          ],
        ),
      );
}
