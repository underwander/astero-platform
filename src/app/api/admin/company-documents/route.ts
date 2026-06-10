import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const documents = await prisma.companyDocument.findMany({
      orderBy: { createdAt: "desc" },
    });

    return Response.json(documents);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const title = String(formData.get("title") || "");
    const category = String(formData.get("category") || "General");
    const file = formData.get("file");

    if (!title || !(file instanceof File)) {
      return Response.json({ error: "Title and file required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const contentBase64 = Buffer.from(bytes).toString("base64");

    const document = await prisma.companyDocument.create({
      data: {
        title,
        category,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        contentBase64,
        isPublished: true,
      },
    });

    return Response.json(document);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { documentId, isPublished } = await req.json();

    if (!documentId || typeof isPublished !== "boolean") {
      return Response.json({ error: "DocumentId and isPublished required" }, { status: 400 });
    }

    const document = await prisma.companyDocument.update({
      where: { id: documentId },
      data: { isPublished },
    });

    return Response.json(document);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
