"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { DesignNav } from "@/app/components/DesignNav";

const MobileDisclaimerBanner = dynamic(
  () => import("./MobileDisclaimerBanner"),
  { ssr: false },
);

type ShellCtx = { setNavRightSlot: (n: ReactNode) => void };

const ShellContext = createContext<ShellCtx | null>(null);

export function useRegisterNavRight(slot: ReactNode) {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    throw new Error("useRegisterNavRight must be used within PolyShell");
  }
  const { setNavRightSlot } = ctx;
  useEffect(() => {
    setNavRightSlot(slot);
    return () => setNavRightSlot(null);
  }, [setNavRightSlot, slot]);
}

function navActiveFromPath(
  pathname: string
): "browse" | "upload" | "leaderboard" | "profile" | undefined {
  if (pathname === "/upload") return "upload";
  if (pathname === "/leaderboard") return "leaderboard";
  if (pathname.startsWith("/dashboard/profile-dashboard")) return "profile";
  if (pathname.startsWith("/dashboard")) return "browse";
  return undefined;
}

export function PolyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [rightSlot, setRightSlot] = useState<ReactNode>(null);
  const setNavRightSlot = useCallback((n: ReactNode) => setRightSlot(n), []);
  const ctx = useMemo(() => ({ setNavRightSlot }), [setNavRightSlot]);
  const active = navActiveFromPath(pathname);

  return (
    <ShellContext.Provider value={ctx}>
      <DesignNav active={active} rightSlot={rightSlot} />
      <MobileDisclaimerBanner />
      {children}
    </ShellContext.Provider>
  );
}
