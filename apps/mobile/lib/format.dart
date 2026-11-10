import 'package:intl/intl.dart';

String money(num? amount, [String currency = 'idr']) {
  final n = (amount ?? 0).toDouble();
  if (currency.toLowerCase() == 'idr') {
    return NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0)
        .format(n);
  }
  return NumberFormat.currency(
    locale: 'en_US',
    symbol: '${currency.toUpperCase()} ',
  ).format(n);
}

String shortDate(String? iso) {
  if (iso == null || iso.isEmpty) return '-';
  final d = DateTime.tryParse(iso)?.toLocal();
  if (d == null) return iso;
  return DateFormat('d MMM yyyy', 'id_ID').format(d);
}

String dateTime(String? iso) {
  if (iso == null || iso.isEmpty) return '-';
  final d = DateTime.tryParse(iso)?.toLocal();
  if (d == null) return iso;
  return DateFormat('d MMM yyyy HH:mm', 'id_ID').format(d);
}

/// Single-variant seed products carry a placeholder option value ("Standar");
/// returns null so screens can hide it instead of showing noise.
String? variantLabel(String? title) {
  if (title == null) return null;
  final t = title.trim();
  if (t.isEmpty) return null;
  const placeholders = {'standar', 'standard', 'default', 'default variant'};
  return placeholders.contains(t.toLowerCase()) ? null : t;
}

// Same shape the backend validator accepts, so nothing passes here and
// then fails there after the login was already created.
final _emailShape = RegExp(r"^(?!\.)(?!.*\.\.)[A-Za-z0-9_'+\-.]*[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$");

bool looksLikeEmail(String s) => _emailShape.hasMatch(s);

/// At least 8 digits in at most 20 characters: "+62 812-3456-7890" passes.
bool looksLikePhone(String s) => s.replaceAll(RegExp(r'\D'), '').length >= 8 && s.length <= 20;

/// The account number in a bank line such as "BCA 123-456-7890 a.n. PT X",
/// digits only so it can be pasted into a banking app: the longest run of
/// digits, null when the line has none of six or more.
String? accountNumber(String bankLine) {
  final runs = RegExp(r'\d[\d .-]*\d')
      .allMatches(bankLine)
      .map((m) => m.group(0)!.replaceAll(RegExp(r'\D'), ''))
      .where((digits) => digits.length >= 6)
      .toList()
    ..sort((a, b) => b.length.compareTo(a.length));
  return runs.firstOrNull;
}
