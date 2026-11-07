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

class _ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onOpenCart;
  const _ProductCard({required this.product, this.onOpenCart});

  @override
  Widget build(BuildContext context) {
    final min = product.minPrice;
    final currency = product.variants.isNotEmpty ? product.variants.first.currency : 'idr';
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => ProductDetailScreen(product: product, onOpenCart: onOpenCart)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: product.thumbnail != null
                  ? CachedNetworkImage(imageUrl: product.thumbnail!, fit: BoxFit.cover)
                  : Container(
                      color: const Color(0xFFE3EEF5),
                      child: const Center(child: WangjiaLogo(size: 64, withText: false)),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.title, style: Theme.of(context).textTheme.titleMedium),
                  if (product.subtitle != null && product.subtitle!.isNotEmpty)
                    Text(product.subtitle!, style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 6),
                  Text(
                    min == null ? S.t('ask_price') : '${product.variants.length > 1 ? 'Mulai ' : ''}${money(min, currency)}',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(color: const Color(0xFF0E5A8A)),
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
