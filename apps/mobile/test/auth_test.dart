import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:wangjia_app/api/medusa_client.dart';
import 'package:wangjia_app/l10n/strings.dart';
import 'package:wangjia_app/screens/login_screen.dart';

const _register = '/auth/customer/emailpass/register';
const _login = '/auth/customer/emailpass';
const _customers = '/store/customers';
const _reset = '/auth/customer/emailpass/reset-password';

/// A session token shaped like the backend's: the payload carries the
/// customer id, empty while the login has no customer profile.
String _token(String customerId) =>
    'h.${base64Url.encode(utf8.encode(jsonEncode({'actor_id': customerId}))).replaceAll('=', '')}.s';

http.Response _ok(Map<String, dynamic> body) => http.Response(jsonEncode(body), 200);
http.Response _refused(int status, String message) => http.Response(jsonEncode({'message': message}), status);
final _taken = _refused(401, 'Identity with email already exists');
final _wrong = _refused(401, 'Invalid email or password');

void main() {
  // Made before the test binding: afterwards a real HTTP client can only be
  // created inside a running test.
  final api = MedusaClient.instance;
  TestWidgetsFlutterBinding.ensureInitialized();
  // The session token goes to an in-memory store instead of the keychain.
  FlutterSecureStorage.setMockInitialValues({});
  late List<http.Request> calls;

  /// Answers each request with the next response queued for its path.
  void backend(Map<String, List<http.Response>> replies) {
    calls = [];
    api.httpClient = MockClient((req) async {
      calls.add(req);
      return replies[req.url.path]!.removeAt(0);
    });
  }

  List<String> paths() => calls.map((c) => c.url.path).toList();

  setUp(() => api.logout());

  group('authFormError', () {
    String? signUp({
      String firstName = 'Budi',
      String phone = '+62 812-3456-7890',
      String email = 'budi@tambak.id',
      String password = 'rahasia88',
    }) =>
        authFormError(register: true, email: email, password: password, firstName: firstName, phone: phone);

    test('sign-in needs an email and a password, nothing else', () {
      expect(authFormError(register: false, email: '', password: 'x'), 'err_fill_login');
      expect(authFormError(register: false, email: 'budi@tambak.id', password: ''), 'err_fill_login');
      expect(authFormError(register: false, email: 'budi@tambak.id', password: 'x'), isNull);
    });

    test('sign-up reports the first problem in screen order', () {
      expect(signUp(), isNull);
      expect(signUp(firstName: '', phone: '', email: '', password: ''), 'err_name_required');
      expect(signUp(phone: '', email: '', password: ''), 'err_phone_invalid');
      expect(signUp(email: 'budi', password: ''), 'err_email_invalid');
      expect(signUp(password: '1234567'), 'err_password_short');
    });

    test('phone: at least 8 digits, at most 20 characters, any country', () {
      expect(signUp(phone: '0812345'), 'err_phone_invalid');
      expect(signUp(phone: '08123456'), isNull);
      expect(signUp(phone: '13800138000'), isNull);
      expect(signUp(phone: '+62 812 3456 7890 1234'), 'err_phone_invalid');
    });

    test('emails the backend would refuse are stopped before any request', () {
      for (final bad in [
        'budi', 'budi@', '@tambak.id', 'budi@tambak', 'budi@tambak.c',
        'budi..s@tambak.id', '.budi@tambak.id', 'budi @tambak.id', 'budi@tambak.id.',
      ]) {
        expect(signUp(email: bad), 'err_email_invalid', reason: bad);
      }
      for (final good in ['budi@tambak.id', 'budi.santoso+toko@mail.tambak.co.id', "o'neil_1@x-y.io"]) {
        expect(signUp(email: good), isNull, reason: good);
      }
    });
  });

  group('MedusaClient sign-up', () {
    Future<void> signUp() => api.register(
          email: 'budi@tambak.id',
          password: 'rahasia88',
          firstName: 'Budi',
          lastName: '',
          phone: '081234567890',
        );

    test('creates the login, then the customer, then signs in', () async {
      backend({
        _register: [_ok({'token': _token('')})],
        _customers: [_ok({'customer': {'id': 'cus_1'}})],
        _login: [_ok({'token': _token('cus_1')})],
      });
      await signUp();
      expect(paths(), [_register, _customers, _login]);
      expect(calls[1].headers['Authorization'], 'Bearer ${_token('')}');
      expect(jsonDecode(calls[1].body), containsPair('first_name', 'Budi'));
      expect(api.isLoggedIn, isTrue);
    });

    test('a failed customer step leaves nobody signed in', () async {
      backend({
        _register: [_ok({'token': _token('')})],
        _customers: [_refused(400, 'Nomor HP harus diverifikasi dengan kode WhatsApp sebelum mendaftar.')],
      });
      await expectLater(signUp(), throwsA(isA<MedusaException>().having((e) => e.status, 'status', 400)));
      expect(api.isLoggedIn, isFalse);
    });

    test('a failed last sign-in leaves nobody signed in', () async {
      backend({
        _register: [_ok({'token': _token('')})],
        _customers: [_ok({'customer': {'id': 'cus_1'}})],
        _login: [_refused(500, 'An unknown error occurred.')],
      });
      await expectLater(signUp(), throwsA(isA<MedusaException>().having((e) => e.status, 'status', 500)));
      expect(api.isLoggedIn, isFalse);
    });

    test('finishes a sign-up that stopped after the login was created', () async {
      backend({
        _register: [_taken],
        _login: [_ok({'token': _token('')}), _ok({'token': _token('cus_1')})],
        _customers: [_ok({'customer': {'id': 'cus_1'}})],
      });
      await signUp();
      expect(paths(), [_register, _login, _customers, _login]);
      expect(calls[2].headers['Authorization'], 'Bearer ${_token('')}');
      expect(api.isLoggedIn, isTrue);
    });

    test('an email that already has a customer is refused, not overwritten', () async {
      backend({
        _register: [_taken],
        _login: [_ok({'token': _token('cus_1')})],
      });
      await expectLater(signUp(), throwsA(isA<MedusaException>().having((e) => e.status, 'status', 401)));
      expect(paths(), [_register, _login]);
      expect(api.isLoggedIn, isFalse);
    });

    test('a taken email with another password is refused', () async {
      backend({
        _register: [_taken],
        _login: [_wrong],
      });
      await expectLater(signUp(), throwsA(isA<MedusaException>().having((e) => e.status, 'status', 401)));
      expect(paths(), [_register, _login]);
      expect(api.isLoggedIn, isFalse);
    });
  });

  group('MedusaClient sign-in', () {
    test('keeps the session of a customer', () async {
      backend({
        _login: [_ok({'token': _token('cus_1')})],
      });
      await api.login('budi@tambak.id', 'rahasia88');
      expect(api.isLoggedIn, isTrue);
    });

    test('a login without a customer profile is not a session', () async {
      backend({
        _login: [_ok({'token': _token('')})],
      });
      await expectLater(api.login('budi@tambak.id', 'rahasia88'), throwsA(isA<SignupIncomplete>()));
      expect(api.isLoggedIn, isFalse);
    });
  });

  group('MedusaClient password reset', () {
    test('the plain-text answer of the server counts as sent', () async {
      backend({
        _reset: [http.Response('Created', 201)],
      });
      await api.requestPasswordReset('budi@tambak.id');
      expect(jsonDecode(calls.single.body), {'identifier': 'budi@tambak.id'});
    });

    test('a refusal is reported', () async {
      backend({
        _reset: [_refused(429, 'Terlalu banyak percobaan.')],
      });
      await expectLater(
        api.requestPasswordReset('budi@tambak.id'),
        throwsA(isA<MedusaException>().having((e) => e.status, 'status', 429)),
      );
    });
  });

  group('login screen', () {
    var loggedIn = 0;

    Future<void> open(WidgetTester tester) async {
      loggedIn = 0;
      await tester.pumpWidget(MaterialApp(home: LoginScreen(onLoggedIn: () => loggedIn++)));
    }

    Future<void> type(WidgetTester tester, String label, String text) =>
        tester.enterText(find.widgetWithText(TextField, S.t(label)), text);

    Future<void> press(WidgetTester tester, String label) async {
      final button = find.widgetWithText(FilledButton, S.t(label));
      await tester.ensureVisible(button);
      await tester.pump();
      await tester.tap(button);
      await tester.pumpAndSettle();
    }

    Future<void> fillSignUp(WidgetTester tester) async {
      await tester.tap(find.text(S.t('register')));
      await tester.pump();
      await type(tester, 'first_name', 'Budi');
      await type(tester, 'phone', '081234567890');
      await type(tester, 'email', 'budi@tambak.id');
      await type(tester, 'password', 'rahasia88');
    }

    testWidgets('an empty sign-in form is not sent', (tester) async {
      backend({});
      await open(tester);
      await press(tester, 'login');
      expect(find.text(S.t('err_fill_login')), findsOneWidget);
      expect(calls, isEmpty);
    });

    testWidgets('a wrong password says so, not "session expired"', (tester) async {
      backend({
        _login: [_wrong],
      });
      await open(tester);
      await type(tester, 'email', 'budi@tambak.id');
      await type(tester, 'password', 'salah');
      await press(tester, 'login');
      expect(find.text(S.t('err_login')), findsOneWidget);
      expect(find.text(S.t('err_session')), findsNothing);
      expect(loggedIn, 0);
    });

    testWidgets('a new message replaces the one on screen', (tester) async {
      backend({
        _login: [_wrong],
      });
      await open(tester);
      await press(tester, 'login');
      expect(find.text(S.t('err_fill_login')), findsOneWidget);
      await type(tester, 'email', 'budi@tambak.id');
      await type(tester, 'password', 'salah');
      await press(tester, 'login');
      expect(find.text(S.t('err_login')), findsOneWidget);
      expect(find.text(S.t('err_fill_login')), findsNothing);
    });

    testWidgets('a correct sign-in goes on into the app', (tester) async {
      backend({
        _login: [_ok({'token': _token('cus_1')})],
      });
      await open(tester);
      await type(tester, 'email', 'budi@tambak.id');
      await type(tester, 'password', 'rahasia88');
      await press(tester, 'login');
      expect(loggedIn, 1);
    });

    testWidgets('an incomplete sign-up form is not sent', (tester) async {
      backend({});
      await open(tester);
      await fillSignUp(tester);
      await type(tester, 'phone', '0812');
      await press(tester, 'register');
      expect(find.text(S.t('err_phone_invalid')), findsOneWidget);
      expect(calls, isEmpty);
    });

    testWidgets('a taken email points to sign-in and opens that tab', (tester) async {
      backend({
        _register: [_taken],
        _login: [_wrong],
      });
      await open(tester);
      await fillSignUp(tester);
      await press(tester, 'register');
      expect(find.text(S.t('err_email_taken')), findsOneWidget);
      expect(find.text(S.t('first_name')), findsNothing);
      expect(paths(), [_register, _login]);
      expect(loggedIn, 0);
    });

    testWidgets('signing in to a half-finished sign-up opens the sign-up tab', (tester) async {
      backend({
        _login: [_ok({'token': _token('')})],
      });
      await open(tester);
      await type(tester, 'email', 'budi@tambak.id');
      await type(tester, 'password', 'rahasia88');
      await press(tester, 'login');
      expect(find.text(S.t('err_signup_incomplete')), findsOneWidget);
      expect(find.text(S.t('first_name')), findsOneWidget);
      expect(loggedIn, 0);
    });

    Future<void> askForReset(WidgetTester tester) async {
      await open(tester);
      final link = find.text(S.t('forgot_password'));
      await tester.ensureVisible(link);
      await tester.pump();
      await tester.tap(link);
      await tester.pumpAndSettle();
      // The dialog's own email field lies above the form's.
      await tester.enterText(find.widgetWithText(TextField, S.t('email')).last, 'budi@tambak.id');
      await press(tester, 'send_link');
    }

    testWidgets('a reset request that went out says the link is on its way', (tester) async {
      backend({
        _reset: [http.Response('Created', 201)],
      });
      await askForReset(tester);
      expect(find.text(S.t('reset_sent')), findsOneWidget);
    });

    testWidgets('a reset request that never left says so', (tester) async {
      api.httpClient = MockClient((_) async => throw http.ClientException('no route to host'));
      await askForReset(tester);
      expect(find.text(S.t('err_offline')), findsOneWidget);
      expect(find.text(S.t('reset_sent')), findsNothing);
    });

    testWidgets('a reset request refused for too many tries says so', (tester) async {
      backend({
        _reset: [_refused(429, 'Terlalu banyak percobaan.')],
      });
      await askForReset(tester);
      expect(find.text(S.t('err_too_many')), findsOneWidget);
      expect(find.text(S.t('reset_sent')), findsNothing);
    });
  });
}
