"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "./profile-dashboard.css";

export default function Page() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsError, setCreditsError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setCreditsError("Not authenticated");
      }
      Promise.resolve().then(() => {
        setAccessToken(data.session?.access_token ?? null);
        setTokenLoaded(true);
      });
    };
    loadSession();
  }, []);

  const refreshCredits = useCallback(async () => {
    if (!accessToken) {
      setCredits(null);
      return;
    }

    try {
      const res = await fetch("/api/credits", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        setCreditsError("Failed to load credits");
        setCredits(null);
        return;
      }

      const data = await res.json();
      setCredits(Number.isFinite(data?.credits) ? Number(data.credits) : 0);
      setCreditsError(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setCreditsError("Failed to load credits");
      setCredits(null);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!tokenLoaded) return;
    void refreshCredits();
  }, [refreshCredits, tokenLoaded]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/");
  }, [router]);

  return (
    <main aria-label="Profile dashboard" className="profile-dashboard">
      <header className="profile-dashboard__header">
        <div>
          <p className="profile-dashboard__eyebrow">Cal Poly SLO</p>
          <h1>Profile Dashboard</h1>
        </div>
        <Link className="profile-dashboard__back" href="/dashboard">
          Back to Dashboard
        </Link>
      </header>
      <section className="profile-dashboard__credits">
        <div className="profile-dashboard__credit-card">
          <span className="profile-dashboard__label">Credits</span>
          <span className="profile-dashboard__value">{credits ?? "—"}</span>
          <p className="profile-dashboard__hint">
          </p>
          {creditsError ? (
            <p className="profile-dashboard__error">{creditsError}</p>
          ) : null}
        </div>
      </section>
      <section className="profile-dashboard__actions">
          <button
            className="profile-dashboard__logout"
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
      </section>
    </main>
  );
}
