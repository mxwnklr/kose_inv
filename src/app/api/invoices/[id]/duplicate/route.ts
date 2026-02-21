import { prisma } from "@/lib/prisma";
import { created, notFound, serverError } from "@/lib/http";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import { extractPrefix } from "@/lib/invoice-number-core";
import { serializeInvoice } from "@/lib/invoices";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, context: Params) {
  try {
    const { id } = await context.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!invoice) {
      return notFound("Invoice not found");
    }

    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + invoice.paymentTermDays);

    const nextNumber = await nextInvoiceNumber(extractPrefix(invoice.invoiceNumber), issueDate);

    const duplicated = await prisma.invoice.create({
      data: {
        invoiceNumber: nextNumber,
        status: "draft",
        issueDate,
        serviceDate: issueDate,
        currency: "EUR",
        language: invoice.language,
        taxMode: invoice.taxMode,
        senderLegalName: invoice.senderLegalName,
        senderStreet: invoice.senderStreet,
        senderPostalCode: invoice.senderPostalCode,
        senderCity: invoice.senderCity,
        senderCountryCode: invoice.senderCountryCode,
        senderEmail: invoice.senderEmail,
        senderPhone: invoice.senderPhone,
        senderVatId: invoice.senderVatId,
        senderTaxNumber: invoice.senderTaxNumber,
        senderIsKleinunternehmer: invoice.senderIsKleinunternehmer,
        senderIban: invoice.senderIban,
        senderBic: invoice.senderBic,
        senderBankName: invoice.senderBankName,
        recipientDisplayName: invoice.recipientDisplayName,
        recipientCompanyName: invoice.recipientCompanyName,
        recipientStreet: invoice.recipientStreet,
        recipientPostalCode: invoice.recipientPostalCode,
        recipientCity: invoice.recipientCity,
        recipientCountryCode: invoice.recipientCountryCode,
        recipientEmail: invoice.recipientEmail,
        recipientPhone: invoice.recipientPhone,
        recipientVatId: invoice.recipientVatId,
        contactId: invoice.contactId,
        netTotal: invoice.netTotal,
        vatTotal: invoice.vatTotal,
        grossTotal: invoice.grossTotal,
        paymentTermDays: invoice.paymentTermDays,
        dueDate,
        note: invoice.note,
        items: {
          createMany: {
            data: invoice.items.map((item) => ({
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

    return created({ invoice: serializeInvoice(duplicated) });
  } catch (error) {
    return serverError(error);
  }
}
