import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';
import '../widgets/wangjia_logo.dart';
import 'product_detail_screen.dart';

class ProductsScreen extends StatefulWidget {
  final VoidCallback? onOpenCart;
  /// Pre-select the category whose name contains this text (e.g. spare parts
  /// opened from a registered machine).
  final String? initialCategoryName;
  const ProductsScreen({super.key, this.onOpenCart, this.initialCategoryName});
  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  late Future<List<Product>> _future = MedusaClient.instance.products();
  late final Future<List<Category>> _categories = MedusaClient.instance.categories().then((cats) {
    final want = widget.initialCategoryName?.toLowerCase();
    if (want != null && _categoryId == null) {
      final hit = cats.where((c) => c.name.toLowerCase().contains(want)).firstOrNull;
      if (hit != null && mounted) setState(() => _categoryId = hit.id);
    }
    return cats;
  });
  String? _categoryId;

  Future<void> _reload() async {
    setState(() {
      _future = MedusaClient.instance.products();
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(S.t('products'))),
        body: FutureBuilder<List<Product>>(
          future: _future,
          builder: (context, snap) {
            if (snap.hasError) return ErrorRetry(error: snap.error!, onRetry: _reload);
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            final all = snap.data!;
            final products = _categoryId == null
                ? all
                : all.where((p) => p.categoryIds.contains(_categoryId)).toList();
            return Column(
              children: [
                const _BrandHero(),
                if (MedusaClient.instance.productsFromCache)
                  MaterialBanner(
                    content: Text(S.t('offline_catalog')),
                    leading: const Icon(Icons.cloud_off),
                    actions: [TextButton(onPressed: _reload, child: Text(S.t('retry')))],
                  ),
                FutureBuilder<List<Category>>(
                  future: _categories,
                  builder: (context, cs) {
                    final cats = cs.data ?? [];
                    if (cats.isEmpty) return const SizedBox.shrink();
                    return SizedBox(
                      height: 48,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(S.t('all')),
                              selected: _categoryId == null,
                              onSelected: (_) => setState(() => _categoryId = null),
                            ),
                          ),
                          ...cats.map((c) => Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: ChoiceChip(
                                  label: Text(c.name),
                                  selected: _categoryId == c.id,
                                  onSelected: (_) => setState(() => _categoryId = c.id),
                                ),
                              )),
                        ],
                      ),
                    );
                  },
                ),
                Expanded(
                  child: products.isEmpty
                      ? Center(child: Text(S.t('no_products')))
                      : RefreshIndicator(
                          onRefresh: _reload,
                          child: ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: products.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, i) => _ProductCard(product: products[i], onOpenCart: widget.onOpenCart),
                          ),
                        ),
                ),
              ],
            );
          },
        ),
      );
}

class _BrandHero extends StatelessWidget {
  const _BrandHero();
  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.fromLTRB(16, 4, 16, 8),
        padding: const EdgeInsets.fromLTRB(18, 16, 12, 16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(0xFF0E5A8A), Color(0xFF1B8A5A)], begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('WANGJIA\u00AE', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: 3)),
                  const SizedBox(height: 4),
                  Text(S.t('hero_tagline'), style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.3)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      _HeroChip(S.t('badge_warranty')),
                      _HeroChip(S.t('badge_installment')),
                      _HeroChip(S.t('badge_shipping')),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const WangjiaLogo(size: 64, withText: false),
          ],
        ),
      );
}

class _HeroChip extends StatelessWidget {
  final String label;
  const _HeroChip(this.label);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(999)),
        child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
      );
}

class _ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onOpenCart;
  const _ProductCard({required this.product, this.onOpenCart});

  @override
  Widget build(BuildContext context) {
    final min = product.minPrice;
    final currency = product.variants.isNotEmpty ? product.variants.first.currency : 'idr';
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => ProductDetailScreen(product: product, onOpenCart: onOpenCart)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 4 / 3,
                  child: Container(
                    color: const Color(0xFFE6F0F6),
                    child: product.thumbnail != null
                        ? CachedNetworkImage(imageUrl: product.thumbnail!, fit: BoxFit.cover)
                        : const Center(child: WangjiaLogo(size: 64, withText: false)),
                  ),
                ),
                Positioned(
                  left: 12,
                  top: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: const Color(0xFF1B8A5A), borderRadius: BorderRadius.circular(999)),
                    child: Text(S.t('badge_warranty'), style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.title, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                  if (product.subtitle != null && product.subtitle!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(product.subtitle!, style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54)),
                    ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          min == null ? S.t('ask_price') : '${product.variants.length > 1 ? '${S.t('from')} ' : ''}${money(min, currency)}',
                          style: theme.textTheme.titleMedium?.copyWith(color: const Color(0xFF0E5A8A), fontWeight: FontWeight.w800),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(color: const Color(0xFFDCEBF5), borderRadius: BorderRadius.circular(999)),
                        child: Text(S.t('view'), style: const TextStyle(color: Color(0xFF0E5A8A), fontSize: 12, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
