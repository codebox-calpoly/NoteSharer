"use client";

import { useEffect, type ReactNode, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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

function PageTransitionWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      const t1 = requestAnimationFrame(() => {
        setVisible(false);
        const t2 = requestAnimationFrame(() => {
          requestAnimationFrame(() => setVisible(true));
        });
        return () => cancelAnimationFrame(t2);
      });
      return () => cancelAnimationFrame(t1);
    }
  }, [pathname]);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {children}
    </div>
  );
}

export function PolyShell({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileDisclaimerBanner />
      <PageTransitionWrapper>{children}</PageTransitionWrapper>
    </>
  );
}
