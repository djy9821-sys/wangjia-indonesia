# Truk Tangki Air — aplikasi pelanggan (Flutter)

Customer app for the Indonesian water-truck store. Talks to the Medusa backend in `apps/backend`.

Features: login/register, product catalog in IDR, order (address + freight option), request a quote,
WhatsApp shortcut, order list, order detail with the payment plan (pay an installment via Midtrans Snap
or upload a bank-transfer receipt), shipment tracking.

```bash
# first time (needs the Flutter SDK on PATH)
flutter create --org id.co.trukair --project-name truk_air_app --platforms ios,android .
flutter pub get

# iOS simulator against the local backend
flutter run --dart-define=MEDUSA_PUBLISHABLE_KEY=pk_xxx

# Android emulator (localhost of the Mac is 10.0.2.2)
flutter run --dart-define=MEDUSA_URL=http://10.0.2.2:9000 --dart-define=MEDUSA_PUBLISHABLE_KEY=pk_xxx
```

Other `--dart-define`s: `WHATSAPP_NUMBER=62812…`, `MIDTRANS_FINISH_URL=…`.
