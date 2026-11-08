import 'package:flutter/material.dart';

/// Official WANGJIA logo (blue W with red dot, "WANG JIA" wordmark).
/// Assets come from brand/logo; [withText] shows the stacked logo, otherwise
/// just the mark on a white rounded tile so it also reads on blue backgrounds.
class WangjiaLogo extends StatelessWidget {
  final double size;
  final bool withText;
  const WangjiaLogo({super.key, this.size = 64, this.withText = true});

  @override
  Widget build(BuildContext context) {
    if (withText) {
      return Image.asset('assets/brand/logo.png', width: size * 2.2, fit: BoxFit.contain);
    }
    return Container(
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
}
