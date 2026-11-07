import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'api/medusa_client.dart';
import 'l10n/strings.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('id_ID');
  await MedusaClient.instance.init();
  runApp(const TrukAirApp());
}

class TrukAirApp extends StatelessWidget {
  const TrukAirApp({super.key});

  @override
  Widget build(BuildContext context) => ValueListenableBuilder<String>(
        valueListenable: S.locale,
        builder: (context, _, __) => MaterialApp(
          title: S.t('app_title'),
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            colorSchemeSeed: const Color(0xFF0E5A8A),
            useMaterial3: true,
            inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
          ),
          home: const AuthGate(),
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
          return HomeShell(customer: snap.data!, onLoggedOut: _refresh);
        },
      );
}
