"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateInvoice } from "@/lib/calculation";
import { formatCurrency, t } from "@/lib/i18n";
import type {
  BusinessProfileInput,
  ContactInput,
  InvoiceDraftInput,
  InvoiceLineInput,
  InvoiceStatus,
  LocaleCode,
  TaxMode
} from "@/types/invoice";
import { Button, Field, Input, Panel, Select, StatRow, TextArea } from "@/components/ui";

type InvoiceRecord = {
  id: string;
  contactId?: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  serviceDate: string;
  dueDate: string;
  paymentTermDays: number;
  currency: "EUR";
  language: LocaleCode;
  taxMode: TaxMode;
  note: string;
  sender: BusinessProfileInput;
  recipient: ContactInput;
  items: InvoiceLineInput[];
  totals: {
    netTotal: number;
    vatTotal: number;
    grossTotal: number;
  };
  taxBreakdown: Array<{ vatRate: 0 | 7 | 19; taxableBase: number; vatAmount: number }>;
};

type ContactRecord = ContactInput & {
  id: string;
};

const EMPTY_PROFILE: BusinessProfileInput = {
  legalName: "",
  street: "",
  postalCode: "",
  city: "",
  countryCode: "DE",
  email: "",
  phone: "",
  vatId: "",
  taxNumber: "",
  isKleinunternehmer: false,
  iban: "",
  bic: "",
  bankName: "",
  defaultPaymentDays: 14,
  invoicePrefix: "INV"
};

const EMPTY_CONTACT: ContactInput = {
  displayName: "",
  companyName: "",
  street: "",
  postalCode: "",
  city: "",
  countryCode: "DE",
  email: "",
  phone: "",
  vatId: "",
  languagePreference: "de"
};

const EMPTY_LINE = (): InvoiceLineInput => ({
  position: 1,
  description: "",
  quantity: 1,
  unit: "pcs",
  unitPriceInput: 0,
  priceInputMode: "net",
  vatRate: 19
});

function dateInputValue(value: string): string {
  return value.slice(0, 10);
}

function toIsoDate(value: string): string {
  return new Date(`${value}T00:00:00`).toISOString();
}

export function InvoiceStudio() {
  const [locale, setLocale] = useState<LocaleCode>("de");
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileInput>(EMPTY_PROFILE);
  const [recipient, setRecipient] = useState<ContactInput>(EMPTY_CONTACT);
  const [contactId, setContactId] = useState<string>("");
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [history, setHistory] = useState<InvoiceRecord[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [invoiceId, setInvoiceId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [status, setStatus] = useState<InvoiceStatus>("draft");
  const [taxMode, setTaxMode] = useState<TaxMode>("standard");
  const [invoiceLanguage, setInvoiceLanguage] = useState<LocaleCode>("de");
  const [issueDate, setIssueDate] = useState<string>(dateInputValue(new Date().toISOString()));
  const [serviceDate, setServiceDate] = useState<string>(dateInputValue(new Date().toISOString()));
  const [paymentTermDays, setPaymentTermDays] = useState<number>(14);
  const [dueDate, setDueDate] = useState<string>(dateInputValue(new Date().toISOString()));
  const [note, setNote] = useState<string>("");
  const [items, setItems] = useState<InvoiceLineInput[]>([{ ...EMPTY_LINE(), position: 1 }]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");

  const calculation = useMemo(
    () => calculateInvoice(items, taxMode, invoiceLanguage),
    [items, taxMode, invoiceLanguage]
  );

  useEffect(() => {
    async function boot() {
      setBusy(true);
      try {
        await Promise.all([loadProfile(), loadContacts(), loadInvoices("")]);
      } finally {
        setBusy(false);
      }
    }

    void boot();
  }, []);

  useEffect(() => {
    const due = new Date(`${issueDate}T00:00:00`);
    due.setDate(due.getDate() + paymentTermDays);
    setDueDate(dateInputValue(due.toISOString()));
  }, [issueDate, paymentTermDays]);

  async function loadProfile() {
    const response = await fetch("/api/business-profile");
    const data = await response.json();

    if (data.profile) {
      setBusinessProfile(data.profile);
      setPaymentTermDays(data.profile.defaultPaymentDays);
    }
  }

  async function loadContacts() {
    const response = await fetch("/api/contacts");
    const data = await response.json();
    setContacts(data.contacts ?? []);
  }

  async function loadInvoices(query: string) {
    const response = await fetch(`/api/invoices?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    setHistory(data.invoices ?? []);
  }

  async function saveProfile() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(businessProfile)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message ?? "Could not save business profile");
      }

      setMessage("Business profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveContact() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipient)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message ?? "Could not save contact");
      }

      await loadContacts();
      setMessage("Contact saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Contact save failed.");
    } finally {
      setBusy(false);
    }
  }

  function createPayload(): InvoiceDraftInput {
    const draft: InvoiceDraftInput = {
      id: invoiceId || undefined,
      status,
      issueDate: toIsoDate(issueDate),
      serviceDate: toIsoDate(serviceDate),
      currency: "EUR",
      language: invoiceLanguage,
      taxMode,
      paymentTermDays,
      dueDate: toIsoDate(dueDate),
      note,
      contactId: contactId || null,
      sender: businessProfile,
      recipient,
      items
    };

    return draft;
  }

  async function saveInvoice() {
    setBusy(true);
    setMessage("");

    try {
      const payload = createPayload();
      const isUpdate = Boolean(invoiceId);
      const response = await fetch(isUpdate ? `/api/invoices/${invoiceId}` : "/api/invoices", {
        method: isUpdate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? "Could not save invoice");
      }

      const saved = data.invoice as InvoiceRecord;
      hydrateFromInvoice(saved);
      await loadInvoices(historyQuery);
      setMessage(`Invoice ${saved.invoiceNumber} saved.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invoice save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function duplicateCurrent() {
    if (!invoiceId) {
      setMessage("Save an invoice first.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/duplicate`, {
        method: "POST"
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? "Could not duplicate invoice");
      }

      const duplicated = data.invoice as InvoiceRecord;
      hydrateFromInvoice(duplicated);
      await loadInvoices(historyQuery);
      setMessage(`Duplicated as ${duplicated.invoiceNumber}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Duplicate failed.");
    } finally {
      setBusy(false);
    }
  }

  async function exportInvoice(kind: "pdf" | "xrechnung") {
    if (!invoiceId) {
      setMessage("Save invoice before export.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/export/${kind}`, {
        method: "POST"
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.validation?.log ?? data.message ?? "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${invoiceNumber || "invoice"}.${kind === "pdf" ? "pdf" : "xml"}`;
      anchor.click();
      URL.revokeObjectURL(url);

      setMessage(`${kind.toUpperCase()} exported.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  }

  function hydrateFromInvoice(invoice: InvoiceRecord) {
    setInvoiceId(invoice.id);
    setInvoiceNumber(invoice.invoiceNumber);
    setStatus(invoice.status);
    setIssueDate(dateInputValue(invoice.issueDate));
    setServiceDate(dateInputValue(invoice.serviceDate));
    setDueDate(dateInputValue(invoice.dueDate));
    setPaymentTermDays(invoice.paymentTermDays);
    setTaxMode(invoice.taxMode);
    setInvoiceLanguage(invoice.language);
    setBusinessProfile(invoice.sender);
    setRecipient(invoice.recipient);
    setContactId(invoice.contactId ?? "");
    setItems(invoice.items.length > 0 ? invoice.items : [{ ...EMPTY_LINE(), position: 1 }]);
    setNote(invoice.note);
  }

  function onSelectContact(id: string) {
    setContactId(id);
    const contact = contacts.find((entry) => entry.id === id);
    if (!contact) {
      return;
    }
    setRecipient({
      displayName: contact.displayName,
      companyName: contact.companyName,
      street: contact.street,
      postalCode: contact.postalCode,
      city: contact.city,
      countryCode: contact.countryCode,
      email: contact.email,
      phone: contact.phone,
      vatId: contact.vatId,
      languagePreference: contact.languagePreference
    });
  }

  function updateLine(index: number, patch: Partial<InvoiceLineInput>) {
    setItems((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              ...patch
            }
          : line
      )
    );
  }

  function addLine() {
    setItems((current) => [...current, { ...EMPTY_LINE(), position: current.length + 1 }]);
  }

  function removeLine(index: number) {
    setItems((current) =>
      current
        .filter((_, lineIndex) => lineIndex !== index)
        .map((line, lineIndex) => ({ ...line, position: lineIndex + 1 }))
    );
  }

  return (
    <main className="mx-auto max-w-[1560px] p-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface px-5 py-4 shadow-panel">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight">{t(locale, "appTitle")}</h1>
          <p className="m-0 text-sm text-muted">{t(locale, "appSubtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant={locale === "de" ? "default" : "ghost"} onClick={() => setLocale("de")}>DE</Button>
          <Button variant={locale === "en" ? "default" : "ghost"} onClick={() => setLocale("en")}>EN</Button>
        </div>
      </header>

      {message ? (
        <div className="mb-4 rounded-md border border-border bg-[#fffaf6] px-4 py-3 text-sm text-text">{message}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <section className="space-y-5 xl:col-span-8">
          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="m-0 text-sm font-semibold uppercase tracking-wider text-muted">
                {t(locale, "businessProfile")}
              </h2>
              <Button onClick={saveProfile} disabled={busy}>
                Save Profile
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Legal Name">
                <Input
                  value={businessProfile.legalName}
                  onChange={(event) =>
                    setBusinessProfile((current) => ({ ...current, legalName: event.target.value }))
                  }
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={businessProfile.email}
                  onChange={(event) =>
                    setBusinessProfile((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </Field>
              <Field label="Street">
                <Input
                  value={businessProfile.street}
                  onChange={(event) =>
                    setBusinessProfile((current) => ({ ...current, street: event.target.value }))
                  }
                />
              </Field>
              <Field label="City">
                <Input
                  value={businessProfile.city}
                  onChange={(event) =>
                    setBusinessProfile((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </Field>
              <Field label="Postal Code">
                <Input
                  value={businessProfile.postalCode}
                  onChange={(event) =>
                    setBusinessProfile((current) => ({ ...current, postalCode: event.target.value }))
                  }
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={businessProfile.phone}
                  onChange={(event) =>
                    setBusinessProfile((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </Field>
              <Field label="IBAN">
                <Input
                  value={businessProfile.iban}
                  onChange={(event) =>
                    setBusinessProfile((current) => ({ ...current, iban: event.target.value }))
                  }
                />
              </Field>
              <Field label="BIC">
                <Input
                  value={businessProfile.bic}
                  onChange={(event) =>
                    setBusinessProfile((current) => ({ ...current, bic: event.target.value }))
                  }
                />
              </Field>
              <Field label="Bank">
                <Input
                  value={businessProfile.bankName}
                  onChange={(event) =>
                    setBusinessProfile((current) => ({ ...current, bankName: event.target.value }))
                  }
                />
              </Field>
              <Field label="Prefix">
                <Input
                  value={businessProfile.invoicePrefix}
                  onChange={(event) =>
                    setBusinessProfile((current) => ({ ...current, invoicePrefix: event.target.value }))
                  }
                />
              </Field>
              <Field label="Default Payment Days">
                <Input
                  type="number"
                  min={1}
                  value={businessProfile.defaultPaymentDays}
                  onChange={(event) =>
                    setBusinessProfile((current) => ({
                      ...current,
                      defaultPaymentDays: Number(event.target.value) || 14
                    }))
                  }
                />
              </Field>
              <Field label="Kleinunternehmer">
                <Select
                  value={businessProfile.isKleinunternehmer ? "yes" : "no"}
                  onChange={(event) =>
                    setBusinessProfile((current) => ({
                      ...current,
                      isKleinunternehmer: event.target.value === "yes"
                    }))
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </Select>
              </Field>
            </div>
          </Panel>

          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="m-0 text-sm font-semibold uppercase tracking-wider text-muted">{t(locale, "recipient")}</h2>
              <Button variant="ghost" onClick={saveContact} disabled={busy}>
                {t(locale, "createContact")}
              </Button>
            </div>

            <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label={t(locale, "selectContact")}>
                <Select value={contactId} onChange={(event) => onSelectContact(event.target.value)}>
                  <option value="">-</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.companyName} · {contact.displayName}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Language">
                <Select
                  value={recipient.languagePreference}
                  onChange={(event) =>
                    setRecipient((current) => ({
                      ...current,
                      languagePreference: event.target.value as LocaleCode
                    }))
                  }
                >
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Contact Name">
                <Input
                  value={recipient.displayName}
                  onChange={(event) =>
                    setRecipient((current) => ({ ...current, displayName: event.target.value }))
                  }
                />
              </Field>
              <Field label="Company">
                <Input
                  value={recipient.companyName}
                  onChange={(event) =>
                    setRecipient((current) => ({ ...current, companyName: event.target.value }))
                  }
                />
              </Field>
              <Field label="Street">
                <Input
                  value={recipient.street}
                  onChange={(event) =>
                    setRecipient((current) => ({ ...current, street: event.target.value }))
                  }
                />
              </Field>
              <Field label="City">
                <Input
                  value={recipient.city}
                  onChange={(event) =>
                    setRecipient((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </Field>
              <Field label="Postal Code">
                <Input
                  value={recipient.postalCode}
                  onChange={(event) =>
                    setRecipient((current) => ({ ...current, postalCode: event.target.value }))
                  }
                />
              </Field>
              <Field label="Email">
                <Input
                  value={recipient.email}
                  onChange={(event) =>
                    setRecipient((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={recipient.phone}
                  onChange={(event) =>
                    setRecipient((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </Field>
              <Field label="VAT ID">
                <Input
                  value={recipient.vatId ?? ""}
                  onChange={(event) =>
                    setRecipient((current) => ({ ...current, vatId: event.target.value }))
                  }
                />
              </Field>
            </div>
          </Panel>

          <Panel>
            <h2 className="mb-3 mt-0 text-sm font-semibold uppercase tracking-wider text-muted">
              {t(locale, "invoiceMeta")}
            </h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Invoice Number">
                <Input value={invoiceNumber} disabled placeholder="auto" />
              </Field>
              <Field label="Status">
                <Select value={status} onChange={(event) => setStatus(event.target.value as InvoiceStatus)}>
                  <option value="draft">{t(locale, "draft")}</option>
                  <option value="issued">{t(locale, "issued")}</option>
                  <option value="paid">{t(locale, "paid")}</option>
                  <option value="cancelled">{t(locale, "cancelled")}</option>
                </Select>
              </Field>
              <Field label="Language">
                <Select
                  value={invoiceLanguage}
                  onChange={(event) => setInvoiceLanguage(event.target.value as LocaleCode)}
                >
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </Select>
              </Field>
              <Field label="Issue Date">
                <Input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
              </Field>
              <Field label="Service Date">
                <Input type="date" value={serviceDate} onChange={(event) => setServiceDate(event.target.value)} />
              </Field>
              <Field label="Due Date">
                <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </Field>
              <Field label="Payment Days">
                <Input
                  type="number"
                  min={1}
                  value={paymentTermDays}
                  onChange={(event) => setPaymentTermDays(Number(event.target.value) || 14)}
                />
              </Field>
              <Field label={t(locale, "taxMode")}>
                <Select value={taxMode} onChange={(event) => setTaxMode(event.target.value as TaxMode)}>
                  <option value="standard">{t(locale, "standardTax")}</option>
                  <option value="kleinunternehmer">{t(locale, "kleinunternehmer")}</option>
                </Select>
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Note">
                <TextArea value={note} onChange={(event) => setNote(event.target.value)} />
              </Field>
            </div>
          </Panel>

          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="m-0 text-sm font-semibold uppercase tracking-wider text-muted">{t(locale, "items")}</h2>
              <Button variant="ghost" onClick={addLine}>
                {t(locale, "addLine")}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="pb-2">#</th>
                    <th className="pb-2">{t(locale, "lineDescription")}</th>
                    <th className="pb-2">{t(locale, "quantity")}</th>
                    <th className="pb-2">{t(locale, "unit")}</th>
                    <th className="pb-2">{t(locale, "unitPrice")}</th>
                    <th className="pb-2">Mode</th>
                    <th className="pb-2">{t(locale, "vatRate")}</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={`${index}-${item.position}`} className="border-b border-border text-sm">
                      <td className="py-2 pr-2 text-muted">{index + 1}</td>
                      <td className="py-2 pr-2">
                        <Input
                          value={item.description}
                          onChange={(event) => updateLine(index, { description: event.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.0001"
                          value={item.quantity}
                          onChange={(event) => updateLine(index, { quantity: Number(event.target.value) || 0 })}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          value={item.unit}
                          onChange={(event) => updateLine(index, { unit: event.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.0001"
                          value={item.unitPriceInput}
                          onChange={(event) =>
                            updateLine(index, {
                              unitPriceInput: Number(event.target.value) || 0
                            })
                          }
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Select
                          value={item.priceInputMode}
                          onChange={(event) =>
                            updateLine(index, {
                              priceInputMode: event.target.value as "net" | "gross"
                            })
                          }
                        >
                          <option value="net">Net</option>
                          <option value="gross">Gross</option>
                        </Select>
                      </td>
                      <td className="py-2 pr-2">
                        <Select
                          value={item.vatRate}
                          onChange={(event) =>
                            updateLine(index, {
                              vatRate: Number(event.target.value) as 0 | 7 | 19
                            })
                          }
                          disabled={taxMode === "kleinunternehmer"}
                        >
                          <option value={0}>0%</option>
                          <option value={7}>7%</option>
                          <option value={19}>19%</option>
                        </Select>
                      </td>
                      <td className="py-2">
                        <Button
                          variant="muted"
                          onClick={() => removeLine(index)}
                          disabled={items.length === 1}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>

        <aside className="space-y-5 xl:col-span-4">
          <Panel className="sticky top-6">
            <h2 className="m-0 mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
              {t(locale, "summary")}
            </h2>
            <StatRow label={t(locale, "netTotal")} value={formatCurrency(calculation.netTotal, locale)} />
            <StatRow label={t(locale, "vatTotal")} value={formatCurrency(calculation.vatTotal, locale)} />
            <StatRow label={t(locale, "grossTotal")} value={formatCurrency(calculation.grossTotal, locale)} />

            <div className="mt-4 space-y-2">
              <Button className="w-full" onClick={saveInvoice} disabled={busy}>
                {t(locale, "saveDraft")}
              </Button>
              <Button className="w-full" variant="ghost" onClick={duplicateCurrent} disabled={busy}>
                {t(locale, "duplicate")}
              </Button>
              <Button className="w-full" variant="ghost" onClick={() => exportInvoice("pdf")} disabled={busy}>
                {t(locale, "exportPdf")}
              </Button>
              <Button className="w-full" variant="ghost" onClick={() => exportInvoice("xrechnung")} disabled={busy}>
                {t(locale, "exportXRechnung")}
              </Button>
            </div>

            {taxMode === "kleinunternehmer" ? (
              <p className="mt-4 rounded-md bg-accent-soft px-3 py-2 text-xs text-text">
                {t(locale, "mandatoryKleinText")}
              </p>
            ) : null}
          </Panel>

          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="m-0 text-sm font-semibold uppercase tracking-wider text-muted">{t(locale, "history")}</h2>
              <Button variant="muted" onClick={() => loadInvoices(historyQuery)} disabled={busy}>
                Refresh
              </Button>
            </div>

            <Input
              placeholder="Search number, customer, status"
              value={historyQuery}
              onChange={(event) => {
                const query = event.target.value;
                setHistoryQuery(query);
                void loadInvoices(query);
              }}
            />

            <div className="mt-3 max-h-[520px] space-y-2 overflow-auto">
              {history.map((invoice) => (
                <button
                  key={invoice.id}
                  className="w-full rounded-md border border-border bg-white p-3 text-left transition-colors hover:border-accent"
                  onClick={() => hydrateFromInvoice(invoice)}
                >
                  <div className="flex items-center justify-between text-sm">
                    <strong>{invoice.invoiceNumber}</strong>
                    <span className="text-xs uppercase text-muted">{invoice.status}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted">{invoice.recipient.companyName}</div>
                  <div className="mt-1 text-xs text-muted">{dateInputValue(invoice.issueDate)}</div>
                </button>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </main>
  );
}
