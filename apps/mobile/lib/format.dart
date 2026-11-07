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
