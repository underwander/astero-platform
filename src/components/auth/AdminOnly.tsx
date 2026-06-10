"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

export default function AdminOnly({ children }: Props) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "ADMIN" && role !== "MANAGER") {
      router.push("/");
      return;
    }

    setAllowed(true);
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