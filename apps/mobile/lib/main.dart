import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'api/medusa_client.dart';
import 'cart.dart';
import 'dev_proxy.dart';
import 'monitoring.dart';
import 'push.dart';
import 'screens/order_detail_screen.dart';
import 'l10n/strings.dart';
import 'widgets/brand.dart';
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
            colorSchemeSeed: Brand.navy,
            useMaterial3: true,
            scaffoldBackgroundColor: Brand.bg,
            appBarTheme: const AppBarTheme(
              centerTitle: true,
              backgroundColor: Colors.white,
              foregroundColor: Colors.black87,
              elevation: 0,
              scrolledUnderElevation: 0,
              titleTextStyle: TextStyle(color: Colors.black87, fontSize: 16, fontWeight: FontWeight.w700),
            ),
            cardTheme: CardThemeData(
              elevation: 0,
              color: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: Brand.line)),
              margin: EdgeInsets.zero,
            ),
            // Primary actions are orange-red (buy / pay / confirm); secondary stay navy.
            filledButtonTheme: FilledButtonThemeData(
              style: FilledButton.styleFrom(
                backgroundColor: Brand.accent,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(48),
                textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            outlinedButtonTheme: OutlinedButtonThemeData(
              style: OutlinedButton.styleFrom(
                foregroundColor: Brand.navy,
                side: const BorderSide(color: Brand.navy),
                minimumSize: const Size.fromHeight(48),
                textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(foregroundColor: Brand.navy)),
            chipTheme: ChipThemeData(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)), side: const BorderSide(color: Brand.line)),
            navigationBarTheme: NavigationBarThemeData(
              backgroundColor: Colors.white,
              indicatorColor: Brand.accentSoft,
              iconTheme: WidgetStateProperty.resolveWith(
                (states) => IconThemeData(color: states.contains(WidgetState.selected) ? Brand.accent : Colors.black54),
              ),
              labelTextStyle: WidgetStateProperty.resolveWith(
                (states) => TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                  color: states.contains(WidgetState.selected) ? Brand.accentDark : Colors.black54,
                ),
              ),
            ),
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
