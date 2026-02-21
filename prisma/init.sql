PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "BusinessProfile" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "legalName" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL DEFAULT 'DE',
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "vatId" TEXT,
  "taxNumber" TEXT,
  "isKleinunternehmer" BOOLEAN NOT NULL DEFAULT 0,
  "iban" TEXT NOT NULL,
  "bic" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "defaultPaymentDays" INTEGER NOT NULL DEFAULT 14,
  "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Contact" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "displayName" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL DEFAULT 'DE',
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "vatId" TEXT,
  "languagePreference" TEXT NOT NULL DEFAULT 'de',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "issueDate" DATETIME NOT NULL,
  "serviceDate" DATETIME NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "language" TEXT NOT NULL DEFAULT 'de',
  "taxMode" TEXT NOT NULL DEFAULT 'standard',
  "senderLegalName" TEXT NOT NULL,
  "senderStreet" TEXT NOT NULL,
  "senderPostalCode" TEXT NOT NULL,
  "senderCity" TEXT NOT NULL,
  "senderCountryCode" TEXT NOT NULL,
  "senderEmail" TEXT NOT NULL,
  "senderPhone" TEXT NOT NULL,
  "senderVatId" TEXT,
  "senderTaxNumber" TEXT,
  "senderIsKleinunternehmer" BOOLEAN NOT NULL DEFAULT 0,
  "senderIban" TEXT NOT NULL,
  "senderBic" TEXT NOT NULL,
  "senderBankName" TEXT NOT NULL,
  "recipientDisplayName" TEXT NOT NULL,
  "recipientCompanyName" TEXT NOT NULL,
  "recipientStreet" TEXT NOT NULL,
  "recipientPostalCode" TEXT NOT NULL,
  "recipientCity" TEXT NOT NULL,
  "recipientCountryCode" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "recipientPhone" TEXT NOT NULL,
  "recipientVatId" TEXT,
  "netTotal" DECIMAL NOT NULL DEFAULT 0,
  "vatTotal" DECIMAL NOT NULL DEFAULT 0,
  "grossTotal" DECIMAL NOT NULL DEFAULT 0,
  "paymentTermDays" INTEGER NOT NULL DEFAULT 14,
  "dueDate" DATETIME NOT NULL,
  "note" TEXT NOT NULL,
  "contactId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invoice_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice" ("invoiceNumber");

CREATE TABLE IF NOT EXISTS "InvoiceItem" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL NOT NULL,
  "unit" TEXT NOT NULL,
  "unitPriceInput" DECIMAL NOT NULL,
  "priceInputMode" TEXT NOT NULL DEFAULT 'net',
  "vatRate" INTEGER NOT NULL,
  "lineNet" DECIMAL NOT NULL,
  "lineVat" DECIMAL NOT NULL,
  "lineGross" DECIMAL NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "InvoiceExport" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "validationState" TEXT NOT NULL DEFAULT 'unavailable',
  "validationLog" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceExport_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
