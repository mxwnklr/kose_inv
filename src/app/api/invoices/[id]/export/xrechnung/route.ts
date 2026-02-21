import { prisma } from "@/lib/prisma";
import { notFound, serverError } from "@/lib/http";
import { buildXRechnungXml, validateXRechnung } from "@/lib/xrechnung";
import { getInvoiceModel } from "@/lib/invoices";

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

    const xml = buildXRechnungXml(invoice);
    const validation = await validateXRechnung(xml);

    await prisma.invoiceExport.create({
      data: {
        invoiceId: id,
        kind: "xrechnung",
        validationState: validation.state,
        validationLog: validation.log
      }
    });

    if (!validation.valid) {
      return Response.json(
        {
          message: "XRechnung validation failed",
          validation
        },
        { status: 422 }
      );
    }

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.xml"`
      }
    });
  } catch (error) {
    return serverError(error);
  }
}
