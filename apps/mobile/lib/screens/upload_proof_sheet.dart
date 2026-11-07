import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../api/medusa_client.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';

/// Bottom sheet: pick a photo of the bank transfer receipt and submit it.
class UploadProofSheet extends StatefulWidget {
  final Installment installment;
  final String currency;
  const UploadProofSheet({super.key, required this.installment, required this.currency});
  @override
  State<UploadProofSheet> createState() => _UploadProofSheetState();
}

class _UploadProofSheetState extends State<UploadProofSheet> {
  final _bank = TextEditingController();
  final _sender = TextEditingController();
  late final _amount = TextEditingController(text: widget.installment.amount.toStringAsFixed(0));
  final _note = TextEditingController();
  DateTime _date = DateTime.now();
  XFile? _file;
  bool _busy = false;

  Future<void> _pick() async {
    final picker = ImagePicker();
    final x = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1600, imageQuality: 85);
    if (x != null) setState(() => _file = x);
  }

  Future<void> _submit() async {
    if (_file == null) return;
    setState(() => _busy = true);
    try {
      final bytes = await _file!.readAsBytes();
      final name = _file!.name;
      final mime = name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      await MedusaClient.instance.uploadProof(
        widget.installment.id,
        bytes: bytes,
        filename: name,
        mimeType: mime,
        bankName: _bank.text.trim().isEmpty ? null : _bank.text.trim(),
        senderName: _sender.text.trim().isEmpty ? null : _sender.text.trim(),
        amount: num.tryParse(_amount.text.replaceAll('.', '').replaceAll(',', '')),
        transferredAt: _date.toIso8601String(),
        note: _note.text.trim().isEmpty ? null : _note.text.trim(),
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) showSnack(context, '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(S.t('upload_proof'), style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              Text('${widget.installment.label} · ${money(widget.installment.amount, widget.currency)}',
                  style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _pick,
                icon: const Icon(Icons.photo_library_outlined),
                label: Text(_file == null ? S.t('choose_photo') : _file!.name),
              ),
              const SizedBox(height: 12),
              TextField(controller: _bank, decoration: InputDecoration(labelText: S.t('bank_name'), hintText: 'BCA / Mandiri / BNI / BRI')),
              const SizedBox(height: 12),
              TextField(controller: _sender, decoration: InputDecoration(labelText: S.t('sender_name'))),
              const SizedBox(height: 12),
              TextField(controller: _amount, keyboardType: TextInputType.number, decoration: InputDecoration(labelText: S.t('amount'))),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(S.t('transfer_date')),
                subtitle: Text(shortDate(_date.toIso8601String())),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final d = await showDatePicker(
                    context: context,
                    initialDate: _date,
                    firstDate: DateTime.now().subtract(const Duration(days: 60)),
                    lastDate: DateTime.now(),
                  );
                  if (d != null) setState(() => _date = d);
                },
              ),
              TextField(controller: _note, maxLines: 2, decoration: InputDecoration(labelText: S.t('note'))),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _busy || _file == null ? null : _submit,
                child: _busy
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(S.t('submit')),
              ),
              TextButton(onPressed: () => Navigator.of(context).pop(false), child: Text(S.t('cancel'))),
            ],
          ),
        ),
      );
}
