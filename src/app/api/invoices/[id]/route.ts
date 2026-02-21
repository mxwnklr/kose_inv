import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok, serverError } from "@/lib/http";
import { parseInvoiceDraft } from "@/lib/parsers";
import { saveInvoiceDraft, serializeInvoice } from "@/lib/invoices";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Params) {
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

    return ok({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const draft = parseInvoiceDraft({ ...body, id });

    const exists = await prisma.invoice.findUnique({ where: { id } });
    if (!exists) {
      return notFound("Invoice not found");
    }

    if (!draft.sender.legalName || !draft.recipient.companyName) {
      return badRequest("sender and recipient details are required");
    }

    const invoice = await saveInvoiceDraft(draft);
    return ok({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    return serverError(error);
  }
}
