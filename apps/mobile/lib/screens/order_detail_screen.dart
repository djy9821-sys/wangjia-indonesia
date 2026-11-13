import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/medusa_client.dart';
import '../config.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/brand.dart';
import '../widgets/common.dart';
import 'tracking_sheet.dart';
import 'order_units_section.dart';
import 'payment_webview_screen.dart';
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
    // Small orders get their plan a moment after placement (event-driven);
    // one short retry avoids showing "waiting for plan" right after checkout.
    if (results[1] == null) {
      await Future<void>.delayed(const Duration(milliseconds: 1500));
      results[1] = await api.paymentPlan(widget.orderId);
    }
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
      final paid = await Navigator.of(context).push<bool>(
        MaterialPageRoute(builder: (_) => PaymentWebViewScreen(url: url)),
      );
      if (paid == true && mounted) {
        showSnack(context, S.t('back_from_payment'));
      }
      await _reload();
    } catch (e) {
      if (mounted) showSnack(context, friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Opens a WhatsApp chat with sales, the order number already written.
  Future<void> _askSales(Order order) async {
    final text = Uri.encodeComponent('Halo WANGJIA, saya ingin bertanya tentang pesanan #${order.displayId}.');
    final uri = Uri.parse('https://wa.me/${AppConfig.whatsappNumber}?text=$text');
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication) && mounted) {
      showSnack(context, S.t('error'));
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
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 32),
                children: [
                  _card(
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text('${S.t('order')} #${order.displayId}',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                            const Spacer(),
                            StatusChip(S.t('fulfillment_$fs'), fulfillmentColor(fs)),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(dateTime(order.createdAt), style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.black54)),
                        const SizedBox(height: 10),
                        ...order.items.map((i) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 5),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 52,
                                    height: 52,
                                    clipBehavior: Clip.antiAlias,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: Brand.line),
                                    ),
                                    child: i.thumbnail != null && i.thumbnail!.isNotEmpty
                                        ? productThumb(context, i.thumbnail!, width: 52)
                                        : const Icon(Icons.water, color: Brand.blue),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(i.title, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600)),
                                        if (variantLabel(i.variantTitle) != null)
                                          Text(variantLabel(i.variantTitle)!, style: const TextStyle(fontSize: 11.5, color: Colors.black54)),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(money(i.unitPrice, order.currency), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                                      Text('x${i.quantity}', style: const TextStyle(fontSize: 11.5, color: Colors.black54)),
                                    ],
                                  ),
                                ],
                              ),
                            )),
                        const Divider(height: 18, color: Brand.line),
                        Row(
                          children: [
                            Text(S.t('total'), style: const TextStyle(fontSize: 13, color: Colors.black54)),
                            const Spacer(),
                            Text(money(order.total, order.currency),
                                style: const TextStyle(color: Brand.accent, fontSize: 18, fontWeight: FontWeight.w800)),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(minimumSize: const Size(0, 38), padding: const EdgeInsets.symmetric(horizontal: 14)),
                            onPressed: () async {
                              try {
                                final url = await MedusaClient.instance.invoiceLink(order.id);
                                await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
                              } catch (e) {
                                if (context.mounted) showSnack(context, friendlyError(e));
                              }
                            },
                            icon: const Icon(Icons.picture_as_pdf_outlined, size: 18),
                            label: Text(S.t('invoice')),
                          ),
                        ),
                      ],
                    ),
                  ),
                  _card(
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _section(context, S.t('payment_plan')),
                        if (plan == null) ...[
                          Text(S.t('no_payment_plan')),
                          const SizedBox(height: 8),
                          OutlinedButton.icon(
                            onPressed: () => _askSales(order),
                            icon: const Icon(Icons.chat_outlined),
                            label: Text(S.t('chat_whatsapp')),
                          ),
                        ] else
                          _PaymentPlanView(
                            plan: plan,
                            busy: _busy,
                            onPay: _payMidtrans,
                            onUpload: (i) => _uploadProof(i, plan),
                          ),
                      ],
                    ),
                  ),
                  _card(
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _section(context, S.t('shipping')),
                        if (order.fulfillments.isEmpty)
                          Text(S.t('fulfillment_not_fulfilled'), style: const TextStyle(color: Colors.black54))
                        else
                          ...order.fulfillments.map((f) => ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: Icon(
                                  f.deliveredAt != null
                                      ? Icons.check_circle
                                      : f.shippedAt != null
                                          ? Icons.local_shipping
                                          : Icons.inventory_2,
                                  color: f.deliveredAt != null ? Brand.green : Brand.blue,
                                ),
                                title: Text(f.deliveredAt != null
                                    ? S.t('fulfillment_delivered')
                                    : f.shippedAt != null
                                        ? S.t('fulfillment_shipped')
                                        : S.t('fulfillment_fulfilled')),
                                subtitle: Text([
                                  if (f.trackingNumbers.isNotEmpty) '${S.t('tracking')}: ${f.trackingNumbers.join(', ')}',
                                  if (f.shippedAt != null) dateTime(f.shippedAt),
                                ].join('\n')),
                                trailing: f.trackingNumbers.isNotEmpty
                                    ? TextButton.icon(
                                        onPressed: () => showTrackingSheet(context, order.id),
                                        icon: const Icon(Icons.route_outlined, size: 18),
                                        label: Text(S.t('track')),
                                      )
                                    : null,
                              )),
                      ],
                    ),
                  ),
                  _card(OrderUnitsSection(orderId: order.id)),
                ],
              ),
            );
          },
        ),
      );

  Widget _card(Widget child) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
        child: child,
      );

  Widget _section(BuildContext context, String title) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
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
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              value: plan.totalAmount == 0 ? 0 : (plan.paidAmount / plan.totalAmount).clamp(0, 1).toDouble(),
              minHeight: 8,
              backgroundColor: Brand.accentSoft,
              color: Brand.accent,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              // Wraps when a large amount and large text leave no room for both on one line.
              Expanded(
                child: Text('${S.t('paid_at').split(' ').first} ${money(plan.paidAmount, plan.currency)}',
                    style: const TextStyle(fontSize: 12.5, color: Brand.accentDark, fontWeight: FontWeight.w700)),
              ),
              const SizedBox(width: 8),
              Text(money(plan.totalAmount, plan.currency), style: const TextStyle(fontSize: 12.5, color: Colors.black54)),
            ],
          ),
          if (plan.note != null && plan.note!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(plan.note!, style: Theme.of(context).textTheme.bodySmall),
          ],
          if (plan.bankTransfer != null && plan.installments.any((i) => i.isOpen)) ...[
            const SizedBox(height: 10),
            _TransferAccount(plan.bankTransfer!),
          ],
          const SizedBox(height: 12),
          ...plan.installments.map((inst) => _InstallmentCard(
                inst: inst,
                currency: plan.currency,
                online: plan.onlinePayment,
                busy: busy,
                onPay: () => onPay(inst),
                onUpload: () => onUpload(inst),
              )),
        ],
      );
}

/// Where to send a bank transfer, with the account number ready to copy.
class _TransferAccount extends StatelessWidget {
  final String account;
  const _TransferAccount(this.account);

  @override
  Widget build(BuildContext context) {
    final small = Theme.of(context).textTheme.bodySmall;
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Brand.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(S.t('transfer_to'), style: small),
          const SizedBox(height: 2),
          SelectableText(account, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(S.t('transfer_hint'), style: small),
          TextButton.icon(
            style: TextButton.styleFrom(padding: EdgeInsets.zero, visualDensity: VisualDensity.compact),
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: accountNumber(account) ?? account));
              if (context.mounted) showSnack(context, S.t('account_copied'));
            },
            icon: const Icon(Icons.copy, size: 16),
            label: Text(S.t('copy_account')),
          ),
        ],
      ),
    );
  }
}

class _InstallmentCard extends StatelessWidget {
  final Installment inst;
  final String currency;

  /// Whether paying online can be offered next to the bank transfer.
  final bool online;
  final bool busy;
  final VoidCallback onPay;
  final VoidCallback onUpload;
  const _InstallmentCard({
    required this.inst,
    required this.currency,
    required this.online,
    required this.busy,
    required this.onPay,
    required this.onUpload,
  });

  @override
  Widget build(BuildContext context) {
    final latestProof = inst.proofs.isEmpty ? null : inst.proofs.last;
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      color: Brand.bg,
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
            Text(money(inst.amount, currency), style: const TextStyle(color: Brand.accent, fontSize: 17, fontWeight: FontWeight.w800)),
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
              if (online) ...[
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
              ] else
                FilledButton.icon(
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
