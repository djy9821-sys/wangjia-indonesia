import "package:flutter_test/flutter_test.dart";
import "package:wangjia_app/update_check.dart";

void main() {
  test("compareVersions orders dotted versions numerically", () {
    expect(compareVersions("1.2.10", "1.2.9"), 1);
    expect(compareVersions("1.0.0", "1.0"), 0);
    expect(compareVersions("0.9.9", "1.0.0"), -1);
    expect(compareVersions("2", "1.9.9"), 1);
  });
}
