import type { Invoice, InvoiceItem, TaxMode } from "@prisma/client";
import { extractPrefix } from "@/lib/invoice-number-core";
import type { LocaleCode, TaxBreakdownByRate } from "@/types/invoice";

export type InvoiceWithItems = Invoice & { items: InvoiceItem[] };

export type ExportInvoiceModel = {
  id: string;
  contactId?: string | null;
  invoiceNumber: string;
  status: string;
  issueDate: Date;
  serviceDate: Date;
  dueDate: Date;
  paymentTermDays: number;
  currency: "EUR";
  language: LocaleCode;
  taxMode: TaxMode;
  note: string;
  sender: {
    legalName: string;
    street: string;
    postalCode: string;
    city: string;
    countryCode: string;
    email: string;
    phone: string;
    vatId?: string | null;
    taxNumber?: string | null;
    isKleinunternehmer: boolean;
    iban: string;
    bic: string;
    bankName: string;
    defaultPaymentDays: number;
    invoicePrefix: string;
  };
  recipient: {
    displayName: string;
    companyName: string;
    street: string;
    postalCode: string;
    city: string;
    countryCode: string;
    email: string;
    phone: string;
    vatId?: string | null;
    languagePreference: LocaleCode;
  };
  items: Array<{
    position: number;
    description: string;
    quantity: number;
    unit: string;
    unitPriceInput: number;
    priceInputMode: "net" | "gross";
    vatRate: 0 | 7 | 19;
    lineNet: number;
    lineVat: number;
    lineGross: number;
  }>;
  totals: {
    netTotal: number;
    vatTotal: number;
    grossTotal: number;
  };
  taxBreakdown: TaxBreakdownByRate[];
};

function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : 0;
}

export function toExportInvoiceModel(invoice: InvoiceWithItems): ExportInvoiceModel {
  const items = invoice.items
    .map((item) => ({
      position: item.position,
      description: item.description,
      quantity: decimalToNumber(item.quantity),
      unit: item.unit,
      unitPriceInput: decimalToNumber(item.unitPriceInput),
      priceInputMode: item.priceInputMode,
      vatRate: item.vatRate as 0 | 7 | 19,
      lineNet: decimalToNumber(item.lineNet),
      lineVat: decimalToNumber(item.lineVat),
      lineGross: decimalToNumber(item.lineGross)
    }))
    .sort((a, b) => a.position - b.position);

  const breakdownMap = new Map<0 | 7 | 19, { taxableBase: number; vatAmount: number }>([
    [0, { taxableBase: 0, vatAmount: 0 }],
    [7, { taxableBase: 0, vatAmount: 0 }],
    [19, { taxableBase: 0, vatAmount: 0 }]
  ]);

  for (const item of items) {
    const bucket = breakdownMap.get(item.vatRate) ?? { taxableBase: 0, vatAmount: 0 };
    bucket.taxableBase += item.lineNet;
    bucket.vatAmount += item.lineVat;
    breakdownMap.set(item.vatRate, bucket);
  }

  const taxBreakdown: TaxBreakdownByRate[] = [0, 7, 19]
    .map((rate) => {
      const bucket = breakdownMap.get(rate as 0 | 7 | 19);
      return {
        vatRate: rate as 0 | 7 | 19,
        taxableBase: Number((bucket?.taxableBase ?? 0).toFixed(2)),
        vatAmount: Number((bucket?.vatAmount ?? 0).toFixed(2))
      };
    })
    .filter((entry) => entry.taxableBase > 0 || entry.vatRate === 0);

  return {
    id: invoice.id,
    contactId: invoice.contactId,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issueDate: invoice.issueDate,
    serviceDate: invoice.serviceDate,
    dueDate: invoice.dueDate,
    paymentTermDays: invoice.paymentTermDays,
    currency: "EUR",
    language: invoice.language as LocaleCode,
    taxMode: invoice.taxMode,
    note: invoice.note,
    sender: {
      legalName: invoice.senderLegalName,
      street: invoice.senderStreet,
      postalCode: invoice.senderPostalCode,
      city: invoice.senderCity,
      countryCode: invoice.senderCountryCode,
      email: invoice.senderEmail,
      phone: invoice.senderPhone,
      vatId: invoice.senderVatId,
      taxNumber: invoice.senderTaxNumber,
      isKleinunternehmer: invoice.senderIsKleinunternehmer,
      iban: invoice.senderIban,
      bic: invoice.senderBic,
      bankName: invoice.senderBankName,
      defaultPaymentDays: invoice.paymentTermDays,
      invoicePrefix: extractPrefix(invoice.invoiceNumber)
    },
    recipient: {
      displayName: invoice.recipientDisplayName,
      companyName: invoice.recipientCompanyName,
      street: invoice.recipientStreet,
      postalCode: invoice.recipientPostalCode,
      city: invoice.recipientCity,
      countryCode: invoice.recipientCountryCode,
      email: invoice.recipientEmail,
      phone: invoice.recipientPhone,
      vatId: invoice.recipientVatId,
      languagePreference: invoice.language as LocaleCode
    },
    items,
    totals: {
      netTotal: decimalToNumber(invoice.netTotal),
      vatTotal: decimalToNumber(invoice.vatTotal),
      grossTotal: decimalToNumber(invoice.grossTotal)
    },
    taxBreakdown
  };
}
