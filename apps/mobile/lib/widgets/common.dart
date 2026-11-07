import 'package:flutter/material.dart';

import '../l10n/strings.dart';

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
              Text('$error', textAlign: TextAlign.center,
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
