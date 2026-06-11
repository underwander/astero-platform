import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;

    if (!documentId) {
      return Response.json({ error: "Missing documentId" }, { status: 400 });
    }

    const document = await prisma.verificationDocument.findUnique({
      where: { id: documentId },
      select: {
        fileName: true,
        fileUrl: true,
        mimeType: true,
        contentBase64: true,
      },
    });

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    const contentBase64 =
      document.contentBase64 || document.fileUrl.match(/^data:[^;]+;base64,(.+)$/)?.[1];

    if (!contentBase64) {
      return Response.json({ error: "Document file is empty" }, { status: 404 });
    }

    const mimeType = document.mimeType || document.fileUrl.match(/^data:([^;]+);base64,/)?.[1] || "application/octet-stream";
    const fileName = encodeURIComponent(document.fileName || "document");
    const fileBuffer = Buffer.from(contentBase64, "base64");

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename*=UTF-8''${fileName}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Verification document view error:", error);

    return Response.json({ error: "Server error" }, { status: 500 });
  }
}