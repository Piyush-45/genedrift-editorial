import type { RetryPolicy } from "./domain";

export function retryDelayMs(policy: RetryPolicy, completedAttemptCount: number): number {
  const exponent = Math.max(0, completedAttemptCount - 1);
  return Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** exponent);
}

export function retryAt(now: Date, policy: RetryPolicy, completedAttemptCount: number): Date {
  return new Date(now.getTime() + retryDelayMs(policy, completedAttemptCount));
}
