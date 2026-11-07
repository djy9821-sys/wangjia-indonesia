import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'api/medusa_client.dart';
import 'config.dart';
import 'l10n/strings.dart';

/// Compares dotted versions ("1.2.10" > "1.2.9"). Non-numeric parts count as 0.
int compareVersions(String a, String b) {
  final pa = a.split('.').map((e) => int.tryParse(e.trim()) ?? 0).toList();
  final pb = b.split('.').map((e) => int.tryParse(e.trim()) ?? 0).toList();
  for (var i = 0; i < 3; i++) {
    final x = i < pa.length ? pa[i] : 0;
    final y = i < pb.length ? pb[i] : 0;
    if (x != y) return x.compareTo(y);
  }
  return 0;
}

class UpdatePolicy {
  final String minVersion;
  final String latestVersion;
  final String? androidUrl;
  final String? iosUrl;
  final String? message;
  UpdatePolicy(this.minVersion, this.latestVersion, this.androidUrl, this.iosUrl, this.message);

  bool get mustUpdate => compareVersions(AppConfig.appVersion, minVersion) < 0;
  bool get canUpdate => compareVersions(AppConfig.appVersion, latestVersion) < 0;
  String? get storeUrl => Platform.isIOS ? iosUrl : androidUrl;
}

/// Asks the backend for the version policy; blocks the app below the minimum
/// version, otherwise shows a one-time banner when a newer build exists.
class UpdateGate extends StatefulWidget {
  final Widget child;
  const UpdateGate({super.key, required this.child});
  @override
  State<UpdateGate> createState() => _UpdateGateState();
}

class _UpdateGateState extends State<UpdateGate> {
  UpdatePolicy? _policy;
  bool _dismissed = false;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    try {
      final res = await MedusaClient.instance.get('/store/app-version');
      if (!mounted) return;
      setState(() => _policy = UpdatePolicy(
            (res['min_version'] ?? '0.0.0') as String,
            (res['latest_version'] ?? '0.0.0') as String,
            res['android_url'] as String?,
            res['ios_url'] as String?,
            res['message'] as String?,
          ));
    } catch (_) {
      // Offline or old backend: never block the app on this.
    }
  }

  Future<void> _open() async {
    final url = _policy?.storeUrl;
    if (url != null) await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final p = _policy;
    if (p != null && p.mustUpdate) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.system_update, size: 56),
                const SizedBox(height: 16),
                Text(S.t('update_required'), style: Theme.of(context).textTheme.titleLarge, textAlign: TextAlign.center),
                const SizedBox(height: 8),
                Text(p.message ?? S.t('update_required_hint'), textAlign: TextAlign.center),
                const SizedBox(height: 24),
                FilledButton.icon(onPressed: _open, icon: const Icon(Icons.download), label: Text(S.t('update_now'))),
              ],
            ),
          ),
        ),
      );
    }
    return Column(
      children: [
        if (p != null && p.canUpdate && !_dismissed)
          Material(
            color: Theme.of(context).colorScheme.primaryContainer,
            child: SafeArea(
              bottom: false,
              child: ListTile(
                dense: true,
                leading: const Icon(Icons.system_update_alt),
                title: Text(p.message ?? S.t('update_available')),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextButton(onPressed: _open, child: Text(S.t('update_now'))),
                    IconButton(onPressed: () => setState(() => _dismissed = true), icon: const Icon(Icons.close)),
                  ],
                ),
              ),
            ),
          ),
        Expanded(child: widget.child),
      ],
    );
  }
}
