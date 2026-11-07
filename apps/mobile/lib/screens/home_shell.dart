import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../widgets/common.dart';

import '../api/medusa_client.dart';
import '../l10n/strings.dart';
import '../cart.dart';
import '../push.dart';
import 'cart_screen.dart';
import 'orders_hub_screen.dart';
import 'products_screen.dart';
import 'addresses_screen.dart';
import 'warranty_screen.dart';
import 'notifications_screen.dart';

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
              leading: const Icon(Icons.location_on_outlined),
              title: Text(S.t('addresses')),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AddressesScreen())),
            ),
            ListTile(
              leading: const Icon(Icons.notifications_outlined),
              title: Text(S.t('notifications')),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NotificationsScreen())),
            ),
            ListTile(
              leading: const Icon(Icons.verified_outlined),
              title: Text(S.t('warranty')),
              subtitle: Text(S.t('scan_qr')),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const WarrantyScreen())),
            ),
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
              leading: const Icon(Icons.privacy_tip_outlined),
              title: Text(S.t('privacy_policy')),
              trailing: const Icon(Icons.open_in_new, size: 18),
              onTap: () => launchUrl(Uri.parse(AppConfig.privacyUrl), mode: LaunchMode.externalApplication),
            ),
            ListTile(
              leading: const Icon(Icons.logout),
              title: Text(S.t('logout')),
              onTap: () async {
                await PushService.instance.unregister();
                await MedusaClient.instance.logout();
                onLoggedOut();
              },
            ),
            ListTile(
              leading: Icon(Icons.delete_forever_outlined, color: Theme.of(context).colorScheme.error),
              title: Text(S.t('delete_account'), style: TextStyle(color: Theme.of(context).colorScheme.error)),
              onTap: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: Text(S.t('delete_account')),
                    content: Text(S.t('delete_account_confirm')),
                    actions: [
                      TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: Text(S.t('cancel'))),
                      FilledButton(
                        style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
                        onPressed: () => Navigator.of(ctx).pop(true),
                        child: Text(S.t('delete')),
                      ),
                    ],
                  ),
                );
                if (ok != true || !context.mounted) return;
                try {
                  await PushService.instance.unregister();
                  await MedusaClient.instance.deleteAccount();
                  if (context.mounted) showSnack(context, S.t('delete_account_done'));
                  onLoggedOut();
                } catch (e) {
                  if (context.mounted) showSnack(context, friendlyError(e));
                }
              },
            ),
          ],
        ),
      );
}
