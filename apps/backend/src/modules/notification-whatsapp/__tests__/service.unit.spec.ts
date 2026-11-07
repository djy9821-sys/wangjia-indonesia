import WhatsAppNotificationService from "../service";

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as any;

describe("WhatsApp provider", () => {
  it("normalises Indonesian phone numbers", () => {
    expect(WhatsAppNotificationService.normalizePhone("+62 812-3456-7890")).toEqual("6281234567890");
    expect(WhatsAppNotificationService.normalizePhone("081234567890")).toEqual("6281234567890");
  });

  it("flattens text into a template parameter Meta accepts", () => {
    const p = WhatsAppNotificationService.templateParam("Halo Budi,\n\nbukti\tditerima.     Terima kasih.");
    expect(p).toEqual("Halo Budi, | bukti diterima.   Terima kasih.");
    expect(WhatsAppNotificationService.templateParam("x".repeat(2000)).length).toEqual(1024);
  });

  it("wraps plain text into the configured template, or not at all", () => {
    const withTemplate = new WhatsAppNotificationService({ logger }, { template_name: "wangjia_notice", template_lang: "id" });
    expect(withTemplate.wrapInTemplate("Pesanan #1 dikonfirmasi")).toEqual({
      name: "wangjia_notice",
      language: { code: "id" },
      components: [{ type: "body", parameters: [{ type: "text", text: "Pesanan #1 dikonfirmasi" }] }],
    });
    const without = new WhatsAppNotificationService({ logger }, {});
    expect(without.wrapInTemplate("apa saja")).toBeNull();
  });

  it("dry-runs when credentials are missing", async () => {
    const svc = new WhatsAppNotificationService({ logger }, {});
    const res = await svc.send({ to: "0812", channel: "whatsapp", template: "t", data: { text: "hi" } } as any);
    expect(res.id).toMatch(/^dry-run-/);
    expect(logger.info).toHaveBeenCalled();
  });
});
