import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../config.dart';
import '../l10n/strings.dart';
import '../widgets/common.dart';
import '../widgets/wangjia_logo.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoggedIn;
  const LoginScreen({super.key, required this.onLoggedIn});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _register = false;
  bool _busy = false;
  final _email = TextEditingController(text: AppConfig.devEmail);
  final _password = TextEditingController(text: AppConfig.devPassword);
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _phone = TextEditingController();
  final _company = TextEditingController();

  Future<void> _submit() async {
    setState(() => _busy = true);
    try {
      final api = MedusaClient.instance;
      if (_register) {
        await api.register(
          email: _email.text.trim(),
          password: _password.text,
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          phone: _phone.text.trim(),
          company: _company.text.trim(),
        );
      } else {
        await api.login(_email.text.trim(), _password.text);
      }
      widget.onLoggedIn();
    } catch (e) {
      if (mounted) showSnack(context, '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const WangjiaLogo(size: 72),
                    const SizedBox(height: 4),
                    Text(S.t('app_title'),
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.black54)),
                    const SizedBox(height: 24),
                    SegmentedButton<bool>(
                      segments: [
                        ButtonSegment(value: false, label: Text(S.t('login'))),
                        ButtonSegment(value: true, label: Text(S.t('register'))),
                      ],
                      selected: {_register},
                      onSelectionChanged: (s) => setState(() => _register = s.first),
                    ),
                    const SizedBox(height: 20),
                    if (_register) ...[
                      Row(children: [
                        Expanded(child: TextField(controller: _first, decoration: InputDecoration(labelText: S.t('first_name')))),
                        const SizedBox(width: 12),
                        Expanded(child: TextField(controller: _last, decoration: InputDecoration(labelText: S.t('last_name')))),
                      ]),
                      const SizedBox(height: 12),
                      TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: InputDecoration(labelText: S.t('phone'), hintText: '+62…')),
                      const SizedBox(height: 12),
                      TextField(controller: _company, decoration: InputDecoration(labelText: S.t('company'))),
                      const SizedBox(height: 12),
                    ],
                    TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: InputDecoration(labelText: S.t('email'))),
                    const SizedBox(height: 12),
                    TextField(controller: _password, obscureText: true, decoration: InputDecoration(labelText: S.t('password'))),
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: _busy ? null : _submit,
                      child: _busy
                          ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                          : Text(_register ? S.t('register') : S.t('login')),
                    ),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () => S.locale.value = S.locale.value == 'id' ? 'en' : 'id',
                      child: Text(S.locale.value == 'id' ? 'English' : 'Bahasa Indonesia'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
}
