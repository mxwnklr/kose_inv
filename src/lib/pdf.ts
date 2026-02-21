import { chromium } from "playwright";
import type { ExportInvoiceModel } from "@/lib/invoice-model";
import { renderInvoiceHtml } from "@/lib/invoice-html";

export async function generateInvoicePdf(invoice: ExportInvoiceModel): Promise<Buffer> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1240, height: 1754 }
    });

    await page.setContent(renderInvoiceHtml(invoice), {
      waitUntil: "networkidle"
    });

    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "16mm",
        right: "14mm",
        bottom: "16mm",
        left: "14mm"
      }
    });
  } finally {
    await browser.close();
  }
}
