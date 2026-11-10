import "package:flutter_test/flutter_test.dart";
import "package:wangjia_app/config.dart";
import "package:wangjia_app/format.dart";
import "package:wangjia_app/models.dart";

void main() {
  group("WarrantyCheck", () {
    test("parses a genuine unit", () {
      final c = WarrantyCheck.fromJson({
        "genuine": true,
        "unit": {
          "serial": "WJ-26-000001",
          "code": "ABCD2345EFGH",
          "product_title": "Kincir Air WANGJIA 2 HP",
          "variant_title": "Standar",
          "warranty_months": 12,
          "status": "registered",
          "registered": true,
          "registered_to_me": true,
          "warranty_expires_at": "2027-01-01T00:00:00.000Z",
          "scan_count": 2,
        },
      });
      expect(c.genuine, isTrue);
      expect(c.title, "Kincir Air WANGJIA 2 HP · Standar");
      expect(c.registeredToMe, isTrue);
      expect(c.scanCount, 2);
    });

    test("parses a counterfeit result without a unit", () {
      final c = WarrantyCheck.fromJson({"genuine": false, "reason": "unknown"});
      expect(c.genuine, isFalse);
      expect(c.reason, "unknown");
      expect(c.serial, isNull);
    });
  });

  group("WarrantyUnit", () {
    test("expired flag follows warranty_expires_at", () {
      final past = WarrantyUnit.fromJson({"id": "a", "serial": "S1", "product_title": "P", "status": "registered", "warranty_expires_at": "2020-01-01T00:00:00.000Z"});
      final future = WarrantyUnit.fromJson({"id": "b", "serial": "S2", "product_title": "P", "status": "registered", "warranty_expires_at": "2099-01-01T00:00:00.000Z"});
      expect(past.expired, isTrue);
      expect(future.expired, isFalse);
      expect(past.registered, isTrue);
    });
  });

  group("Address", () {
    test("keeps the map pin in metadata both ways", () {
      const a = Address(firstName: "Budi", address1: "Jl. Tambak", city: "Indramayu", lat: -6.3, lng: 108.3);
      final json = a.toJson();
      expect(json["metadata"]["lat"], -6.3);
      expect(json["metadata"]["lng"], 108.3);
      final back = Address.fromJson({...json, "id": "addr_1"});
      expect(back.lat, -6.3);
      expect(back.mapsUrl, contains("-6.3,108.3"));
    });

    test("omits the pin when not set", () {
      const a = Address(firstName: "Budi");
      expect(a.toJson()["metadata"].containsKey("lat"), isFalse);
    });
  });

  group("PaymentPlan", () {
    const base = {"id": "plan_1", "currency_code": "idr", "total_amount": 100, "installments": []};

    test("reads how the shop takes payment", () {
      final plan = PaymentPlan.fromJson({
        ...base,
        "payment_methods": {"bank_transfer": "BCA 8850123456 a.n. PT Contoh", "online": false},
      });
      expect(plan.bankTransfer, "BCA 8850123456 a.n. PT Contoh");
      expect(plan.onlinePayment, isFalse);
    });

    test("a backend that does not say keeps the online button and names no account", () {
      final plan = PaymentPlan.fromJson(base);
      expect(plan.bankTransfer, isNull);
      expect(plan.onlinePayment, isTrue);
    });
  });

  group("accountNumber", () {
    test("is the longest run of digits in the bank line, without separators", () {
      expect(accountNumber("BCA 8850123456 a.n. PT Contoh Tambak"), "8850123456");
      expect(accountNumber("Mandiri 142-00-1234567-8 a.n. CV Maju 88"), "1420012345678");
      expect(accountNumber("BCA, hubungi sales"), isNull);
    });

    test("a year or a house number in the line is not taken for an account", () {
      expect(accountNumber("BCA a.n. PT Tambak 2024, Jl. Raya 12"), isNull);
    });
  });

  group("TrackingInfo", () {
    test("parses carrier history", () {
      final t = TrackingInfo.fromJson({
        "tracking_number": "JP123",
        "courier": "jne",
        "status": "delivered",
        "history": [
          {"time": "2026-11-01T01:00:00Z", "status": "picked", "note": "Diambil kurir"},
          {"time": "2026-11-03T01:00:00Z", "status": "delivered", "note": "Diterima"},
        ],
      });
      expect(t.history.length, 2);
      expect(t.history.last.note, "Diterima");
    });
  });

  group("reachableUrl", () {
    const lan = "http://192.168.1.20:9000";

    test("re-bases localhost URLs onto the backend the app talks to", () {
      expect(reachableUrl("http://localhost:9000/static/products/a.jpg", backend: lan),
          "http://192.168.1.20:9000/static/products/a.jpg");
      expect(reachableUrl("http://127.0.0.1:9000/invoice?token=x", backend: "https://api.example.com"),
          "https://api.example.com/invoice?token=x");
    });

    test("leaves public URLs and empty values alone", () {
      expect(reachableUrl("https://cdn.example.com/a.jpg", backend: lan), "https://cdn.example.com/a.jpg");
      expect(reachableUrl(null, backend: lan), isNull);
      expect(reachableUrl("", backend: lan), "");
    });

    test("product photos go through it", () {
      // Default build config talks to http://localhost:9000, so a photo stored
      // under 127.0.0.1 comes out on that host.
      final p = Product.fromJson({
        "id": "prod_1",
        "thumbnail": "http://127.0.0.1:9000/static/products/a.jpg",
        "images": [
          {"url": "http://127.0.0.1:9000/static/products/a.jpg"},
          {"url": "https://cdn.example.com/b.jpg"},
        ],
      });
      expect(p.thumbnail, "http://localhost:9000/static/products/a.jpg");
      expect(p.images, ["http://localhost:9000/static/products/a.jpg", "https://cdn.example.com/b.jpg"]);
    });
  });
}
