import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';
import 'quote_detail_screen.dart';

Color quoteColor(String status) => switch (status) {
      'pending_customer' => const Color(0xFFD98E04),
      'accepted' => const Color(0xFF1B8A5A),
      'customer_rejected' || 'merchant_rejected' => const Color(0xFFB3261E),
      _ => const Color(0xFF6B7280),
    };

class QuotesScreen extends StatefulWidget {
  final VoidCallback? onBrowse;
  const QuotesScreen({super.key, this.onBrowse});
  @override
  State<QuotesScreen> createState() => QuotesScreenState();
}

class QuotesScreenState extends State<QuotesScreen> {
  late Future<List<Quote>> _future = MedusaClient.instance.quotes();

  Future<void> reload() async {
    setState(() {
      _future = MedusaClient.instance.quotes();
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<List<Quote>>(
        future: _future,
        builder: (context, snap) {
          if (snap.hasError) return ErrorRetry(error: snap.error!, onRetry: reload);
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final quotes = snap.data!;
          if (quotes.isEmpty) {
            return EmptyState(
              icon: Icons.request_quote_outlined,
              title: S.t('no_quotes'),
              subtitle: S.t('no_quotes_hint'),
              actionLabel: widget.onBrowse == null ? null : S.t('browse_products'),
              onAction: widget.onBrowse,
            );
          }
          return RefreshIndicator(
            onRefresh: reload,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: quotes.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final q = quotes[i];
                return Card(
                  child: InkWell(
                    onTap: () => Navigator.of(context)
                        .push(MaterialPageRoute(builder: (_) => QuoteDetailScreen(quoteId: q.id)))
                        .then((_) => reload()),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  '${S.t('quote')} ${q.displayId != null ? '#${q.displayId}' : ''}'.trim(),
                                  style: Theme.of(context).textTheme.titleMedium,
                                ),
                              ),
                              Text(money(q.total, q.currency), style: Theme.of(context).textTheme.titleSmall),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            [if (q.createdAt != null) shortDate(q.createdAt), q.items.map((e) => '${e.title} ×${e.quantity}').join(', ')].join(' · '),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: 8),
                          StatusChip(S.t('quote_${q.status}'), quoteColor(q.status)),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
      );
}
