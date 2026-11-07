import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/medusa_client.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';
import 'upload_proof_sheet.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;
  const OrderDetailScreen({super.key, required this.orderId});
  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> with WidgetsBindingObserver {
  late Future<(Order, PaymentPlan?)> _future = _load();
  bool _busy = false;

  Future<(Order, PaymentPlan?)> _load() async {
    final api = MedusaClient.instance;
    final results = await Future.wait([api.order(widget.orderId), api.paymentPlan(widget.orderId)]);
    return (results[0] as Order, results[1] as PaymentPlan?);
  }

  Future<void> _reload() async {
    setState(() {
      _future = _load();
    });
    await _future;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  /// Coming back from the Midtrans page: refresh so a settled payment shows.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _reload();
  }

  Future<void> _payMidtrans(Installment inst) async {
    setState(() => _busy = true);
    try {
      final url = await MedusaClient.instance.midtransRedirectUrl(inst.id);
      if (!mounted) return;
      showSnack(context, S.t('back_from_payment'));
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } catch (e) {
      if (mounted) showSnack(context, '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _uploadProof(Installment inst, PaymentPlan plan) async {
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => UploadProofSheet(installment: inst, currency: plan.currency),
    );
    if (ok == true) {
      if (mounted) showSnack(context, S.t('proof_sent'));
      _reload();
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: Text(S.t('order')),
          actions: [IconButton(onPressed: _reload, icon: const Icon(Icons.refresh))],
        ),
        body: FutureBuilder<(Order, PaymentPlan?)>(
          future: _future,
          builder: (context, snap) {
            if (snap.hasError) return ErrorRetry(error: snap.error!, onRetry: _reload);
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            final (order, plan) = snap.data!;
            final fs = order.fulfillmentStatus ?? 'not_fulfilled';
            return RefreshIndicator(
              onRefresh: _reload,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    children: [
                      Text('#${order.displayId}', style: Theme.of(context).textTheme.headlineSmall),
                      const Spacer(),
                      StatusChip(S.t('fulfillment_$fs'), fulfillmentColor(fs)),
                    ],
                  ),
                  Text(dateTime(order.createdAt), style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 16),
                  _section(context, S.t('items')),
                  ...order.items.map((i) => ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        title: Text(i.title),
                        subtitle: i.variantTitle == null ? null : Text(i.variantTitle!),
                        trailing: Text('${i.quantity} × ${money(i.unitPrice, order.currency)}'),
                      )),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(S.t('total'), style: Theme.of(context).textTheme.titleMedium),
                    trailing: Text(money(order.total, order.currency), style: Theme.of(context).textTheme.titleMedium),
                  ),
                  const Divider(height: 32),
                  _section(context, S.t('payment_plan')),
                  if (plan == null)
                    Text(S.t('no_payment_plan'))
                  else
                    _PaymentPlanView(
                      plan: plan,
                      busy: _busy,
                      onPay: _payMidtrans,
                      onUpload: (i) => _uploadProof(i, plan),
                    ),
                  const Divider(height: 32),
                  _section(context, S.t('shipping')),
                  if (order.fulfillments.isEmpty)
                    Text(S.t('fulfillment_not_fulfilled'))
                  else
                    ...order.fulfillments.map((f) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: Icon(f.deliveredAt != null
                              ? Icons.check_circle
                              : f.shippedAt != null
                                  ? Icons.local_shipping
                                  : Icons.inventory_2),
                          title: Text(f.deliveredAt != null
                              ? S.t('fulfillment_delivered')
                              : f.shippedAt != null
                                  ? S.t('fulfillment_shipped')
                                  : S.t('fulfillment_fulfilled')),
                          subtitle: Text([
                            if (f.trackingNumbers.isNotEmpty) '${S.t('tracking')}: ${f.trackingNumbers.join(', ')}',
                            if (f.shippedAt != null) dateTime(f.shippedAt),
                          ].join('\n')),
                        )),
                  const SizedBox(height: 32),
                ],
              ),
            );
          },
        ),
      );

  Widget _section(BuildContext context, String title) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(title, style: Theme.of(context).textTheme.titleMedium),
      );
}

class _PaymentPlanView extends StatelessWidget {
  final PaymentPlan plan;
  final bool busy;
  final void Function(Installment) onPay;
  final void Function(Installment) onUpload;
  const _PaymentPlanView({required this.plan, required this.busy, required this.onPay, required this.onUpload});

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: (plan.releasedAt != null ? const Color(0xFF1B8A5A) : const Color(0xFFD98E04)).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Icon(plan.releasedAt != null ? Icons.verified : Icons.hourglass_top,
                    color: plan.releasedAt != null ? const Color(0xFF1B8A5A) : const Color(0xFFD98E04)),
                const SizedBox(width: 10),
                Expanded(child: Text(plan.releasedAt != null ? S.t('released') : S.t('not_released'))),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text('${money(plan.paidAmount, plan.currency)} / ${money(plan.totalAmount, plan.currency)}',
              style: Theme.of(context).textTheme.bodyMedium),
          if (plan.note != null && plan.note!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(plan.note!, style: Theme.of(context).textTheme.bodySmall),
          ],
          const SizedBox(height: 12),
          ...plan.installments.map((inst) => _InstallmentCard(
                inst: inst,
                currency: plan.currency,
                busy: busy,
                onPay: () => onPay(inst),
                onUpload: () => onUpload(inst),
              )),
        ],
      );
}

class _InstallmentCard extends StatelessWidget {
  final Installment inst;
  final String currency;
  final bool busy;
  final VoidCallback onPay;
  final VoidCallback onUpload;
  const _InstallmentCard({required this.inst, required this.currency, required this.busy, required this.onPay, required this.onUpload});

  @override
  Widget build(BuildContext context) {
    final latestProof = inst.proofs.isEmpty ? null : inst.proofs.last;
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(child: Text('${inst.sequence}. ${inst.label}', style: Theme.of(context).textTheme.titleSmall)),
                StatusChip(S.t('status_${inst.status}'), installmentColor(inst.status)),
              ],
            ),
            const SizedBox(height: 6),
            Text(money(inst.amount, currency), style: Theme.of(context).textTheme.titleMedium),
            if (inst.dueDate != null)
              Text('${S.t('due')}: ${shortDate(inst.dueDate)}', style: Theme.of(context).textTheme.bodySmall),
            if (inst.paidAt != null)
              Text('${S.t('paid_at')}: ${dateTime(inst.paidAt)}', style: Theme.of(context).textTheme.bodySmall),
            if (inst.refundedAmount > 0)
              Text('${S.t('refunded')}: ${money(inst.refundedAmount, currency)}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF7C3AED))),
            if (latestProof != null && inst.status != 'paid') ...[
              const SizedBox(height: 6),
              Text(
                S.t('proof_${latestProof.status}') +
                    (latestProof.reviewNote != null && latestProof.reviewNote!.isNotEmpty ? ': ${latestProof.reviewNote}' : ''),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: latestProof.status == 'rejected' ? const Color(0xFFB3261E) : null,
                    ),
              ),
            ],
            if (inst.isOpen) ...[
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: busy ? null : onPay,
                icon: const Icon(Icons.qr_code_2),
                label: Text(S.t('pay_midtrans')),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: busy ? null : onUpload,
                icon: const Icon(Icons.upload_file),
                label: Text(S.t('upload_proof')),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
