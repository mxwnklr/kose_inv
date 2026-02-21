import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok, serverError } from "@/lib/http";
import { parseContact } from "@/lib/parsers";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const contact = parseContact(body);

    const exists = await prisma.contact.findUnique({ where: { id } });
    if (!exists) {
      return notFound("Contact not found");
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: contact
    });

    return ok({ contact: updated });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_: Request, context: Params) {
  try {
    const { id } = await context.params;

    const exists = await prisma.contact.findUnique({ where: { id } });
    if (!exists) {
      return badRequest("Contact not found");
    }

    await prisma.contact.delete({ where: { id } });

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
