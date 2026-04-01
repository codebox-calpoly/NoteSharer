"use client";

import { useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";

const MobileDisclaimerBanner = dynamic(
  () => import("./MobileDisclaimerBanner"),
  { ssr: false },
);

/** DesignNav lives in AuthenticatedAppChrome; per-page slots are unused. */
export function useRegisterNavRight(slot: ReactNode) {
  useEffect(() => {
    void slot;
  }, [slot]);
}

export function PolyShell({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileDisclaimerBanner />
      {children}
    </>
  );
}
