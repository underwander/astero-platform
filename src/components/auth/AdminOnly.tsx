"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentSession } from "@/lib/client-auth";

type Props = {
  children: React.ReactNode;
};

export default function AdminOnly({ children }: Props) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const initializeSession = () => {
      getCurrentSession()
        .then((session) => {
          if (!active) return;
          if (!session) router.replace("/login");
          else if (session.role !== "ADMIN" && session.role !== "MANAGER") router.replace("/");
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
    };
  }, [router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Checking permissions...</p>
      </div>
    );
  }

  return <>{children}</>;
}
