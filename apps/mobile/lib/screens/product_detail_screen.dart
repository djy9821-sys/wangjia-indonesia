import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/medusa_client.dart';
import '../cart.dart';
import '../config.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';
import '../widgets/wangjia_logo.dart';

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

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    return Scaffold(
      appBar: AppBar(
        title: Text(p.title),
        actions: [IconButton(onPressed: _share, icon: const Icon(Icons.share_outlined), tooltip: S.t('share'))],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _Gallery(images: p.images),
          const SizedBox(height: 16),
          Text(p.title, style: Theme.of(context).textTheme.headlineSmall),
          if (p.subtitle != null && p.subtitle!.isNotEmpty)
            Text(p.subtitle!, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.black54)),
          const SizedBox(height: 8),
          Text(
            _variant.price == null ? S.t('ask_price') : money(_variant.price, _variant.currency),
            style: Theme.of(context).textTheme.titleLarge?.copyWith(color: const Color(0xFF0E5A8A)),
          ),
          const SizedBox(height: 16),
          if (p.variants.length > 1) ...[
            Text(S.t('capacity'), style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: p.variants
                  .map((v) => ChoiceChip(
                        label: Text(v.title),
                        selected: v.id == _variant.id,
                        onSelected: (_) => setState(() => _variant = v),
                      ))
                  .toList(),
            ),
            const SizedBox(height: 16),
          ],
          Row(
            children: [
              Text(S.t('quantity'), style: Theme.of(context).textTheme.titleSmall),
              const Spacer(),
              IconButton(onPressed: _qty > 1 ? () => setState(() => _qty--) : null, icon: const Icon(Icons.remove_circle_outline)),
              Text('$_qty', style: Theme.of(context).textTheme.titleMedium),
              IconButton(onPressed: () => setState(() => _qty++), icon: const Icon(Icons.add_circle_outline)),
            ],
          ),
          const SizedBox(height: 16),
          if (p.specs.isNotEmpty) ...[
            Text(S.t('specs'), style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            _SpecTable(specs: p.specs),
            const SizedBox(height: 16),
          ],
          if (p.description != null && p.description!.isNotEmpty) ...[
            Text(S.t('description'), style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(p.description!, style: Theme.of(context).textTheme.bodyMedium),
          ],
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _busy
                ? null
                : () {
                    CartStore.instance.add(CartItem.fromProduct(p, _variant, _qty));
                    showSnack(context, S.t('added_to_cart'));
                  },
            icon: const Icon(Icons.add_shopping_cart),
            label: Text(S.t('add_to_cart')),
          ),
          const SizedBox(height: 10),
          FilledButton.tonalIcon(
            onPressed: _busy
                ? null
                : () {
                    CartStore.instance.add(CartItem.fromProduct(p, _variant, _qty));
                    Navigator.of(context).popUntil((r) => r.isFirst);
                    widget.onOpenCart?.call();
                  },
            icon: const Icon(Icons.shopping_cart_checkout),
            label: Text(S.t('order_now')),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: _busy ? null : _requestQuote,
            icon: const Icon(Icons.request_quote_outlined),
            label: Text(S.t('request_quote')),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: _whatsapp,
            icon: const Icon(Icons.chat_outlined),
            label: Text(S.t('chat_whatsapp')),
          ),
        ],
      ),
    );
  }
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
        aspectRatio: 16 / 9,
        child: Container(
          decoration: BoxDecoration(color: const Color(0xFFE3EEF5), borderRadius: BorderRadius.circular(12)),
          child: const Center(child: WangjiaLogo(size: 96, withText: false)),
        ),
      );
    }
    return Column(
      children: [
        AspectRatio(
          aspectRatio: 4 / 3,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: PageView.builder(
              itemCount: widget.images.length,
              onPageChanged: (i) => setState(() => _index = i),
              itemBuilder: (_, i) => GestureDetector(
                onTap: () => _openFull(i),
                child: CachedNetworkImage(imageUrl: widget.images[i],
                  fit: BoxFit.cover,
                  placeholder: (_, __) => const Center(child: CircularProgressIndicator()),
                  errorWidget: (_, __, ___) => const Center(child: Icon(Icons.broken_image_outlined)),
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
                    color: i == _index ? const Color(0xFF0E5A8A) : Colors.black26,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ),
      ],
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
