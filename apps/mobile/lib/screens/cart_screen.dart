import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../cart.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../widgets/brand.dart';
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
                    padding: const EdgeInsets.all(12),
                    itemCount: cart.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, i) {
                      final it = cart.items[i];
                      return Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 76,
                              height: 76,
                              clipBehavior: Clip.antiAlias,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Brand.line),
                              ),
                              child: it.thumbnail != null
                                  ? CachedNetworkImage(imageUrl: it.thumbnail!, fit: BoxFit.contain)
                                  : const WangjiaLogo(size: 56, withText: false),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(it.productTitle, maxLines: 2, overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, height: 1.25)),
                                  if (variantLabel(it.variantTitle) != null) ...[
                                    const SizedBox(height: 2),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(color: Brand.bg, borderRadius: BorderRadius.circular(4)),
                                      child: Text(variantLabel(it.variantTitle)!, style: const TextStyle(fontSize: 11, color: Colors.black54)),
                                    ),
                                  ],
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(money(it.price, it.currency),
                                            style: const TextStyle(color: Brand.accent, fontSize: 15, fontWeight: FontWeight.w800)),
                                      ),
                                      _Stepper(
                                        value: it.quantity,
                                        onMinus: () => cart.setQuantity(it.variantId, it.quantity - 1),
                                        onPlus: () => cart.setQuantity(it.variantId, it.quantity + 1),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              onPressed: () => cart.remove(it.variantId),
                              icon: const Icon(Icons.delete_outline, size: 20, color: Colors.black38),
                              tooltip: S.t('remove'),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                // Sticky summary bar, marketplace style.
                Container(
                  decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: Brand.line))),
                  child: SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(S.t('subtotal'), style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                Text(money(cart.total, cart.currency),
                                    style: const TextStyle(color: Brand.accent, fontSize: 19, fontWeight: FontWeight.w800)),
                                InkWell(
                                  onTap: _busy ? null : _requestQuote,
                                  child: Text(S.t('request_quote_cart'),
                                      style: const TextStyle(fontSize: 12, color: Brand.navy, fontWeight: FontWeight.w600)),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(
                            width: 170,
                            child: FilledButton(
                              onPressed: _busy
                                  ? null
                                  : () => Navigator.of(context).push(MaterialPageRoute(
                                        builder: (_) => CheckoutScreen(items: List.of(cart.items)),
                                      )),
                              child: Text('${S.t('checkout_short')} (${cart.count})'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      );
}

class _Stepper extends StatelessWidget {
  final int value;
  final VoidCallback onMinus, onPlus;
  const _Stepper({required this.value, required this.onMinus, required this.onPlus});
  Widget _btn(IconData icon, VoidCallback onTap) => InkWell(
        onTap: onTap,
        child: SizedBox(width: 28, height: 28, child: Icon(icon, size: 16, color: Colors.black87)),
      );
  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(border: Border.all(color: Brand.line), borderRadius: BorderRadius.circular(6)),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _btn(Icons.remove, onMinus),
            Container(width: 1, height: 28, color: Brand.line),
            SizedBox(width: 32, child: Text('$value', textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700))),
            Container(width: 1, height: 28, color: Brand.line),
            _btn(Icons.add, onPlus),
          ],
        ),
      );
}
