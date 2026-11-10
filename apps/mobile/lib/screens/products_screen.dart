import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../cart.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/brand.dart';
import '../widgets/common.dart';
import '../widgets/wangjia_logo.dart';
import 'checkout_screen.dart';
import 'login_screen.dart';
import 'product_detail_screen.dart';
import 'warranty_screen.dart';

class ProductsScreen extends StatefulWidget {
  final VoidCallback? onOpenCart;
  /// Pre-select the category whose name contains this text (e.g. spare parts
  /// opened from a registered machine).
  final String? initialCategoryName;
  /// Prices can differ per customer, so the catalogue is loaded again when
  /// this changes.
  final String? customerId;
  const ProductsScreen({super.key, this.onOpenCart, this.initialCategoryName, this.customerId});
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
  String _query = '';
  final _groupBuyKey = GlobalKey();

  Future<void> _reload() async {
    setState(() {
      _future = MedusaClient.instance.products();
      _groupBuys = MedusaClient.instance.groupBuys().catchError((_) => <GroupBuy>[]);
    });
    await _future;
  }

  @override
  void didUpdateWidget(ProductsScreen old) {
    super.didUpdateWidget(old);
    if (old.customerId != widget.customerId) {
      _future = MedusaClient.instance.products();
      _groupBuys = MedusaClient.instance.groupBuys().catchError((_) => <GroupBuy>[]);
    }
  }

  Future<void> _pickCategory(String contains) async {
    final cats = await _categories;
    final hit = cats.where((c) => c.name.toLowerCase().contains(contains)).firstOrNull;
    if (mounted) setState(() => _categoryId = hit?.id);
  }

  void _scrollToGroupBuys() {
    final ctx = _groupBuyKey.currentContext;
    if (ctx != null) {
      Scrollable.ensureVisible(ctx, duration: const Duration(milliseconds: 400), alignment: 0.1);
    } else {
      showSnack(context, S.t('no_group_buy'));
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: Brand.bg,
        body: FutureBuilder<List<Product>>(
          future: _future,
          builder: (context, snap) {
            if (snap.hasError) return SafeArea(child: ErrorRetry(error: snap.error!, onRetry: _reload));
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            final all = snap.data!;
            final q = _query.trim().toLowerCase();
            final products = all.where((p) {
              if (_categoryId != null && !p.categoryIds.contains(_categoryId)) return false;
              if (q.isNotEmpty && !p.title.toLowerCase().contains(q) && !(p.subtitle ?? '').toLowerCase().contains(q)) return false;
              return true;
            }).toList();
            final featured = all.where((p) => p.thumbnail != null && p.minPrice != null).take(3).toList();
            return RefreshIndicator(
              onRefresh: _reload,
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(child: _Header(query: _query, onQuery: (v) => setState(() => _query = v))),
                  if (MedusaClient.instance.productsFromCache)
                    SliverToBoxAdapter(
                      child: MaterialBanner(
                        content: Text(S.t('offline_catalog')),
                        leading: const Icon(Icons.cloud_off),
                        actions: [TextButton(onPressed: _reload, child: Text(S.t('retry')))],
                      ),
                    ),
                  if (q.isEmpty) ...[
                    if (featured.isNotEmpty) SliverToBoxAdapter(child: _Banner(products: featured, onOpenCart: widget.onOpenCart)),
                    SliverToBoxAdapter(
                      child: _QuickEntries(
                        onAerator: () => _pickCategory('kincir'),
                        onParts: () => _pickCategory('suku'),
                        onGroupBuy: _scrollToGroupBuys,
                        onWarranty: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const WarrantyScreen())),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: KeyedSubtree(key: _groupBuyKey, child: _GroupBuySection(future: _groupBuys, onJoined: _reload)),
                    ),
                  ],
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
                      child: Row(
                        children: [
                          Container(width: 4, height: 18, decoration: BoxDecoration(color: Brand.accent, borderRadius: BorderRadius.circular(2))),
                          const SizedBox(width: 8),
                          Text(q.isEmpty ? S.t('all_products') : '"$_query"',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                          const Spacer(),
                          Text('${products.length} ${S.t('items_unit')}', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.black54)),
                        ],
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: FutureBuilder<List<Category>>(
                      future: _categories,
                      builder: (context, cs) {
                        final cats = cs.data ?? [];
                        if (cats.isEmpty) return const SizedBox.shrink();
                        return SizedBox(
                          height: 44,
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            children: [
                              _Pill(label: S.t('all'), selected: _categoryId == null, onTap: () => setState(() => _categoryId = null)),
                              ...cats.map((c) => _Pill(label: c.name, selected: _categoryId == c.id, onTap: () => setState(() => _categoryId = c.id))),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  if (products.isEmpty)
                    SliverToBoxAdapter(
                      child: Padding(padding: const EdgeInsets.all(40), child: Center(child: Text(S.t('no_products')))),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(12, 8, 12, 24),
                      sliver: SliverGrid(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 10,
                          crossAxisSpacing: 10,
                          childAspectRatio: 0.62,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, i) => _ProductCard(product: products[i], onOpenCart: widget.onOpenCart),
                          childCount: products.length,
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      );
}

/// Blue header with the logo and a search field (filters the catalogue locally).
class _Header extends StatelessWidget {
  final String query;
  final ValueChanged<String> onQuery;
  const _Header({required this.query, required this.onQuery});

  @override
  Widget build(BuildContext context) => Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(colors: [Brand.blue, Brand.navy], begin: Alignment.topLeft, end: Alignment.bottomRight),
        ),
        padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + 8, 16, 14),
        child: Row(
          children: [
            const WangjiaLogo(size: 40, withText: false),
            const SizedBox(width: 10),
            Expanded(
              child: Container(
                height: 40,
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
                child: TextField(
                  onChanged: onQuery,
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: S.t('search_hint'),
                    hintStyle: const TextStyle(fontSize: 13, color: Colors.black45),
                    prefixIcon: const Icon(Icons.search, color: Brand.navy),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
}

/// Swipeable promo banner built from real products (photo + starting price).
class _Banner extends StatefulWidget {
  final List<Product> products;
  final VoidCallback? onOpenCart;
  const _Banner({required this.products, this.onOpenCart});
  @override
  State<_Banner> createState() => _BannerState();
}

class _BannerState extends State<_Banner> {
  int _index = 0;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        child: Column(
          children: [
            SizedBox(
              height: 168,
              child: PageView.builder(
                itemCount: widget.products.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (context, i) {
                  final p = widget.products[i];
                  final palette = const [
                    [Color(0xFF0193DE), Color(0xFF0E5A8A)],
                    [Color(0xFFF04E23), Color(0xFFB3290A)],
                    [Color(0xFF1B8A5A), Color(0xFF0B5A3A)],
                  ][i % 3];
                  return InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => ProductDetailScreen(product: p, onOpenCart: widget.onOpenCart)),
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: palette, begin: Alignment.topLeft, end: Alignment.bottomRight),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      padding: const EdgeInsets.fromLTRB(18, 14, 12, 14),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(S.t('official_store').toUpperCase(),
                                    style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.2)),
                                const SizedBox(height: 4),
                                Text(p.title, maxLines: 2, overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800, height: 1.15)),
                                const SizedBox(height: 6),
                                Text('${S.t('from')} ${money(p.minPrice, p.variants.first.currency)}',
                                    style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
                                  child: Text(S.t('view'), style: TextStyle(color: palette.first, fontSize: 12, fontWeight: FontWeight.w800)),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              width: 118,
                              height: 118,
                              color: Colors.white,
                              padding: const EdgeInsets.all(4),
                              child: CachedNetworkImage(imageUrl: p.thumbnail!, fit: BoxFit.contain),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                widget.products.length,
                (i) => AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: i == _index ? 16 : 6,
                  height: 6,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(color: i == _index ? Brand.accent : Colors.black26, borderRadius: BorderRadius.circular(3)),
                ),
              ),
            ),
          ],
        ),
      );
}

class _QuickEntries extends StatelessWidget {
  final VoidCallback onAerator, onParts, onGroupBuy, onWarranty;
  const _QuickEntries({required this.onAerator, required this.onParts, required this.onGroupBuy, required this.onWarranty});

  @override
  Widget build(BuildContext context) {
    Widget item(IconData icon, Color color, String label, VoidCallback onTap) => Expanded(
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Column(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(16)),
                    child: Icon(icon, color: color, size: 26),
                  ),
                  const SizedBox(height: 6),
                  Text(label, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ),
        );
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Row(
        children: [
          item(Icons.water, Brand.blue, S.t('quick_aerator'), onAerator),
          item(Icons.settings_suggest_outlined, Brand.navy, S.t('quick_parts'), onParts),
          item(Icons.groups_2_outlined, Brand.accent, S.t('group_buy'), onGroupBuy),
          item(Icons.verified_user_outlined, Brand.green, S.t('quick_warranty'), onWarranty),
        ],
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _Pill({required this.label, required this.selected, required this.onTap});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(right: 8),
        child: InkWell(
          borderRadius: BorderRadius.circular(999),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: selected ? Brand.accentSoft : Colors.white,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: selected ? Brand.accent : Brand.line),
            ),
            child: Text(label,
                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: selected ? Brand.accentDark : Colors.black87)),
          ),
        ),
      );
}

/// Marketplace-style card: square photo, two-line title, big accent price.
class _ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onOpenCart;
  const _ProductCard({required this.product, this.onOpenCart});

  @override
  Widget build(BuildContext context) {
    final min = product.minPrice;
    final currency = product.variants.isNotEmpty ? product.variants.first.currency : 'idr';
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => ProductDetailScreen(product: product, onOpenCart: onOpenCart)),
      ),
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 1,
                  child: Container(
                    color: product.thumbnail != null ? Colors.white : const Color(0xFFE6F0F6),
                    padding: const EdgeInsets.all(6),
                    child: product.thumbnail != null
                        ? CachedNetworkImage(imageUrl: product.thumbnail!, fit: BoxFit.contain)
                        : const Center(child: WangjiaLogo(size: 56, withText: false)),
                  ),
                ),
                if (product.variants.length > 1)
                  Positioned(
                    left: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(color: Brand.navy, borderRadius: BorderRadius.circular(6)),
                      child: Text('${product.variants.length} ${S.t('variants_unit')}',
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
                    ),
                  ),
              ],
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(product.title, maxLines: 2, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13, height: 1.25, fontWeight: FontWeight.w600)),
                    const Spacer(),
                    Text(
                      min == null ? S.t('ask_price') : money(min, currency),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Brand.accent, fontSize: 16, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        _MiniTag(S.t('badge_warranty')),
                        const SizedBox(width: 4),
                        _MiniTag(S.t('tag_installment')),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniTag extends StatelessWidget {
  final String text;
  const _MiniTag(this.text);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
        decoration: BoxDecoration(
          color: Brand.accentSoft,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: const Color(0xFFF9C3B2)),
        ),
        child: Text(text, style: const TextStyle(color: Brand.accentDark, fontSize: 9.5, fontWeight: FontWeight.w700)),
      );
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
            padding: const EdgeInsets.only(top: 12, bottom: 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                  child: Row(
                    children: [
                      Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: Brand.accentSoft, borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.groups_2_outlined, color: Brand.accent, size: 20)),
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
                          _Tag(S.t('group_buy').toUpperCase(), Brand.accent),
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
                              style: theme.textTheme.titleMedium?.copyWith(color: Brand.accent, fontWeight: FontWeight.w800)),
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
              child: LinearProgressIndicator(value: g.progress, minHeight: 6, backgroundColor: Brand.accentSoft, color: Brand.accent),
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
          Text('${g.productTitle}${variantLabel(g.variantTitle) != null ? ' · ${variantLabel(g.variantTitle)}' : ''}',
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
    if (!await ensureSignedIn(context)) return;
    if (!mounted) return;
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
