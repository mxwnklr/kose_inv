import { prisma } from "@/lib/prisma";
import { notFound, serverError } from "@/lib/http";
import { getInvoiceModel } from "@/lib/invoices";
import { generateInvoicePdf } from "@/lib/pdf";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, context: Params) {
  try {
    const { id } = await context.params;
    const invoice = await getInvoiceModel(id);

    if (!invoice) {
      return notFound("Invoice not found");
    }

    const pdfBuffer = await generateInvoicePdf(invoice);

    await prisma.invoiceExport.create({
      data: {
        invoiceId: id,
        kind: "pdf",
        validationState: "passed",
        validationLog: "PDF export created"
      }
    });

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`
      }
    });
  } catch (error) {
    return serverError(error);
  }
}
