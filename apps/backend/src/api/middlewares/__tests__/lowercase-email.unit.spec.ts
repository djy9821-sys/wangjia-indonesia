import { lowercaseEmail } from "../lowercase-email";

const run = (middleware: ReturnType<typeof lowercaseEmail>, req: Record<string, unknown>) => {
  const next = jest.fn();
  middleware(req as any, {} as any, next);
  expect(next).toHaveBeenCalledTimes(1);
  return req as any;
};

describe("lowercaseEmail", () => {
  it("trims and lower-cases the email of a sign-in or sign-up", () => {
    const req = run(lowercaseEmail(), { body: { email: "  Budi.Santoso@Gmail.COM ", password: "RaHasia88" } });
    expect(req.body).toEqual({ email: "budi.santoso@gmail.com", password: "RaHasia88" });
  });

  it("also corrects a body the route has already validated", () => {
    const req = run(lowercaseEmail(), {
      body: { email: "Budi@Tambak.ID", first_name: "Budi" },
      validatedBody: { email: "Budi@Tambak.ID", first_name: "Budi" },
    });
    expect(req.body.email).toEqual("budi@tambak.id");
    expect(req.validatedBody).toEqual({ email: "budi@tambak.id", first_name: "Budi" });
  });

  it("handles the identifier of a password reset", () => {
    const req = run(lowercaseEmail("identifier"), { body: { identifier: "Budi@Tambak.id" } });
    expect(req.body.identifier).toEqual("budi@tambak.id");
  });

  it("leaves requests without that field alone", () => {
    expect(run(lowercaseEmail(), {}).body).toBeUndefined();
    expect(run(lowercaseEmail(), { body: { email: null } }).body).toEqual({ email: null });
    expect(run(lowercaseEmail(), { body: { identifier: "Budi@Tambak.id" } }).body).toEqual({ identifier: "Budi@Tambak.id" });
  });
});
