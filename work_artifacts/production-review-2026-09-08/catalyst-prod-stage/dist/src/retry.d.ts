import type { RetryPolicy } from "./domain";
export declare function retryDelayMs(policy: RetryPolicy, completedAttemptCount: number): number;
export declare function retryAt(now: Date, policy: RetryPolicy, completedAttemptCount: number): Date;
