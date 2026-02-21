# Local Invoice Studio

Attio-inspired, local-first invoice web app for the German market with:

- DE/EN UI toggle
- Netto/Brutto line handling
- VAT logic (19/7/0 + Kleinunternehmer §19 mode)
- Contacts storage
- Invoice history + duplicate flow
- PDF export (server HTML -> PDF)
- XRechnung XML export with strict validation gate

## Stack

- Next.js App Router + TypeScript
- Prisma + SQLite
- Tailwind CSS
- Playwright (for PDF generation)

## Quick Start

1. Install dependencies

```bash
bun install
```

2. Create environment file

```bash
cp .env.example .env
```

3. Generate Prisma client

```bash
bunx prisma generate
```

4. Initialize SQLite database

```bash
# Preferred (if prisma migrate works in your env)
bunx prisma migrate dev --name init

# Fallback (used in this environment)
sqlite3 prisma/dev.db < prisma/init.sql
```

5. Start development server

```bash
bun run dev
```

App: `http://localhost:3000`

## XRechnung Validation Setup

Set `XRECHNUNG_VALIDATION_COMMAND` in `.env`.

The command **must** include `{xml}` placeholder. Optional `{reportDir}` can be used if your validator writes reports.

Example:

```bash
XRECHNUNG_VALIDATION_COMMAND="java -jar /path/to/validationtool-standalone.jar -s /path/to/scenarios.xml -o {reportDir} {xml}"
```

Behavior:

- Validation pass: XML is downloadable.
- Validation fail/unavailable: API returns `422` with validator logs; no compliant export.

## API Overview

- `GET|POST /api/business-profile`
- `GET|POST /api/contacts`
- `PATCH|DELETE /api/contacts/:id`
- `GET|POST /api/invoices`
- `GET|PATCH /api/invoices/:id`
- `POST /api/invoices/:id/duplicate`
- `POST /api/invoices/:id/export/pdf`
- `POST /api/invoices/:id/export/xrechnung`

## Quality Checks

```bash
bun run test
bun run lint
bun run build
```

Current tests cover core calculation and invoice number parsing.
