import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  directory?: string;
}

/**
 * Simple file-based cache for scraped data
 */
export class Cache {
  private cacheDir: string;
  private defaultTTL: number;

  constructor(options: CacheOptions = {}) {
    this.cacheDir = options.directory || path.join(process.cwd(), '.cache');
    this.defaultTTL = options.ttl || 24 * 60 * 60 * 1000; // 24 hours default
  }

  /**
   * Initialize cache directory
   */
  async init() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  /**
   * Generate cache key from input
   */
  private getCacheKey(key: string): string {
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Get cache file path
   */
  private getCachePath(key: string): string {
    const hash = this.getCacheKey(key);
    return path.join(this.cacheDir, `${hash}.json`);
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const filePath = this.getCachePath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      const cached = JSON.parse(data);

      // Check if expired
      if (cached.expiresAt && Date.now() > cached.expiresAt) {
        await this.delete(key);
        return null;
      }

      return cached.value as T;
    } catch (error) {
      // Cache miss
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.init();
      const filePath = this.getCachePath(key);
      const expiresAt = Date.now() + (ttl || this.defaultTTL);

      const data = JSON.stringify({
        value,
        expiresAt,
        cachedAt: Date.now(),
      });

      await fs.writeFile(filePath, data, 'utf-8');
    } catch (error) {
      console.error('Failed to write cache:', error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getCachePath(key);
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore errors (file might not exist)
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map((file) => fs.unlink(path.join(this.cacheDir, file)))
      );
      console.log(`🗑️  Cleared ${files.length} cache files`);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<{ files: number; size: number }> {
    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;

      for (const file of files) {
        const stats = await fs.stat(path.join(this.cacheDir, file));
        totalSize += stats.size;
      }

      return {
        files: files.length,
        size: totalSize,
      };
    } catch (error) {
      return { files: 0, size: 0 };
    }
  }

  /**
   * Execute function with caching
   */
  async cached<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      console.log(`✅ Cache hit: ${key}`);
      return cached;
    }

    // Execute function
    console.log(`⏬ Cache miss: ${key}, fetching...`);
    const value = await fn();

    // Store in cache
    await this.set(key, value, ttl);

    return value;
  }
}

// Export singleton instance
export const cache = new Cache({
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days default
});
