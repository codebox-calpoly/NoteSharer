export type CreditLedgerRow = {
  amount: number | null;
};

export type CreditTotals = {
  creditsEarned: number;
  creditsSpent: number;
};

export function sumCreditTotals(rows: CreditLedgerRow[]): CreditTotals {
  let creditsEarned = 0;
  let creditsSpent = 0;

  for (const row of rows) {
    const amount = Number(row.amount ?? 0);
    if (amount > 0) {
      creditsEarned += amount;
      continue;
    }

    if (amount < 0) {
      creditsSpent += Math.abs(amount);
    }
  }

  return { creditsEarned, creditsSpent };
}

export function normalizeNetCredits(value: number | null | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}
