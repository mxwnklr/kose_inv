export type LocaleCode = "de" | "en";

export type TaxMode = "standard" | "kleinunternehmer";
export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled";
export type PriceInputMode = "net" | "gross";

export type BusinessProfileInput = {
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

export type ContactInput = {
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

export type InvoiceLineInput = {
  id?: string;
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unitPriceInput: number;
  priceInputMode: PriceInputMode;
  vatRate: 0 | 7 | 19;
};

export type InvoiceDraftInput = {
  id?: string;
  status: InvoiceStatus;
  issueDate: string;
  serviceDate: string;
  currency: "EUR";
  language: LocaleCode;
  taxMode: TaxMode;
  paymentTermDays: number;
  dueDate: string;
  note: string;
  contactId?: string | null;
  sender: BusinessProfileInput;
  recipient: ContactInput;
  items: InvoiceLineInput[];
};

export type CalculatedInvoiceLine = InvoiceLineInput & {
  lineNet: number;
  lineVat: number;
  lineGross: number;
};

export type TaxBreakdownByRate = {
  vatRate: 0 | 7 | 19;
  taxableBase: number;
  vatAmount: number;
};

export type CalculatedInvoice = {
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  items: CalculatedInvoiceLine[];
  taxBreakdown: TaxBreakdownByRate[];
  mandatoryKleinunternehmerNote?: string;
};

export type XRechnungValidationResult = {
  valid: boolean;
  state: "passed" | "failed" | "unavailable";
  log: string;
};
