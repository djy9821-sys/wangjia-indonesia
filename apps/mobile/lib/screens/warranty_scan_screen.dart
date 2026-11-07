import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../api/medusa_client.dart';
import '../l10n/strings.dart';
import '../widgets/common.dart';
import 'warranty_screen.dart';

/// Camera view for the QR label. Each decoded code is checked once; the
/// result sheet pauses scanning until it is closed.
class WarrantyScanScreen extends StatefulWidget {
  const WarrantyScanScreen({super.key});
  @override
  State<WarrantyScanScreen> createState() => _WarrantyScanScreenState();
}

class _WarrantyScanScreenState extends State<WarrantyScanScreen> {
  final _controller = MobileScannerController(formats: const [BarcodeFormat.qrCode]);
  bool _handling = false;
  bool _registered = false;
  String? _last;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_handling) return;
    final raw = capture.barcodes.map((b) => b.rawValue).whereType<String>().firstOrNull;
    if (raw == null || raw == _last) return;
    _handling = true;
    _last = raw;
    await _controller.stop();
    try {
      final result = await MedusaClient.instance.verifyWarranty(raw);
      if (!mounted) return;
      final changed = await showWarrantyResult(context, result);
      if (changed == true) _registered = true;
    } catch (e) {
      if (mounted) showSnack(context, '$e');
    } finally {
      _handling = false;
      if (mounted) {
        await _controller.start();
        // Allow the same label to be scanned again after a moment.
        Future.delayed(const Duration(seconds: 3), () => _last = null);
      }
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) Navigator.of(context).pop(_registered);
        },
        child: Scaffold(
          appBar: AppBar(
            title: Text(S.t('scan_qr')),
            actions: [
              IconButton(
                onPressed: () => _controller.toggleTorch(),
                icon: const Icon(Icons.flashlight_on_outlined),
              ),
            ],
          ),
          body: Stack(
            children: [
              MobileScanner(
                controller: _controller,
                onDetect: _onDetect,
                errorBuilder: (context, error) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      '${error.errorCode.name}\n${S.t('type_code')}: ${S.t('warranty')} → ${S.t('code')}',
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
              Center(
                child: Container(
                  width: 240,
                  height: 240,
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white, width: 3),
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 32,
                child: Text(
                  S.t('camera_hint'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, shadows: [Shadow(blurRadius: 6)]),
                ),
              ),
            ],
          ),
        ),
      );
}
