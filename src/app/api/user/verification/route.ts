import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const userId = String(formData.get("userId") || "");
    const documentType = String(formData.get("documentType") || "Identity document");
    const file = formData.get("file");

    if (!userId || !(file instanceof File)) {
      return Response.json({ error: "UserId and file required" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: "File is too large. Max 5MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const document = await prisma.verificationDocument.create({
      data: {
        userId,
        documentType,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        contentBase64: buffer.toString("base64"),
      },
    });

    await prisma.user.update({ where: { id: userId }, data: { kycStatus: "PENDING" } });

    return Response.json({ id: document.id, status: document.status });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
