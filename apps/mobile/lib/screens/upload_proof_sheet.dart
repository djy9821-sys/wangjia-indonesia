import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../api/medusa_client.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../widgets/common.dart';

/// Bottom sheet: photograph or pick the bank transfer receipt and submit it.
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

  /// Shown in the sheet itself: a snack bar would come up behind it.
  String? _error;

  Future<void> _pick(ImageSource source) async {
    try {
      final x = await ImagePicker().pickImage(source: source, maxWidth: 1600, imageQuality: 85);
      if (x == null || !mounted) return;
      setState(() {
        _file = x;
        _error = null;
      });
    } catch (_) {
      // No camera on this phone, or the permission was refused.
      if (mounted) setState(() => _error = S.t('err_photo'));
    }
  }

  Future<void> _submit() async {
    if (_file == null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
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
      if (mounted) setState(() => _error = friendlyError(e));
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
              Text(S.t('choose_photo'), style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _busy ? null : () => _pick(ImageSource.camera),
                      icon: const Icon(Icons.photo_camera_outlined),
                      label: Text(S.t('take_photo')),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _busy ? null : () => _pick(ImageSource.gallery),
                      icon: const Icon(Icons.photo_library_outlined),
                      label: Text(S.t('from_gallery')),
                    ),
                  ),
                ],
              ),
              if (_file != null) ...[
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(
                    File(_file!.path),
                    height: 120,
                    fit: BoxFit.cover,
                    cacheHeight: 360,
                    errorBuilder: (_, __, ___) => Text(_file!.name),
                  ),
                ),
              ],
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
              if (_error != null) ...[
                Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                const SizedBox(height: 8),
              ],
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
