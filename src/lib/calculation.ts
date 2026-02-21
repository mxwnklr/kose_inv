import type {
  CalculatedInvoice,
  CalculatedInvoiceLine,
  InvoiceLineInput,
  LocaleCode,
  TaxMode,
  TaxBreakdownByRate
} from "@/types/invoice";

const VAT_RATES: Array<0 | 7 | 19> = [0, 7, 19];

function roundHalfUp(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function roundInternal(value: number): number {
  return roundHalfUp(value, 4);
}

export function calculateLine(item: InvoiceLineInput, taxMode: TaxMode): CalculatedInvoiceLine {
  const quantity = roundInternal(item.quantity);
  const price = roundInternal(item.unitPriceInput);
  const vatRate = taxMode === "kleinunternehmer" ? 0 : item.vatRate;

  if (item.priceInputMode === "net") {
    const lineNet = roundHalfUp(quantity * price);
    const lineVat = roundHalfUp((lineNet * vatRate) / 100);
    return {
      ...item,
      quantity,
      unitPriceInput: price,
      vatRate,
      lineNet,
      lineVat,
      lineGross: roundHalfUp(lineNet + lineVat)
    };
  }

  const gross = roundHalfUp(quantity * price);
  const divisor = 1 + vatRate / 100;
  const lineNet = vatRate === 0 ? gross : roundHalfUp(gross / divisor);
  const lineVat = roundHalfUp(gross - lineNet);

  return {
    ...item,
    quantity,
    unitPriceInput: price,
    vatRate,
    lineNet,
    lineVat,
    lineGross: gross
  };
}

export function calculateInvoice(
  items: InvoiceLineInput[],
  taxMode: TaxMode,
  locale: LocaleCode
): CalculatedInvoice {
  const calculatedItems = items.map((item) => calculateLine(item, taxMode));

  const taxBreakdownMap = new Map<number, { taxableBase: number; vatAmount: number }>();
  for (const rate of VAT_RATES) {
    taxBreakdownMap.set(rate, { taxableBase: 0, vatAmount: 0 });
  }

  for (const line of calculatedItems) {
    const current = taxBreakdownMap.get(line.vatRate) ?? { taxableBase: 0, vatAmount: 0 };
    current.taxableBase = roundHalfUp(current.taxableBase + line.lineNet);
    current.vatAmount = roundHalfUp(current.vatAmount + line.lineVat);
    taxBreakdownMap.set(line.vatRate, current);
  }

  const taxBreakdown = VAT_RATES.map((rate) => {
    const data = taxBreakdownMap.get(rate) ?? { taxableBase: 0, vatAmount: 0 };
    return {
      vatRate: rate,
      taxableBase: roundHalfUp(data.taxableBase),
      vatAmount: taxMode === "kleinunternehmer" ? 0 : roundHalfUp(data.vatAmount)
    } satisfies TaxBreakdownByRate;
  }).filter((bucket) => bucket.taxableBase > 0 || bucket.vatRate === 0);

  const netTotal = roundHalfUp(calculatedItems.reduce((sum, item) => sum + item.lineNet, 0));
  const vatTotal =
    taxMode === "kleinunternehmer"
      ? 0
      : roundHalfUp(calculatedItems.reduce((sum, item) => sum + item.lineVat, 0));
  const grossTotal = roundHalfUp(netTotal + vatTotal);

  const mandatoryKleinunternehmerNote =
    taxMode === "kleinunternehmer"
      ? locale === "de"
        ? "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
        : "No VAT charged according to § 19 German VAT Act."
      : undefined;

  return {
    netTotal,
    vatTotal,
    grossTotal,
    items: calculatedItems,
    taxBreakdown,
    mandatoryKleinunternehmerNote
  };
}

export function assertVatRate(rate: number): asserts rate is 0 | 7 | 19 {
  if (!VAT_RATES.includes(rate as 0 | 7 | 19)) {
    throw new Error(`Unsupported VAT rate: ${rate}`);
  }
}
