import "package:flutter/material.dart";

import "../api/medusa_client.dart";
import "../format.dart";
import "../l10n/strings.dart";
import "../widgets/common.dart";
import "order_detail_screen.dart";
import "warranty_screen.dart";

class AppNotification {
  final String id;
  final String? title;
  final String text;
  final String? orderId;
  final String? warrantyUnitId;
  final String? createdAt;
  AppNotification(this.id, this.title, this.text, this.orderId, this.warrantyUnitId, this.createdAt);
  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
        j["id"] as String,
        j["title"] as String?,
        (j["text"] ?? "") as String,
        j["order_id"] as String?,
        j["warranty_unit_id"] as String?,
        j["created_at"] as String?,
      );
}

/// History of everything we sent the customer (WhatsApp / email copies),
/// so a missed push notification is never lost.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late Future<List<AppNotification>> _future = _load();

  Future<List<AppNotification>> _load() async {
    final res = await MedusaClient.instance.get("/store/notifications");
    return (res["notifications"] as List).map((e) => AppNotification.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> _reload() async {
    setState(() {
      _future = _load();
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(S.t("notifications"))),
        body: RefreshIndicator(
          onRefresh: _reload,
          child: FutureBuilder<List<AppNotification>>(
            future: _future,
            builder: (context, snap) {
              if (snap.hasError) return ErrorRetry(error: snap.error!, onRetry: _reload);
              if (!snap.hasData) return const Center(child: CircularProgressIndicator());
              final list = snap.data!;
              if (list.isEmpty) {
                return ListView(children: [Padding(padding: const EdgeInsets.all(24), child: Text(S.t("no_notifications"), textAlign: TextAlign.center))]);
              }
              return ListView.separated(
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: list.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, i) {
                  final n = list[i];
                  final target = n.orderId != null
                      ? () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: n.orderId!)))
                      : n.warrantyUnitId != null
                          ? () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const WarrantyScreen()))
                          : null;
                  return ListTile(
                    leading: Icon(n.warrantyUnitId != null ? Icons.verified_outlined : Icons.notifications_outlined),
                    title: Text(n.title ?? S.t("notifications")),
                    subtitle: Text("${n.text}\n${dateTime(n.createdAt)}"),
                    isThreeLine: true,
                    trailing: target == null ? null : const Icon(Icons.chevron_right),
                    onTap: target,
                  );
                },
              );
            },
          ),
        ),
      );
}
