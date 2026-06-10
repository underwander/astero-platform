"use client";

import ProtectedPage from "@/components/auth/ProtectedPage";
import { useEffect, useState } from "react";

type CompanyDocument = {
  id: string;
  title: string;
  category: string;
  fileName: string;
  mimeType: string;
  contentBase64: string;
  createdAt: string;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDocuments() {
    const res = await fetch("/api/company-documents");
    const data = await res.json();
    setDocuments(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <ProtectedPage>
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-[#06130d] via-[#092016] to-emerald-950 p-6 text-white md:p-8">
          <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
            Company documents
          </span>
          <h1 className="mt-4 text-3xl font-black md:text-4xl">Documents</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/70">
            Legal documents, policies and company files published by Astero.
          </p>
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 dark:border-emerald-400/10 dark:bg-white/[0.04] md:p-6">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-slate-500">No published company documents yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 dark:border-emerald-400/10 dark:bg-slate-950/60">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">{doc.category}</p>
                  <h2 className="mt-2 text-lg font-black text-slate-900 dark:text-white">{doc.title}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-emerald-50/55">{doc.fileName}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(doc.createdAt).toLocaleString()}</p>
                  <a
                    href={`data:${doc.mimeType};base64,${doc.contentBase64}`}
                    download={doc.fileName}
                    className="mt-4 inline-flex rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-500"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
