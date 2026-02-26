import {
  getAllTimeRank,
  sortLeaderboardRows,
  toLeaderboardEntries,
  type LeaderboardProfileRow,
} from "@/app/api/leaderboard/helpers";

function makeRow(overrides: Partial<LeaderboardProfileRow>): LeaderboardProfileRow {
  return {
    id: "user",
    handle: "user",
    display_name: "User",
    uploaded_note_count: 0,
    total_credits_earned: 0,
    credit_score: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("leaderboard helpers", () => {
  it("sorts rows by uploads, then credits earned, then net credits, then created_at", () => {
    const rows = [
      makeRow({ id: "b", uploaded_note_count: 2, total_credits_earned: 4, credit_score: 5, created_at: "2026-01-02T00:00:00.000Z" }),
      makeRow({ id: "a", uploaded_note_count: 3, total_credits_earned: 1, credit_score: 1, created_at: "2026-01-03T00:00:00.000Z" }),
      makeRow({ id: "d", uploaded_note_count: 2, total_credits_earned: 4, credit_score: 6, created_at: "2026-01-04T00:00:00.000Z" }),
      makeRow({ id: "c", uploaded_note_count: 2, total_credits_earned: 4, credit_score: 6, created_at: "2026-01-01T00:00:00.000Z" }),
    ];

    expect(sortLeaderboardRows(rows).map((row) => row.id)).toEqual(["a", "c", "d", "b"]);
  });

  it("returns null rank for unranked users with no uploads", () => {
    const rows = [
      makeRow({ id: "ranked", uploaded_note_count: 1 }),
      makeRow({ id: "unranked", uploaded_note_count: 0 }),
    ];

    expect(getAllTimeRank(rows, "unranked")).toEqual({
      rank: null,
      totalContributors: 1,
    });
  });

  it("maps ranked entries with 1-based rank", () => {
    const rows = [
      makeRow({ id: "u2", uploaded_note_count: 1, credit_score: 5 }),
      makeRow({ id: "u1", uploaded_note_count: 2, credit_score: 7 }),
    ];

    expect(toLeaderboardEntries(rows)).toEqual([
      expect.objectContaining({ userId: "u1", rank: 1 }),
      expect.objectContaining({ userId: "u2", rank: 2 }),
    ]);
  });
});
