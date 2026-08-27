"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentSession } from "@/lib/client-auth";

type ProtectedPageProps = {
  children: React.ReactNode;
};

export default function ProtectedPage({ children }: ProtectedPageProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const handleAuthEvent = (event: StorageEvent) => {
      if (event.key === "astero.auth.event" && event.newValue?.startsWith("logout:")) {
        router.replace("/login");
      }
    };
    window.addEventListener("storage", handleAuthEvent);
    const initializeSession = () => {
      getCurrentSession()
        .then((session) => {
          if (!active) return;
          if (!session) router.replace("/login");
          else setAllowed(true);
        })
        .catch(() => {
          if (active) retryTimer = setTimeout(initializeSession, 2000);
        });
    };
    initializeSession();
    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener("storage", handleAuthEvent);
    };
  }, [router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Checking session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
