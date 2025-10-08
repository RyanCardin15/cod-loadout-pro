/**
 * Source Coordinator Tests
 * Tests source registry, priority management, and enable/disable functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SourceCoordinator } from '../source-coordinator';
import type { DataSourceConfig, SourceHealthReport } from '../types';

describe('SourceCoordinator', () => {
  let coordinator: SourceCoordinator;

  beforeEach(() => {
    coordinator = new SourceCoordinator(createTestRegistry());
  });

  describe('Source Registry Management', () => {
    it('should return all registered sources', () => {
      const sources = coordinator.getAllSources();
      expect(sources.length).toBe(3);
    });

    it('should return only enabled sources', () => {
      coordinator.disableSource('testSource2');
      const enabledSources = coordinator.getEnabledSources();

      expect(enabledSources.length).toBe(2);
      expect(enabledSources.every((s) => s.enabled)).toBe(true);
    });

    it('should sort enabled sources by priority', () => {
      const sources = coordinator.getEnabledSources();

      expect(sources[0].priority).toBe(1);
      expect(sources[1].priority).toBe(2);
      expect(sources[2].priority).toBe(3);
    });

    it('should get source by name', () => {
      const source = coordinator.getSource('testSource1');

      expect(source).toBeDefined();
      expect(source!.name).toBe('Test Source 1');
    });

    it('should return undefined for non-existent source', () => {
      const source = coordinator.getSource('nonExistent');
      expect(source).toBeUndefined();
    });
  });

  describe('Enable/Disable Sources', () => {
    it('should enable a source', () => {
      coordinator.disableSource('testSource1');
      const result = coordinator.enableSource('testSource1');

      expect(result).toBe(true);
      const source = coordinator.getSource('testSource1');
      expect(source!.enabled).toBe(true);
    });

    it('should disable a source', () => {
      const result = coordinator.disableSource('testSource1');

      expect(result).toBe(true);
      const source = coordinator.getSource('testSource1');
      expect(source!.enabled).toBe(false);
    });

    it('should return false when enabling non-existent source', () => {
      const result = coordinator.enableSource('nonExistent');
      expect(result).toBe(false);
    });

    it('should return false when disabling non-existent source', () => {
      const result = coordinator.disableSource('nonExistent');
      expect(result).toBe(false);
    });

    it('should handle enabling already enabled source', () => {
      const result = coordinator.enableSource('testSource1');
      expect(result).toBe(true);
      const source = coordinator.getSource('testSource1');
      expect(source!.enabled).toBe(true);
    });

    it('should handle disabling already disabled source', () => {
      coordinator.disableSource('testSource1');
      const result = coordinator.disableSource('testSource1');

      expect(result).toBe(true);
      const source = coordinator.getSource('testSource1');
      expect(source!.enabled).toBe(false);
    });
  });

  describe('Priority Management', () => {
    it('should update source priority', () => {
      const result = coordinator.updatePriority('testSource3', 1);

      expect(result).toBe(true);
      const source = coordinator.getSource('testSource3');
      expect(source!.priority).toBe(1);
    });

    it('should return false when updating priority of non-existent source', () => {
      const result = coordinator.updatePriority('nonExistent', 1);
      expect(result).toBe(false);
    });

    it('should reorder sources after priority update', () => {
      coordinator.updatePriority('testSource3', 1);
      const sources = coordinator.getEnabledSources();

      expect(sources[0].name).toBe('Test Source 3');
    });

    it('should handle multiple sources with same priority', () => {
      coordinator.updatePriority('testSource2', 1);
      coordinator.updatePriority('testSource3', 1);

      const sources = coordinator.getEnabledSources();

      // All should have priority 1
      expect(sources.filter((s) => s.priority === 1).length).toBeGreaterThan(1);
    });
  });

  describe('Source Registration', () => {
    it('should register a new source', () => {
      const newSource: DataSourceConfig = {
        name: 'New Source',
        priority: 4,
        provides: ['baseStats'],
        updateFrequency: 'daily',
        reliability: 0.85,
        fetcher: vi.fn().mockResolvedValue({}),
        enabled: true,
      };

      coordinator.registerSource('newSource', newSource);

      const source = coordinator.getSource('newSource');
      expect(source).toBeDefined();
      expect(source!.name).toBe('New Source');
    });

    it('should overwrite existing source when registering with same name', () => {
      const newConfig: DataSourceConfig = {
        name: 'Updated Source',
        priority: 10,
        provides: ['baseStats'],
        updateFrequency: 'daily',
        reliability: 0.85,
        fetcher: vi.fn().mockResolvedValue({}),
        enabled: true,
      };

      coordinator.registerSource('testSource1', newConfig);

      const source = coordinator.getSource('testSource1');
      expect(source!.name).toBe('Updated Source');
      expect(source!.priority).toBe(10);
    });

    it('should initialize health history for new source', () => {
      const newSource: DataSourceConfig = {
        name: 'New Source',
        priority: 4,
        provides: ['baseStats'],
        updateFrequency: 'daily',
        reliability: 0.85,
        fetcher: vi.fn().mockResolvedValue({}),
        enabled: true,
      };

      coordinator.registerSource('newSource', newSource);

      const health = coordinator.getSourceHealth('newSource');
      expect(health).toBeDefined();
      expect(health!.status).toBe('unknown');
    });
  });

  describe('Source Unregistration', () => {
    it('should unregister a source', () => {
      const result = coordinator.unregisterSource('testSource1');

      expect(result).toBe(true);
      const source = coordinator.getSource('testSource1');
      expect(source).toBeUndefined();
    });

    it('should return false when unregistering non-existent source', () => {
      const result = coordinator.unregisterSource('nonExistent');
      expect(result).toBe(false);
    });

    it('should remove health history when unregistering', () => {
      coordinator.unregisterSource('testSource1');

      const health = coordinator.getSourceHealth('testSource1');
      expect(health).toBeUndefined();
    });
  });

  describe('Health Monitoring', () => {
    it('should update source health', () => {
      const healthReport: SourceHealthReport = {
        sourceName: 'testSource1',
        status: 'healthy',
        lastSuccessfulFetch: Date.now(),
        consecutiveFailures: 0,
        averageLatency: 150,
        uptime: 100,
      };

      coordinator.updateSourceHealth(healthReport);

      const health = coordinator.getSourceHealth('testSource1');
      expect(health).toEqual(healthReport);
    });

    it('should get health for specific source', () => {
      const health = coordinator.getSourceHealth('testSource1');

      expect(health).toBeDefined();
      expect(health!.sourceName).toBe('testSource1');
    });

    it('should get all source health reports', () => {
      const reports = coordinator.getAllSourceHealth();

      expect(reports.length).toBe(3);
      reports.forEach((report) => {
        expect(report.sourceName).toBeDefined();
        expect(report.status).toBeDefined();
      });
    });

    it('should track consecutive failures', () => {
      const healthReport: SourceHealthReport = {
        sourceName: 'testSource1',
        status: 'degraded',
        consecutiveFailures: 3,
        averageLatency: 500,
        uptime: 70,
      };

      coordinator.updateSourceHealth(healthReport);

      const health = coordinator.getSourceHealth('testSource1');
      expect(health!.consecutiveFailures).toBe(3);
    });
  });

  describe('Auto Health Management', () => {
    it('should auto-disable unhealthy sources', () => {
      // Set source as unhealthy with many failures
      const healthReport: SourceHealthReport = {
        sourceName: 'testSource1',
        status: 'down',
        consecutiveFailures: 5,
        averageLatency: 1000,
        uptime: 20,
      };

      coordinator.updateSourceHealth(healthReport);

      const disabled = coordinator.autoDisableUnhealthySources(5);

      expect(disabled).toContain('testSource1');
      const source = coordinator.getSource('testSource1');
      expect(source!.enabled).toBe(false);
    });

    it('should not disable sources below failure threshold', () => {
      const healthReport: SourceHealthReport = {
        sourceName: 'testSource1',
        status: 'degraded',
        consecutiveFailures: 3,
        averageLatency: 500,
        uptime: 80,
      };

      coordinator.updateSourceHealth(healthReport);

      const disabled = coordinator.autoDisableUnhealthySources(5);

      expect(disabled).not.toContain('testSource1');
      const source = coordinator.getSource('testSource1');
      expect(source!.enabled).toBe(true);
    });

    it('should auto-enable recovered sources', () => {
      // First disable a source
      coordinator.disableSource('testSource1');

      // Mark as recovered
      const healthReport: SourceHealthReport = {
        sourceName: 'testSource1',
        status: 'healthy',
        consecutiveFailures: 0,
        averageLatency: 150,
        uptime: 100,
        lastSuccessfulFetch: Date.now(),
      };

      coordinator.updateSourceHealth(healthReport);

      const enabled = coordinator.autoEnableRecoveredSources();

      expect(enabled).toContain('testSource1');
      const source = coordinator.getSource('testSource1');
      expect(source!.enabled).toBe(true);
    });

    it('should not enable sources that are not healthy', () => {
      coordinator.disableSource('testSource1');

      const healthReport: SourceHealthReport = {
        sourceName: 'testSource1',
        status: 'degraded',
        consecutiveFailures: 2,
        averageLatency: 500,
        uptime: 70,
      };

      coordinator.updateSourceHealth(healthReport);

      const enabled = coordinator.autoEnableRecoveredSources();

      expect(enabled).not.toContain('testSource1');
      const source = coordinator.getSource('testSource1');
      expect(source!.enabled).toBe(false);
    });
  });

  describe('Capability-Based Queries', () => {
    it('should get sources by capability', () => {
      const sources = coordinator.getSourcesByCapability('baseStats');

      expect(sources.length).toBeGreaterThan(0);
      sources.forEach((source) => {
        expect(source.provides).toContain('baseStats');
      });
    });

    it('should return sources sorted by priority', () => {
      const sources = coordinator.getSourcesByCapability('baseStats');

      for (let i = 1; i < sources.length; i++) {
        expect(sources[i].priority).toBeGreaterThanOrEqual(sources[i - 1].priority);
      }
    });

    it('should return empty array for non-existent capability', () => {
      const sources = coordinator.getSourcesByCapability('nonExistent');
      expect(sources.length).toBe(0);
    });

    it('should include disabled sources in capability search', () => {
      coordinator.disableSource('testSource1');
      const sources = coordinator.getSourcesByCapability('baseStats');

      // Should still include disabled source
      expect(sources.length).toBeGreaterThan(0);
    });
  });

  describe('Overall Health Calculation', () => {
    it('should calculate overall health as healthy when all sources healthy', () => {
      // Mark all as healthy
      ['testSource1', 'testSource2', 'testSource3'].forEach((name) => {
        coordinator.updateSourceHealth({
          sourceName: name,
          status: 'healthy',
          consecutiveFailures: 0,
          averageLatency: 100,
          uptime: 100,
        });
      });

      const overall = coordinator.getOverallHealth();

      expect(overall.status).toBe('healthy');
      expect(overall.healthySources).toBe(3);
      expect(overall.downSources).toBe(0);
    });

    it('should calculate overall health as degraded when some sources down', () => {
      coordinator.updateSourceHealth({
        sourceName: 'testSource1',
        status: 'down',
        consecutiveFailures: 10,
        averageLatency: 1000,
        uptime: 0,
      });

      const overall = coordinator.getOverallHealth();

      expect(overall.status).toBe('degraded');
      expect(overall.downSources).toBeGreaterThan(0);
    });

    it('should calculate overall health as down when all sources down', () => {
      ['testSource1', 'testSource2', 'testSource3'].forEach((name) => {
        coordinator.updateSourceHealth({
          sourceName: name,
          status: 'down',
          consecutiveFailures: 10,
          averageLatency: 1000,
          uptime: 0,
        });
      });

      const overall = coordinator.getOverallHealth();

      expect(overall.status).toBe('down');
      expect(overall.downSources).toBe(3);
    });
  });

  describe('Statistics', () => {
    it('should return registry statistics', () => {
      const stats = coordinator.getStats();

      expect(stats.totalSources).toBe(3);
      expect(stats.enabledSources).toBe(3);
      expect(stats.disabledSources).toBe(0);
      expect(stats.byUpdateFrequency).toBeDefined();
      expect(stats.byCapability).toBeDefined();
      expect(stats.averageReliability).toBeGreaterThan(0);
    });

    it('should group sources by update frequency', () => {
      const stats = coordinator.getStats();

      expect(stats.byUpdateFrequency).toBeDefined();
      expect(typeof stats.byUpdateFrequency).toBe('object');
    });

    it('should group sources by capability', () => {
      const stats = coordinator.getStats();

      expect(stats.byCapability).toBeDefined();
      expect(stats.byCapability['baseStats']).toBeDefined();
      expect(Array.isArray(stats.byCapability['baseStats'])).toBe(true);
    });

    it('should calculate average reliability correctly', () => {
      const stats = coordinator.getStats();

      // Average of 0.95, 0.90, 0.92 = 0.92333...
      expect(stats.averageReliability).toBeCloseTo(0.923, 2);
    });

    it('should update stats after disabling sources', () => {
      coordinator.disableSource('testSource1');
      const stats = coordinator.getStats();

      expect(stats.enabledSources).toBe(2);
      expect(stats.disabledSources).toBe(1);
    });
  });
});

/**
 * Helper: Create test registry
 */
function createTestRegistry(): Record<string, DataSourceConfig> {
  return {
    testSource1: {
      name: 'Test Source 1',
      priority: 1,
      provides: ['baseStats', 'attachments'],
      updateFrequency: 'weekly',
      reliability: 0.95,
      fetcher: vi.fn().mockResolvedValue({}),
      enabled: true,
    },
    testSource2: {
      name: 'Test Source 2',
      priority: 2,
      provides: ['tier', 'winRate', 'pickRate'],
      updateFrequency: 'hourly',
      reliability: 0.90,
      fetcher: vi.fn().mockResolvedValue({}),
      enabled: true,
    },
    testSource3: {
      name: 'Test Source 3',
      priority: 3,
      provides: ['ttk', 'damageRanges'],
      updateFrequency: 'daily',
      reliability: 0.92,
      fetcher: vi.fn().mockResolvedValue({}),
      enabled: true,
    },
  };
}
