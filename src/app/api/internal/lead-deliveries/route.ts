import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serverConfig } from "@/config/server";
import { createLeadService } from "@/modules/leads/composition";

export const runtime = "nodejs";

function authorized(request: Request) {
  const secret = serverConfig.integrations.cronSecret;
  if (!secret) return false;
  const received = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  if (!serverConfig.integrations.cronSecret) {
    return NextResponse.json({ message: "Обработчик не настроен" }, { status: 503 });
  }
  if (!authorized(request)) return NextResponse.json({ message: "Доступ запрещён" }, { status: 401 });

  try {
    const result = await createLeadService().processPending(50);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[lead:delivery]", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "Не удалось обработать очередь" }, { status: 503 });
  }
}
