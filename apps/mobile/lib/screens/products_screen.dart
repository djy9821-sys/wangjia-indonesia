import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';
import '../widgets/wangjia_logo.dart';
import '../cart.dart';
import 'checkout_screen.dart';
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
  late Future<List<GroupBuy>> _groupBuys = MedusaClient.instance.groupBuys().catchError((_) => <GroupBuy>[]);
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
      _groupBuys = MedusaClient.instance.groupBuys().catchError((_) => <GroupBuy>[]);
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
                _GroupBuySection(future: _groupBuys, onJoined: _reload),
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
          gradient: const LinearGradient(colors: [Color(0xFF0193DE), Color(0xFF0E5A8A)], begin: Alignment.topLeft, end: Alignment.bottomRight),
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
                    // Catalogue photos are white 1:1 squares; show them whole.
                    color: product.thumbnail != null ? Colors.white : const Color(0xFFE6F0F6),
                    padding: const EdgeInsets.all(8),
                    child: product.thumbnail != null
                        ? CachedNetworkImage(imageUrl: product.thumbnail!, fit: BoxFit.contain)
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

/// Horizontal strip of open patungan; hidden when there are none.
class _GroupBuySection extends StatelessWidget {
  final Future<List<GroupBuy>> future;
  final VoidCallback onJoined;
  const _GroupBuySection({required this.future, required this.onJoined});

  @override
  Widget build(BuildContext context) => FutureBuilder<List<GroupBuy>>(
        future: future,
        builder: (context, snap) {
          final list = snap.data ?? const <GroupBuy>[];
          if (list.isEmpty) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                  child: Row(
                    children: [
                      const Icon(Icons.groups_2_outlined, color: Color(0xFF0E5A8A)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(S.t('group_buy_running'), style: Theme.of(context).textTheme.titleMedium),
                            Text(S.t('group_buy_sub'), style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.black54)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(
                  height: 196,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (context, i) => _GroupBuyCard(g: list[i], onJoined: onJoined),
                  ),
                ),
              ],
            ),
          );
        },
      );
}

class _GroupBuyCard extends StatelessWidget {
  final GroupBuy g;
  final VoidCallback onJoined;
  const _GroupBuyCard({required this.g, required this.onJoined});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final disc = g.discountPercent;
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => _JoinGroupBuySheet.show(context, g, onJoined),
      child: Container(
        width: 300,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFD6E4EE)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: 72,
                    height: 72,
                    color: Colors.white,
                    child: g.thumbnail == null
                        ? const WangjiaLogo(size: 48, withText: false)
                        : CachedNetworkImage(imageUrl: g.thumbnail!, fit: BoxFit.contain),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          _Tag(S.t('group_buy').toUpperCase(), const Color(0xFF0193DE)),
                          if (disc != null && disc > 0) ...[
                            const SizedBox(width: 6),
                            _Tag(S.t('save_pct').replaceFirst('{n}', '$disc'), const Color(0xFFD9342B)),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(g.title, maxLines: 2, overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.end,
                        spacing: 6,
                        children: [
                          Text(money(g.groupPrice, g.currency),
                              style: theme.textTheme.titleMedium?.copyWith(color: const Color(0xFF0E5A8A), fontWeight: FontWeight.w800)),
                          if (g.regularPrice != null)
                            Text(money(g.regularPrice, g.currency),
                                style: theme.textTheme.bodySmall?.copyWith(decoration: TextDecoration.lineThrough, color: Colors.black45)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Spacer(),
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(value: g.progress, minHeight: 6, backgroundColor: const Color(0xFFE6F0F6), color: const Color(0xFF0193DE)),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: Text(
                    S.t('collected_of').replaceFirst('{n}', '${g.joinedQuantity}').replaceFirst('{min}', '${g.minQuantity}'),
                    style: theme.textTheme.bodySmall,
                  ),
                ),
                Text(S.t('days_left').replaceFirst('{n}', '${g.daysLeft}'), style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final String text;
  final Color color;
  const _Tag(this.text, this.color);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(99)),
        child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
      );
}

/// Quantity picker + join: creates the group-price cart on the server and
/// hands it to the normal checkout.
class _JoinGroupBuySheet extends StatefulWidget {
  final GroupBuy g;
  final VoidCallback onJoined;
  const _JoinGroupBuySheet({required this.g, required this.onJoined});

  static Future<void> show(BuildContext context, GroupBuy g, VoidCallback onJoined) => showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
        builder: (_) => _JoinGroupBuySheet(g: g, onJoined: onJoined),
      );

  @override
  State<_JoinGroupBuySheet> createState() => _JoinGroupBuySheetState();
}

class _JoinGroupBuySheetState extends State<_JoinGroupBuySheet> {
  int _qty = 1;
  bool _busy = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final g = widget.g;
    final theme = Theme.of(context);
    final max = g.remainingQuantity ?? 99;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(g.title, style: theme.textTheme.titleLarge),
          Text('${g.productTitle}${g.variantTitle != null ? ' · ${g.variantTitle}' : ''}',
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.black54)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _PriceBox(label: S.t('group_price'), value: money(g.groupPrice, g.currency), highlight: true)),
              const SizedBox(width: 10),
              Expanded(child: _PriceBox(label: S.t('normal_price'), value: g.regularPrice == null ? '-' : money(g.regularPrice, g.currency))),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(value: g.progress, minHeight: 8, backgroundColor: const Color(0xFFE6F0F6), color: const Color(0xFF0193DE)),
          ),
          const SizedBox(height: 6),
          Text(
            '${S.t('collected_of').replaceFirst('{n}', '${g.joinedQuantity}').replaceFirst('{min}', '${g.minQuantity}')} · '
            '${S.t('participants').replaceFirst('{n}', '${g.participants}')} · ${S.t('days_left').replaceFirst('{n}', '${g.daysLeft}')}',
            style: theme.textTheme.bodySmall,
          ),
          Text(
            g.missing > 0 ? S.t('missing_units').replaceFirst('{n}', '${g.missing}') : S.t('min_reached'),
            style: theme.textTheme.bodySmall?.copyWith(color: const Color(0xFF0E5A8A), fontWeight: FontWeight.w600),
          ),
          if (g.remainingQuantity != null)
            Text(S.t('quota_left').replaceFirst('{n}', '${g.remainingQuantity}'), style: theme.textTheme.bodySmall),
          const SizedBox(height: 12),
          Text(S.t('group_buy_hint'), style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54)),
          if (g.note != null && g.note!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(g.note!, style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54)),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Text(S.t('quantity'), style: theme.textTheme.titleSmall),
              const Spacer(),
              IconButton.outlined(onPressed: _qty > 1 ? () => setState(() => _qty--) : null, icon: const Icon(Icons.remove)),
              SizedBox(width: 40, child: Text('$_qty', textAlign: TextAlign.center, style: theme.textTheme.titleMedium)),
              IconButton.outlined(onPressed: _qty < max ? () => setState(() => _qty++) : null, icon: const Icon(Icons.add)),
            ],
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
          ],
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _busy || max < 1 ? null : _join,
              child: _busy
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text('${S.t('join_group_buy')} · ${money(g.groupPrice * _qty, g.currency)}'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _join() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final g = widget.g;
      final cartId = await MedusaClient.instance.joinGroupBuy(g.id, _qty);
      if (!mounted) return;
      widget.onJoined();
      final item = CartItem(
        variantId: g.variantId,
        productId: g.productId,
        productTitle: g.title,
        variantTitle: g.variantTitle ?? '',
        price: g.groupPrice,
        currency: g.currency,
        thumbnail: g.thumbnail,
        quantity: _qty,
      );
      Navigator.of(context).pop();
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => CheckoutScreen(items: [item], cartId: cartId)));
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = e is MedusaException ? e.message : '$e';
      });
    }
  }
}

class _PriceBox extends StatelessWidget {
  final String label;
  final String value;
  final bool highlight;
  const _PriceBox({required this.label, required this.value, this.highlight = false});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: highlight ? const Color(0xFFE6F0F6) : const Color(0xFFF5F7F9),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.black54)),
            Text(value,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800, color: highlight ? const Color(0xFF0E5A8A) : Colors.black87)),
          ],
        ),
      );
}
