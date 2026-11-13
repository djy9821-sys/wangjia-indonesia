import 'package:flutter/material.dart';

/// The official WANGJIA mark (blue W with a red dot) on a white rounded tile,
/// so it also reads on blue backgrounds. brand/logo/build-assets.cjs makes the
/// picture.
class WangjiaLogo extends StatelessWidget {
  final double size;
  const WangjiaLogo({super.key, this.size = 64});

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        padding: EdgeInsets.all(size * 0.14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(size * 0.22),
        ),
        child: Image.asset('assets/brand/mark.png', fit: BoxFit.contain),
      );
}
