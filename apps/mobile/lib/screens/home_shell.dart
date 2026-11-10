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
  /// Null while browsing as a guest.
  final Map<String, dynamic>? customer;
  /// Opens the login page, or checks a saved login again.
  final VoidCallback onSignIn;
  const HomeShell({super.key, required this.customer, required this.onSignIn});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;
  final _ordersKey = GlobalKey<OrdersHubScreenState>();

  void _open(int tab) {
    setState(() => _tab = tab);
    // A saved login that could not be checked at start (no signal): try again
    // when the customer's own pages are opened.
    if (tab >= 2 && widget.customer == null && MedusaClient.instance.isLoggedIn) widget.onSignIn();
  }

  void _goToQuotes() {
    _open(2);
    WidgetsBinding.instance.addPostFrameCallback((_) => _ordersKey.currentState?.showQuotes());
  }

  @override
  Widget build(BuildContext context) {
    final customer = widget.customer;
    final pages = <Widget>[
      ProductsScreen(customerId: customer?['id'] as String?, onOpenCart: () => setState(() => _tab = 1)),
      CartScreen(onQuoteRequested: _goToQuotes, onBrowse: () => setState(() => _tab = 0)),
      if (customer == null)
        Scaffold(
          appBar: AppBar(title: Text(S.t('orders'))),
          body: EmptyState(
            icon: Icons.receipt_long_outlined,
            title: S.t('orders_guest'),
            actionLabel: S.t('login_or_register'),
            onAction: widget.onSignIn,
          ),
        )
      else
        OrdersHubScreen(key: _ordersKey, onBrowse: () => setState(() => _tab = 0)),
      _AccountScreen(customer: customer, onSignIn: widget.onSignIn),
    ];
    return Scaffold(
      body: IndexedStack(index: _tab, children: pages),
      bottomNavigationBar: AnimatedBuilder(
        animation: CartStore.instance,
        builder: (context, _) => NavigationBar(
          selectedIndex: _tab,
          onDestinationSelected: _open,
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
  final Map<String, dynamic>? customer;
  final VoidCallback onSignIn;
  const _AccountScreen({required this.customer, required this.onSignIn});

  String get _name => '${customer?['first_name'] ?? ''} ${customer?['last_name'] ?? ''}'.trim();

  String get _initials {
    final parts = _name.split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return 'W';
    return parts.take(2).map((p) => p[0].toUpperCase()).join();
  }

  Widget _tile(BuildContext context, IconData icon, String title, {String? subtitle, VoidCallback? onTap, Widget? trailing, Color? color}) =>
      ListTile(
        leading: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(color: (color ?? const Color(0xFF0E5A8A)).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, size: 20, color: color ?? const Color(0xFF0E5A8A)),
        ),
        title: Text(title, style: TextStyle(color: color, fontWeight: FontWeight.w500)),
        subtitle: subtitle == null ? null : Text(subtitle),
        trailing: trailing ?? (onTap == null ? null : const Icon(Icons.chevron_right, color: Colors.black38)),
        onTap: onTap,
      );

  Widget _group(List<Widget> tiles) => Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            for (var i = 0; i < tiles.length; i++) ...[
              if (i > 0) const Divider(height: 1, indent: 64),
              tiles[i],
            ],
          ],
        ),
      );

  Future<void> _deleteAccount(BuildContext context) async {
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
    } catch (e) {
      if (context.mounted) showSnack(context, friendlyError(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final company = (customer?['company_name'] ?? '').toString();
    return Scaffold(
      appBar: AppBar(title: Text(S.t('account'))),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        children: [
          if (customer == null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(S.t('account_guest'), style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(S.t('account_guest_hint'), style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54)),
                    const SizedBox(height: 14),
                    FilledButton(onPressed: onSignIn, child: Text(S.t('login_or_register'))),
                  ],
                ),
              ),
            )
          else
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(colors: [Color(0xFF0193DE), Color(0xFF0E5A8A)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                      ),
                      alignment: Alignment.center,
                      child: Text(_initials, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_name.isEmpty ? S.t('profile') : _name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                          if ((customer?['email'] ?? '').toString().isNotEmpty)
                            Text('${customer?['email']}', style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54)),
                          if ((customer?['phone'] ?? '').toString().isNotEmpty)
                            Text('${customer?['phone']}', style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54)),
                          if (company.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            StatusChip(company, const Color(0xFF0E5A8A)),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          SectionTitle(S.t('services')),
          _group([
            if (customer != null) ...[
              _tile(context, Icons.location_on_outlined, S.t('addresses'),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AddressesScreen()))),
              _tile(context, Icons.notifications_outlined, S.t('notifications'),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NotificationsScreen()))),
            ],
            _tile(context, Icons.verified_outlined, S.t('warranty'), subtitle: S.t('scan_qr'), color: const Color(0xFF1B8A5A),
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const WarrantyScreen()))),
          ]),
          SectionTitle(S.t('settings')),
          _group([
            _tile(
              context,
              Icons.language,
              S.t('language'),
              trailing: SegmentedButton<String>(
                style: const ButtonStyle(visualDensity: VisualDensity.compact),
                segments: const [
                  ButtonSegment(value: 'id', label: Text('ID')),
                  ButtonSegment(value: 'en', label: Text('EN')),
                ],
                selected: {S.locale.value},
                onSelectionChanged: (s) => S.locale.value = s.first,
              ),
            ),
            _tile(context, Icons.privacy_tip_outlined, S.t('privacy_policy'),
                trailing: const Icon(Icons.open_in_new, size: 18, color: Colors.black38),
                onTap: () => launchUrl(Uri.parse(AppConfig.privacyUrl), mode: LaunchMode.externalApplication)),
            _tile(context, Icons.chat_outlined, S.t('help'), subtitle: 'WhatsApp',
                trailing: const Icon(Icons.open_in_new, size: 18, color: Colors.black38),
                onTap: () => launchUrl(Uri.parse('https://wa.me/${AppConfig.whatsappNumber}'), mode: LaunchMode.externalApplication)),
          ]),
          if (customer != null) ...[
            const SizedBox(height: 18),
            _group([
              _tile(context, Icons.logout, S.t('logout'), color: Colors.black87, onTap: () async {
                await PushService.instance.unregister();
                await MedusaClient.instance.logout();
              }),
              _tile(context, Icons.delete_forever_outlined, S.t('delete_account'), color: theme.colorScheme.error,
                  onTap: () => _deleteAccount(context)),
            ]),
          ],
          const SizedBox(height: 20),
          Text('${S.t('app_version')} ${AppConfig.appVersion}',
              textAlign: TextAlign.center, style: theme.textTheme.bodySmall?.copyWith(color: Colors.black38)),
        ],
      ),
    );
  }
}
