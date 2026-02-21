import { formatCurrency, formatDate } from "@/lib/i18n";
import type { ExportInvoiceModel } from "@/lib/invoice-model";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function row(label: string, value: string): string {
  return `<div class="meta-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

export function renderInvoiceHtml(invoice: ExportInvoiceModel): string {
  const locale = invoice.language;

  const title = locale === "de" ? "Rechnung" : "Invoice";
  const serviceDateLabel = locale === "de" ? "Leistungsdatum" : "Service Date";
  const dueDateLabel = locale === "de" ? "Fällig am" : "Due Date";
  const bankLabel = locale === "de" ? "Bankverbindung" : "Bank Details";
  const tableHeaders = {
    description: locale === "de" ? "Beschreibung" : "Description",
    qty: locale === "de" ? "Menge" : "Qty",
    unit: locale === "de" ? "Einheit" : "Unit",
    net: locale === "de" ? "Netto" : "Net",
    vat: locale === "de" ? "MwSt." : "VAT",
    gross: locale === "de" ? "Brutto" : "Gross"
  };

  const itemsRows = invoice.items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.description)}</td>
        <td class="num">${item.quantity}</td>
        <td>${escapeHtml(item.unit)}</td>
        <td class="num">${formatCurrency(item.lineNet, locale)}</td>
        <td class="num">${item.vatRate}%</td>
        <td class="num">${formatCurrency(item.lineGross, locale)}</td>
      </tr>
    `
    )
    .join("");

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #fff;
        color: #0f1720;
        padding: 36px;
      }
      .page { width: 100%; }
      .header {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 20px;
        margin-bottom: 20px;
      }
      .title {
        font-size: 30px;
        letter-spacing: -0.02em;
        margin: 0;
      }
      .invoice-number {
        font-weight: 600;
        color: #ff5a1f;
      }
      .addresses {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
      }
      .box {
        background: #fafbfc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 14px;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 20px;
      }
      .meta-row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        font-size: 13px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      th, td {
        border-bottom: 1px solid #e2e8f0;
        text-align: left;
        padding: 10px 6px;
        font-size: 13px;
      }
      th { color: #5b6570; font-weight: 600; }
      .num { text-align: right; }
      .totals {
        margin-left: auto;
        width: 290px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 13px;
      }
      .grand { font-size: 15px; font-weight: 700; color: #ff5a1f; }
      .footnote {
        margin-top: 20px;
        color: #5b6570;
        font-size: 12px;
      }
      .bank {
        margin-top: 20px;
        border-top: 1px solid #e2e8f0;
        padding-top: 14px;
      }
      .bank strong { display: block; margin-bottom: 5px; }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="header">
        <div>
          <h1 class="title">${escapeHtml(title)}</h1>
          <div class="invoice-number">${escapeHtml(invoice.invoiceNumber)}</div>
        </div>
        <div class="meta-grid">
          ${row(locale === "de" ? "Rechnungsdatum" : "Issue Date", formatDate(invoice.issueDate, locale))}
          ${row(serviceDateLabel, formatDate(invoice.serviceDate, locale))}
          ${row(dueDateLabel, formatDate(invoice.dueDate, locale))}
          ${row(locale === "de" ? "Zahlungsziel" : "Payment Terms", `${invoice.paymentTermDays} days`)}
        </div>
      </header>

      <section class="addresses">
        <div class="box">
          <strong>${escapeHtml(invoice.sender.legalName)}</strong><br />
          ${escapeHtml(invoice.sender.street)}<br />
          ${escapeHtml(invoice.sender.postalCode)} ${escapeHtml(invoice.sender.city)}, ${escapeHtml(invoice.sender.countryCode)}<br />
          ${escapeHtml(invoice.sender.email)} · ${escapeHtml(invoice.sender.phone)}
        </div>
        <div class="box">
          <strong>${escapeHtml(invoice.recipient.companyName)}</strong><br />
          ${escapeHtml(invoice.recipient.displayName)}<br />
          ${escapeHtml(invoice.recipient.street)}<br />
          ${escapeHtml(invoice.recipient.postalCode)} ${escapeHtml(invoice.recipient.city)}, ${escapeHtml(invoice.recipient.countryCode)}<br />
          ${escapeHtml(invoice.recipient.email)} · ${escapeHtml(invoice.recipient.phone)}
        </div>
      </section>

      <table>
        <thead>
          <tr>
            <th>${tableHeaders.description}</th>
            <th class="num">${tableHeaders.qty}</th>
            <th>${tableHeaders.unit}</th>
            <th class="num">${tableHeaders.net}</th>
            <th class="num">${tableHeaders.vat}</th>
            <th class="num">${tableHeaders.gross}</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>

      <aside class="totals">
        <div class="total-row"><span>${tableHeaders.net}</span><strong>${formatCurrency(invoice.totals.netTotal, locale)}</strong></div>
        <div class="total-row"><span>${tableHeaders.vat}</span><strong>${formatCurrency(invoice.totals.vatTotal, locale)}</strong></div>
        <div class="total-row grand"><span>${tableHeaders.gross}</span><strong>${formatCurrency(invoice.totals.grossTotal, locale)}</strong></div>
      </aside>

      ${invoice.note ? `<p class="footnote">${escapeHtml(invoice.note)}</p>` : ""}
      <div class="bank">
        <strong>${escapeHtml(bankLabel)}</strong>
        ${escapeHtml(invoice.sender.bankName)} · IBAN ${escapeHtml(invoice.sender.iban)} · BIC ${escapeHtml(invoice.sender.bic)}
      </div>
    </div>
  </body>
</html>`;
}
