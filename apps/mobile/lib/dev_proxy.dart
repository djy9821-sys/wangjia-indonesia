import 'dart:io';

import 'config.dart';

/*
  Developer convenience only: route all app HTTP through a proxy, e.g.
    --dart-define=DEV_PROXY=127.0.0.1:7890
  Dart's HttpClient ignores the system proxy, so map tiles / geocoding do not
  load on machines where only the proxy reaches the internet. Never set in
  release builds (the config defaults to empty).
*/
class _ProxyOverrides extends HttpOverrides {
  final String proxy;
  _ProxyOverrides(this.proxy);

  @override
  HttpClient createHttpClient(SecurityContext? context) {
    final client = super.createHttpClient(context);
    client.findProxy = (uri) {
      final host = uri.host;
      if (host == 'localhost' || host == '127.0.0.1' || host == '10.0.2.2') {
        return 'DIRECT';
      }
      return 'PROXY $proxy';
    };
    return client;
  }
}

void installDevProxy() {
  if (AppConfig.devProxy.isEmpty) return;
  HttpOverrides.global = _ProxyOverrides(AppConfig.devProxy);
}
