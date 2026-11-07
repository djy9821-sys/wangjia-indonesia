import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:sentry/sentry.dart';

import 'config.dart';

/*
  Crash / error reporting through the pure-Dart Sentry client (no native
  SDK, so the offline SwiftPM build keeps working). Points at our own
  GlitchTip instance when SENTRY_DSN is set at build time; otherwise it is a
  no-op and errors only go to the console.
*/
Future<void> runMonitored(FutureOr<void> Function() appRunner) async {
  if (AppConfig.sentryDsn.isEmpty) {
    await appRunner();
    return;
  }
  await Sentry.init(
    (options) {
      options.dsn = AppConfig.sentryDsn;
      options.environment = AppConfig.environment;
      options.release = 'wangjia_app@${AppConfig.appVersion}';
      options.tracesSampleRate = 0;
      options.sendDefaultPii = false;
    },
    appRunner: () async {
      FlutterError.onError = (details) {
        FlutterError.presentError(details);
        Sentry.captureException(details.exception, stackTrace: details.stack);
      };
      PlatformDispatcher.instance.onError = (error, stack) {
        Sentry.captureException(error, stackTrace: stack);
        return true;
      };
      await appRunner();
    },
  );
}

/// Attach the signed-in customer (id only, no name/phone) to reports.
void setMonitoredUser(String? customerId) {
  if (AppConfig.sentryDsn.isEmpty) return;
  Sentry.configureScope((scope) => scope.setUser(customerId == null ? null : SentryUser(id: customerId)));
}
