import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/medusa_client.dart';
import '../config.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';
import '../widgets/wangjia_logo.dart';
import 'checkout_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;
  const ProductDetailScreen({super.key, required this.product});
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
      if (mounted) showSnack(context, '$e');
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

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    return Scaffold(
      appBar: AppBar(title: Text(p.title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: p.images.isNotEmpty
                  ? PageView(children: p.images.map((u) => Image.network(u, fit: BoxFit.cover)).toList())
                  : Container(
                      color: const Color(0xFFE3EEF5),
                      child: const Center(child: WangjiaLogo(size: 96, withText: false)),
                    ),
            ),
          ),
          const SizedBox(height: 16),
          Text(p.title, style: Theme.of(context).textTheme.headlineSmall),
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
          if (p.description != null) Text(p.description!, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _busy
                ? null
                : () => Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => CheckoutScreen(product: p, variant: _variant, quantity: _qty),
                    )),
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
