# Truk Tangki Air — aplikasi pelanggan (Flutter)

Customer app for the Indonesian water-truck store. Talks to the Medusa backend in `apps/backend`.

Features: login/register, product catalog in IDR, order (address + freight option), request a quote,
WhatsApp shortcut, order list, order detail with the payment plan (pay an installment via Midtrans Snap
or upload a bank-transfer receipt), shipment tracking.

```bash
# first time (needs the Flutter SDK on PATH)
flutter create --org id.co.wangjia --project-name wangjia_app --platforms ios,android .
flutter pub get

# iOS simulator against the local backend
flutter run --dart-define=MEDUSA_PUBLISHABLE_KEY=pk_xxx

# Android emulator (localhost of the Mac is 10.0.2.2)
flutter run --dart-define=MEDUSA_URL=http://10.0.2.2:9000 --dart-define=MEDUSA_PUBLISHABLE_KEY=pk_xxx
```

Other `--dart-define`s: `WHATSAPP_NUMBER=62812…`, `MIDTRANS_FINISH_URL=…`.

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
