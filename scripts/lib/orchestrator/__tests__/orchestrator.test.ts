/**
 * Data Source Orchestrator Tests
 * Tests parallel execution, retry logic, timeout handling, and partial failures
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DataSourceOrchestrator } from '../data-source-orchestrator';
import { SourceCoordinator } from '../source-coordinator';
import type { DataSourceConfig } from '../types';

describe('DataSourceOrchestrator', () => {
  let orchestrator: DataSourceOrchestrator;
  let coordinator: SourceCoordinator;

  beforeEach(() => {
    // Create test coordinator with mock sources
    coordinator = new SourceCoordinator(createMockRegistry());
    orchestrator = new DataSourceOrchestrator(
      coordinator,
      { timeout: 5000, maxRetries: 2, parallelExecution: true },
      { maxRetries: 2, baseDelayMs: 100, maxDelayMs: 500, exponentialBackoff: true, jitter: false }
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Parallel Execution', () => {
    it('should execute all enabled sources in parallel', async () => {
      const startTime = Date.now();
      const result = await orchestrator.fetchFromAllSources();
      const duration = Date.now() - startTime;

      // Parallel execution should take roughly as long as the slowest source (500ms)
      // Not the sum of all sources
      expect(duration).toBeLessThan(1000);
      expect(result.metadata.sources.length).toBe(3);
      expect(result.metadata.successCount).toBe(3);
      expect(result.metadata.failureCount).toBe(0);
    });

    it('should return data from all successful sources', async () => {
      const result = await orchestrator.fetchFromAllSources();

      expect(result.codarmory).toBeDefined();
      expect(result.wzstats).toBeDefined();
      expect(result.codmunity).toBeDefined();
    });

    it('should track execution metrics for each source', async () => {
      await orchestrator.fetchFromAllSources();
      const metrics = orchestrator.getMetrics();

      expect(metrics.totalExecutions).toBe(1);
      expect(metrics.successfulExecutions).toBe(1);
      expect(metrics.sourceMetrics).toHaveProperty('MockCODArmory');
      expect(metrics.sourceMetrics).toHaveProperty('MockWZStats');
      expect(metrics.sourceMetrics).toHaveProperty('MockCODMunity');
    });
  });

  describe('Partial Failures', () => {
    it('should handle partial failures gracefully', async () => {
      // Create registry with one failing source
      const registryWithFailure = createMockRegistry();
      registryWithFailure.wzstats.fetcher = vi.fn().mockRejectedValue(new Error('API down'));

      coordinator = new SourceCoordinator(registryWithFailure);
      orchestrator = new DataSourceOrchestrator(coordinator, {
        timeout: 5000,
        maxRetries: 1,
        parallelExecution: true,
      });

      const result = await orchestrator.fetchFromAllSources();

      // Should have 2 successes and 1 failure
      expect(result.metadata.successCount).toBe(2);
      expect(result.metadata.failureCount).toBe(1);

      // Successful sources should have data
      expect(result.codarmory).toBeDefined();
      expect(result.codmunity).toBeDefined();

      // Failed source should not have data
      expect(result.wzstats).toBeUndefined();
    });

    it('should continue execution when one source fails', async () => {
      const registryWithFailure = createMockRegistry();
      registryWithFailure.codarmory.fetcher = vi.fn().mockRejectedValue(new Error('Network error'));

      coordinator = new SourceCoordinator(registryWithFailure);
      orchestrator = new DataSourceOrchestrator(coordinator, {
        timeout: 5000,
        maxRetries: 1,
        parallelExecution: true,
      });

      const result = await orchestrator.fetchFromAllSources();

      expect(result.metadata.successCount).toBeGreaterThan(0);
      expect(result.metadata.failureCount).toBe(1);
    });

    it('should update health status for failed sources', async () => {
      const registryWithFailure = createMockRegistry();
      registryWithFailure.codmunity.fetcher = vi.fn().mockRejectedValue(new Error('Timeout'));

      coordinator = new SourceCoordinator(registryWithFailure);
      orchestrator = new DataSourceOrchestrator(coordinator);

      await orchestrator.fetchFromAllSources();

      const health = coordinator.getSourceHealth('MockCODMunity');
      expect(health).toBeDefined();
      expect(health!.consecutiveFailures).toBeGreaterThan(0);
      expect(health!.status).toBe('degraded');
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout sources that exceed limit', async () => {
      const registryWithSlowSource = createMockRegistry();
      registryWithSlowSource.codarmory.fetcher = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ weapons: [], attachments: [] }), 10000);
          })
      );
      registryWithSlowSource.codarmory.timeout = 500;

      coordinator = new SourceCoordinator(registryWithSlowSource);
      orchestrator = new DataSourceOrchestrator(coordinator, {
        timeout: 5000,
        maxRetries: 0,
        parallelExecution: true,
      });

      const result = await orchestrator.fetchFromAllSources();

      // Slow source should timeout
      expect(result.metadata.failureCount).toBeGreaterThan(0);
      expect(result.codarmory).toBeUndefined();
    });

    it('should respect individual source timeouts', async () => {
      const registry = createMockRegistry();
      registry.codarmory.timeout = 100;
      registry.wzstats.timeout = 200;
      registry.codmunity.timeout = 300;

      coordinator = new SourceCoordinator(registry);
      orchestrator = new DataSourceOrchestrator(coordinator);

      const startTime = Date.now();
      await orchestrator.fetchFromAllSources();
      const duration = Date.now() - startTime;

      // All sources complete within their timeouts
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed sources up to max retries', async () => {
      let attempt = 0;
      const mockFetcher = vi.fn().mockImplementation(() => {
        attempt++;
        if (attempt < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ weapons: [] });
      });

      const registry = createMockRegistry();
      registry.codarmory.fetcher = mockFetcher;

      coordinator = new SourceCoordinator(registry);
      orchestrator = new DataSourceOrchestrator(coordinator, {
        timeout: 5000,
        maxRetries: 3,
        parallelExecution: false,
      });

      const result = await orchestrator.fetchFromAllSources();

      expect(mockFetcher).toHaveBeenCalledTimes(3);
      expect(result.metadata.successCount).toBeGreaterThan(0);
    });

    it('should apply exponential backoff between retries', async () => {
      const timestamps: number[] = [];
      const mockFetcher = vi.fn().mockImplementation(() => {
        timestamps.push(Date.now());
        return Promise.reject(new Error('Fail'));
      });

      const registry = createMockRegistry();
      registry.codarmory.fetcher = mockFetcher;
      registry.wzstats.enabled = false;
      registry.codmunity.enabled = false;

      coordinator = new SourceCoordinator(registry);
      orchestrator = new DataSourceOrchestrator(
        coordinator,
        { timeout: 5000, maxRetries: 2 },
        { maxRetries: 2, baseDelayMs: 100, maxDelayMs: 1000, exponentialBackoff: true, jitter: false }
      );

      await orchestrator.fetchFromAllSources();

      // Check that delays increase exponentially
      expect(timestamps.length).toBe(3); // Initial + 2 retries
      const delay1 = timestamps[1] - timestamps[0];
      const delay2 = timestamps[2] - timestamps[1];

      expect(delay1).toBeGreaterThanOrEqual(90); // ~100ms
      expect(delay2).toBeGreaterThanOrEqual(180); // ~200ms (exponential)
    });

    it('should not retry after max retries exceeded', async () => {
      const mockFetcher = vi.fn().mockRejectedValue(new Error('Permanent failure'));

      const registry = createMockRegistry();
      registry.codarmory.fetcher = mockFetcher;
      registry.wzstats.enabled = false;
      registry.codmunity.enabled = false;

      coordinator = new SourceCoordinator(registry);
      orchestrator = new DataSourceOrchestrator(coordinator, {
        timeout: 5000,
        maxRetries: 2,
      });

      await orchestrator.fetchFromAllSources();

      expect(mockFetcher).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Health Monitoring', () => {
    it('should track consecutive failures', async () => {
      const mockFetcher = vi.fn().mockRejectedValue(new Error('Always fails'));

      const registry = createMockRegistry();
      registry.codarmory.fetcher = mockFetcher;

      coordinator = new SourceCoordinator(registry);
      orchestrator = new DataSourceOrchestrator(coordinator, { maxRetries: 1 });

      // Execute multiple times to accumulate failures
      await orchestrator.fetchFromAllSources();
      await orchestrator.fetchFromAllSources();
      await orchestrator.fetchFromAllSources();

      const health = coordinator.getSourceHealth('MockCODArmory');
      expect(health).toBeDefined();
      expect(health!.consecutiveFailures).toBe(3);
      expect(health!.status).toBe('down');
    });

    it('should reset consecutive failures on success', async () => {
      let failCount = 0;
      const mockFetcher = vi.fn().mockImplementation(() => {
        failCount++;
        if (failCount <= 2) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ weapons: [] });
      });

      const registry = createMockRegistry();
      registry.codarmory.fetcher = mockFetcher;

      coordinator = new SourceCoordinator(registry);
      orchestrator = new DataSourceOrchestrator(coordinator, { maxRetries: 1 });

      // Fail twice
      await orchestrator.fetchFromAllSources();
      await orchestrator.fetchFromAllSources();

      let health = coordinator.getSourceHealth('MockCODArmory');
      expect(health!.consecutiveFailures).toBeGreaterThan(0);

      // Succeed once
      await orchestrator.fetchFromAllSources();

      health = coordinator.getSourceHealth('MockCODArmory');
      expect(health!.consecutiveFailures).toBe(0);
      expect(health!.status).toBe('healthy');
    });

    it('should calculate uptime correctly', async () => {
      const registry = createMockRegistry();
      coordinator = new SourceCoordinator(registry);
      orchestrator = new DataSourceOrchestrator(coordinator);

      // Execute multiple times
      for (let i = 0; i < 10; i++) {
        await orchestrator.fetchFromAllSources();
      }

      const health = coordinator.getSourceHealth('MockCODArmory');
      expect(health!.uptime).toBe(100);
    });

    it('should check source health independently', async () => {
      const reports = await orchestrator.checkSourceHealth();

      expect(reports.length).toBe(3);
      reports.forEach((report) => {
        expect(report.sourceName).toBeDefined();
        expect(report.status).toBeDefined();
        expect(['healthy', 'degraded', 'down']).toContain(report.status);
      });
    });
  });

  describe('Sequential Execution', () => {
    it('should execute sources sequentially when configured', async () => {
      orchestrator = new DataSourceOrchestrator(coordinator, {
        timeout: 5000,
        maxRetries: 1,
        parallelExecution: false,
      });

      const result = await orchestrator.fetchFromAllSources();

      expect(result.metadata.successCount).toBeGreaterThan(0);
    });

    it('should stop on first failure in fail-fast mode', async () => {
      const registry = createMockRegistry();
      registry.codarmory.fetcher = vi.fn().mockRejectedValue(new Error('First fails'));
      const wzstatsFetcher = vi.fn().mockResolvedValue([]);
      const codmunityFetcher = vi.fn().mockResolvedValue([]);
      registry.wzstats.fetcher = wzstatsFetcher;
      registry.codmunity.fetcher = codmunityFetcher;

      coordinator = new SourceCoordinator(registry);
      orchestrator = new DataSourceOrchestrator(coordinator, {
        timeout: 5000,
        maxRetries: 0,
        parallelExecution: false,
        failFast: true,
      });

      await orchestrator.fetchFromAllSources();

      // Only first source should be called
      expect(wzstatsFetcher).not.toHaveBeenCalled();
      expect(codmunityFetcher).not.toHaveBeenCalled();
    });
  });

  describe('Metrics and History', () => {
    it('should track orchestrator metrics', async () => {
      await orchestrator.fetchFromAllSources();
      await orchestrator.fetchFromAllSources();

      const metrics = orchestrator.getMetrics();

      expect(metrics.totalExecutions).toBe(2);
      expect(metrics.successfulExecutions).toBeGreaterThan(0);
      expect(metrics.averageDuration).toBeGreaterThan(0);
      expect(metrics.lastExecution).toBeDefined();
    });

    it('should maintain execution history', async () => {
      await orchestrator.fetchFromAllSources();
      await orchestrator.fetchFromAllSources();

      const history = orchestrator.getExecutionHistory();

      expect(history.length).toBeGreaterThan(0);
      history.forEach((result) => {
        expect(result.sourceName).toBeDefined();
        expect(result.status).toBeDefined();
        expect(result.duration).toBeGreaterThanOrEqual(0);
        expect(result.timestamp).toBeDefined();
      });
    });

    it('should limit history size', async () => {
      // Execute many times
      for (let i = 0; i < 150; i++) {
        await orchestrator.fetchFromAllSources();
      }

      const history = orchestrator.getExecutionHistory();

      // Should be limited to 100 entries per source
      expect(history.length).toBeLessThanOrEqual(300);
    });

    it('should reset metrics when requested', async () => {
      await orchestrator.fetchFromAllSources();

      let metrics = orchestrator.getMetrics();
      expect(metrics.totalExecutions).toBeGreaterThan(0);

      orchestrator.resetMetrics();

      metrics = orchestrator.getMetrics();
      expect(metrics.totalExecutions).toBe(0);
      expect(metrics.successfulExecutions).toBe(0);
    });
  });

  describe('Meta Data Fetching', () => {
    it('should fetch only meta-capable sources', async () => {
      const metaData = await orchestrator.fetchMetaOnly();

      // Should return data from sources that provide tier/winRate/pickRate
      expect(Array.isArray(metaData)).toBe(true);
    });

    it('should be faster than full fetch', async () => {
      const start1 = Date.now();
      await orchestrator.fetchMetaOnly();
      const metaDuration = Date.now() - start1;

      const start2 = Date.now();
      await orchestrator.fetchFromAllSources();
      const fullDuration = Date.now() - start2;

      // Meta fetch should be faster (or at least not slower)
      expect(metaDuration).toBeLessThanOrEqual(fullDuration + 100); // 100ms tolerance
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty source registry', async () => {
      const emptyCoordinator = new SourceCoordinator({});
      const emptyOrchestrator = new DataSourceOrchestrator(emptyCoordinator);

      const result = await emptyOrchestrator.fetchFromAllSources();

      expect(result.metadata.sources.length).toBe(0);
      expect(result.metadata.successCount).toBe(0);
    });

    it('should handle all sources disabled', async () => {
      coordinator.disableSource('MockCODArmory');
      coordinator.disableSource('MockWZStats');
      coordinator.disableSource('MockCODMunity');

      const result = await orchestrator.fetchFromAllSources();

      expect(result.metadata.sources.length).toBe(0);
      expect(result.metadata.successCount).toBe(0);
    });

    it('should handle sources returning null/undefined', async () => {
      const registry = createMockRegistry();
      registry.codarmory.fetcher = vi.fn().mockResolvedValue(null);
      registry.wzstats.fetcher = vi.fn().mockResolvedValue(undefined);

      coordinator = new SourceCoordinator(registry);
      orchestrator = new DataSourceOrchestrator(coordinator);

      const result = await orchestrator.fetchFromAllSources();

      // Should handle gracefully
      expect(result.metadata).toBeDefined();
    });

    it('should handle sources returning empty arrays', async () => {
      const registry = createMockRegistry();
      registry.codarmory.fetcher = vi.fn().mockResolvedValue({ weapons: [], attachments: [] });
      registry.wzstats.fetcher = vi.fn().mockResolvedValue([]);

      coordinator = new SourceCoordinator(registry);
      orchestrator = new DataSourceOrchestrator(coordinator);

      const result = await orchestrator.fetchFromAllSources();

      expect(result.metadata.successCount).toBeGreaterThan(0);
      expect(result.codarmory).toBeDefined();
    });
  });
});

/**
 * Helper: Create mock source registry for testing
 */
function createMockRegistry(): Record<string, DataSourceConfig> {
  return {
    codarmory: {
      name: 'MockCODArmory',
      priority: 1,
      provides: ['baseStats', 'attachments'],
      updateFrequency: 'weekly',
      reliability: 0.95,
      fetcher: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  weapons: [{ name: 'M4A1', category: 'AR' }],
                  attachments: [{ name: 'Red Dot', slot: 'optic' }],
                }),
              300
            );
          })
      ),
      enabled: true,
      timeout: 1000,
      maxRetries: 2,
    },
    wzstats: {
      name: 'MockWZStats',
      priority: 2,
      provides: ['tier', 'winRate', 'pickRate'],
      updateFrequency: 'hourly',
      reliability: 0.90,
      fetcher: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve([
                  { name: 'M4A1', tier: 'S', usage: 15.5, winRate: 54.2, game: 'Warzone' },
                ]),
              200
            );
          })
      ),
      enabled: true,
      timeout: 1000,
      maxRetries: 2,
    },
    codmunity: {
      name: 'MockCODMunity',
      priority: 3,
      provides: ['ttk', 'damageRanges', 'recoil'],
      updateFrequency: 'daily',
      reliability: 0.92,
      fetcher: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve([
                  {
                    name: 'M4A1',
                    ttk: { min: 300, max: 600 },
                    damageRanges: [{ range: 0, damage: 30 }],
                  },
                ]),
              500
            );
          })
      ),
      enabled: true,
      timeout: 1000,
      maxRetries: 2,
    },
  };
}
