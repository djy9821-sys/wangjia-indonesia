import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';
import 'quotes_screen.dart';

class QuoteDetailScreen extends StatefulWidget {
  final String quoteId;
  const QuoteDetailScreen({super.key, required this.quoteId});
  @override
  State<QuoteDetailScreen> createState() => _QuoteDetailScreenState();
}

class _QuoteDetailScreenState extends State<QuoteDetailScreen> {
  late Future<Quote> _future = MedusaClient.instance.quote(widget.quoteId);
  final _msg = TextEditingController();
  bool _busy = false;

  Future<void> _reload() async {
    setState(() {
      _future = MedusaClient.instance.quote(widget.quoteId);
    });
    await _future;
  }

  Future<void> _run(Future<void> Function() action, String okMsg) async {
    setState(() => _busy = true);
    try {
      await action();
      if (mounted) showSnack(context, okMsg);
      await _reload();
    } catch (e) {
      if (mounted) showSnack(context, friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _accept() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(S.t('accept_quote')),
        content: Text(S.t('quote_accepted_msg')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(S.t('cancel'))),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(S.t('accept_quote'))),
        ],
      ),
    );
    if (ok == true) {
      await _run(() => MedusaClient.instance.acceptQuote(widget.quoteId), S.t('quote_accepted_msg'));
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: Text(S.t('quote')),
          actions: [IconButton(onPressed: _reload, icon: const Icon(Icons.refresh))],
        ),
        body: FutureBuilder<Quote>(
          future: _future,
          builder: (context, snap) {
            if (snap.hasError) return ErrorRetry(error: snap.error!, onRetry: _reload);
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            final q = snap.data!;
            return Column(
              children: [
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text(
                        '${S.t('quote')} ${q.displayId != null ? '#${q.displayId}' : ''}',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 6),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: StatusChip(S.t('quote_${q.status}'), quoteColor(q.status)),
                      ),
                      if (q.createdAt != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(dateTime(q.createdAt), style: Theme.of(context).textTheme.bodySmall),
                        ),
                      const SizedBox(height: 16),
                      Text(S.t('items'), style: Theme.of(context).textTheme.titleMedium),
                      ...q.items.map((i) => ListTile(
                            dense: true,
                            contentPadding: EdgeInsets.zero,
                            title: Text(i.title),
                            subtitle: i.variantTitle == null ? null : Text(i.variantTitle!),
                            trailing: Text('${i.quantity} × ${money(i.unitPrice, q.currency)}'),
                          )),
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(S.t('total'), style: Theme.of(context).textTheme.titleMedium),
                        trailing: Text(money(q.total, q.currency), style: Theme.of(context).textTheme.titleMedium),
                      ),
                      if (q.awaitingCustomer) ...[
                        const SizedBox(height: 8),
                        FilledButton.icon(
                          onPressed: _busy ? null : _accept,
                          icon: const Icon(Icons.check),
                          label: Text(S.t('accept_quote')),
                        ),
                        const SizedBox(height: 8),
                        OutlinedButton(
                          onPressed: _busy
                              ? null
                              : () => _run(() => MedusaClient.instance.rejectQuote(widget.quoteId), S.t('quote_rejected_msg')),
                          child: Text(S.t('reject_quote')),
                        ),
                      ],
                      const Divider(height: 32),
                      Text(S.t('messages'), style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      ...q.messages.map((m) => Align(
                            alignment: m.fromCustomer ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              constraints: const BoxConstraints(maxWidth: 300),
                              decoration: BoxDecoration(
                                color: m.fromCustomer ? const Color(0xFFDCEBF5) : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(m.text),
                                  Text(dateTime(m.createdAt), style: Theme.of(context).textTheme.labelSmall),
                                ],
                              ),
                            ),
                          )),
                    ],
                  ),
                ),
                if (!q.closed)
                  SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _msg,
                              decoration: InputDecoration(hintText: S.t('write_message')),
                              minLines: 1,
                              maxLines: 3,
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton.filled(
                            onPressed: _busy
                                ? null
                                : () {
                                    final text = _msg.text.trim();
                                    if (text.isEmpty) return;
                                    _msg.clear();
                                    _run(() => MedusaClient.instance.sendQuoteMessage(widget.quoteId, text), S.t('send'));
                                  },
                            icon: const Icon(Icons.send),
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
