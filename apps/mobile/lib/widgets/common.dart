import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../api/medusa_client.dart';
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

void showSnack(BuildContext context, String msg) =>
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
