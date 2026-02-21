import { calculateInvoice, calculateLine } from "./calculation";

describe("calculateLine", () => {
  it("calculates net input lines with VAT", () => {
    const line = calculateLine(
      {
        position: 1,
        description: "Service",
        quantity: 2,
        unit: "h",
        unitPriceInput: 100,
        priceInputMode: "net",
        vatRate: 19
      },
      "standard"
    );

    expect(line.lineNet).toBe(200);
    expect(line.lineVat).toBe(38);
    expect(line.lineGross).toBe(238);
  });

  it("reverse calculates gross input lines", () => {
    const line = calculateLine(
      {
        position: 1,
        description: "Service",
        quantity: 1,
        unit: "h",
        unitPriceInput: 119,
        priceInputMode: "gross",
        vatRate: 19
      },
      "standard"
    );

    expect(line.lineNet).toBe(100);
    expect(line.lineVat).toBe(19);
    expect(line.lineGross).toBe(119);
  });
});

describe("calculateInvoice", () => {
  it("aggregates totals and tax buckets", () => {
    const result = calculateInvoice(
      [
        {
          position: 1,
          description: "A",
          quantity: 1,
          unit: "pcs",
          unitPriceInput: 100,
          priceInputMode: "net",
          vatRate: 19
        },
        {
          position: 2,
          description: "B",
          quantity: 1,
          unit: "pcs",
          unitPriceInput: 100,
          priceInputMode: "net",
          vatRate: 7
        }
      ],
      "standard",
      "de"
    );

    expect(result.netTotal).toBe(200);
    expect(result.vatTotal).toBe(26);
    expect(result.grossTotal).toBe(226);
    expect(result.taxBreakdown.some((bucket) => bucket.vatRate === 19 && bucket.vatAmount === 19)).toBe(true);
    expect(result.taxBreakdown.some((bucket) => bucket.vatRate === 7 && bucket.vatAmount === 7)).toBe(true);
  });

  it("forces zero VAT in kleinunternehmer mode", () => {
    const result = calculateInvoice(
      [
        {
          position: 1,
          description: "A",
          quantity: 2,
          unit: "pcs",
          unitPriceInput: 50,
          priceInputMode: "net",
          vatRate: 19
        }
      ],
      "kleinunternehmer",
      "de"
    );

    expect(result.netTotal).toBe(100);
    expect(result.vatTotal).toBe(0);
    expect(result.grossTotal).toBe(100);
    expect(result.mandatoryKleinunternehmerNote).toContain("19 UStG");
  });
});
