"use client";

import { useCallback, useEffect, useState } from "react";
import { DesignNav } from "@/app/components/DesignNav";
import { getSessionWithRecovery, supabase } from "@/lib/supabaseClient";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  uploads: number;
  credits: number;
  avatar: string;
};

export default function LeaderboardPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      const { session } = await getSessionWithRecovery(supabase);
      setAccessToken(session?.access_token ?? null);
    };

    void loadSession();
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      setEntries([]);
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/leaderboard", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        setEntries([]);
        setError(payload.error ?? "Failed to load leaderboard");
        return;
      }

      const payload = (await res.json()) as { leaderboard?: LeaderboardEntry[] };
      setEntries(payload.leaderboard ?? []);
    } catch {
      setEntries([]);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    void fetchLeaderboard();
  }, [accessToken, fetchLeaderboard]);

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400 to-yellow-600";
    if (rank === 2) return "from-gray-300 to-gray-500";
    if (rank === 3) return "from-orange-400 to-orange-600";
    return "from-[#6dbe8b] to-[#90bf8e]";
  };

  const first = entries[0] ?? null;
  const second = entries[1] ?? null;
  const third = entries[2] ?? null;
  const hasPodium = entries.length >= 3;
  const listStartIndex = hasPodium ? 3 : 0;

  return (
    <div className="flex flex-col min-h-screen page-bg" style={{ fontFamily: "var(--font-inter), Inter, Helvetica, sans-serif" }}>
      <DesignNav active="leaderboard" />
      <main className="flex-1 px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div
            className={`mb-8 text-center transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="font-bold text-[var(--poly-neutral-dark)] text-3xl md:text-4xl mb-2">Leaderboard</h2>
            <p className="font-normal text-[var(--poly-neutral-muted)] text-base md:text-lg">Ranked by total uploaded notes</p>
          </div>

          {loading && <p className="text-center text-[#666666] mb-8">Loading leaderboard...</p>}
          {!loading && error && <p className="text-center text-red-600 mb-8">{error}</p>}
          {!loading && !error && entries.length === 0 && (
            <p className="text-center text-[#666666] mb-8">No contributors yet.</p>
          )}

          {!loading && !error && first && second && third && (
            <div
              className={`mb-12 transition-all duration-700 delay-300 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <div className="flex items-end justify-center gap-4 md:gap-8">
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${getMedalColor(2)} flex items-center justify-center text-white text-xl md:text-2xl font-bold mb-3 shadow-lg`}>
                    {second.avatar}
                  </div>
                  <div className="bg-white rounded-t-xl p-4 md:p-6 text-center shadow-lg w-32 md:w-40 h-32 md:h-40 flex flex-col justify-center">
                    <div className="text-3xl md:text-4xl font-bold text-gray-400 mb-2">2</div>
                    <p className="font-semibold text-[#2e2e2e] text-sm md:text-base mb-1">{second.name.split(" ")[0]}</p>
                    <p className="text-[#6dbe8b] text-xs md:text-sm font-bold">{second.uploads} uploads</p>
                  </div>
                </div>
                <div className="flex flex-col items-center -mt-8">
                  <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${getMedalColor(1)} flex items-center justify-center text-white text-2xl md:text-3xl font-bold mb-3 shadow-xl`}>
                    {first.avatar}
                  </div>
                  <div className="bg-white rounded-t-xl p-4 md:p-6 text-center shadow-xl w-32 md:w-40 h-40 md:h-48 flex flex-col justify-center">
                    <div className="text-4xl md:text-5xl font-bold text-yellow-500 mb-2">1</div>
                    <p className="font-semibold text-[#2e2e2e] text-sm md:text-base mb-1">{first.name.split(" ")[0]}</p>
                    <p className="text-[#6dbe8b] text-xs md:text-sm font-bold">{first.uploads} uploads</p>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${getMedalColor(3)} flex items-center justify-center text-white text-xl md:text-2xl font-bold mb-3 shadow-lg`}>
                    {third.avatar}
                  </div>
                  <div className="bg-white rounded-t-xl p-4 md:p-6 text-center shadow-lg w-32 md:w-40 h-28 md:h-32 flex flex-col justify-center">
                    <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">3</div>
                    <p className="font-semibold text-[#2e2e2e] text-sm md:text-base mb-1">{third.name.split(" ")[0]}</p>
                    <p className="text-[#6dbe8b] text-xs md:text-sm font-bold">{third.uploads} uploads</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-3">
              {entries.slice(listStartIndex).map((user, index) => (
                <div
                  key={user.userId}
                  className={`bg-white rounded-xl shadow-md p-4 md:p-6 transition-all duration-700 hover:shadow-lg hover:-translate-y-1 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${(index + 4) * 100}ms` }}
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="font-bold text-[#666666] text-xl md:text-2xl w-8 text-center">{user.rank}</div>
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br ${getMedalColor(user.rank)} flex items-center justify-center text-white text-base md:text-lg font-bold`}>
                      {user.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#2e2e2e] text-base md:text-lg">{user.name}</h3>
                      <p className="text-[#666666] text-sm">{user.uploads} uploads</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#6dbe8b] text-lg md:text-xl">{user.credits}</div>
                      <div className="text-[#666666] text-xs">credits</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
