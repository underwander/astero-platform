import { prisma } from "@/lib/prisma";
import { ensureSupportMessagesTable } from "@/lib/support-messages";
import { supportErrorMessage } from "@/lib/support-errors";
import { randomUUID } from "crypto";

type SupportMessageRow = {
  id: string;
  userId: string;
  message: string;
  sender: string | null;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  attachmentBase64: string | null;
  createdAt: Date;
};

type SupportConversationRow = {
  status: string;
  closedAt: Date | null;
};

export async function GET(req: Request) {
  try {
    await ensureSupportMessagesTable();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "UserId required" }, { status: 400 });
    }

    const conversation = await prisma.$queryRaw<SupportConversationRow[]>`
      SELECT "status", "closedAt"
      FROM "SupportConversation"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;

    const currentConversation = conversation[0] || { status: "OPEN", closedAt: null };

    if (currentConversation.status === "CLOSED") {
      return Response.json(
        { status: "CLOSED", messages: [] },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const messages = await prisma.$queryRaw<SupportMessageRow[]>`
      SELECT "id", "userId", "message", "sender", "attachmentName", "attachmentMimeType", "attachmentBase64", "createdAt"
      FROM "SupportMessage"
      WHERE "userId" = ${userId}
      AND (${currentConversation.closedAt}::timestamptz IS NULL OR "createdAt" > ${currentConversation.closedAt})
      ORDER BY "createdAt" ASC
    `;

    return Response.json({ status: currentConversation.status, messages }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Support load failed", details: supportErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureSupportMessagesTable();

    const { userId, message, attachment } = await req.json();
    const text = String(message || "").trim();
    const attachmentName = attachment?.name ? String(attachment.name).slice(0, 180) : null;
    const attachmentMimeType = attachment?.mimeType ? String(attachment.mimeType).slice(0, 120) : null;
    const attachmentBase64 = attachment?.base64 ? String(attachment.base64) : null;

    if (!userId || (!text && !attachmentBase64)) {
      return Response.json({ error: "UserId and message or image required" }, { status: 400 });
    }

    if (attachmentBase64 && (!attachmentMimeType?.startsWith("image/") || attachmentBase64.length > 6_500_000)) {
      return Response.json({ error: "Only images up to 5MB are supported" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return Response.json({ error: "Client not found. Please log in again." }, { status: 404 });
    }

    if (user.role === "ADMIN" || user.role === "MANAGER") {
      return Response.json(
        { error: "Open Support from a client account, not an admin account." },
        { status: 403 }
      );
    }

    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "SupportConversation" ("userId", "status", "createdAt", "updatedAt", "closedAt")
      VALUES (${userId}, 'OPEN', NOW(), NOW(), NULL)
      ON CONFLICT ("userId")
      DO UPDATE SET "status" = 'OPEN', "updatedAt" = NOW()
    `;

    const created = await prisma.$queryRaw<SupportMessageRow[]>`
      INSERT INTO "SupportMessage" ("id", "userId", "message", "sender", "fromRole", "attachmentName", "attachmentMimeType", "attachmentBase64")
      VALUES (${id}, ${userId}, ${text}, 'CLIENT', 'CLIENT', ${attachmentName}, ${attachmentMimeType}, ${attachmentBase64})
      RETURNING "id", "userId", "message", "sender", "attachmentName", "attachmentMimeType", "attachmentBase64", "createdAt"
    `;

    const conversation = await prisma.$queryRaw<SupportConversationRow[]>`
      SELECT "status", "closedAt"
      FROM "SupportConversation"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;
    const currentConversation = conversation[0] || { status: "OPEN", closedAt: null };
    const managerMessages = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count
      FROM "SupportMessage"
      WHERE "userId" = ${userId}
      AND "sender" = 'ADMIN'
      AND (${currentConversation.closedAt}::timestamptz IS NULL OR "createdAt" > ${currentConversation.closedAt})
    `;

    if (Number(managerMessages[0]?.count || 0) === 0) {
      const botId = randomUUID();
      const botText = buildBotReply(text, Boolean(attachmentBase64));
      await prisma.$executeRaw`
        INSERT INTO "SupportMessage" ("id", "userId", "message", "sender", "fromRole")
        VALUES (${botId}, ${userId}, ${botText}, 'BOT', 'BOT')
      `;
    }

    return Response.json(created[0], {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Support send failed", details: supportErrorMessage(error) },
      { status: 500 }
    );
  }
}

function buildBotReply(text: string, hasAttachment: boolean) {
  const lower = text.toLowerCase();

  if (hasAttachment) {
    return pickReply([
      "Спасибо, изображение получил. Я прикрепил его к обращению. Если можете, добавьте пару слов, что именно на скриншоте нужно проверить.",
      "Файл на месте. Я передам его менеджеру вместе с вашим сообщением. Если вопрос срочный, напишите сумму, дату или номер операции.",
    ]);
  }

  if (hasAny(lower, ["привет", "здравств", "добрый", "hello", "hi"])) {
    return pickReply([
      "Здравствуйте. Я виртуальный помощник Astero. Опишите вопрос, а я помогу сориентироваться и передам детали менеджеру.",
      "Добрый день. Я на связи. Напишите, что нужно проверить: счет, вывод, пополнение, терминал или документы.",
    ]);
  }

  if (hasAny(lower, ["вывод", "снять", "снятие", "withdraw", "withdrawal"])) {
    return pickReply([
      "Понял, вопрос по выводу средств. Укажите сумму, способ вывода и дату заявки. Менеджер проверит статус и вернется с ответом.",
      "По выводу: проверьте, пожалуйста, что профиль заполнен и реквизиты указаны корректно. Я уже передаю обращение менеджеру.",
      "Если вывод задерживается, напишите сумму и примерное время создания заявки. Так менеджер быстрее найдет операцию.",
    ]);
  }

  if (hasAny(lower, ["пополн", "депозит", "deposit", "платеж", "оплат"])) {
    return pickReply([
      "Понял, вопрос по пополнению. Напишите сумму, способ оплаты и приложите скриншот платежа, если он уже был отправлен.",
      "По депозиту: если платеж прошел, но баланс не изменился, укажите время платежа и последние цифры карты/кошелька.",
      "Я передам вопрос менеджеру. Чтобы ускорить проверку, добавьте сумму пополнения и выбранный способ оплаты.",
    ]);
  }

  if (hasAny(lower, ["сделк", "ордер", "позици", "trade", "order", "profit", "loss", "убыт", "прибыл"])) {
    return pickReply([
      "По сделке лучше указать инструмент, время открытия, объем и что именно нужно проверить. Я передам эти детали менеджеру.",
      "Понял, вопрос по торговой операции. Напишите символ пары/актива и время сделки, чтобы менеджер быстрее проверил расчет.",
      "Если речь о прибыли или убытке, приложите скриншот позиции. Это поможет быстрее разобраться.",
    ]);
  }

  if (hasAny(lower, ["терминал", "график", "котиров", "цена", "terminal", "chart", "quote", "price"])) {
    return pickReply([
      "Понял, вопрос по терминалу. Уточните инструмент и что именно отличается: цена, график, открытие сделки или закрытие.",
      "По котировкам: напишите символ инструмента и текущую цену, которую видите. Менеджер сверит настройки.",
      "Если график отображается некорректно, обновите страницу и напишите, сохраняется ли проблема. Я передам обращение дальше.",
    ]);
  }

  if (hasAny(lower, ["вериф", "документ", "паспорт", "kyc", "verification"])) {
    return pickReply([
      "По верификации: убедитесь, что документ читаемый, без бликов и обрезанных краев. Если уже отправили, менеджер проверит статус.",
      "Если документ не принимается, приложите скриншот ошибки. Я передам его специалисту по верификации.",
      "Понял, вопрос по документам. Напишите тип документа и когда вы его отправляли.",
    ]);
  }

  if (hasAny(lower, ["пароль", "войти", "логин", "доступ", "password", "login"])) {
    return pickReply([
      "Если проблема со входом, проверьте почту и пароль. Если пароль не подходит, менеджер сможет помочь со сменой доступа.",
      "Понял, вопрос по доступу. Напишите почту аккаунта и что именно происходит при входе.",
      "Если страница не пускает в кабинет, попробуйте обновить браузер и повторить вход. Я передам вопрос менеджеру.",
    ]);
  }

  if (hasAny(lower, ["профиль", "данные", "почта", "телефон", "profile", "email"])) {
    return pickReply([
      "По профилю: напишите, какие данные нужно проверить или изменить. Менеджер подскажет дальнейшие действия.",
      "Понял, вопрос по данным аккаунта. Уточните, что именно нужно обновить: телефон, почту, страну или адрес.",
    ]);
  }

  if (hasAny(lower, ["спасибо", "благодар", "ок", "понял", "thanks", "thank"])) {
    return pickReply([
      "Пожалуйста. Я оставлю обращение открытым, чтобы менеджер мог подключиться при необходимости.",
      "Рад помочь. Если появятся дополнительные детали, просто напишите сюда.",
    ]);
  }

  if (hasAny(lower, ["срочно", "быстро", "urgent", "важно"])) {
    return pickReply([
      "Понял, что вопрос срочный. Я пометил обращение как важное по смыслу сообщения. Напишите, пожалуйста, сумму/инструмент/дату, если это относится к операции.",
      "Принял. Чтобы менеджер быстрее разобрался, добавьте ключевые детали: что произошло, когда и на каком счете.",
    ]);
  }

  return pickReply([
    "Я принял сообщение и передал его менеджеру. Напишите, пожалуйста, чуть подробнее, что именно нужно проверить.",
    "Понял вас. Чтобы менеджер быстрее помог, добавьте детали: сумма, дата, инструмент или скриншот, если он есть.",
    "Спасибо, сообщение получено. Я пока на связи и помогу собрать информацию для менеджера.",
    "Я записал обращение. Опишите ситуацию одним-двумя предложениями подробнее, и менеджер сможет быстрее ответить.",
  ]);
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function pickReply(replies: string[]) {
  return replies[Math.floor(Math.random() * replies.length)];
}
