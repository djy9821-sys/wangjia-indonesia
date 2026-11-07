import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'api/medusa_client.dart';
import 'cart.dart';
import 'dev_proxy.dart';
import 'monitoring.dart';
import 'push.dart';
import 'screens/order_detail_screen.dart';
import 'l10n/strings.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'screens/warranty_screen.dart';
import 'update_check.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  installDevProxy();
  await initializeDateFormatting('id_ID');
  await MedusaClient.instance.init();
  await CartStore.instance.load();
  await PushService.instance.init();
  await runMonitored(() => runApp(const TrukAirApp()));
}

final navigatorKey = GlobalKey<NavigatorState>();

class TrukAirApp extends StatelessWidget {
  const TrukAirApp({super.key});

  @override
  Widget build(BuildContext context) => ValueListenableBuilder<String>(
        valueListenable: S.locale,
        builder: (context, _, __) => MaterialApp(
          navigatorKey: navigatorKey,
          builder: (context, child) => PushListener(
            onOpenOrder: (id) => navigatorKey.currentState?.push(
              MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: id)),
            ),
            onOpenWarranty: () => navigatorKey.currentState?.push(
              MaterialPageRoute(builder: (_) => const WarrantyScreen()),
            ),
            child: child ?? const SizedBox.shrink(),
          ),
          title: S.t('app_title'),
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            colorSchemeSeed: const Color(0xFF0E5A8A),
            useMaterial3: true,
            inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
          ),
          home: const UpdateGate(child: AuthGate()),
        ),
      );
}

/// Shows the login screen until a customer session exists.
class AuthGate extends StatefulWidget {
  const AuthGate({super.key});
  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  late Future<Map<String, dynamic>?> _me = MedusaClient.instance.me();

  @override
  void initState() {
    super.initState();
    // Expired or revoked session anywhere in the app -> back to login.
    MedusaClient.instance.onUnauthorized = () {
      if (mounted) _refresh();
    };
  }

  void _refresh() => setState(() {
      _me = MedusaClient.instance.me();
    });

  @override
  Widget build(BuildContext context) => FutureBuilder(
        future: _me,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Scaffold(body: Center(child: CircularProgressIndicator()));
          }
          if (snap.data == null) {
            return LoginScreen(onLoggedIn: _refresh);
          }
          // Logged in: make sure this device receives order notifications.
          PushService.instance.registerForCurrentUser();
          setMonitoredUser(snap.data!['id'] as String?);
          return HomeShell(customer: snap.data!, onLoggedOut: _refresh);
        },
      );
}
