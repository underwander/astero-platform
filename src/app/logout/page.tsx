"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearClientAuthState } from "@/lib/client-auth";
import { useState } from "react";

export default function LogoutPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    async function logout() {
      try {
        const response = await fetch("/api/logout", {
          method: "POST",
          credentials: "same-origin",
          keepalive: true,
        });
        if (!response.ok) throw new Error("Logout failed");
        clearClientAuthState();
        localStorage.setItem("astero.auth.event", `logout:${Date.now()}`);
        if (active) router.replace("/login");
      } catch {
        if (active) setFailed(true);
      }
    }
    void logout();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          {failed ? "Logout was not completed" : "Logging out..."}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          {failed ? "Check the connection and try again." : "Redirecting to login page..."}
        </p>
        {failed && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
