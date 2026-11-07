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
            scaffoldBackgroundColor: const Color(0xFFF4F8FB),
            appBarTheme: const AppBarTheme(centerTitle: true, backgroundColor: Color(0xFFF4F8FB), elevation: 0, scrolledUnderElevation: 0),
            cardTheme: CardThemeData(
              elevation: 0,
              color: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: const BorderSide(color: Color(0xFFE1EAF1))),
              margin: EdgeInsets.zero,
            ),
            filledButtonTheme: FilledButtonThemeData(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(50), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
            ),
            outlinedButtonTheme: OutlinedButtonThemeData(
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(50), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
            ),
            chipTheme: ChipThemeData(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)), side: const BorderSide(color: Color(0xFFD6E2EB))),
            navigationBarTheme: const NavigationBarThemeData(backgroundColor: Colors.white, indicatorColor: Color(0xFFDCEBF5)),
            inputDecorationTheme: InputDecorationTheme(
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          home: const UpdateGate(child: AuthGate()),
          // Universal / App Links: https://<storefront>/id/garansi/<code> -> warranty check.
          onGenerateRoute: (settings) {
            final m = RegExp(r'^(?:/[a-z]{2})?/garansi/([A-Za-z0-9]{6,20})/?$').firstMatch(settings.name ?? '');
            if (m != null) {
              return MaterialPageRoute(builder: (_) => WarrantyScreen(initialCode: m.group(1)));
            }
            return null;
          },
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
