import { prisma } from "@/lib/prisma";
import { parseSequence } from "@/lib/invoice-number-core";

export { parseSequence } from "@/lib/invoice-number-core";

export async function nextInvoiceNumber(prefix: string, issueDate: Date): Promise<string> {
  const year = issueDate.getFullYear();
  const searchPrefix = `${prefix}${year}-`;

  const existing = await prisma.invoice.findMany({
    where: {
      invoiceNumber: {
        startsWith: searchPrefix
      }
    },
    select: {
      invoiceNumber: true
    }
  });

  const next =
    existing.reduce((max, entry) => Math.max(max, parseSequence(entry.invoiceNumber)), 0) + 1;

  return `${searchPrefix}${String(next).padStart(4, "0")}`;
}
