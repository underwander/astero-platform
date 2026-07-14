"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { clientAgreementEn, clientAgreementRu } from "@/components/broker/legalDocumentContent";

type Lang = "ru" | "en";

type LocalizedDocument = {
  id: string;
  title: Record<Lang, string>;
  heading: Record<Lang, string>;
  text: Record<Lang, string>;
};

const documents: LocalizedDocument[] = [
  {
    id: "aml",
    title: { ru: "AML", en: "AML" },
    heading: { ru: "Политика противодействия отмыванию денег (AML)", en: "Anti-Money Laundering Policy (AML)" },
    text: {
      ru: `Политика противодействия отмыванию денег (AML)
Astero придерживается процедур, направленных на предотвращение использования платформы для отмывания денег, финансирования терроризма или иной незаконной деятельности.

1. Основные принципы
Мы соблюдаем международные финансовые стандарты, проверяем подозрительные операции и можем запрашивать дополнительную информацию о происхождении средств.

2. Платежи третьих лиц
Пополнения и выводы должны выполняться только с использованием платежных средств, принадлежащих владельцу аккаунта.

3. Мониторинг операций
Astero может временно ограничить операции, если активность клиента требует дополнительной проверки.

4. Вывод средств
Средства выводятся на тот же платежный метод, который использовался для пополнения, если иной порядок не согласован отдельно.`,
      en: `Anti-Money Laundering Policy (AML)
Astero follows procedures designed to prevent the use of the platform for money laundering, terrorism financing or other unlawful activity.

1. Core principles
We follow international financial standards, review suspicious transactions and may request additional information about the source of funds.

2. Third-party payments
Deposits and withdrawals must be made only with payment methods owned by the account holder.

3. Transaction monitoring
Astero may temporarily restrict operations when client activity requires additional review.

4. Withdrawals
Funds are generally withdrawn to the same payment method used for funding unless another method is separately approved.`,
    },
  },
  {
    id: "kyc",
    title: { ru: "KYC", en: "KYC" },
    heading: { ru: "Политика «Знай своего клиента» (KYC)", en: "Know Your Customer Policy (KYC)" },
    text: {
      ru: `Политика «Знай своего клиента» (KYC)
В соответствии с глобальными регуляторными нормами Astero использует процедуру KYC. Она необходима для подтверждения личности клиентов, предотвращения кражи данных и защиты финансовой системы.

1. Подтверждение личности
Клиент может предоставить один из документов:
• международный паспорт;
• водительское удостоверение;
• национальное удостоверение личности или ID-карту.

2. Подтверждение адреса
Клиент может предоставить документ, выданный не позднее 6 месяцев назад:
• счет за коммунальные услуги;
• банковскую выписку;
• налоговую справку или официальный документ с адресом.

3. Проверка платежных методов
При пополнении картой компания может запросить копию лицевой стороны карты с закрытыми средними цифрами.

4. Защита данных
Документы передаются по защищенному соединению и хранятся на защищенных серверах Astero.`,
      en: `Know Your Customer Policy (KYC)
In line with global regulatory standards, Astero uses KYC procedures to verify client identity, prevent identity theft and protect the financial system.

1. Proof of identity
A client may provide one of the following documents:
• international passport;
• driving licence;
• national identity card or ID document.

2. Proof of residence
A client may provide a document issued within the last 6 months:
• utility bill;
• bank statement;
• tax certificate or official document showing the address.

3. Payment method verification
When a card is used for funding, the company may request a masked copy of the front side of the card.

4. Data protection
Documents are transmitted through a secure connection and stored on protected Astero servers.`,
    },
  },
  {
    id: "agreement",
    title: { ru: "Соглашение", en: "Agreement" },
    heading: { ru: "Клиентское соглашение", en: "Client Agreement" },
    text: {
      ru: clientAgreementRu,
      en: clientAgreementEn,
    },
  },
  {
    id: "privacy",
    title: { ru: "Конфиденциальность", en: "Privacy" },
    heading: { ru: "Политика конфиденциальности", en: "Privacy Policy" },
    text: {
      ru: `Политика конфиденциальности
Astero («мы», «нас» или «наш») уважает вашу конфиденциальность и стремится защищать ваши персональные данные. Настоящая Политика конфиденциальности описывает, как мы собираем, используем и защищаем вашу информацию, когда вы пользуетесь нашим веб-сайтом и услугами.

1. Информация, которую мы собираем
Мы можем собирать следующие типы персональных данных:

Идентификационные данные: имя, фамилия, дата рождения.
Контактные данные: адрес электронной почты, номер телефона, физический адрес.
Финансовые данные: детали банковского счета, история транзакций (если применимо).
Технические данные: IP-адрес, тип браузера, данные о местоположении.

2. Как мы используем ваши данные
Мы используем ваши персональные данные для следующих целей:

Для предоставления и управления нашими финансовыми услугами и аналитикой.
Для соблюдения юридических и регуляторных обязательств (KYC/AML).
Для улучшения работы нашего веб-сайта и клиентского сервиса.
Для отправки вам уведомлений, рыночных сигналов и маркетинговой информации (с вашего согласия).

3. Защита данных
Мы применяем строгие меры безопасности, включая шифрование SSL, брандмауэры и системы контроля доступа, чтобы предотвратить несанкционированный доступ, потерю или изменение ваших персональных данных. Данные хранятся на защищенных серверах.

4. Передача данных третьим лицам
Мы не продаем ваши персональные данные. Мы можем делиться вашей информацией только с:

Надежными поставщиками услуг (IT, аналитика, платежные шлюзы).
Регуляторами и правоохранительными органами, если это требуется по закону.

5. Ваши права
Вы имеете право на доступ, исправление, удаление ваших данных, а также право на отзыв согласия на их обработку. Чтобы воспользоваться этими правами, свяжитесь с нами через страницу "Контакты".`,
      en: `Privacy Policy
Astero ("we", "us" or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use and protect your information when you use our website and services.

1. Information we collect
We may collect the following types of personal data:

Identification data: first name, last name, date of birth.
Contact data: email address, phone number, physical address.
Financial data: bank account details and transaction history, where applicable.
Technical data: IP address, browser type and location data.

2. How we use your data
We use your personal data for the following purposes:

To provide and manage our financial services and analytics.
To comply with legal and regulatory obligations, including KYC/AML.
To improve the performance of our website and client service.
To send you notifications, market signals and marketing information with your consent.

3. Data protection
We apply strict security measures, including SSL encryption, firewalls and access-control systems, to prevent unauthorised access, loss or alteration of your personal data. Data is stored on secure servers.

4. Sharing data with third parties
We do not sell your personal data. We may share your information only with:

Trusted service providers, including IT, analytics and payment-gateway providers.
Regulators and law-enforcement authorities, where required by law.

5. Your rights
You have the right to access, correct and delete your data, as well as the right to withdraw consent to its processing. To exercise these rights, contact us through the "Contacts" page.`,
    },
  },
  {
    id: "legal",
    title: { ru: "Правовая информация", en: "Legal information" },
    heading: { ru: "Правовая информация и регулирование", en: "Legal Information and Regulation" },
    text: {
      ru: `Правовая информация и регулирование
Astero стремится обеспечить максимальную прозрачность своей деятельности. Мы соблюдаем международные финансовые стандарты и требования регуляторов в юрисдикциях нашего присутствия.

Лицензирование
Astero действует как поставщик аналитических данных (FinTech Data Provider). В настоящее время Astero не выступает в роли брокера-дилера и не осуществляет клиринг клиентских средств. Мы предоставляем программные решения, инструменты аналитики и рыночные агрегации.

Борьба с отмыванием денег (AML)
Astero придерживается строгой политики противодействия легализации доходов, полученных преступным путем (AML), и правил «Знай своего клиента» (KYC). Мы оставляем за собой право запрашивать документы, подтверждающие личность, для использования определенных платных подписок.`,
      en: `Legal Information and Regulation
Astero is committed to transparency. We follow international financial standards and regulatory requirements in the jurisdictions where we operate.

Licensing
Astero operates as a FinTech Data Provider. At this time Astero does not act as a broker-dealer and does not clear client funds. We provide software solutions, analytical tools and market data aggregation.

Anti-Money Laundering (AML)
Astero follows strict AML and Know Your Customer (KYC) policies. We reserve the right to request identity documents for access to certain paid subscriptions or platform features.`,
    },
  },
  {
    id: "risk",
    title: { ru: "Риски", en: "Risks" },
    heading: { ru: "Уведомление о рисках", en: "Risk Disclosure" },
    text: {
      ru: `Уведомление о рисках
Операции на финансовых рынках связаны с высоким уровнем риска. Стоимость инструментов может быстро меняться под влиянием рыночных, политических, экономических и технических факторов.

Использование кредитного плеча может увеличить как потенциальную прибыль, так и потенциальный убыток. Клиент самостоятельно принимает торговые решения и несет ответственность за их результат.

Аналитические материалы Astero не являются индивидуальной инвестиционной рекомендацией. Прошлые результаты не гарантируют будущую доходность.`,
      en: `Risk Disclosure
Financial market operations involve a high level of risk. Instrument prices may change rapidly due to market, political, economic and technical factors.

Leverage may increase both potential profit and potential loss. The client makes trading decisions independently and is responsible for their results.

Astero analytical materials do not constitute personalized investment advice. Past performance does not guarantee future results.`,
    },
  },
];

export default function LegalDocumentsPanel() {
  const { language } = useLanguage();
  const [active, setActive] = useState<LocalizedDocument | null>(null);
  const lang: Lang = language === "en" ? "en" : "ru";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex flex-wrap gap-2 text-xs">
        {documents.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item)}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 font-black text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"
          >
            {item.title[lang]}
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="max-h-[82vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-emerald-200 bg-white text-slate-900 shadow-2xl dark:border-emerald-400/20 dark:bg-slate-950 dark:text-white">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950">
              <h2 className="text-lg font-black">{active.heading[lang]}</h2>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xl font-black leading-none text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-white"
                aria-label={lang === "ru" ? "Закрыть" : "Close"}
              >
                ×
              </button>
            </div>
            <div className="whitespace-pre-line p-5 text-sm leading-7 text-slate-600 dark:text-slate-300">{active.text[lang]}</div>
          </div>
        </div>
      )}
    </section>
  );
}
