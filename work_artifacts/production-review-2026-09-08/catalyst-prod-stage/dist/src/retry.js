"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryDelayMs = retryDelayMs;
exports.retryAt = retryAt;
function retryDelayMs(policy, completedAttemptCount) {
    const exponent = Math.max(0, completedAttemptCount - 1);
    return Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** exponent);
}
function retryAt(now, policy, completedAttemptCount) {
    return new Date(now.getTime() + retryDelayMs(policy, completedAttemptCount));
}
//# sourceMappingURL=retry.js.map