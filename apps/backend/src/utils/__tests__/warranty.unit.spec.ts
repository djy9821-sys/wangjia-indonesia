import { extractWarrantyCode, formatSerial, generateVerificationCode } from "../warranty";

describe("warranty helpers", () => {
  it("formats running serials", () => {
    expect(formatSerial(7, "WJ", new Date("2026-03-01"))).toEqual("WJ-26-000007");
  });
  it("generates unambiguous 12-char codes", () => {
    const c = generateVerificationCode();
    expect(c).toMatch(/^[A-HJ-NP-Z2-9]{12}$/);
    expect(c).not.toMatch(/[0O1I]/);
  });
  it("extracts the code from a QR url or bare input", () => {
    expect(extractWarrantyCode("https://wangjia.co.id/id/garansi/abcd2345efgh")).toEqual("ABCD2345EFGH");
    expect(extractWarrantyCode(" abcd2345efgh ")).toEqual("ABCD2345EFGH");
    expect(extractWarrantyCode("https://evil.example/x")).toBeNull();
  });
});
