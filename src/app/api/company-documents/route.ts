import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const documents = await prisma.companyDocument.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(documents);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
