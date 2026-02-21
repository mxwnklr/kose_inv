import { parseSequence } from "./invoice-number-core";

describe("parseSequence", () => {
  it("returns the trailing 4-digit sequence", () => {
    expect(parseSequence("INV2026-0009")).toBe(9);
    expect(parseSequence("KOSE2027-1250")).toBe(1250);
  });

  it("returns 0 for unrecognized formats", () => {
    expect(parseSequence("INV-1")).toBe(0);
    expect(parseSequence("INV2026")).toBe(0);
  });
});
