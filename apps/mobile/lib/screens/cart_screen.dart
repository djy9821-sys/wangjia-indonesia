import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../cart.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../widgets/common.dart';
import '../widgets/wangjia_logo.dart';
import 'checkout_screen.dart';

class CartScreen extends StatefulWidget {
  /// Called after a quote request so the shell can switch to the quotes tab.
  final VoidCallback? onQuoteRequested;
  final VoidCallback? onBrowse;
  const CartScreen({super.key, this.onQuoteRequested, this.onBrowse});
  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final cart = CartStore.instance;
  bool _busy = false;

  Future<void> _requestQuote() async {
    setState(() => _busy = true);
    try {
      final api = MedusaClient.instance;
      final cartId = await api.createCartFromItems(cart.items);
      await api.requestQuote(cartId);
      cart.clear();
      if (!mounted) return;
      showSnack(context, S.t('quote_requested'));
      widget.onQuoteRequested?.call();
    } catch (e) {
      if (mounted) showSnack(context, friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(S.t('cart'))),
        body: AnimatedBuilder(
          animation: cart,
          builder: (context, _) {
            if (cart.isEmpty) {
              return EmptyState(
                icon: Icons.shopping_cart_outlined,
                title: S.t('cart_empty'),
                subtitle: S.t('cart_empty_hint'),
                actionLabel: widget.onBrowse == null ? null : S.t('browse_products'),
                onAction: widget.onBrowse,
              );
            }
            return Column(
              children: [
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: cart.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) {
                      final it = cart.items[i];
                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: it.thumbnail != null
                                    ? CachedNetworkImage(imageUrl: it.thumbnail!, width: 56, height: 56, fit: BoxFit.cover)
                                    : const WangjiaLogo(size: 56, withText: false),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(it.productTitle, style: Theme.of(context).textTheme.titleSmall),
                                    Text(it.variantTitle, style: Theme.of(context).textTheme.bodySmall),
                                    const SizedBox(height: 4),
                                    Text(money(it.lineTotal, it.currency),
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color(0xFF0E5A8A))),
                                  ],
                                ),
                              ),
                              Column(
                                children: [
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      IconButton(
                                        visualDensity: VisualDensity.compact,
                                        onPressed: () => cart.setQuantity(it.variantId, it.quantity - 1),
                                        icon: const Icon(Icons.remove_circle_outline),
                                      ),
                                      Text('${it.quantity}'),
                                      IconButton(
                                        visualDensity: VisualDensity.compact,
                                        onPressed: () => cart.setQuantity(it.variantId, it.quantity + 1),
                                        icon: const Icon(Icons.add_circle_outline),
                                      ),
                                    ],
                                  ),
                                  TextButton(
                                    onPressed: () => cart.remove(it.variantId),
                                    child: Text(S.t('remove')),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Text(S.t('subtotal'), style: Theme.of(context).textTheme.titleMedium),
                            const Spacer(),
                            Text(money(cart.total, cart.currency), style: Theme.of(context).textTheme.titleMedium),
                          ],
                        ),
                        const SizedBox(height: 10),
                        FilledButton.icon(
                          onPressed: _busy
                              ? null
                              : () => Navigator.of(context).push(MaterialPageRoute(
                                    builder: (_) => CheckoutScreen(items: List.of(cart.items)),
                                  )),
                          icon: const Icon(Icons.shopping_cart_checkout),
                          label: Text(S.t('continue_checkout')),
                        ),
                        const SizedBox(height: 8),
                        OutlinedButton.icon(
                          onPressed: _busy ? null : _requestQuote,
                          icon: const Icon(Icons.request_quote_outlined),
                          label: Text(S.t('request_quote_cart')),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      );
}
