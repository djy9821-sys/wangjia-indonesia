/// Build-time configuration. Override with --dart-define, e.g.
///   flutter run --dart-define=MEDUSA_URL=http://10.0.2.2:9000 \
///               --dart-define=MEDUSA_PUBLISHABLE_KEY=pk_xxx
class AppConfig {
  /// iOS simulator reaches the Mac at localhost; Android emulator uses 10.0.2.2.
  static const backendUrl = String.fromEnvironment(
    'MEDUSA_URL',
    defaultValue: 'http://localhost:9000',
  );
  static const publishableKey = String.fromEnvironment(
    'MEDUSA_PUBLISHABLE_KEY',
    defaultValue: 'pk_test',
  );

  /// Sales WhatsApp number in international format without "+".
  static const whatsappNumber = String.fromEnvironment(
    'WHATSAPP_NUMBER',
    defaultValue: '6281200000000',
  );

  /// Developer convenience: pre-fill the login form in local builds.
  static const devEmail = String.fromEnvironment('DEV_EMAIL', defaultValue: '');
  static const devPassword = String.fromEnvironment('DEV_PASSWORD', defaultValue: '');

  /// Where Midtrans sends the customer after paying. The app re-checks the
  /// installment when it comes back to the foreground.
  static const midtransFinishUrl = String.fromEnvironment(
    'MIDTRANS_FINISH_URL',
    defaultValue: 'http://localhost:8000/id/account/orders',
  );

  /// Error reporting (GlitchTip / Sentry DSN of the "app" project). Empty = off.
  static const sentryDsn = String.fromEnvironment('SENTRY_DSN', defaultValue: '');
  static const environment = String.fromEnvironment('APP_ENV', defaultValue: 'development');
  static const appVersion = String.fromEnvironment('APP_VERSION', defaultValue: '0.1.0');

  /// Dev only: "host:port" of an HTTP proxy for all non-local requests.
  static const devProxy = String.fromEnvironment('DEV_PROXY', defaultValue: '');

  /// Privacy policy shown in the account screen (store review requirement).
  static const privacyUrl = String.fromEnvironment(
    'PRIVACY_URL',
    defaultValue: 'http://localhost:8000/id/privacy',
  );

  /// Public web store, used for share links (product pages, warranty check).
  static const storefrontUrl = String.fromEnvironment(
    'STOREFRONT_URL',
    defaultValue: 'http://localhost:8000',
  );
}
