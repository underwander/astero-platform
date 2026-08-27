export const MAX_DEPOSIT_COMMENT_LENGTH = 500;

export class DepositCommentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DepositCommentValidationError";
  }
}

export function normalizeDepositComment(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new DepositCommentValidationError("Comment must be text");
  }

  const comment = value.trim();
  if (!comment) return null;
  if (comment.length > MAX_DEPOSIT_COMMENT_LENGTH) {
    throw new DepositCommentValidationError(`Comment must not exceed ${MAX_DEPOSIT_COMMENT_LENGTH} characters`);
  }

  return comment;
}

export function parseManualBalanceAmount(value: unknown): number {
  if (value === undefined || value === null || value === "") {
    throw new DepositCommentValidationError("Amount is required");
  }

  const amount = Number(value);
  if (!Number.isFinite(amount) || amount === 0) {
    throw new DepositCommentValidationError("Invalid amount");
  }

  return amount;
}

export function prepareManualBalanceOperation(currentBalance: number, amountValue: unknown, commentValue: unknown) {
  const amount = parseManualBalanceAmount(amountValue);
  const comment = normalizeDepositComment(commentValue);
  const isDeposit = amount >= 0;

  return {
    amount,
    nextBalance: Math.max(0, Number(currentBalance || 0) + amount),
    type: isDeposit ? "DEPOSIT" : "WITHDRAWAL_ADJUSTMENT",
    description: comment || (isDeposit ? "Admin deposit" : "Admin balance deduction"),
    comment,
  };
}

const HIDDEN_LEGACY_DESCRIPTIONS = new Set([
  "Admin deposit",
  "Admin balance deduction",
  "Manual balance adjustment",
]);

export function visibleTransactionDescription(value: string | null | undefined): string | null {
  const description = value?.trim();
  if (!description || HIDDEN_LEGACY_DESCRIPTIONS.has(description)) return null;
  if (description.startsWith("Deposit request approved:")) return null;
  return description;
}
