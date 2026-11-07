import 'dart:async';
import 'dart:io' show Platform;

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

import 'api/medusa_client.dart';

/// Push notifications via Firebase Cloud Messaging.
///
/// Firebase config files (ios/Runner/GoogleService-Info.plist,
/// android/app/google-services.json) are NOT in the repo; without them
/// initialisation fails and the app simply runs without push.
class PushService {
  PushService._();
  static final PushService instance = PushService._();

  bool _ready = false;
  String? _token;
  final messages = StreamController<RemoteMessage>.broadcast();
  final opened = StreamController<RemoteMessage>.broadcast();

  bool get ready => _ready;

  Future<void> init() async {
    try {
      await Firebase.initializeApp();
      _ready = true;
    } catch (e) {
      debugPrint('[push] Firebase not configured, push disabled: $e');
      return;
    }
    final fm = FirebaseMessaging.instance;
    FirebaseMessaging.onMessage.listen(messages.add);
    FirebaseMessaging.onMessageOpenedApp.listen(opened.add);
    final initial = await fm.getInitialMessage();
    if (initial != null) opened.add(initial);
    // Token arrives (and refreshes) through onRegistered after register().
    fm.onRegistered.listen((t) {
      _token = t;
      _register();
    });
  }

  /// Ask permission and register the token for the logged-in customer.
  Future<void> registerForCurrentUser() async {
    if (!_ready) return;
    try {
      final fm = FirebaseMessaging.instance;
      await fm.requestPermission(alert: true, badge: true, sound: true);
      if (Platform.isIOS) {
        await fm.setForegroundNotificationPresentationOptions(alert: true, badge: true, sound: true);
      }
      await fm.register();
    } catch (e) {
      debugPrint('[push] register failed: $e');
    }
  }

  Future<void> _register() async {
    final t = _token;
    if (t == null || !MedusaClient.instance.isLoggedIn) return;
    try {
      await MedusaClient.instance.registerPushToken(t, Platform.isIOS ? 'ios' : 'android');
    } catch (e) {
      debugPrint('[push] token upload failed: $e');
    }
  }

  /// Forget this device on logout (best effort).
  Future<void> unregister() async {
    final t = _token;
    if (t == null) return;
    try {
      await MedusaClient.instance.deletePushToken(t);
    } catch (_) {}
  }
}

/// Shows foreground pushes as a banner and routes taps to the order.
class PushListener extends StatefulWidget {
  final Widget child;
  final void Function(String orderId) onOpenOrder;
  /// Warranty notifications (registered / expiring) open the Garansi screen.
  final VoidCallback? onOpenWarranty;
  const PushListener({super.key, required this.child, required this.onOpenOrder, this.onOpenWarranty});
  @override
  State<PushListener> createState() => _PushListenerState();
}

class _PushListenerState extends State<PushListener> {
  StreamSubscription? _a, _b;

  @override
  void initState() {
    super.initState();
    _a = PushService.instance.messages.stream.listen((m) {
      final n = m.notification;
      if (n == null || !mounted) return;
      final orderId = m.data['order_id'] as String?;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('${n.title ?? ''}\n${n.body ?? ''}'.trim()),
        duration: const Duration(seconds: 6),
        action: orderId != null
            ? SnackBarAction(label: 'Lihat', onPressed: () => widget.onOpenOrder(orderId))
            : m.data['warranty_unit_id'] != null && widget.onOpenWarranty != null
                ? SnackBarAction(label: 'Lihat', onPressed: widget.onOpenWarranty!)
                : null,
      ));
    });
    _b = PushService.instance.opened.stream.listen((m) {
      final orderId = m.data['order_id'] as String?;
      if (orderId != null) {
        widget.onOpenOrder(orderId);
      } else if (m.data['warranty_unit_id'] != null) {
        widget.onOpenWarranty?.call();
      }
    });
  }

  @override
  void dispose() {
    _a?.cancel();
    _b?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
