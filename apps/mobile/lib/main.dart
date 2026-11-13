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
import 'widgets/common.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'screens/warranty_screen.dart';
import 'update_check.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  installDevProxy();
  await initializeDateFormatting('id_ID');
  await S.load();
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

/// The shop is open to guests; a customer session adds orders, quotes and the
/// account. The shell stays mounted while the session changes, so a page that
/// asked for a sign-in can carry on afterwards.
class AuthGate extends StatefulWidget {
  const AuthGate({super.key});
  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  Map<String, dynamic>? _customer;
  // The first check of a saved login. The shop is open meanwhile; only the
  // customer's own pages wait for it.
  bool _loading = MedusaClient.instance.isLoggedIn;
  int _refreshes = 0;

  @override
  void initState() {
    super.initState();
    MedusaClient.instance.onSessionChanged = _refresh;
    if (_loading) _refresh();
  }

  @override
  void dispose() {
    MedusaClient.instance.onSessionChanged = null;
    super.dispose();
  }

  /// Loads the customer behind the current session. Returns what went wrong
  /// when the session could not be checked (no signal), otherwise null.
  Future<Object?> _refresh() async {
    final turn = ++_refreshes;
    Map<String, dynamic>? customer;
    Object? error;
    try {
      customer = await MedusaClient.instance.me();
    } catch (e) {
      error = e;
    }
    // The latest refresh wins: a slow answer must not undo a newer one.
    if (!mounted || turn != _refreshes) return error;
    setState(() {
      _customer = customer;
      _loading = false;
    });
    if (customer != null) PushService.instance.registerForCurrentUser();
    setMonitoredUser(customer?['id'] as String?);
    return error;
  }

  Future<void> _signIn() async {
    // A saved login that could not be checked earlier (no signal): try again.
    final error = MedusaClient.instance.isLoggedIn ? await _refresh() : null;
    if (!mounted || _customer != null) return;
    if (MedusaClient.instance.isLoggedIn) {
      showSnack(context, friendlyError(error));
    } else {
      await ensureSignedIn(context);
    }
  }

  @override
  Widget build(BuildContext context) => HomeShell(customer: _customer, checking: _loading, onSignIn: _signIn);
}
