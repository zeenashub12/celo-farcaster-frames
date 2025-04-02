"use client";

import dynamic from "next/dynamic";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import React from "react";

const WagmiProvider = dynamic(
  () => import("@/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export const Providers: React.FC<{
  session: Session | null;
  children: React.ReactNode;
}> = ({ session, children }) => {
  return (
    // @ts-expect-error - Known issue with Auth.js v5 + React 19 type definitions
    <SessionProvider session={session}>
      <WagmiProvider>{children}</WagmiProvider>
    </SessionProvider>
  );
};
