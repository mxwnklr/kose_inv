import { prisma } from "@/lib/prisma";
import { badRequest, ok, serverError } from "@/lib/http";
import { parseBusinessProfile } from "@/lib/parsers";

export async function GET() {
  try {
    const profile = await prisma.businessProfile.findFirst({
      orderBy: { createdAt: "asc" }
    });

    if (!profile) {
      return ok({
        profile: null
      });
    }

    return ok({ profile });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profile = parseBusinessProfile(body);

    if (!profile.legalName || !profile.email) {
      return badRequest("legalName and email are required");
    }

    const existing = await prisma.businessProfile.findFirst({
      orderBy: { createdAt: "asc" }
    });

    const upserted = existing
      ? await prisma.businessProfile.update({
          where: { id: existing.id },
          data: profile
        })
      : await prisma.businessProfile.create({ data: profile });

    return ok({ profile: upserted });
  } catch (error) {
    return serverError(error);
  }
}
