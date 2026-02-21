import type { LocaleCode } from "@/types/invoice";

export const messages = {
  de: {
    appTitle: "Local Invoice Studio",
    appSubtitle: "Rechnungen lokal erstellen, speichern und exportieren.",
    businessProfile: "Unternehmensprofil",
    contacts: "Kontakte",
    recipient: "Empfänger",
    invoiceMeta: "Rechnungsdetails",
    items: "Positionen",
    summary: "Zusammenfassung",
    saveDraft: "Entwurf speichern",
    duplicate: "Duplizieren",
    exportPdf: "PDF exportieren",
    exportXRechnung: "XRechnung exportieren",
    history: "Rechnungsverlauf",
    taxMode: "Steuermodus",
    standardTax: "Regelbesteuerung",
    kleinunternehmer: "Kleinunternehmer §19",
    mandatoryKleinText:
      "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",
    lineDescription: "Beschreibung",
    quantity: "Menge",
    unit: "Einheit",
    unitPrice: "Einzelpreis",
    vatRate: "MwSt.",
    netTotal: "Netto",
    vatTotal: "USt.",
    grossTotal: "Brutto",
    addLine: "Position hinzufügen",
    createContact: "Kontakt speichern",
    selectContact: "Kontakt wählen",
    issued: "Versendet",
    paid: "Bezahlt",
    draft: "Entwurf",
    cancelled: "Storniert"
  },
  en: {
    appTitle: "Local Invoice Studio",
    appSubtitle: "Create, store, and export invoices locally.",
    businessProfile: "Business Profile",
    contacts: "Contacts",
    recipient: "Recipient",
    invoiceMeta: "Invoice Details",
    items: "Line Items",
    summary: "Summary",
    saveDraft: "Save Draft",
    duplicate: "Duplicate",
    exportPdf: "Export PDF",
    exportXRechnung: "Export XRechnung",
    history: "Invoice History",
    taxMode: "Tax Mode",
    standardTax: "Standard VAT",
    kleinunternehmer: "Small business (§19 UStG)",
    mandatoryKleinText:
      "No VAT charged according to § 19 German VAT Act.",
    lineDescription: "Description",
    quantity: "Quantity",
    unit: "Unit",
    unitPrice: "Unit Price",
    vatRate: "VAT",
    netTotal: "Net",
    vatTotal: "VAT",
    grossTotal: "Gross",
    addLine: "Add line",
    createContact: "Save contact",
    selectContact: "Select contact",
    issued: "Issued",
    paid: "Paid",
    draft: "Draft",
    cancelled: "Cancelled"
  }
} as const;

export function t(locale: LocaleCode, key: keyof (typeof messages)["de"]): string {
  return messages[locale][key] ?? messages.de[key];
}

export function formatCurrency(value: number, locale: LocaleCode): string {
  const localeTag = locale === "de" ? "de-DE" : "en-GB";
  return new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDate(value: string | Date, locale: LocaleCode): string {
  const localeTag = locale === "de" ? "de-DE" : "en-GB";
  return new Intl.DateTimeFormat(localeTag).format(new Date(value));
}
