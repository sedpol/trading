import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthRateLimitService } from './auth-rate-limit.service';

describe('AuthRateLimitService', () => {
  let service: AuthRateLimitService;

  beforeEach(() => {
    process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS = '3';
    process.env.AUTH_RATE_LIMIT_WINDOW_MS = '60000';
    process.env.AUTH_RATE_LIMIT_BLOCK_MS = '60000';
    service = new AuthRateLimitService();
  });

  it('allows a few failed attempts before blocking', () => {
    expect(() => service.recordFailedAttempt('127.0.0.1:trader', 1_000)).not.toThrow();
    expect(() => service.recordFailedAttempt('127.0.0.1:trader', 2_000)).not.toThrow();
    expect(() => service.recordFailedAttempt('127.0.0.1:trader', 3_000)).toThrow(HttpException);
  });

  it('blocks repeated login attempts until the block window expires', () => {
    service.recordFailedAttempt('127.0.0.1:trader', 1_000);
    service.recordFailedAttempt('127.0.0.1:trader', 2_000);
    expect(() => service.recordFailedAttempt('127.0.0.1:trader', 3_000)).toThrow(HttpException);

    expect(() => service.assertLoginAllowed('127.0.0.1:trader', 10_000)).toThrow(HttpException);
    expect(() => service.assertLoginAllowed('127.0.0.1:trader', 64_001)).not.toThrow();
  });

  it('clears the rate limit state after a successful login', () => {
    service.recordFailedAttempt('127.0.0.1:trader', 1_000);
    service.recordFailedAttempt('127.0.0.1:trader', 2_000);
    service.reset('127.0.0.1:trader');

    expect(() => service.assertLoginAllowed('127.0.0.1:trader', 3_000)).not.toThrow();
  });

  it('uses HTTP 429 for blocked attempts', () => {
    service.recordFailedAttempt('127.0.0.1:trader', 1_000);
    service.recordFailedAttempt('127.0.0.1:trader', 2_000);

    try {
      service.recordFailedAttempt('127.0.0.1:trader', 3_000);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
  });
});
