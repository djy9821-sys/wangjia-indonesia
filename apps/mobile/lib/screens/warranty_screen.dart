import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/medusa_client.dart';
import '../config.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';
import 'products_screen.dart';
import 'warranty_scan_screen.dart';

/// Garansi & Keaslian: scan a label, type a code, see registered machines.
class WarrantyScreen extends StatefulWidget {
  const WarrantyScreen({super.key});
  @override
  State<WarrantyScreen> createState() => _WarrantyScreenState();
}

class _WarrantyScreenState extends State<WarrantyScreen> {
  late Future<List<WarrantyUnit>> _future = MedusaClient.instance.myWarrantyUnits();
  final _code = TextEditingController();
  bool _checking = false;

  Future<void> _reload() async {
    setState(() {
      _future = MedusaClient.instance.myWarrantyUnits();
    });
    await _future;
  }

  Future<void> _scan() async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const WarrantyScanScreen()),
    );
    if (changed == true) _reload();
  }

  /// Service request on WhatsApp (serial prefilled) or jump to spare parts.
  Future<void> _unitActions(WarrantyUnit u) => showModalBottomSheet(
        context: context,
        showDragHandle: true,
        builder: (ctx) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(title: Text(u.title), subtitle: Text('${S.t('serial')}: ${u.serial}')),
              ListTile(
                leading: const Icon(Icons.build_outlined),
                title: Text(S.t('request_service')),
                subtitle: Text(S.t('chat_whatsapp')),
                onTap: () {
                  Navigator.of(ctx).pop();
                  launchUrl(
                    Uri.parse('https://wa.me/${AppConfig.whatsappNumber}?text=${Uri.encodeComponent('Halo WANGJIA, saya ingin minta servis untuk ${u.title} nomor seri ${u.serial}.')}'),
                    mode: LaunchMode.externalApplication,
                  );
                },
              ),
              ListTile(
                leading: const Icon(Icons.settings_suggest_outlined),
                title: Text(S.t('spare_parts')),
                subtitle: Text(S.t('spare_parts_hint')),
                onTap: () {
                  Navigator.of(ctx).pop();
                  Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => const ProductsScreen(initialCategoryName: 'suku cadang'),
                  ));
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      );

  Future<void> _checkTyped() async {
    final raw = _code.text.trim();
    if (raw.isEmpty) return;
    setState(() => _checking = true);
    try {
      final result = await MedusaClient.instance.verifyWarranty(raw);
      if (!mounted) return;
      final changed = await showWarrantyResult(context, result);
      if (changed == true) {
        _code.clear();
        _reload();
      }
    } catch (e) {
      if (mounted) showSnack(context, '$e');
    } finally {
      if (mounted) setState(() => _checking = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(S.t('warranty'))),
        body: RefreshIndicator(
          onRefresh: _reload,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(S.t('warranty_intro')),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: _scan,
                icon: const Icon(Icons.qr_code_scanner),
                label: Text(S.t('scan_qr')),
              ),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: TextField(
                    controller: _code,
                    textCapitalization: TextCapitalization.characters,
                    decoration: InputDecoration(labelText: S.t('code'), hintText: 'ABCD2345EFGH'),
                    onSubmitted: (_) => _checkTyped(),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: _checking ? null : _checkTyped,
                  child: _checking
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(S.t('check')),
                ),
              ]),
              const SizedBox(height: 24),
              Text(S.t('my_units'), style: Theme.of(context).textTheme.titleMedium),
              Text(S.t('tap_unit_hint'), style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 8),
              FutureBuilder<List<WarrantyUnit>>(
                future: _future,
                builder: (context, snap) {
                  if (snap.hasError) return ErrorRetry(error: snap.error!, onRetry: _reload);
                  if (!snap.hasData) return const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()));
                  final list = snap.data!;
                  if (list.isEmpty) {
                    return Text(S.t('no_units'), style: TextStyle(color: Theme.of(context).colorScheme.outline));
                  }
                  return Column(
                    children: [
                      for (final u in list)
                        Card(
                          child: ListTile(
                            leading: Icon(Icons.verified, color: u.expired ? Colors.grey : const Color(0xFF1B8A5A)),
                            title: Text(u.title),
                            subtitle: Text([
                              '${S.t('serial')}: ${u.serial}',
                              '${S.t('warranty_until')}: ${shortDate(u.warrantyExpiresAt)}',
                              if ((u.farmLocation ?? '').isNotEmpty) u.farmLocation!,
                            ].join('\n')),
                            isThreeLine: true,
                            trailing: StatusChip(
                              u.expired ? S.t('expired') : S.t('active'),
                              u.expired ? const Color(0xFF6B7280) : const Color(0xFF1B8A5A),
                            ),
                            onTap: () => _unitActions(u),
                          ),
                        ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      );
}

/// Bottom sheet with the verification outcome and the register action.
/// Returns true when a registration happened.
Future<bool?> showWarrantyResult(BuildContext context, WarrantyCheck result) =>
    showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _ResultSheet(result: result),
    );

class _ResultSheet extends StatefulWidget {
  final WarrantyCheck result;
  const _ResultSheet({required this.result});
  @override
  State<_ResultSheet> createState() => _ResultSheetState();
}

class _ResultSheetState extends State<_ResultSheet> {
  final _farm = TextEditingController();
  bool _busy = false;
  WarrantyUnit? _registered;

  Future<void> _register() async {
    setState(() => _busy = true);
    try {
      final unit = await MedusaClient.instance.registerWarranty(widget.result.code!, farmLocation: _farm.text.trim());
      if (!mounted) return;
      setState(() => _registered = unit);
      showSnack(context, S.t('registered_ok'));
    } catch (e) {
      if (mounted) showSnack(context, '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.result;
    final scheme = Theme.of(context).colorScheme;
    final ok = r.genuine;
    final color = ok ? const Color(0xFF1B8A5A) : scheme.error;
    final registered = _registered != null || r.registered;
    final expires = _registered?.warrantyExpiresAt ?? r.warrantyExpiresAt;

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(ok ? Icons.verified : Icons.gpp_bad, color: color, size: 36),
            const SizedBox(width: 12),
            Expanded(
              child: Text(ok ? S.t('genuine') : S.t('not_genuine'),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(color: color)),
            ),
          ]),
          const SizedBox(height: 12),
          if (!ok) ...[
            Text(switch (r.reason) {
              'void' => S.t('reason_void'),
              'invalid_code' => S.t('reason_invalid'),
              _ => S.t('reason_unknown'),
            }),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () => launchUrl(
                Uri.parse('https://wa.me/${AppConfig.whatsappNumber}?text=${Uri.encodeComponent('Halo WANGJIA, saya menemukan label yang tidak terverifikasi.')}'),
                mode: LaunchMode.externalApplication,
              ),
              icon: const Icon(Icons.report_outlined),
              label: Text(S.t('report_fake')),
            ),
          ] else ...[
            Text(r.title, style: Theme.of(context).textTheme.titleMedium),
            Text('${S.t('serial')}: ${r.serial}'),
            const SizedBox(height: 4),
            if (registered)
              Text('${S.t('warranty_until')}: ${shortDate(expires)}')
            else
              Text('${S.t('warranty_label')}: ${r.warrantyMonths} ${S.t('warranty_not_registered')}'),
            if (r.scanCount > 5) ...[
              const SizedBox(height: 8),
              Text(S.t('scan_many'), style: TextStyle(color: scheme.error)),
            ],
            const SizedBox(height: 16),
            if (_registered != null || r.registeredToMe)
              StatusChip(S.t('registered_to_you'), const Color(0xFF1B8A5A))
            else if (r.registered)
              Text(S.t('registered_other'), style: TextStyle(color: scheme.error))
            else ...[
              TextField(
                controller: _farm,
                decoration: InputDecoration(labelText: S.t('farm_location')),
              ),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: _busy ? null : _register,
                icon: const Icon(Icons.verified_user_outlined),
                label: Text(S.t('register_warranty')),
              ),
            ],
          ],
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => Navigator.of(context).pop(_registered != null),
            child: Text(S.t('close')),
          ),
        ],
      ),
    );
  }
}
