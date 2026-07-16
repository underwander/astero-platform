type SupportAiMessage = {
  message: string;
  sender: string | null;
};

type SupportIssueType =
  | "withdrawal"
  | "deposit"
  | "technical"
  | "account"
  | "verification"
  | "trading"
  | "partner"
  | "general";

const issueLabels: Record<SupportIssueType, string> = {
  withdrawal: "вывод средств",
  deposit: "пополнение счета",
  technical: "техническая проблема",
  account: "аккаунт и доступ",
  verification: "верификация",
  trading: "торговая операция",
  partner: "партнерская программа",
  general: "общий вопрос",
};

export function buildSupportBotReply(messages: SupportAiMessage[], hasAttachment: boolean) {
  const clientMessages = messages.filter((item) => item.sender === "CLIENT");
  const botMessages = messages.filter((item) => item.sender === "BOT");
  const lastClientMessage = clientMessages[clientMessages.length - 1]?.message || "";
  const combined = clientMessages.map((item) => item.message).join(" ").toLowerCase();
  const issueType = detectIssueType(combined);
  const missing = getMissingDetails(issueType, combined, hasAttachment);
  const alreadyAsked = botMessages.map((item) => item.message).join(" ").toLowerCase();

  if (clientMessages.length <= 1 && isVague(lastClientMessage)) {
    return "Здравствуйте! Я виртуальный помощник Astero. Я помогу подготовить обращение для менеджера. Пожалуйста, опишите подробнее, что именно произошло и в каком разделе кабинета возник вопрос.";
  }

  if (hasAttachment && !alreadyAsked.includes("что именно нужно проверить")) {
    return "Файл получил и прикрепил к обращению. Уточните, пожалуйста, что именно нужно проверить на изображении или в документе.";
  }

  const nextQuestion = missing.find((question) => !alreadyAsked.includes(question.marker));
  if (nextQuestion) {
    return nextQuestion.text;
  }

  if (!alreadyAsked.includes("зафиксировал информацию")) {
    return `Спасибо. Я зафиксировал обращение по теме "${issueLabels[issueType]}" и передал его менеджеру. Пожалуйста, ожидайте ответа специалиста. Как только менеджер подключится, он продолжит общение в этом чате.`;
  }

  return "Информация добавлена к обращению. Если есть дополнительные детали, сумма, дата операции, номер заявки или скриншот, отправьте их сюда, менеджер увидит все в этом чате.";
}

function detectIssueType(text: string): SupportIssueType {
  if (hasAny(text, ["вывод", "снятие", "withdraw", "withdrawal", "реквизит"])) return "withdrawal";
  if (hasAny(text, ["пополн", "депозит", "deposit", "оплат", "платеж", "карта", "крипт"])) return "deposit";
  if (hasAny(text, ["терминал", "график", "котиров", "цена", "ошибка", "не работает", "завис", "technical", "bug"])) return "technical";
  if (hasAny(text, ["пароль", "логин", "войти", "доступ", "аккаунт", "почта", "password", "login"])) return "account";
  if (hasAny(text, ["вериф", "kyc", "документ", "паспорт", "адрес"])) return "verification";
  if (hasAny(text, ["сделк", "ордер", "позици", "прибыл", "убыт", "buy", "sell", "trade", "order"])) return "trading";
  if (hasAny(text, ["партнер", "affiliate", "реферал", "комисси"])) return "partner";
  return "general";
}

function getMissingDetails(issueType: SupportIssueType, text: string, hasAttachment: boolean) {
  const common = [
    { marker: "когда возникла", text: "Когда возникла проблема? Укажите примерное время и дату, чтобы менеджер быстрее нашел событие." },
  ];

  if (issueType === "withdrawal") {
    return [
      { marker: "сумму вывода", text: "Укажите, пожалуйста, сумму вывода, способ вывода и дату создания заявки." },
      { marker: "статус заявки", text: "Какой статус сейчас отображается у заявки на вывод средств?" },
      ...common,
    ].filter((item) => needsQuestion(item.marker, text));
  }

  if (issueType === "deposit") {
    return [
      { marker: "сумму пополнения", text: "Укажите сумму пополнения, способ оплаты и время платежа." },
      { marker: "подтверждение платежа", text: hasAttachment ? "Спасибо, подтверждение вижу. Уточните, зачислились ли средства на баланс?" : "Если платеж уже был отправлен, прикрепите скриншот или квитанцию оплаты." },
      ...common,
    ].filter((item) => needsQuestion(item.marker, text));
  }

  if (issueType === "technical") {
    return [
      { marker: "какие действия", text: "Какие действия вы выполняли перед появлением проблемы?" },
      { marker: "появляется ли ошибка", text: "Появляется ли текст ошибки? Если да, отправьте его или приложите скриншот." },
      { marker: "устройство и браузер", text: "С какого устройства и браузера вы заходите: телефон, компьютер, Safari, Chrome или другое?" },
    ].filter((item) => needsQuestion(item.marker, text));
  }

  if (issueType === "trading") {
    return [
      { marker: "символ инструмента", text: "Укажите символ инструмента, тип сделки, объем и примерное время открытия или закрытия." },
      { marker: "номер сделки", text: "Если видите номер сделки или заявки, отправьте его сюда." },
      ...common,
    ].filter((item) => needsQuestion(item.marker, text));
  }

  if (issueType === "verification") {
    return [
      { marker: "какой документ", text: "Какой документ вы отправляли на проверку и когда он был загружен?" },
      { marker: "статус верификации", text: "Какой статус верификации отображается сейчас в личном кабинете?" },
    ].filter((item) => needsQuestion(item.marker, text));
  }

  if (issueType === "account") {
    return [
      { marker: "почту аккаунта", text: "Укажите почту аккаунта и что именно происходит при входе или изменении данных." },
      { marker: "текст ошибки", text: "Если появляется ошибка, отправьте ее текст или скриншот." },
    ].filter((item) => needsQuestion(item.marker, text));
  }

  return [
    { marker: "подробнее", text: "Опишите, пожалуйста, подробнее: что произошло, где именно в кабинете и какой результат вы ожидали увидеть." },
    ...common,
  ].filter((item) => needsQuestion(item.marker, text));
}

function isVague(text: string) {
  const normalized = text.trim().toLowerCase();
  return normalized.length < 18 || ["проблема", "у меня проблема", "не работает", "помогите", "help"].includes(normalized);
}

function needsQuestion(marker: string, text: string) {
  const words = marker.split(" ");
  return !words.some((word) => text.includes(word));
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}
