import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../config.dart';
import '../l10n/strings.dart';

/// Midtrans Snap inside the app. Pops with `true` as soon as Snap redirects
/// to the finish URL (or reports a transaction status), so the caller can
/// refresh the installment. E-wallet deep links (GoPay, ShopeePay, DANA)
/// are handed to the system so their apps can open.
class PaymentWebViewScreen extends StatefulWidget {
  final String url;
  const PaymentWebViewScreen({super.key, required this.url});
  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  late final WebViewController _controller;
  double _progress = 0;
  bool _finished = false;

  static const _externalSchemes = ['gojek', 'gopay', 'shopeeid', 'dana', 'ovo', 'linkaja', 'intent', 'market', 'itms-apps'];

  bool _isFinish(String url) =>
      url.startsWith(AppConfig.midtransFinishUrl) ||
      url.contains('transaction_status=') ||
      url.contains('/finish?') ||
      url.contains('status_code=200');

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onProgress: (p) => setState(() => _progress = p / 100),
        onNavigationRequest: (req) async {
          final uri = Uri.tryParse(req.url);
          if (uri != null && _externalSchemes.contains(uri.scheme)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication).catchError((_) => false);
            return NavigationDecision.prevent;
          }
          if (_isFinish(req.url)) {
            _done();
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
        onPageFinished: (url) {
          if (_isFinish(url)) _done();
        },
      ))
      ..loadRequest(Uri.parse(widget.url));
  }

  void _done() {
    if (_finished || !mounted) return;
    _finished = true;
    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: Text(S.t('pay_in_app_title')),
          actions: [
            IconButton(
              tooltip: S.t('pay_open_app'),
              onPressed: () => launchUrl(Uri.parse(widget.url), mode: LaunchMode.externalApplication),
              icon: const Icon(Icons.open_in_browser),
            ),
          ],
          bottom: _progress < 1
              ? PreferredSize(
                  preferredSize: const Size.fromHeight(2),
                  child: LinearProgressIndicator(value: _progress, minHeight: 2),
                )
              : null,
        ),
        body: WebViewWidget(controller: _controller),
      );
}
