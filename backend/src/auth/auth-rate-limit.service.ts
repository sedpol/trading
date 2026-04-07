import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type RateLimitState = {
  attempts: number;
  windowStartedAt: number;
  blockedUntil: number;
};

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

@Injectable()
export class AuthRateLimitService {
  private readonly states = new Map<string, RateLimitState>();
  private readonly maxAttempts = parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS, 5);
  private readonly windowMs = parsePositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
  private readonly blockMs = parsePositiveInt(process.env.AUTH_RATE_LIMIT_BLOCK_MS, this.windowMs);

  assertLoginAllowed(key: string, now = Date.now()) {
    const state = this.states.get(key);

    if (!state) {
      return;
    }

    if (state.blockedUntil > now) {
      throw this.createLimitException(state.blockedUntil, now);
    }

    if (now - state.windowStartedAt >= this.windowMs) {
      this.states.delete(key);
    }
  }

  recordFailedAttempt(key: string, now = Date.now()) {
    const state = this.states.get(key);

    if (!state || now - state.windowStartedAt >= this.windowMs) {
      this.states.set(key, {
        attempts: 1,
        windowStartedAt: now,
        blockedUntil: 0,
      });
      return;
    }

    state.attempts += 1;

    if (state.attempts >= this.maxAttempts) {
      state.blockedUntil = now + this.blockMs;
      throw this.createLimitException(state.blockedUntil, now);
    }
  }

  reset(key: string) {
    this.states.delete(key);
  }

  private createLimitException(blockedUntil: number, now: number) {
    const retryAfterSeconds = Math.max(1, Math.ceil((blockedUntil - now) / 1000));
    return new HttpException(
      `Too many login attempts. Try again in ${retryAfterSeconds} seconds.`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
