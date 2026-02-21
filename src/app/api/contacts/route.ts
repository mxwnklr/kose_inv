import { prisma } from "@/lib/prisma";
import { badRequest, created, ok, serverError } from "@/lib/http";
import { parseContact } from "@/lib/parsers";

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { updatedAt: "desc" }
    });

    return ok({ contacts });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const contact = parseContact(body);

    if (!contact.companyName || !contact.displayName) {
      return badRequest("companyName and displayName are required");
    }

    const createdContact = await prisma.contact.create({
      data: contact
    });

    return created({ contact: createdContact });
  } catch (error) {
    return serverError(error);
  }
}
