import 'dart:async';
import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../api/medusa_client.dart';
import '../format.dart';
import '../l10n/strings.dart';

/// Turns exceptions into short Indonesian/English messages for farmers,
/// never raw `SocketException: …` strings.
String friendlyError(Object? e) {
  if (e is SocketException || e is HandshakeException || e is http.ClientException) return S.t('err_offline');
  if (e is TimeoutException) return S.t('err_timeout');
  if (e is MedusaException) {
    switch (e.status) {
      case 401:
        return S.t('err_session');
      case 403:
        return S.t('err_forbidden');
      case 404:
        return S.t('err_not_found');
      case 429:
        return S.t('err_too_many');
    }
    if (e.status >= 500) return S.t('err_server');
    // 4xx from our own routes carry a customer-facing Indonesian message.
    return e.message.startsWith('HTTP ') ? S.t('err_generic') : e.message;
  }
  if (e is FormatException) return S.t('err_server');
  return S.t('err_generic');
}

class ErrorRetry extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;
  const ErrorRetry({super.key, required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 40),
              const SizedBox(height: 12),
              Text(S.t('error'), style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              Text(friendlyError(error), textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 16),
              FilledButton(onPressed: onRetry, child: Text(S.t('retry'))),
            ],
          ),
        ),
      );
}

class StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  const StatusChip(this.label, this.color, {super.key});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: color.withValues(alpha: 0.5)),
        ),
        child: Text(label,
            style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
      );
}

Color installmentColor(String status) => switch (status) {
      'paid' => const Color(0xFF1B8A5A),
      'refunded' => const Color(0xFF7C3AED),
      'awaiting_confirmation' => const Color(0xFFD98E04),
      'cancelled' => const Color(0xFFB3261E),
      _ => const Color(0xFF6B7280),
    };

Color fulfillmentColor(String? status) => switch (status) {
      'shipped' || 'partially_shipped' => const Color(0xFF1D4ED8),
      'delivered' || 'partially_delivered' => const Color(0xFF1B8A5A),
      'fulfilled' || 'partially_fulfilled' => const Color(0xFF7C3AED),
      'canceled' => const Color(0xFFB3261E),
      _ => const Color(0xFF6B7280),
    };

/// A new message replaces the one on screen instead of queueing behind it.
void showSnack(BuildContext context, String msg) => ScaffoldMessenger.of(context)
  ..clearSnackBars()
  ..showSnackBar(SnackBar(content: Text(msg)));

/// A product picture for a list, decoded for the box it is shown in and not at
/// the size it is stored at: 1200 px takes 5.8 MB of memory, a 76-point box on
/// a 3x screen 0.2 MB. [width] is the box, in logical pixels.
Widget productThumb(BuildContext context, String url, {required double width}) => CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.contain,
      memCacheWidth: (width * MediaQuery.devicePixelRatioOf(context)).ceil(),
    );

/// Friendly empty list: icon, one line, optional action (e.g. "Lihat produk").
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;
  const EmptyState({super.key, required this.icon, required this.title, this.subtitle, this.actionLabel, this.onAction});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 84,
                height: 84,
                decoration: const BoxDecoration(color: Color(0xFFDCEBF5), shape: BoxShape.circle),
                child: Icon(icon, size: 40, color: const Color(0xFF0E5A8A)),
              ),
              const SizedBox(height: 16),
              Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
              if (subtitle != null) ...[
                const SizedBox(height: 6),
                Text(subtitle!, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.black54)),
              ],
              if (actionLabel != null && onAction != null) ...[
                const SizedBox(height: 20),
                FilledButton.tonal(
                  style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
                  onPressed: onAction,
                  child: Text(actionLabel!),
                ),
              ],
            ],
          ),
        ),
      );
}

/// Rounded section title used above lists on detail screens.
class SectionTitle extends StatelessWidget {
  final String text;
  const SectionTitle(this.text, {super.key});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 18, 4, 8),
        child: Text(text.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Colors.black54, letterSpacing: 1.1, fontWeight: FontWeight.w700)),
      );
}

Color paymentColor(String? status) => switch (status) {
      'captured' || 'paid' => const Color(0xFF1B8A5A),
      'partially_captured' || 'authorized' || 'awaiting' => const Color(0xFFD98E04),
      'refunded' || 'partially_refunded' => const Color(0xFF7C3AED),
      'canceled' => const Color(0xFFB3261E),
      _ => const Color(0xFF6B7280),
    };

// Checks for the fields of the address forms.
String? requiredField(String? v) => (v == null || v.trim().isEmpty) ? S.t('err_required') : null;
String? phoneField(String? v) => looksLikePhone((v ?? '').trim()) ? null : S.t('err_phone_invalid');
String? emailField(String? v) => looksLikeEmail((v ?? '').trim()) ? null : S.t('err_email_invalid');

/// Checks every field of [form] and scrolls to the topmost one that needs
/// fixing. Only fields that are built get checked, so the form belongs in a
/// Column: a lazily built list drops the fields that are scrolled away.
bool validateForm(GlobalKey<FormState> form) {
  final invalid = form.currentState!.validateGranularly();
  if (invalid.isEmpty) return true;
  double top(FormFieldState<Object?> f) => (f.context.findRenderObject() as RenderBox).localToGlobal(Offset.zero).dy;
  final first = invalid.reduce((a, b) => top(a) <= top(b) ? a : b);
  Scrollable.ensureVisible(first.context, alignment: 0.2, duration: const Duration(milliseconds: 250));
  return false;
}
