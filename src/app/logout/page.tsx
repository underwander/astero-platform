"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("userId");
    localStorage.removeItem("email");

    setTimeout(() => {
      router.push("/login");
    }, 300);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          Logging out...
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Redirecting to login page...
        </p>
      </div>
    </div>
  );
}