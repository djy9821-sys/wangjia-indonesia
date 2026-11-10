import 'package:flutter/material.dart';

import '../api/medusa_client.dart';
import '../config.dart';
import '../format.dart';
import '../l10n/strings.dart';
import '../update_check.dart';
import '../widgets/common.dart';
import '../widgets/wangjia_logo.dart';


/// String key of the first problem with the form, or null when it can be
/// sent. Fields are checked in the order they appear on screen.
@visibleForTesting
String? authFormError({
  required bool register,
  required String email,
  required String password,
  String firstName = '',
  String phone = '',
}) {
  if (!register) return email.isEmpty || password.isEmpty ? 'err_fill_login' : null;
  if (firstName.isEmpty) return 'err_name_required';
  if (!looksLikePhone(phone)) return 'err_phone_invalid';
  if (!looksLikeEmail(email)) return 'err_email_invalid';
  if (password.length < 8) return 'err_password_short';
  return null;
}

/// True when a customer is signed in, asking on the login page first if not.
Future<bool> ensureSignedIn(BuildContext context) async {
  if (MedusaClient.instance.isLoggedIn) return true;
  final ok = await Navigator.of(context).push<bool>(
    MaterialPageRoute(builder: (ctx) => LoginScreen(onLoggedIn: () => Navigator.of(ctx).pop(true))),
  );
  return ok == true;
}

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoggedIn;
  const LoginScreen({super.key, required this.onLoggedIn});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _register = false;
  bool _busy = false;
  bool _showPassword = false;
  final _email = TextEditingController(text: AppConfig.devEmail);
  final _password = TextEditingController(text: AppConfig.devPassword);
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _phone = TextEditingController();
  final _company = TextEditingController();
  final _code = TextEditingController();
  String? _verificationToken;
  String? _verifiedPhone;
  bool _codeSent = false;
  int _resendIn = 0;

  Future<void> _sendCode() async {
    try {
      await MedusaClient.instance.requestOtp(_phone.text.trim());
      setState(() {
        _codeSent = true;
        _resendIn = 60;
      });
      _tick();
      if (mounted) showSnack(context, S.t('code_sent'));
    } catch (e) {
      if (mounted) showSnack(context, friendlyError(e));
    }
  }

  void _tick() {
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted || _resendIn <= 0) return;
      setState(() => _resendIn--);
      _tick();
    });
  }

  Future<void> _verifyCode() async {
    try {
      final token = await MedusaClient.instance.verifyOtp(_phone.text.trim(), _code.text.trim());
      setState(() {
        _verificationToken = token;
        _verifiedPhone = _phone.text.trim();
      });
      if (mounted) showSnack(context, S.t('phone_verified'));
    } catch (e) {
      if (mounted) showSnack(context, friendlyError(e));
    }
  }

  Future<void> _forgotPassword() async {
    final ctrl = TextEditingController(text: _email.text.trim());
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(S.t('reset_title')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(S.t('reset_hint')),
            const SizedBox(height: 12),
            TextField(controller: ctrl, keyboardType: TextInputType.emailAddress, decoration: InputDecoration(labelText: S.t('email'))),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(S.t('cancel'))),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(S.t('send_link'))),
        ],
      ),
    );
    if (ok != true || ctrl.text.trim().isEmpty) return;
    try {
      await MedusaClient.instance.requestPasswordReset(ctrl.text.trim());
    } catch (e) {
      // The server answers the same for known and unknown emails, so a failure
      // here is the request itself: offline, timed out, too many tries.
      if (mounted) showSnack(context, friendlyError(e));
      return;
    }
    // One message whether or not the email has an account.
    if (mounted) showSnack(context, S.t('reset_sent'));
  }

  Future<void> _submit() async {
    final email = _email.text.trim();
    final problem = authFormError(
      register: _register,
      email: email,
      password: _password.text,
      firstName: _first.text.trim(),
      phone: _phone.text.trim(),
    );
    if (problem != null) {
      showSnack(context, S.t(problem));
      return;
    }
    setState(() => _busy = true);
    try {
      final api = MedusaClient.instance;
      if (_register) {
        await api.register(
          email: email,
          password: _password.text,
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          phone: _phone.text.trim(),
          company: _company.text.trim(),
          phoneVerificationToken: _verifiedPhone == _phone.text.trim() ? _verificationToken : null,
        );
      } else {
        await api.login(email, _password.text);
      }
      if (!mounted) return;
      widget.onLoggedIn();
    } on SignupIncomplete {
      if (!mounted) return;
      showSnack(context, S.t('err_signup_incomplete'));
      setState(() => _register = true);
    } catch (e) {
      if (!mounted) return;
      // On this screen a 401 is about what was typed, not an expired session.
      final rejected = e is MedusaException && e.status == 401;
      showSnack(context, rejected ? S.t(_register ? 'err_email_taken' : 'err_login') : friendlyError(e));
      if (rejected && _register) setState(() => _register = false);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        // Blends into the page; carries the back arrow when opened from the shop.
        appBar: AppBar(backgroundColor: Theme.of(context).scaffoldBackgroundColor),
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.fromLTRB(20, 22, 20, 20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [Color(0xFF0193DE), Color(0xFF0E5A8A)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('WANGJIA\u00AE', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: 3)),
                                const SizedBox(height: 2),
                                const Text('KINCIR AIR · AERATOR TAMBAK', style: TextStyle(color: Colors.white70, fontSize: 10, letterSpacing: 1.4, fontWeight: FontWeight.w600)),
                                const SizedBox(height: 10),
                                Text(S.t('login_tagline'), style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.3)),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          const WangjiaLogo(size: 64, withText: false),
                        ],
                      ),
                    ),
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
                      TextField(
                        controller: _phone,
                        keyboardType: TextInputType.phone,
                        onChanged: (_) => setState(() {}),
                        decoration: InputDecoration(
                          labelText: S.t('phone'),
                          hintText: '+62…',
                          suffixIcon: _verifiedPhone == _phone.text.trim() && _verificationToken != null
                              ? const Icon(Icons.verified, color: Color(0xFF1B8A5A))
                              : phoneCodes
                                  ? TextButton(
                                      onPressed: _phone.text.trim().length >= 9 && _resendIn == 0 ? _sendCode : null,
                                      child: Text(_resendIn > 0 ? '${S.t('resend_in')} ${_resendIn}s' : S.t('send_code')),
                                    )
                                  : null,
                        ),
                      ),
                      if (_codeSent && _verificationToken == null) ...[
                        const SizedBox(height: 12),
                        Row(children: [
                          Expanded(
                            child: TextField(
                              controller: _code,
                              keyboardType: TextInputType.number,
                              maxLength: 6,
                              decoration: InputDecoration(labelText: S.t('enter_code'), counterText: ''),
                            ),
                          ),
                          const SizedBox(width: 12),
                          FilledButton.tonal(onPressed: _verifyCode, child: Text(S.t('verify'))),
                        ]),
                      ],
                      const SizedBox(height: 12),
                      TextField(controller: _company, decoration: InputDecoration(labelText: S.t('company'))),
                      const SizedBox(height: 12),
                    ],
                    TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: InputDecoration(labelText: S.t('email'))),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _password,
                      obscureText: !_showPassword,
                      onSubmitted: (_) => _busy ? null : _submit(),
                      decoration: InputDecoration(
                        labelText: S.t('password'),
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _showPassword = !_showPassword),
                          icon: Icon(_showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: _busy ? null : _submit,
                      child: _busy
                          ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                          : Text(_register ? S.t('register') : S.t('login')),
                    ),
                    if (!_register)
                      TextButton(onPressed: _forgotPassword, child: Text(S.t('forgot_password'))),
                    const SizedBox(height: 4),
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
