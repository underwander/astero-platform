import { createHmac } from "node:crypto";
import { after, NextResponse } from "next/server";
import { serverConfig } from "@/config/server";
import { leadSchema } from "@/features/lead-form/schema";
import { createLeadRateLimiter, createLeadService } from "@/modules/leads/composition";

export const runtime = "nodejs";
export const maxDuration = 15;

const MAX_BODY_SIZE = 24_000;
const WINDOW_MS = 10 * 60 * 1_000;
const WINDOW_SECONDS = WINDOW_MS / 1_000;
const MAX_REQUESTS = 5;

function response(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "no-store", ...Object.fromEntries(new Headers(headers)) } },
  );
}

function clientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || request.headers.get("cf-connecting-ip") || "unknown";
  return ip.slice(0, 128);
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return response("Неподдерживаемый формат запроса", 415);

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) return response("Запрос отклонён", 403);
    } catch {
      return response("Запрос отклонён", 403);
    }
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_SIZE) return response("Размер запроса превышен", 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return response("Некорректный запрос", 400);
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return response("Проверьте заполнение формы", 422);
  if (parsed.data.website) return response("Обращение принято", 200);

  const rateLimitSecret = serverConfig.security.rateLimitSecret;
  if (!rateLimitSecret) return response("Система приёма обращений временно не настроена.", 503);

  try {
    const keyHash = createHmac("sha256", rateLimitSecret).update(clientIdentifier(request)).digest("hex");
    const accepted = await createLeadRateLimiter().consume(keyHash, MAX_REQUESTS, WINDOW_SECONDS);
    if (!accepted) {
      return response("Слишком много обращений. Повторите попытку позже.", 429, {
        "Retry-After": String(WINDOW_SECONDS),
      });
    }

    const service = createLeadService();
    const result = await service.create(
      {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        telegram: parsed.data.telegram,
        country: parsed.data.country,
        message: parsed.data.message,
      },
      {
        userAgent: request.headers.get("user-agent"),
        referrer: request.headers.get("referer"),
      },
    );

    if (result.pendingDeliveries) {
      after(async () => {
        try {
          await service.processPending(result.pendingDeliveries);
        } catch (error) {
          console.error("[lead:delivery-after]", error instanceof Error ? error.name : "UnknownError");
        }
      });
    }

    return response("Обращение сохранено", 201);
  } catch (error) {
    console.error("[lead:create]", error instanceof Error ? error.name : "UnknownError");
    return response("Система приёма обращений временно недоступна. Повторите попытку позже.", 503);
  }
}
