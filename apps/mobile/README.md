# WANGJIA Kincir Air — aplikasi pelanggan (Flutter)

Customer app for the WANGJIA aerator store. Talks to the Medusa backend in `apps/backend`.

Features: login/register with WhatsApp OTP, product catalog in IDR with specs and gallery, cart, order
(saved addresses, province/regency/district picker, map pin for the pond), request a quote and chat on it,
order detail with the payment plan (pay an instalment via Midtrans Snap or upload a bank-transfer receipt),
invoice download, shipment tracking with carrier history, push notifications, QR scan for genuine check and
warranty registration (one tap from the order for machines the warehouse packed), WhatsApp service request,
in-app account deletion, error reporting.

```bash
# first time (needs the Flutter SDK on PATH)
flutter create --org id.co.wangjia --project-name wangjia_app --platforms ios,android .
flutter pub get

# iOS simulator against the local backend
flutter run --dart-define=MEDUSA_PUBLISHABLE_KEY=pk_xxx

# Android emulator (localhost of the Mac is 10.0.2.2)
flutter run --dart-define=MEDUSA_URL=http://10.0.2.2:9000 --dart-define=MEDUSA_PUBLISHABLE_KEY=pk_xxx
```

Other `--dart-define`s: `WHATSAPP_NUMBER=62812…`, `MIDTRANS_FINISH_URL=…`, `SENTRY_DSN=…` (GlitchTip app
project; empty = reporting off), `APP_ENV=production`, `APP_VERSION=1.0.0`, `PRIVACY_URL=https://wangjia.co.id/id/privacy` (account screen link, required by the stores), `DEV_PROXY=127.0.0.1:7890` (dev only:
route map tiles / geocoding through a local proxy, since Dart ignores the system proxy).

## Release (Fastlane)

```bash
gem install bundler && bundle install          # once
export DART_DEFINES="MEDUSA_URL=https://api.wangjia.co.id,MEDUSA_PUBLISHABLE_KEY=pk_live_xxx,SENTRY_DSN=https://...,APP_ENV=production"
# iOS: App Store Connect API key (Users and Access -> Integrations), base64 of the .p8 in ASC_KEY_CONTENT
export APPLE_ID=... APPLE_TEAM_ID=... ASC_KEY_ID=... ASC_ISSUER_ID=... ASC_KEY_CONTENT=...
bundle exec fastlane ios beta                   # TestFlight
bundle exec fastlane ios release                # App Store review
# Android: Play Console service-account JSON content in PLAY_SERVICE_ACCOUNT_JSON
bundle exec fastlane android beta               # internal testing track
bundle exec fastlane android release            # production (draft)
```

Code signing for iOS uses Xcode automatic signing with the team in `APPLE_TEAM_ID`; Android release
signing needs `android/key.properties` + keystore (git-ignored) as in the Flutter docs.

## Push notifications (Firebase)

Push is wired but inactive until the Firebase config files exist:
`ios/Runner/GoogleService-Info.plist` and `android/app/google-services.json` (both git-ignored).
Without them the app starts normally and simply skips push. Simulate a push on the simulator with
`xcrun simctl push booted id.co.wangjia.wangjiaApp tool/push-payload.apns`.

If GitHub / dl.google.com are flaky behind a proxy, Swift Package Manager downloads for Firebase may fail in
`flutter run`. Once `build/ios/SourcePackages` is populated, build offline:

```bash
flutter build ios --simulator --debug --config-only --dart-define=MEDUSA_PUBLISHABLE_KEY=pk_xxx
xcodebuild -workspace ios/Runner.xcworkspace -scheme Runner -configuration Debug -sdk iphonesimulator \
  -destination "id=<simulator udid>" -clonedSourcePackagesDirPath build/ios/SourcePackages \
  -skipPackageUpdates -derivedDataPath build/ios/DerivedData build
xcrun simctl install booted build/ios/DerivedData/Build/Products/Debug-iphonesimulator/Runner.app
```

## End-to-end tests (Maestro)

`maestro/` holds three flows (login + browse, warranty code check, order detail) written against the
Indonesian UI strings. Install Maestro (`curl -Ls https://get.maestro.mobile.dev | bash`), build and
install the app on a simulator/emulator or a real phone, then:

```bash
maestro test maestro/ -e EMAIL=budi@contoh.id -e PASSWORD=rahasia123
```

The flows were written from the screens but not yet executed here (no Maestro on this machine): expect to
adjust a selector or two on the first run. They are meant for a real device before each store release.