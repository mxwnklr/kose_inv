export function parseSequence(invoiceNumber: string): number {
  const match = invoiceNumber.match(/-(\d{4})$/);
  if (!match) {
    return 0;
  }
  return Number(match[1]);
}

export function extractPrefix(invoiceNumber: string): string {
  const match = invoiceNumber.match(/^(.*?)(\d{4})-(\d{4})$/);
  return match?.[1] || "INV";
}
