"use client";

import dynamic from "next/dynamic";

const WisdomTicker = dynamic(() => import("@/components/admin/WisdomTicker"), { ssr: false });

export default function ClientWisdomTicker() {
  return <WisdomTicker />;
}
