import { prisma } from "@/lib/prisma";
import { isAuthResponse, resolveScopedUserId } from "@/lib/api-auth";

function normalizeProfileField(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scoped = await resolveScopedUserId(searchParams.get("userId"), { allowStaffAccess: true });

    if (isAuthResponse(scoped)) return scoped;

    const user = await prisma.user.findUnique({
      where: {
        id: scoped.userId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        country: true,
        city: true,
        address: true,
        balance: true,
        role: true,
        isBlocked: true,
        kycStatus: true,
        createdAt: true,
        verificationDocs: {
          select: {
            id: true,
            type: true,
            documentType: true,
            fileName: true,
            fileUrl: true,
            mimeType: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return Response.json({
      ...user,
      verificationDocuments: user.verificationDocs || [],
    });
  } catch (error) {
    console.error("User profile error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const {
      userId,
      firstName,
      lastName,
      phone,
      country,
      city,
      address,
    } = await req.json();
    const scoped = await resolveScopedUserId(userId, { allowStaffAccess: true });

    if (isAuthResponse(scoped)) return scoped;

    const user = await prisma.user.update({
      where: {
        id: scoped.userId,
      },
      data: {
        firstName: normalizeProfileField(firstName),
        lastName: normalizeProfileField(lastName),
        phone: normalizeProfileField(phone),
        country: normalizeProfileField(country),
        city: normalizeProfileField(city),
        address: normalizeProfileField(address),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        country: true,
        city: true,
        address: true,
        balance: true,
        role: true,
        isBlocked: true,
        kycStatus: true,
        createdAt: true,
      },
    });

    return Response.json(user);
  } catch (error) {
    console.error("User profile update error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
