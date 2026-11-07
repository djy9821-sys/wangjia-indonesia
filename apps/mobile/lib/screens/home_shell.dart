import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../l10n/strings.dart';
import '../cart.dart';
import 'cart_screen.dart';
import 'orders_hub_screen.dart';
import 'products_screen.dart';

class HomeShell extends StatefulWidget {
  final Map<String, dynamic> customer;
  final VoidCallback onLoggedOut;
  const HomeShell({super.key, required this.customer, required this.onLoggedOut});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;
  final _ordersKey = GlobalKey<OrdersHubScreenState>();

  void _goToQuotes() {
    setState(() => _tab = 2);
    WidgetsBinding.instance.addPostFrameCallback((_) => _ordersKey.currentState?.showQuotes());
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      ProductsScreen(onOpenCart: () => setState(() => _tab = 1)),
      CartScreen(onQuoteRequested: _goToQuotes),
      OrdersHubScreen(key: _ordersKey),
      _AccountScreen(customer: widget.customer, onLoggedOut: widget.onLoggedOut),
    ];
    return Scaffold(
      body: IndexedStack(index: _tab, children: pages),
      bottomNavigationBar: AnimatedBuilder(
        animation: CartStore.instance,
        builder: (context, _) => NavigationBar(
          selectedIndex: _tab,
          onDestinationSelected: (i) => setState(() => _tab = i),
          destinations: [
            NavigationDestination(icon: const Icon(Icons.water_outlined), label: S.t('products')),
            NavigationDestination(
              icon: Badge.count(
                count: CartStore.instance.count,
                isLabelVisible: CartStore.instance.count > 0,
                child: const Icon(Icons.shopping_cart_outlined),
              ),
              label: S.t('cart'),
            ),
            NavigationDestination(icon: const Icon(Icons.receipt_long_outlined), label: S.t('orders')),
            NavigationDestination(icon: const Icon(Icons.person_outline), label: S.t('account')),
          ],
        ),
      ),
    );
  }
}

class _AccountScreen extends StatelessWidget {
  final Map<String, dynamic> customer;
  final VoidCallback onLoggedOut;
  const _AccountScreen({required this.customer, required this.onLoggedOut});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(S.t('account'))),
        body: ListView(
          children: [
            ListTile(
              leading: const CircleAvatar(child: Icon(Icons.person)),
              title: Text('${customer['first_name'] ?? ''} ${customer['last_name'] ?? ''}'.trim()),
              subtitle: Text('${customer['email'] ?? ''}\n${customer['phone'] ?? ''}'.trim()),
              isThreeLine: true,
            ),
            if ((customer['company_name'] ?? '').toString().isNotEmpty)
              ListTile(leading: const Icon(Icons.business), title: Text('${customer['company_name']}')),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.language),
              title: Text(S.t('language')),
              trailing: SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'id', label: Text('ID')),
                  ButtonSegment(value: 'en', label: Text('EN')),
                ],
                selected: {S.locale.value},
                onSelectionChanged: (s) => S.locale.value = s.first,
              ),
            ),
            ListTile(
              leading: const Icon(Icons.logout),
              title: Text(S.t('logout')),
              onTap: () async {
                await MedusaClient.instance.logout();
                onLoggedOut();
              },
            ),
          ],
        ),
      );
}
