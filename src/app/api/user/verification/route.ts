import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const userId = String(formData.get("userId") || "");
    const documentType = String(formData.get("documentType") || "DOCUMENT");
    const file = formData.get("file") as File | null;

    if (!userId || !file) {
      return Response.json(
        { error: "Missing userId or file" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentBase64 = buffer.toString("base64");
    const mimeType = file.type || "application/octet-stream";

    const document = await prisma.verificationDocument.create({
      data: {
        userId,
        type: documentType,
        documentType,
        fileName: file.name,
        mimeType,
        contentBase64,
        fileUrl: `data:${mimeType};base64,${contentBase64}`,
        status: "PENDING",
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: "PENDING" },
    });

    return Response.json(document);
  } catch (error) {
    console.error("Verification upload error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}