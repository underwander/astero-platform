export interface RequestRateLimiter {
  consume(keyHash: string, limit: number, windowSeconds: number): Promise<boolean>;
}
