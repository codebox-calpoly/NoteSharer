"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type Session } from "@supabase/supabase-js";
import { getSessionWithRecovery, supabase } from "@/lib/supabaseClient";
import { buildProfileInitials } from "@/lib/profile-display";
import { DesignNav } from "./DesignNav";

type CreditsPayload = {
  credits?: number;
  freeDownloads?: number;
};

type EnrollmentPayload = {
  enrollmentRequired?: boolean;
};

type ProfilePayload = {
  display_name: string | null;
  handle: string | null;
};

const APP_PATHS = ["/dashboard", "/upload", "/leaderboard"];

function getActiveNav(pathname: string) {
  if (pathname.startsWith("/upload")) return "upload" as const;
  if (pathname.startsWith("/leaderboard")) return "leaderboard" as const;
  if (pathname.startsWith("/dashboard/profile-dashboard")) return "profile" as const;
  return "browse" as const;
}

export function AuthenticatedAppChrome() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [freeDownloads, setFreeDownloads] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [handle, setHandle] = useState<string | null>(null);

  const showChrome = useMemo(
    () => APP_PATHS.some((prefix) => pathname.startsWith(prefix)),
    [pathname],
  );

  useEffect(() => {
    let cancelled = false;
    const loadSession = async () => {
      const { session: currentSession } = await getSessionWithRecovery(supabase);
      if (!cancelled) {
        setSession(currentSession);
      }
    };

    void loadSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!showChrome || !session?.access_token) return;

    let cancelled = false;
    const authHeaders = {
      Authorization: `Bearer ${session.access_token}`,
    };

    const loadShellData = async () => {
      const [creditsRes, enrollmentRes, profileRes] = await Promise.all([
        fetch("/api/credits", { headers: authHeaders }).catch(() => null),
        fetch("/api/me/enrollment", { headers: authHeaders }).catch(() => null),
        supabase
          .from("profiles")
          .select("display_name, handle")
          .eq("id", session.user.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      if (creditsRes?.ok) {
        const payload = (await creditsRes.json()) as CreditsPayload;
        setCredits(Number.isFinite(payload.credits) ? Number(payload.credits) : 0);
        setFreeDownloads(
          Number.isFinite(payload.freeDownloads) ? Number(payload.freeDownloads) : 0,
        );
      } else {
        setCredits(null);
        setFreeDownloads(null);
      }

      if (enrollmentRes?.ok) {
        const payload = (await enrollmentRes.json()) as EnrollmentPayload;
        if (
          payload.enrollmentRequired &&
          pathname !== "/onboarding"
        ) {
          router.replace("/onboarding?mode=course-refresh");
          return;
        }
      }

      const profileData = profileRes.data as ProfilePayload | null;
      setDisplayName(profileData?.display_name ?? null);
      setHandle(profileData?.handle ?? null);
    };

    void loadShellData();

    return () => {
      cancelled = true;
    };
  }, [showChrome, session?.access_token, session?.user.id, pathname, router]);

  if (!showChrome || !session) {
    return null;
  }

  const initials = buildProfileInitials(displayName, handle);

  return (
    <DesignNav
      active={getActiveNav(pathname)}
      rightSlot={
        <>
          <span className="app-shell-pill">Credits: {credits ?? "\u2014"}</span>
          {(freeDownloads ?? 0) > 0 ? (
            <span className="app-shell-pill">Free downloads: {freeDownloads}</span>
          ) : null}
          <Link
            href="/dashboard/profile-dashboard"
            className="app-shell-profile-link"
            aria-label="Open profile"
          >
            {initials}
          </Link>
        </>
      }
    />
  );
}
