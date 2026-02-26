"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSessionWithRecovery, supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { DesignNav } from "@/app/components/DesignNav";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { useTheme } from "@/app/components/ThemeProvider";
import { displayStatValue, getRankValue, toProfileStats, type ProfileStats } from "./stats";
import "./profile-dashboard.css";
import "../course-detail.css";

type ProfileNote = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  class_id: string | null;
  profile_display_name: string | null;
  upvote_count: number;
  downvote_count: number;
  download_cost: number;
  downloaded: boolean;
};

function getDisplayInitial(user: User | null): string {
  if (!user) return "?";
  const name = user.user_metadata?.full_name as string | undefined;
  if (name && typeof name === "string") {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  }
  const email = user.email;
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

function getDisplayName(user: User | null): string {
  if (!user) return "Guest";
  const name = user.user_metadata?.full_name as string | undefined;
  if (name && typeof name === "string") return name.trim();
  return user.email?.split("@")[0] ?? "User";
}

function getHandle(user: User | null): string {
  if (!user) return "guest";
  return user.user_metadata?.user_name as string ?? user.email?.split("@")[0] ?? "user";
}

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsError, setCreditsError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<"uploads" | "downloads" | "favorites">("uploads");
  const [uploads, setUploads] = useState<ProfileNote[]>([]);
  const [downloads, setDownloads] = useState<ProfileNote[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [loadingDownloads, setLoadingDownloads] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      const { session, error } = await getSessionWithRecovery(supabase);
      if (error) setCreditsError("Not authenticated");
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      setTokenLoaded(true);
    };
    loadSession();
  }, []);

  const refreshCredits = useCallback(async () => {
    const { session } = await getSessionWithRecovery(supabase);
    if (!session?.access_token) {
      setCredits(null);
      return;
    }
    try {
      const res = await fetch("/api/credits", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        setCreditsError("Failed to load credits");
        setCredits(null);
        return;
      }
      const data = await res.json();
      setCredits(Number.isFinite(data?.credits) ? Number(data.credits) : 0);
      setCreditsError(null);
    } catch {
      setCreditsError("Failed to load credits");
      setCredits(null);
    }
  }, []);

  useEffect(() => {
    if (!tokenLoaded) return;
    const t = setTimeout(() => void refreshCredits(), 0);
    return () => clearTimeout(t);
  }, [refreshCredits, tokenLoaded]);

  const fetchUploads = useCallback(async () => {
    if (!accessToken) return;
    setLoadingUploads(true);
    setNotesError(null);
    try {
      const res = await fetch("/api/notes?mine=1&page_size=50", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        setNotesError(payload.error ?? "Failed to load uploads");
        setUploads([]);
        return;
      }
      const data = (await res.json()) as { notes?: ProfileNote[] };
      setUploads(data.notes ?? []);
    } catch {
      setNotesError("Failed to load uploads");
      setUploads([]);
    } finally {
      setLoadingUploads(false);
    }
  }, [accessToken]);

  const fetchDownloads = useCallback(async () => {
    if (!accessToken) return;
    setLoadingDownloads(true);
    setNotesError(null);
    try {
      const res = await fetch("/api/notes?downloaded=1&page_size=50", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        setNotesError(payload.error ?? "Failed to load downloads");
        setDownloads([]);
        return;
      }
      const data = (await res.json()) as { notes?: ProfileNote[] };
      setDownloads(data.notes ?? []);
    } catch {
      setNotesError("Failed to load downloads");
      setDownloads([]);
    } finally {
      setLoadingDownloads(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!tokenLoaded || !accessToken) return;
    void fetchUploads();
  }, [tokenLoaded, accessToken, fetchUploads]);

  useEffect(() => {
    if (!tokenLoaded || !accessToken) return;
    void fetchDownloads();
  }, [tokenLoaded, accessToken, fetchDownloads]);

  const fetchProfileStats = useCallback(async () => {
    if (!accessToken) return;
    setLoadingStats(true);
    setStatsError(null);

    try {
      const res = await fetch("/api/profile/stats", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        setStatsError(payload.error ?? "Failed to load stats");
        setProfileStats(null);
        setLeaderboardRank(null);
        return;
      }

      const payload = (await res.json()) as {
        stats?: ProfileStats;
        rank?: { allTime?: number | null; totalContributors?: number };
      };

      setProfileStats(toProfileStats(payload));
      setLeaderboardRank(getRankValue(payload));
    } catch {
      setStatsError("Failed to load stats");
      setProfileStats(null);
      setLeaderboardRank(null);
    } finally {
      setLoadingStats(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!tokenLoaded || !accessToken) return;
    void fetchProfileStats();
  }, [tokenLoaded, accessToken, fetchProfileStats]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/");
  }, [router]);

  const initial = getDisplayInitial(user);
  const displayName = getDisplayName(user);
  const handle = getHandle(user);
  const { theme } = useTheme();
  const displayedStats = profileStats ?? null;

  return (
    <div className="profile-page">
      <DesignNav
        active="profile"
        rightSlot={
          <>
            <span className="profile-page__credits-pill">Credits: {credits ?? "—"}</span>
            <Link href="/dashboard/profile-dashboard" className="profile-page__profile-btn" aria-label="Profile">
              {initial}
            </Link>
          </>
        }
      />

      <div className="profile-page__body">
        <div className="profile-page__main">
          <div className="profile-page__content">
            <section
              className={`profile-page__card profile-page__profile-card page-enter ${isVisible ? "page-enter-visible" : "page-enter-hidden"}`}
              style={{ transitionDelay: "0ms" }}
            >
              <div className="profile-page__profile-row">
                <div className="profile-page__profile-info">
                  <div className="profile-page__avatar" aria-hidden>{initial}</div>
                  <div className="profile-page__profile-meta">
                    <h1 className="profile-page__handle">{handle}</h1>
                    <p className="profile-page__name">{displayName}</p>
                    <p className="profile-page__bio">Share notes and earn credits.</p>
                  </div>
                </div>
                <div className="profile-page__rank-card">
                  <p className="profile-page__rank-label">Leaderboard Rank</p>
                  <p className="profile-page__rank-value">
                    {loadingStats ? "—" : displayStatValue(leaderboardRank)}
                  </p>
                  <p className="profile-page__rank-sub">Top contributor this week</p>
                </div>
              </div>
            </section>

            <section
              className={`profile-page__card profile-page__tabs-card page-enter ${isVisible ? "page-enter-visible" : "page-enter-hidden"}`}
              style={{ transitionDelay: "150ms" }}
            >
              <div className="profile-page__tabs">
                <button
                  type="button"
                  className={`profile-page__tab ${activeTab === "uploads" ? "active" : ""}`}
                  onClick={() => setActiveTab("uploads")}
                >
                  My Uploads
                </button>
                <button
                  type="button"
                  className={`profile-page__tab ${activeTab === "downloads" ? "active" : ""}`}
                  onClick={() => setActiveTab("downloads")}
                >
                  Downloads
                </button>
                <button
                  type="button"
                  className={`profile-page__tab ${activeTab === "favorites" ? "active" : ""}`}
                  onClick={() => setActiveTab("favorites")}
                >
                  Favorites
                </button>
              </div>
              <div
                className={`profile-page__note-list page-enter ${isVisible ? "page-enter-visible" : "page-enter-hidden"}`}
                style={{ transitionDelay: "250ms" }}
              >
                {notesError && (
                  <p className="profile-page__error-inline" role="alert">{notesError}</p>
                )}
                {activeTab === "uploads" && (
                  <>
                    {loadingUploads && <p className="profile-page__loading">Loading your uploads…</p>}
                    {!loadingUploads && uploads.length === 0 && (
                      <p className="profile-page__empty">No uploads yet. Upload notes to get started.</p>
                    )}
                    {!loadingUploads && uploads.length > 0 && (
                      <ul className="profile-page__note-cards" aria-label="My uploads">
                        {uploads.map((note) => (
                          <li key={note.id}>
                            <Link
                              href={note.class_id ? `/dashboard/course/${note.class_id}` : "/dashboard"}
                              className="course-detail-note-card profile-page__note-card"
                            >
                              <h3 className="course-detail-note-title">{note.title}</h3>
                              <p className="course-detail-note-by">
                                by {note.profile_display_name ?? "You"}
                              </p>
                              <div className="course-detail-note-meta">
                                <div className="course-detail-note-votes">
                                  <span className="course-detail-note-vote-up">↑ {note.upvote_count}</span>
                                  <span className="course-detail-note-vote-down">↓ {note.downvote_count}</span>
                                </div>
                                <span className="course-detail-note-credits">
                                  {note.download_cost} credits
                                </span>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
                {activeTab === "downloads" && (
                  <>
                    {loadingDownloads && <p className="profile-page__loading">Loading your downloads…</p>}
                    {!loadingDownloads && downloads.length === 0 && (
                      <p className="profile-page__empty">No downloads yet. Download notes from a course to see them here.</p>
                    )}
                    {!loadingDownloads && downloads.length > 0 && (
                      <ul className="profile-page__note-cards" aria-label="My downloads">
                        {downloads.map((note) => (
                          <li key={note.id}>
                            <Link
                              href={note.class_id ? `/dashboard/course/${note.class_id}` : "/dashboard"}
                              className="course-detail-note-card profile-page__note-card"
                            >
                              <h3 className="course-detail-note-title">{note.title}</h3>
                              <p className="course-detail-note-by">
                                by {note.profile_display_name ?? "Anonymous"}
                              </p>
                              <div className="course-detail-note-meta">
                                <div className="course-detail-note-votes">
                                  <span className="course-detail-note-vote-up">↑ {note.upvote_count}</span>
                                  <span className="course-detail-note-vote-down">↓ {note.downvote_count}</span>
                                </div>
                                <span className="course-detail-note-credits">🔓 Owned</span>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
                {activeTab === "favorites" && (
                  <p className="profile-page__empty">No favorites yet. Favorites coming soon.</p>
                )}
              </div>
            </section>
          </div>

          <aside
            className={`profile-page__sidebar page-enter ${isVisible ? "page-enter-visible" : "page-enter-hidden"}`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="profile-page__stats-card">
              <h2 className="profile-page__stats-title">My Stats</h2>
              <div className="profile-page__stats-grid">
                <div className="profile-page__stat-row">
                  <span className="profile-page__stat-label">Total Uploads</span>
                  <span className="profile-page__stat-value">
                    {loadingStats ? "—" : displayStatValue(displayedStats?.totalUploads)}
                  </span>
                </div>
                <div className="profile-page__stat-row">
                  <span className="profile-page__stat-label">Total Upvotes</span>
                  <span className="profile-page__stat-value">
                    {loadingStats ? "—" : displayStatValue(displayedStats?.totalUpvotes)}
                  </span>
                </div>
                <div className="profile-page__stat-row">
                  <span className="profile-page__stat-label">Credits Earned</span>
                  <span className="profile-page__stat-value">
                    {loadingStats ? "—" : displayStatValue(displayedStats?.creditsEarned)}
                  </span>
                </div>
                <div className="profile-page__stat-row">
                  <span className="profile-page__stat-label">Credits Spent</span>
                  <span className="profile-page__stat-value">
                    {loadingStats ? "—" : displayStatValue(displayedStats?.creditsSpent)}
                  </span>
                </div>
              </div>
              <div className="profile-page__stat-divider" />
              <div className="profile-page__stat-row profile-page__stat-row--net">
                <span className="profile-page__stat-label">Net Credits</span>
                <span className="profile-page__stat-value profile-page__stat-value--net">
                  {loadingStats ? "—" : displayStatValue(displayedStats?.netCredits)}
                </span>
              </div>
              {statsError && (
                <p className="profile-page__error-inline" role="alert">{statsError}</p>
              )}
            </div>
            <div className="profile-page__stats-card profile-page__appearance">
              <h2 className="profile-page__stats-title">Appearance</h2>
              <div className="profile-page__stat-row profile-page__stat-row--appearance">
                <span className="profile-page__stat-label">Theme</span>
                <ThemeToggle />
              </div>
              <p className="profile-page__appearance-hint">
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {creditsError && (
        <p className="profile-page__error" role="alert">{creditsError}</p>
      )}

      <div className="profile-page__actions">
        <button
          type="button"
          className="profile-page__logout"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out…" : "Logout"}
        </button>
      </div>
    </div>
  );
}
