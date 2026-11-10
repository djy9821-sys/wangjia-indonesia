import "dart:convert";

import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";
import "package:http/http.dart" as http;
import "package:http/testing.dart";
import "package:wangjia_app/api/medusa_client.dart";
import "package:wangjia_app/update_check.dart";

void main() {
  // Made before the test binding: afterwards a real HTTP client can only be
  // created inside a running test.
  final api = MedusaClient.instance;
  TestWidgetsFlutterBinding.ensureInitialized();

  test("compareVersions orders dotted versions numerically", () {
    expect(compareVersions("1.2.10", "1.2.9"), 1);
    expect(compareVersions("1.0.0", "1.0"), 0);
    expect(compareVersions("0.9.9", "1.0.0"), -1);
    expect(compareVersions("2", "1.9.9"), 1);
  });

  testWidgets("the shop says at start-up whether it can send a phone code", (tester) async {
    addTearDown(() => phoneCodes = true);
    Future<void> start(Map<String, dynamic> answer) async {
      api.httpClient = MockClient((_) async => http.Response(jsonEncode(answer), 200));
      await tester.pumpWidget(MaterialApp(home: UpdateGate(key: UniqueKey(), child: const SizedBox())));
      await tester.pumpAndSettle();
    }

    await start({"min_version": "0.0.0", "latest_version": "0.0.0", "phone_codes": false});
    expect(phoneCodes, isFalse);
    // A backend that does not say is an older one: its sign-up form kept the button.
    await start({"min_version": "0.0.0", "latest_version": "0.0.0"});
    expect(phoneCodes, isTrue);
  });
}
