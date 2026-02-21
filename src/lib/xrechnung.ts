import { exec } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { ExportInvoiceModel } from "@/lib/invoice-model";
import type { XRechnungValidationResult } from "@/types/invoice";

const execAsync = promisify(exec);

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function buildTaxCategoryCode(rate: number): string {
  if (rate === 0) {
    return "Z";
  }
  return "S";
}

function mapTaxExemptionReason(invoice: ExportInvoiceModel): string {
  if (invoice.taxMode === "kleinunternehmer") {
    return "VAT exemption according to §19 UStG";
  }
  return "";
}

export function buildXRechnungXml(invoice: ExportInvoiceModel): string {
  const customizationId =
    "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0";
  const profileId = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";

  const taxSubtotalNodes = invoice.taxBreakdown
    .filter((bucket) => bucket.taxableBase > 0 || bucket.vatAmount > 0 || bucket.vatRate === 0)
    .map((bucket) => {
      const exemptionReason =
        invoice.taxMode === "kleinunternehmer" || bucket.vatRate === 0
          ? `<cbc:TaxExemptionReason>${escapeXml(mapTaxExemptionReason(invoice) || "VAT exempt")}</cbc:TaxExemptionReason>`
          : "";

      return `
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="EUR">${bucket.taxableBase.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="EUR">${(invoice.taxMode === "kleinunternehmer" ? 0 : bucket.vatAmount).toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>${buildTaxCategoryCode(bucket.vatRate)}</cbc:ID>
          <cbc:Percent>${invoice.taxMode === "kleinunternehmer" ? 0 : bucket.vatRate}</cbc:Percent>
          ${exemptionReason}
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>`;
    })
    .join("\n");

  const lineNodes = invoice.items
    .map((item) => {
      return `
      <cac:InvoiceLine>
        <cbc:ID>${item.position}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="C62">${item.quantity.toFixed(2)}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="EUR">${item.lineNet.toFixed(2)}</cbc:LineExtensionAmount>
        <cac:Item>
          <cbc:Name>${escapeXml(item.description)}</cbc:Name>
          <cac:ClassifiedTaxCategory>
            <cbc:ID>${buildTaxCategoryCode(item.vatRate)}</cbc:ID>
            <cbc:Percent>${invoice.taxMode === "kleinunternehmer" ? 0 : item.vatRate}</cbc:Percent>
            <cac:TaxScheme>
              <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
          </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
          <cbc:PriceAmount currencyID="EUR">${item.unitPriceInput.toFixed(2)}</cbc:PriceAmount>
          <cbc:BaseQuantity unitCode="C62">1</cbc:BaseQuantity>
        </cac:Price>
      </cac:InvoiceLine>`;
    })
    .join("\n");

  const note = invoice.taxMode === "kleinunternehmer"
    ? "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
    : invoice.note;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice
  xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>${customizationId}</cbc:CustomizationID>
  <cbc:ProfileID>${profileId}</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoice.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${dateOnly(invoice.issueDate)}</cbc:IssueDate>
  <cbc:DueDate>${dateOnly(invoice.dueDate)}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cbc:BuyerReference>LOCAL-B2B</cbc:BuyerReference>
  ${note ? `<cbc:Note>${escapeXml(note)}</cbc:Note>` : ""}

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(invoice.sender.street)}</cbc:StreetName>
        <cbc:CityName>${escapeXml(invoice.sender.city)}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(invoice.sender.postalCode)}</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>${escapeXml(invoice.sender.countryCode)}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(invoice.sender.vatId || "DE000000000")}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(invoice.sender.legalName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
      <cac:Contact>
        <cbc:ElectronicMail>${escapeXml(invoice.sender.email)}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(invoice.recipient.street)}</cbc:StreetName>
        <cbc:CityName>${escapeXml(invoice.recipient.city)}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(invoice.recipient.postalCode)}</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>${escapeXml(invoice.recipient.countryCode)}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escapeXml(invoice.recipient.companyName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
      <cac:Contact>
        <cbc:Name>${escapeXml(invoice.recipient.displayName)}</cbc:Name>
        <cbc:ElectronicMail>${escapeXml(invoice.recipient.email)}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${escapeXml(invoice.sender.iban)}</cbc:ID>
      <cac:FinancialInstitutionBranch>
        <cbc:ID>${escapeXml(invoice.sender.bic)}</cbc:ID>
      </cac:FinancialInstitutionBranch>
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${invoice.totals.vatTotal.toFixed(2)}</cbc:TaxAmount>
    ${taxSubtotalNodes}
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">${invoice.totals.netTotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${invoice.totals.netTotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${invoice.totals.grossTotal.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">${invoice.totals.grossTotal.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  ${lineNodes}
</Invoice>`;
}

export async function validateXRechnung(xml: string): Promise<XRechnungValidationResult> {
  const validationCommand = process.env.XRECHNUNG_VALIDATION_COMMAND;

  if (!validationCommand) {
    return {
      valid: false,
      state: "unavailable",
      log: "XRechnung validation command is missing. Set XRECHNUNG_VALIDATION_COMMAND with {xml} placeholder."
    };
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "xrechnung-"));
  const xmlPath = path.join(tempDir, "invoice.xml");
  const reportPath = path.join(tempDir, "report.txt");

  await writeFile(xmlPath, xml, "utf8");

  try {
    const command = validationCommand
      .replaceAll("{xml}", JSON.stringify(xmlPath))
      .replaceAll("{reportDir}", JSON.stringify(tempDir));

    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 1_000_000
    });

    let report = `${stdout}\n${stderr}`.trim();
    try {
      const maybeReport = await readFile(reportPath, "utf8");
      report = `${report}\n${maybeReport}`.trim();
    } catch {
      // Optional report file.
    }

    return {
      valid: true,
      state: "passed",
      log: report || "Validation passed"
    };
  } catch (error) {
    const report = error instanceof Error ? error.message : String(error);
    return {
      valid: false,
      state: "failed",
      log: report
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
