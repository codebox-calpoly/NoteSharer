export type LeaderboardProfileRow = {
  id: string;
  handle: string | null;
  display_name: string | null;
  uploaded_note_count: number | null;
  total_credits_earned: number | null;
  credit_score: number | null;
  created_at: string;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  uploads: number;
  credits: number;
  avatar: string;
};

export function buildInitials(displayName: string | null, handle: string | null): string {
  const source = (displayName?.trim() || handle?.trim() || "U").replace(/^@/, "");
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function sortLeaderboardRows(rows: LeaderboardProfileRow[]): LeaderboardProfileRow[] {
  return [...rows].sort((a, b) => {
    const uploadDiff = Number(b.uploaded_note_count ?? 0) - Number(a.uploaded_note_count ?? 0);
    if (uploadDiff !== 0) return uploadDiff;

    const creditsEarnedDiff = Number(b.total_credits_earned ?? 0) - Number(a.total_credits_earned ?? 0);
    if (creditsEarnedDiff !== 0) return creditsEarnedDiff;

    const creditScoreDiff = Number(b.credit_score ?? 0) - Number(a.credit_score ?? 0);
    if (creditScoreDiff !== 0) return creditScoreDiff;

    return a.created_at.localeCompare(b.created_at);
  });
}

export function toAllTimeRankedRows(rows: LeaderboardProfileRow[]): LeaderboardProfileRow[] {
  return sortLeaderboardRows(rows).filter((row) => Number(row.uploaded_note_count ?? 0) > 0);
}

export function toLeaderboardEntries(rows: LeaderboardProfileRow[]): LeaderboardEntry[] {
  return toAllTimeRankedRows(rows).map((row, index) => ({
    rank: index + 1,
    userId: row.id,
    name: row.display_name?.trim() || row.handle || "Anonymous",
    uploads: Number(row.uploaded_note_count ?? 0),
    credits: Number(row.credit_score ?? 0),
    avatar: buildInitials(row.display_name, row.handle),
  }));
}

export function getAllTimeRank(rows: LeaderboardProfileRow[], userId: string): { rank: number | null; totalContributors: number } {
  const rankedRows = toAllTimeRankedRows(rows);
  const index = rankedRows.findIndex((row) => row.id === userId);

  return {
    rank: index >= 0 ? index + 1 : null,
    totalContributors: rankedRows.length,
  };
}
