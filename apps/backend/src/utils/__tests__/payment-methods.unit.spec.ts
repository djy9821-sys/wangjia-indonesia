import { storePaymentMethods, transferAccount } from "../payment-methods";

describe("payment methods offered to a customer", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("gives the company's bank account once it is filled in", () => {
    process.env.COMPANY_BANK = "  BCA 8850123456 a.n. PT Contoh Tambak  ";
    expect(transferAccount()).toEqual("BCA 8850123456 a.n. PT Contoh Tambak");
  });

  it("gives no account while it is missing or still the template's example", () => {
    delete process.env.COMPANY_BANK;
    expect(transferAccount()).toBeNull();
    process.env.COMPANY_BANK = " ";
    expect(transferAccount()).toBeNull();
    process.env.COMPANY_BANK = "BCA 1234567890 a.n. PT Adhinusa Lestari Jaya";
    expect(transferAccount()).toBeNull();
  });

  it("offers online payment only with a Midtrans key", () => {
    delete process.env.MIDTRANS_SERVER_KEY;
    expect(storePaymentMethods().online).toBe(false);
    process.env.MIDTRANS_SERVER_KEY = "SB-Mid-server-test";
    expect(storePaymentMethods().online).toBe(true);
  });
});
