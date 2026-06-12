import { prisma } from "@/lib/prisma";
import { ensureManualQuotesTable } from "@/lib/manual-quotes";

export async function GET() {
  try {
    await ensureManualQuotesTable();

    const quotes = await prisma.manualQuote.findMany({
      orderBy: {
        symbol: "asc",
      },
    });

    return Response.json(quotes);
  } catch (error) {
    console.error("Manual quotes get error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureManualQuotesTable();

    const { symbol, price, enabled } = await req.json();

    if (!symbol || price === undefined || price === null) {
      return Response.json(
        { error: "Symbol and price required" },
        { status: 400 }
      );
    }

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return Response.json(
        { error: "Invalid price" },
        { status: 400 }
      );
    }

    const quote = await prisma.manualQuote.upsert({
      where: {
        symbol,
      },
      update: {
        price: numericPrice,
        enabled: typeof enabled === "boolean" ? enabled : true,
      },
      create: {
        symbol,
        price: numericPrice,
        enabled: typeof enabled === "boolean" ? enabled : true,
      },
    });

    return Response.json(quote);
  } catch (error) {
    console.error("Manual quotes patch error:", error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
