import { prisma } from "@/lib/prisma";
import { calculateInvoice } from "@/lib/calculation";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import { toExportInvoiceModel } from "@/lib/invoice-model";
import type { InvoiceDraftInput } from "@/types/invoice";

export function mergeKleinunternehmerNote(note: string, required?: string): string {
  if (!required) {
    return note;
  }
  if (note.includes(required)) {
    return note;
  }
  return note ? `${note}\n\n${required}` : required;
}

export async function saveInvoiceDraft(input: InvoiceDraftInput) {
  const calculation = calculateInvoice(input.items, input.taxMode, input.language);
  const note = mergeKleinunternehmerNote(input.note, calculation.mandatoryKleinunternehmerNote);

  if (input.items.length === 0) {
    throw new Error("Invoice needs at least one line item.");
  }

  if (input.id) {
    return prisma.invoice.update({
      where: { id: input.id },
      data: {
        status: input.status,
        issueDate: new Date(input.issueDate),
        serviceDate: new Date(input.serviceDate),
        currency: "EUR",
        language: input.language,
        taxMode: input.taxMode,
        senderLegalName: input.sender.legalName,
        senderStreet: input.sender.street,
        senderPostalCode: input.sender.postalCode,
        senderCity: input.sender.city,
        senderCountryCode: input.sender.countryCode,
        senderEmail: input.sender.email,
        senderPhone: input.sender.phone,
        senderVatId: input.sender.vatId,
        senderTaxNumber: input.sender.taxNumber,
        senderIsKleinunternehmer: input.sender.isKleinunternehmer,
        senderIban: input.sender.iban,
        senderBic: input.sender.bic,
        senderBankName: input.sender.bankName,
        recipientDisplayName: input.recipient.displayName,
        recipientCompanyName: input.recipient.companyName,
        recipientStreet: input.recipient.street,
        recipientPostalCode: input.recipient.postalCode,
        recipientCity: input.recipient.city,
        recipientCountryCode: input.recipient.countryCode,
        recipientEmail: input.recipient.email,
        recipientPhone: input.recipient.phone,
        recipientVatId: input.recipient.vatId,
        contactId: input.contactId,
        netTotal: calculation.netTotal,
        vatTotal: calculation.vatTotal,
        grossTotal: calculation.grossTotal,
        paymentTermDays: input.paymentTermDays,
        dueDate: new Date(input.dueDate),
        note,
        items: {
          deleteMany: {},
          createMany: {
            data: calculation.items.map((item) => ({
              position: item.position,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPriceInput: item.unitPriceInput,
              priceInputMode: item.priceInputMode,
              vatRate: item.vatRate,
              lineNet: item.lineNet,
              lineVat: item.lineVat,
              lineGross: item.lineGross
            }))
          }
        }
      },
      include: {
        items: true
      }
    });
  }

  const invoiceNumber = await nextInvoiceNumber(input.sender.invoicePrefix || "INV", new Date(input.issueDate));

  return prisma.invoice.create({
    data: {
      invoiceNumber,
      status: input.status,
      issueDate: new Date(input.issueDate),
      serviceDate: new Date(input.serviceDate),
      currency: "EUR",
      language: input.language,
      taxMode: input.taxMode,
      senderLegalName: input.sender.legalName,
      senderStreet: input.sender.street,
      senderPostalCode: input.sender.postalCode,
      senderCity: input.sender.city,
      senderCountryCode: input.sender.countryCode,
      senderEmail: input.sender.email,
      senderPhone: input.sender.phone,
      senderVatId: input.sender.vatId,
      senderTaxNumber: input.sender.taxNumber,
      senderIsKleinunternehmer: input.sender.isKleinunternehmer,
      senderIban: input.sender.iban,
      senderBic: input.sender.bic,
      senderBankName: input.sender.bankName,
      recipientDisplayName: input.recipient.displayName,
      recipientCompanyName: input.recipient.companyName,
      recipientStreet: input.recipient.street,
      recipientPostalCode: input.recipient.postalCode,
      recipientCity: input.recipient.city,
      recipientCountryCode: input.recipient.countryCode,
      recipientEmail: input.recipient.email,
      recipientPhone: input.recipient.phone,
      recipientVatId: input.recipient.vatId,
      contactId: input.contactId,
      netTotal: calculation.netTotal,
      vatTotal: calculation.vatTotal,
      grossTotal: calculation.grossTotal,
      paymentTermDays: input.paymentTermDays,
      dueDate: new Date(input.dueDate),
      note,
      items: {
        createMany: {
          data: calculation.items.map((item) => ({
            position: item.position,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPriceInput: item.unitPriceInput,
            priceInputMode: item.priceInputMode,
            vatRate: item.vatRate,
            lineNet: item.lineNet,
            lineVat: item.lineVat,
            lineGross: item.lineGross
          }))
        }
      }
    },
    include: {
      items: true
    }
  });
}

export async function getInvoiceModel(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true
    }
  });

  if (!invoice) {
    return null;
  }

  return toExportInvoiceModel(invoice);
}

export function serializeInvoice(invoice: Awaited<ReturnType<typeof saveInvoiceDraft>>) {
  const model = toExportInvoiceModel(invoice);
  return {
    ...model,
    issueDate: model.issueDate.toISOString(),
    serviceDate: model.serviceDate.toISOString(),
    dueDate: model.dueDate.toISOString()
  };
}
