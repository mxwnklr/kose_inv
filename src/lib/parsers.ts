import type {
  BusinessProfileInput,
  ContactInput,
  InvoiceDraftInput,
  InvoiceLineInput,
  InvoiceStatus,
  LocaleCode,
  PriceInputMode,
  TaxMode
} from "@/types/invoice";

function asString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}

function asLocale(value: unknown): LocaleCode {
  return value === "en" ? "en" : "de";
}

function asTaxMode(value: unknown): TaxMode {
  return value === "kleinunternehmer" ? "kleinunternehmer" : "standard";
}

function asStatus(value: unknown): InvoiceStatus {
  if (value === "issued" || value === "paid" || value === "cancelled") {
    return value;
  }
  return "draft";
}

function asPriceInputMode(value: unknown): PriceInputMode {
  return value === "gross" ? "gross" : "net";
}

function asVatRate(value: unknown): 0 | 7 | 19 {
  const rate = asNumber(value, 19);
  if (rate === 0 || rate === 7 || rate === 19) {
    return rate;
  }
  return 19;
}

export function parseBusinessProfile(input: unknown): BusinessProfileInput {
  const source = (input ?? {}) as Record<string, unknown>;
  return {
    legalName: asString(source.legalName),
    street: asString(source.street),
    postalCode: asString(source.postalCode),
    city: asString(source.city),
    countryCode: asString(source.countryCode, "DE"),
    email: asString(source.email),
    phone: asString(source.phone),
    vatId: asString(source.vatId) || null,
    taxNumber: asString(source.taxNumber) || null,
    isKleinunternehmer: asBoolean(source.isKleinunternehmer),
    iban: asString(source.iban),
    bic: asString(source.bic),
    bankName: asString(source.bankName),
    defaultPaymentDays: asNumber(source.defaultPaymentDays, 14),
    invoicePrefix: asString(source.invoicePrefix, "INV")
  };
}

export function parseContact(input: unknown): ContactInput {
  const source = (input ?? {}) as Record<string, unknown>;
  return {
    displayName: asString(source.displayName),
    companyName: asString(source.companyName),
    street: asString(source.street),
    postalCode: asString(source.postalCode),
    city: asString(source.city),
    countryCode: asString(source.countryCode, "DE"),
    email: asString(source.email),
    phone: asString(source.phone),
    vatId: asString(source.vatId) || null,
    languagePreference: asLocale(source.languagePreference)
  };
}

function parseInvoiceItem(input: unknown, index: number): InvoiceLineInput {
  const source = (input ?? {}) as Record<string, unknown>;
  return {
    id: asString(source.id) || undefined,
    position: asNumber(source.position, index + 1),
    description: asString(source.description),
    quantity: asNumber(source.quantity, 1),
    unit: asString(source.unit, "pcs"),
    unitPriceInput: asNumber(source.unitPriceInput, 0),
    priceInputMode: asPriceInputMode(source.priceInputMode),
    vatRate: asVatRate(source.vatRate)
  };
}

export function parseInvoiceDraft(input: unknown): InvoiceDraftInput {
  const source = (input ?? {}) as Record<string, unknown>;
  const sender = parseBusinessProfile(source.sender);
  const recipient = parseContact(source.recipient);

  const itemsInput = Array.isArray(source.items) ? source.items : [];

  const issueDate = asString(source.issueDate) || new Date().toISOString();
  const paymentTermDays = asNumber(source.paymentTermDays, sender.defaultPaymentDays || 14);
  const dueDateDefault = new Date(issueDate);
  dueDateDefault.setDate(dueDateDefault.getDate() + paymentTermDays);

  return {
    id: asString(source.id) || undefined,
    status: asStatus(source.status),
    issueDate,
    serviceDate: asString(source.serviceDate) || issueDate,
    currency: "EUR",
    language: asLocale(source.language),
    taxMode: asTaxMode(source.taxMode),
    paymentTermDays,
    dueDate: asString(source.dueDate) || dueDateDefault.toISOString(),
    note: asString(source.note),
    contactId: asString(source.contactId) || null,
    sender,
    recipient,
    items: itemsInput.map((item, index) => parseInvoiceItem(item, index))
  };
}
