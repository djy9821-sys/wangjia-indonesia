import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/medusa_client.dart';
import '../cart.dart';
import '../config.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/brand.dart';
import '../widgets/common.dart';
import '../widgets/wangjia_logo.dart';
import 'login_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;
  final VoidCallback? onOpenCart;
  const ProductDetailScreen({super.key, required this.product, this.onOpenCart});
  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late Variant _variant = widget.product.variants.first;
  int _qty = 1;
  bool _busy = false;

  Future<void> _requestQuote() async {
    if (!await ensureSignedIn(context)) return;
    if (!mounted) return;
    setState(() => _busy = true);
    try {
      final cartId = await MedusaClient.instance.createCartWithItem(_variant.id, _qty);
      await MedusaClient.instance.requestQuote(cartId);
      if (mounted) showSnack(context, S.t('quote_requested'));
    } catch (e) {
      if (mounted) showSnack(context, friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _whatsapp() async {
    final text = Uri.encodeComponent(
      'Halo WANGJIA, saya tertarik dengan ${widget.product.title} (${_variant.title}) x$_qty. Mohon info harga dan pengiriman.',
    );
    final uri = Uri.parse('https://wa.me/${AppConfig.whatsappNumber}?text=$text');
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication) && mounted) {
      showSnack(context, S.t('error'));
    }
  }

  /// Farmers recommend equipment to each other on WhatsApp: share the
  /// product page link with the price in one tap.
  Future<void> _share() async {
    final p = widget.product;
    final link = p.handle == null ? AppConfig.storefrontUrl : '${AppConfig.storefrontUrl}/id/products/${p.handle}';
    final price = p.minPrice == null ? '' : ' ${S.t('from')} ${money(p.minPrice)}.';
    final text = Uri.encodeComponent('${p.title} - WANGJIA Kincir Air.$price $link');
    await launchUrl(Uri.parse('https://wa.me/?text=$text'), mode: LaunchMode.externalApplication);
  }

  void _addToCart({bool goToCart = false}) {
    final p = widget.product;
    CartStore.instance.add(CartItem.fromProduct(p, _variant, _qty));
    if (goToCart) {
      Navigator.of(context).popUntil((r) => r.isFirst);
      widget.onOpenCart?.call();
    } else {
      showSnack(context, S.t('added_to_cart'));
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final theme = Theme.of(context);
    final price = _variant.price;
    return Scaffold(
      backgroundColor: Brand.bg,
      appBar: AppBar(
        title: Text(p.title, style: const TextStyle(fontSize: 16)),
        actions: [IconButton(onPressed: _share, icon: const Icon(Icons.share_outlined), tooltip: S.t('share'))],
      ),
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          _Gallery(images: p.images),
          // Price block: accent price first, like a marketplace listing.
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      price == null ? S.t('ask_price') : money(price, _variant.currency),
                      style: const TextStyle(color: Brand.accent, fontSize: 26, fontWeight: FontWeight.w800, height: 1),
                    ),
                    const SizedBox(width: 8),
                    if (p.variants.length > 1)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 3),
                        child: Text(_variant.title, style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54)),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(S.t('price_note'), style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54)),
                const SizedBox(height: 10),
                Text(p.title, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, height: 1.2)),
                if (p.subtitle != null && p.subtitle!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(p.subtitle!, style: theme.textTheme.bodyMedium?.copyWith(color: Colors.black54)),
                  ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _Trust(Icons.verified_user_outlined, S.t('badge_warranty')),
                    _Trust(Icons.payments_outlined, S.t('badge_installment')),
                    _Trust(Icons.local_shipping_outlined, S.t('badge_shipping')),
                    _Trust(Icons.qr_code_2, S.t('badge_qr')),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (p.variants.length > 1) ...[
                  Text(S.t('capacity'), style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: p.variants.map((v) {
                      final selected = v.id == _variant.id;
                      return InkWell(
                        borderRadius: BorderRadius.circular(10),
                        onTap: () => setState(() => _variant = v),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                          decoration: BoxDecoration(
                            color: selected ? Brand.accentSoft : Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: selected ? Brand.accent : Brand.line, width: selected ? 1.5 : 1),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(v.title, style: TextStyle(fontWeight: FontWeight.w700, color: selected ? Brand.accentDark : Colors.black87)),
                              if (v.price != null)
                                Text(money(v.price, v.currency), style: TextStyle(fontSize: 11.5, color: selected ? Brand.accentDark : Colors.black54)),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),
                ],
                Row(
                  children: [
                    Text(S.t('quantity'), style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                    const Spacer(),
                    _QtyButton(icon: Icons.remove, onTap: _qty > 1 ? () => setState(() => _qty--) : null),
                    SizedBox(width: 44, child: Text('$_qty', textAlign: TextAlign.center, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700))),
                    _QtyButton(icon: Icons.add, onTap: () => setState(() => _qty++)),
                  ],
                ),
                const SizedBox(height: 10),
                InkWell(
                  onTap: _busy ? null : _requestQuote,
                  child: Row(
                    children: [
                      const Icon(Icons.request_quote_outlined, size: 18, color: Brand.navy),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(S.t('wholesale_quote'), style: const TextStyle(color: Brand.navy, fontWeight: FontWeight.w600, fontSize: 13)),
                      ),
                      const Icon(Icons.chevron_right, color: Brand.navy),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (p.specs.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(S.t('specs'), style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 10),
                  _SpecTable(specs: p.specs),
                ],
              ),
            ),
          ],
          if (p.description != null && p.description!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(S.t('description'), style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Text(p.description!, style: theme.textTheme.bodyMedium?.copyWith(height: 1.45)),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
        ],
      ),
      // Sticky buy bar: chat · cart · add · buy now.
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
          decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: Brand.line))),
          child: Row(
            children: [
              _BarIcon(icon: Icons.chat_outlined, label: 'Chat', onTap: _whatsapp),
              _BarIcon(icon: Icons.shopping_cart_outlined, label: S.t('cart'), onTap: () {
                Navigator.of(context).popUntil((r) => r.isFirst);
                widget.onOpenCart?.call();
              }),
              const SizedBox(width: 6),
              Expanded(
                child: SizedBox(
                  height: 44,
                  child: OutlinedButton(
                    onPressed: _busy ? null : () => _addToCart(),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Brand.accentDark,
                      backgroundColor: Brand.accentSoft,
                      side: const BorderSide(color: Brand.accent),
                      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.horizontal(left: Radius.circular(10))),
                      padding: EdgeInsets.zero,
                    ),
                    child: Text('+ ${S.t('cart')}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                  ),
                ),
              ),
              Expanded(
                child: SizedBox(
                  height: 44,
                  child: FilledButton(
                    onPressed: _busy ? null : () => _addToCart(goToCart: true),
                    style: FilledButton.styleFrom(
                      backgroundColor: Brand.accent,
                      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.horizontal(right: Radius.circular(10))),
                      padding: EdgeInsets.zero,
                    ),
                    child: Text(S.t('buy_now'), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  const _QtyButton({required this.icon, this.onTap});
  @override
  Widget build(BuildContext context) => InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), border: Border.all(color: Brand.line)),
          child: Icon(icon, size: 18, color: onTap == null ? Colors.black26 : Colors.black87),
        ),
      );
}

class _BarIcon extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _BarIcon({required this.icon, required this.label, required this.onTap});
  @override
  Widget build(BuildContext context) => InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: SizedBox(
          width: 52,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: Brand.navy, size: 22),
              Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 10, color: Brand.navy)),
            ],
          ),
        ),
      );
}

/// Swipeable image gallery with dots; tap opens a zoomable full-screen view.
class _Gallery extends StatefulWidget {
  final List<String> images;
  const _Gallery({required this.images});
  @override
  State<_Gallery> createState() => _GalleryState();
}

class _GalleryState extends State<_Gallery> {
  int _index = 0;

  void _openFull(int start) {
    Navigator.of(context).push(MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(backgroundColor: Colors.black, foregroundColor: Colors.white),
        body: PageView.builder(
          controller: PageController(initialPage: start),
          itemCount: widget.images.length,
          itemBuilder: (_, i) => InteractiveViewer(
            minScale: 1,
            maxScale: 5,
            child: Center(child: CachedNetworkImage(imageUrl: widget.images[i], fit: BoxFit.contain)),
          ),
        ),
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) {
      return AspectRatio(
        aspectRatio: 1,
        child: Container(
          color: const Color(0xFFE3EEF5),
          child: const Center(child: WangjiaLogo(size: 96, withText: false)),
        ),
      );
    }
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
      children: [
        AspectRatio(
          aspectRatio: 1,
          child: ClipRRect(
            borderRadius: BorderRadius.zero,
            child: PageView.builder(
              itemCount: widget.images.length,
              onPageChanged: (i) => setState(() => _index = i),
              itemBuilder: (_, i) => GestureDetector(
                onTap: () => _openFull(i),
                child: Container(
                  color: Colors.white,
                  child: CachedNetworkImage(imageUrl: widget.images[i],
                    fit: BoxFit.contain,
                    placeholder: (_, __) => const Center(child: CircularProgressIndicator()),
                    errorWidget: (_, __, ___) => const Center(child: Icon(Icons.broken_image_outlined)),
                  ),
                ),
              ),
            ),
          ),
        ),
        if (widget.images.length > 1)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                widget.images.length,
                (i) => Container(
                  width: i == _index ? 18 : 7,
                  height: 7,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  decoration: BoxDecoration(
                    color: i == _index ? Brand.accent : Colors.black26,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ),
      ],
    ),
    );
  }
}

class _SpecTable extends StatelessWidget {
  final List<(String, String)> specs;
  const _SpecTable({required this.specs});

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          border: Border.all(color: Colors.black12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            for (var i = 0; i < specs.length; i++)
              Container(
                color: i.isEven ? const Color(0xFFF5F8FA) : Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 140,
                      child: Text(specs[i].$1, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.black54)),
                    ),
                    Expanded(child: Text(specs[i].$2, style: Theme.of(context).textTheme.bodyMedium)),
                  ],
                ),
              ),
          ],
        ),
      );
}

class _Trust extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Trust(this.icon, this.label);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: const Color(0xFFD6E2EB)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: const Color(0xFF1B8A5A)),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ],
        ),
      );
}
