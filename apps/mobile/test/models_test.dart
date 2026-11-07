import "package:flutter_test/flutter_test.dart";
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
}
