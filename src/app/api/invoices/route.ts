import { prisma } from "@/lib/prisma";
import { badRequest, created, ok, serverError } from "@/lib/http";
import { parseInvoiceDraft } from "@/lib/parsers";
import { saveInvoiceDraft, serializeInvoice } from "@/lib/invoices";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

    const invoices = await prisma.invoice.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        items: true
      }
    });

    const filtered = q
      ? invoices.filter((invoice) => {
          const haystack = [
            invoice.invoiceNumber,
            invoice.recipientCompanyName,
            invoice.recipientDisplayName,
            invoice.status
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : invoices;

    return ok({ invoices: filtered.map((invoice) => serializeInvoice(invoice)) });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const draft = parseInvoiceDraft(body);

    if (!draft.sender.legalName || !draft.recipient.companyName) {
      return badRequest("sender and recipient details are required");
    }

    const invoice = await saveInvoiceDraft(draft);

    return created({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    return serverError(error);
  }
}
