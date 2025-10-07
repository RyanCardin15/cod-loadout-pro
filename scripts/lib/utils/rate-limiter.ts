/**
 * Rate Limiter for API requests
 * Ensures we don't exceed rate limits when scraping data
 */

interface RateLimiterConfig {
  requestsPerMinute: number;
  requestsPerHour?: number;
}

export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestTimestamps: number[] = [];
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    // Wait if we've hit the rate limit
    await this.waitIfNeeded();

    // Execute next item
    const fn = this.queue.shift();
    if (fn) {
      this.requestTimestamps.push(Date.now());
      await fn();
    }

    // Process next item
    this.processQueue();
  }

  private async waitIfNeeded() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Clean up old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => ts > oneHourAgo
    );

    // Check per-minute limit
    const recentRequests = this.requestTimestamps.filter(
      (ts) => ts > oneMinuteAgo
    );

    if (recentRequests.length >= this.config.requestsPerMinute) {
      const oldestRecent = Math.min(...recentRequests);
      const waitTime = 60 * 1000 - (now - oldestRecent);
      console.log(`⏳ Rate limit: waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Check per-hour limit if configured
    if (this.config.requestsPerHour) {
      const hourlyRequests = this.requestTimestamps.filter(
        (ts) => ts > oneHourAgo
      );

      if (hourlyRequests.length >= this.config.requestsPerHour) {
        const oldestHourly = Math.min(...hourlyRequests);
        const waitTime = 60 * 60 * 1000 - (now - oldestHourly);
        console.log(
          `⏳ Hourly rate limit: waiting ${Math.ceil(waitTime / 1000 / 60)}m...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue = [];
    this.processing = false;
  }
}

// Pre-configured rate limiters for different sources
export const rateLimiters = {
  github: new RateLimiter({ requestsPerMinute: 60, requestsPerHour: 5000 }),
  truegamedata: new RateLimiter({ requestsPerMinute: 10 }),
  wzranked: new RateLimiter({ requestsPerMinute: 30 }),
  symgg: new RateLimiter({ requestsPerMinute: 20 }),
  codmunity: new RateLimiter({ requestsPerMinute: 30 }),
};
