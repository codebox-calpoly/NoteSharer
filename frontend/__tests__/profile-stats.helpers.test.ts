import { normalizeNetCredits, sumCreditTotals } from "@/app/api/profile/stats/helpers";

describe("profile stats helpers", () => {
  it("aggregates positive and negative credit ledger amounts", () => {
    const totals = sumCreditTotals([
      { amount: 5 },
      { amount: -3 },
      { amount: 2 },
      { amount: -1 },
      { amount: null },
    ]);

    expect(totals).toEqual({
      creditsEarned: 7,
      creditsSpent: 4,
    });
  });

  it("normalizes net credits to 0 when value is null/undefined", () => {
    expect(normalizeNetCredits(null)).toBe(0);
    expect(normalizeNetCredits(undefined)).toBe(0);
    expect(normalizeNetCredits(9)).toBe(9);
  });
});
