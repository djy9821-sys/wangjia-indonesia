import 'package:flutter/material.dart';

/// WANGJIA mark + wordmark drawn in code (no asset pipeline needed).
/// Replace with the official logo image once 李总 provides it.
class WangjiaLogo extends StatelessWidget {
  final double size;
  final bool withText;
  const WangjiaLogo({super.key, this.size = 64, this.withText = true});

  @override
  Widget build(BuildContext context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(size * 0.22),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF0E5A8A), Color(0xFF1B8A5A)],
              ),
            ),
            child: CustomPaint(painter: _PaddleWheelPainter()),
          ),
          if (withText) ...[
            SizedBox(height: size * 0.18),
            Text(
              'WANGJIA',
              style: TextStyle(
                fontSize: size * 0.42,
                fontWeight: FontWeight.w800,
                letterSpacing: size * 0.06,
                color: const Color(0xFF0E5A8A),
              ),
            ),
            Text(
              'KINCIR AIR · AERATOR TAMBAK',
              style: TextStyle(
                fontSize: size * 0.14,
                letterSpacing: size * 0.03,
                color: const Color(0xFF1B8A5A),
              ),
            ),
          ],
        ],
      );
}

class _PaddleWheelPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size s) {
    final c = Offset(s.width / 2, s.height / 2);
    final r = s.width * 0.33;
    final stroke = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = s.width * 0.045
      ..strokeCap = StrokeCap.round;
    final fill = Paint()..color = Colors.white;
    canvas.drawCircle(c, r, stroke);
    for (var i = 0; i < 6; i++) {
      canvas.save();
      canvas.translate(c.dx, c.dy);
      canvas.rotate(i * 3.14159 / 3);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(-s.width * 0.04, -r, s.width * 0.08, r * 0.85),
          Radius.circular(s.width * 0.02),
        ),
        fill,
      );
      canvas.restore();
    }
    canvas.drawCircle(c, s.width * 0.075, fill);
    final wave = Path()..moveTo(c.dx - r * 1.3, c.dy + r * 0.55);
    for (var i = 0; i < 4; i++) {
      final x0 = c.dx - r * 1.3 + i * r * 0.65;
      wave.quadraticBezierTo(x0 + r * 0.325, c.dy + r * 0.3, x0 + r * 0.65, c.dy + r * 0.55);
    }
    canvas.drawPath(wave, stroke..strokeWidth = s.width * 0.035);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
