"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

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

export default function ProfilePage() {
  const router = useRouter();
  const { t, language } = useLanguage();

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
      setMessage(data.error || "Profile error");
      return;
    }

    setProfile({
      ...data,
      verificationDocuments: data.verificationDocuments || data.verificationDocs || [],
    });
  }

  async function saveProfile() {
    if (!profile) return;

    setMessage(language === "ru" ? "Сохранение..." : "Saving...");

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

    setMessage(
      res.ok
        ? language === "ru"
          ? "Профиль сохранён"
          : "Profile saved"
        : data.error || "Error"
    );

    if (res.ok) {
      await loadProfile();
    }
  }

  async function uploadDocument() {
    if (!profile || !file) {
      setUploadMessage(language === "ru" ? "Выберите файл" : "Choose a file");
      return;
    }

    const formData = new FormData();
    formData.append("userId", profile.id);
    formData.append("documentType", documentType);
    formData.append("file", file);

    setUploadMessage(language === "ru" ? "Загрузка..." : "Uploading...");

    const res = await fetch("/api/user/verification", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setUploadMessage(
      res.ok
        ? language === "ru"
          ? "Документ отправлен на проверку"
          : "Document submitted for review"
        : data.error || "Upload error"
    );

    if (res.ok) {
      setFile(null);
      await loadProfile();
    }
  }

  async function changePassword() {
    if (!profile) return;

    setPasswordMessage(language === "ru" ? "Обновление..." : "Updating...");

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

    setPasswordMessage(
      res.ok
        ? language === "ru"
          ? "Пароль изменён"
          : "Password changed"
        : data.error || "Password error"
    );

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
      <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 dark:border-emerald-400/10 dark:bg-white/[0.04]">
        Loading...
      </div>
    );
  }

  const documents = profile.verificationDocuments || [];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-[#06130d] via-[#092016] to-emerald-950 p-5 text-white shadow-xl shadow-emerald-950/10 md:p-8">
        <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
          Astero profile
        </span>

        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
          {t("profile")}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/70">
          {language === "ru"
            ? "Личные данные, верификация документов и смена пароля."
            : "Personal data, document verification and password management."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04] xl:col-span-2">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {t("personalInfo")}
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input value={profile.firstName || ""} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="h-12 rounded-2xl border border-emerald-100 px-4 text-sm dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white" placeholder={language === "ru" ? "Имя" : "First name"} />
            <input value={profile.lastName || ""} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="h-12 rounded-2xl border border-emerald-100 px-4 text-sm dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white" placeholder={language === "ru" ? "Фамилия" : "Last name"} />
            <input value={profile.email} disabled className="h-12 rounded-2xl border border-emerald-100 bg-slate-50 px-4 text-sm text-slate-500 dark:border-emerald-400/10 dark:bg-slate-900" />
            <input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="h-12 rounded-2xl border border-emerald-100 px-4 text-sm dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white" placeholder={language === "ru" ? "Телефон" : "Phone"} />
            <input value={profile.country || ""} onChange={(e) => setProfile({ ...profile, country: e.target.value })} className="h-12 rounded-2xl border border-emerald-100 px-4 text-sm dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white" placeholder={language === "ru" ? "Страна" : "Country"} />
            <input value={profile.city || ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="h-12 rounded-2xl border border-emerald-100 px-4 text-sm dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white" placeholder={language === "ru" ? "Город" : "City"} />
            <input value={profile.address || ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="h-12 rounded-2xl border border-emerald-100 px-4 text-sm dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white md:col-span-2" placeholder={language === "ru" ? "Адрес" : "Address"} />
          </div>

          <button onClick={saveProfile} className="mt-5 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-500">
            {language === "ru" ? "Сохранить профиль" : "Save profile"}
          </button>

          {message && (
            <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-300">
              {message}
            </p>
          )}
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04]">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            KYC
          </h2>

          <p className="mt-2 text-sm text-slate-500 dark:text-emerald-50/60">
            Status: <b>{profile.kycStatus}</b>
          </p>

          <div className="mt-5 space-y-3">
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white">
              <option value="Identity document">Identity document</option>
              <option value="Proof of address">Proof of address</option>
              <option value="Bank proof">Bank proof</option>
            </select>

            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full rounded-2xl border border-emerald-100 p-3 text-sm dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white" />

            <button onClick={uploadDocument} className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-500">
              {language === "ru" ? "Отправить документ" : "Submit document"}
            </button>

            {uploadMessage && (
              <p className="text-sm text-emerald-600 dark:text-emerald-300">
                {uploadMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04]">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {t("security")}
          </h2>

          <div className="mt-5 space-y-3">
            <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" className="h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white" placeholder={language === "ru" ? "Текущий пароль" : "Current password"} />
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm dark:border-emerald-400/10 dark:bg-slate-950 dark:text-white" placeholder={language === "ru" ? "Новый пароль" : "New password"} />

            <button onClick={changePassword} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700 dark:bg-emerald-600">
              {language === "ru" ? "Изменить пароль" : "Change password"}
            </button>

            {passwordMessage && (
              <p className="text-sm text-emerald-600 dark:text-emerald-300">
                {passwordMessage}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/10 dark:bg-white/[0.04]">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {t("verification")}
          </h2>

          <div className="mt-4 space-y-3">
            {documents.length === 0 && (
              <p className="text-sm text-slate-500">
                No documents uploaded
              </p>
            )}

            {documents.map((doc) => (
              <div key={doc.id} className="rounded-2xl border border-emerald-100 p-4 text-sm dark:border-emerald-400/10">
                <p className="font-bold text-slate-900 dark:text-white">
                  {doc.documentType || "DOCUMENT"}
                </p>

                <p className="mt-1 text-slate-500">
                  {doc.fileName}
                </p>

                <p className="mt-1 font-bold text-emerald-600">
                  {doc.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}