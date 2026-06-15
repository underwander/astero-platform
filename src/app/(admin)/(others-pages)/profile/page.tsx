"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type VerificationDocument = {
  id: string;
  documentType?: string | null;
  fileName: string;
  status: string;
  createdAt: string;
};

type Profile = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  balance: number;
  role: string;
  kycStatus: string;
  verificationDocuments?: VerificationDocument[];
};

const inputClass =
  "h-12 w-full rounded-xl border border-emerald-100 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:text-slate-500 dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-900";

const fileInputClass =
  "w-full rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-4 text-sm text-slate-700 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:border-emerald-400 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-slate-200";

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [documentType, setDocumentType] = useState("Identity document");
  const [file, setFile] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function loadProfile() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      router.push("/login");
      return;
    }

    const res = await fetch(`/api/user/profile?userId=${userId}`, {
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Не удалось загрузить профиль");
      return;
    }

    setProfile({
      ...data,
      verificationDocuments: data.verificationDocuments || data.verificationDocs || [],
    });
  }

  async function saveProfile() {
    if (!profile) return;

    setMessage("Сохраняем данные...");

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        country: profile.country,
        city: profile.city,
        address: profile.address,
      }),
    });

    const data = await res.json();

    setMessage(res.ok ? "Профиль сохранен" : data.error || "Не удалось сохранить профиль");

    if (res.ok) {
      await loadProfile();
    }
  }

  async function uploadDocument() {
    if (!profile || !file) {
      setUploadMessage("Выберите файл для отправки");
      return;
    }

    const formData = new FormData();
    formData.append("userId", profile.id);
    formData.append("documentType", documentType);
    formData.append("file", file);

    setUploadMessage("Загружаем документ...");

    const res = await fetch("/api/user/verification", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setUploadMessage(res.ok ? "Документ отправлен на проверку" : data.error || "Не удалось отправить документ");

    if (res.ok) {
      setFile(null);
      await loadProfile();
    }
  }

  async function changePassword() {
    if (!profile) return;

    setPasswordMessage("Обновляем пароль...");

    const res = await fetch("/api/user/change-password", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: profile.id,
        currentPassword,
        newPassword,
      }),
    });

    const data = await res.json();

    setPasswordMessage(res.ok ? "Пароль изменен" : data.error || "Не удалось изменить пароль");

    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-88px)] rounded-xl border border-slate-200 bg-white p-6 text-sm font-bold text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
        Загрузка профиля...
      </div>
    );
  }

  const documents = profile.verificationDocuments || [];

  return (
    <div className="min-h-[calc(100vh-88px)] space-y-4 text-slate-950 dark:text-white">
      <div className="grid grid-cols-1 gap-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-5">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Профиль клиента</h1>
            </div>
            <StatusBadge status={profile.kycStatus} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Имя">
              <input
                value={profile.firstName || ""}
                onChange={(event) => setProfile({ ...profile, firstName: event.target.value })}
                className={inputClass}
                placeholder="Введите имя"
              />
            </Field>

            <Field label="Фамилия">
              <input
                value={profile.lastName || ""}
                onChange={(event) => setProfile({ ...profile, lastName: event.target.value })}
                className={inputClass}
                placeholder="Введите фамилию"
              />
            </Field>

            <Field label="Email">
              <input value={profile.email} disabled className={inputClass} />
            </Field>

            <Field label="Телефон">
              <input
                value={profile.phone || ""}
                onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                className={inputClass}
                placeholder="+380..."
              />
            </Field>

            <Field label="Страна">
              <input
                value={profile.country || ""}
                onChange={(event) => setProfile({ ...profile, country: event.target.value })}
                className={inputClass}
                placeholder="Страна проживания"
              />
            </Field>

            <Field label="Город">
              <input
                value={profile.city || ""}
                onChange={(event) => setProfile({ ...profile, city: event.target.value })}
                className={inputClass}
                placeholder="Город"
              />
            </Field>

            <Field label="Адрес" wide>
              <input
                value={profile.address || ""}
                onChange={(event) => setProfile({ ...profile, address: event.target.value })}
                className={inputClass}
                placeholder="Улица, дом, квартира"
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={saveProfile}
              className="h-12 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-500"
            >
              Сохранить профиль
            </button>

            {message && <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{message}</p>}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[430px_0.5fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="text-base font-black text-slate-900 dark:text-white">Верификация</h2>

          <div className="mt-4 space-y-4">
            <Field label="Тип документа">
              <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className={inputClass}>
                <option value="Identity document">Документ личности</option>
                <option value="Proof of address">Подтверждение адреса</option>
                <option value="Bank proof">Банковский документ</option>
              </select>
            </Field>

            <Field label="Файл документа">
              <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} className={fileInputClass} />
            </Field>

            <button
              onClick={uploadDocument}
              className="h-12 w-full rounded-xl bg-emerald-600 text-sm font-black text-white transition hover:bg-emerald-500"
            >
              Отправить документ
            </button>

            {uploadMessage && <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{uploadMessage}</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="border-b border-slate-100 p-4 dark:border-white/10">
            <h2 className="text-base font-black text-slate-900 dark:text-white">Загруженные документы</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">История документов, отправленных на проверку</p>
          </div>

          <div className="p-4">
            {documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-500 dark:border-white/10 dark:text-slate-400">
                Документы пока не загружены
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">{documentTypeLabel(doc.documentType)}</p>
                        <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{doc.fileName}</p>
                      </div>
                      <StatusBadge status={doc.status} small />
                    </div>
                    <p className="mt-3 text-xs font-bold text-slate-400">{new Date(doc.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <h2 className="text-base font-black text-slate-900 dark:text-white">Безопасность</h2>
        <div className="mt-4 max-w-xl space-y-4">
          <Field label="Текущий пароль">
            <input
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              type="password"
              className={inputClass}
              placeholder="Введите текущий пароль"
            />
          </Field>

          <Field label="Новый пароль">
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              className={inputClass}
              placeholder="Введите новый пароль"
            />
          </Field>

          <button
            onClick={changePassword}
            className="h-12 w-full rounded-xl bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            Изменить пароль
          </button>
        </div>
        {passwordMessage && <p className="mt-3 text-sm font-bold text-emerald-700 dark:text-emerald-300">{passwordMessage}</p>}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "md:col-span-2" : ""}>
      <span className="mb-2 block text-sm font-black text-slate-900 dark:text-white">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status, small = false }: { status: string; small?: boolean }) {
  const normalized = status || "PENDING";
  const className =
    normalized === "APPROVED" || normalized === "VERIFIED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300"
      : normalized === "REJECTED"
        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300"
        : "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-400/20 dark:bg-yellow-500/10 dark:text-yellow-300";

  return (
    <span className={`inline-flex shrink-0 rounded-full border font-black ${small ? "px-2 py-1 text-[10px]" : "px-3 py-1 text-xs"} ${className}`}>
      {statusLabel(normalized)}
    </span>
  );
}

function statusLabel(value: string) {
  if (value === "APPROVED" || value === "VERIFIED") return "Проверено";
  if (value === "REJECTED") return "Отклонено";
  if (value === "PENDING") return "На проверке";
  return value;
}

function documentTypeLabel(value?: string | null) {
  if (value === "Identity document") return "Документ личности";
  if (value === "Proof of address") return "Подтверждение адреса";
  if (value === "Bank proof") return "Банковский документ";
  return value || "Документ";
}
