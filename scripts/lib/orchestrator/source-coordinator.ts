// ============================================================================
// Source Coordinator
// ============================================================================
// Manages data source registry, priorities, and dynamic enable/disable.
// Provides health monitoring, capability-based source lookup, and automatic
// source management based on health status.
// ============================================================================

import type { DataSourceConfig, HealthStatus, SourceHealthReport } from './types';
import { fetchAllCODMunityStats } from '../scrapers/codmunity-scraper';
import { fetchAllCODArmoryData } from '../scrapers/codarmory-fetcher';
import { fetchWZStatsMetaData } from '../scrapers/wzstats-scraper';

// ============================================================================
// Data Source Registry
// ============================================================================

/**
 * Data source registry with metadata
 */
export const dataSourceRegistry: Record<string, DataSourceConfig> = {
  codarmory: {
    name: 'CODArmory',
    priority: 1,
    provides: ['baseStats', 'attachments'],
    updateFrequency: 'weekly',
    reliability: 0.95,
    fetcher: fetchAllCODArmoryData,
    enabled: true,
    timeout: 30000, // 30 seconds
    maxRetries: 3,
  },
  wzstats: {
    name: 'WZStats.gg',
    priority: 2,
    provides: ['tier', 'winRate', 'pickRate'],
    updateFrequency: 'hourly',
    reliability: 0.90,
    fetcher: fetchWZStatsMetaData,
    enabled: process.env.WZSTATS_SCRAPER_ENABLED === 'true',
    timeout: 20000, // 20 seconds
    maxRetries: 3,
  },
  codmunity: {
    name: 'CODMunity',
    priority: 3,
    provides: ['ttk', 'damageRanges', 'recoil', 'bulletVelocity', 'movementSpeed'],
    updateFrequency: 'daily',
    reliability: 0.92,
    fetcher: fetchAllCODMunityStats,
    enabled: process.env.CODMUNITY_SCRAPER_ENABLED === 'true',
    timeout: 25000, // 25 seconds
    maxRetries: 3,
  },
};

// ============================================================================
// Source Coordinator Class
// ============================================================================

/**
 * Source Coordinator Class
 * Manages source registry and execution priorities
 */
export class SourceCoordinator {
  private registry: Record<string, DataSourceConfig>;
  private healthHistory: Map<string, SourceHealthReport>;

  constructor(customRegistry?: Record<string, DataSourceConfig>) {
    this.registry = customRegistry || { ...dataSourceRegistry };
    this.healthHistory = new Map();

    // Initialize health history
    Object.keys(this.registry).forEach((sourceName) => {
      this.healthHistory.set(sourceName, {
        sourceName,
        status: 'unknown',
        consecutiveFailures: 0,
        averageLatency: 0,
        uptime: 100,
      });
    });
  }

  /**
   * Get all registered sources
   */
  getAllSources(): DataSourceConfig[] {
    return Object.values(this.registry);
  }

  /**
   * Get enabled sources sorted by priority
   */
  getEnabledSources(): DataSourceConfig[] {
    return Object.values(this.registry)
      .filter((source) => source.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get source by name
   */
  getSource(sourceName: string): DataSourceConfig | undefined {
    return this.registry[sourceName];
  }

  /**
   * Enable a source
   */
  enableSource(sourceName: string): boolean {
    const source = this.registry[sourceName];
    if (!source) {
      console.warn(`Source "${sourceName}" not found in registry`);
      return false;
    }

    source.enabled = true;
    console.log(`Source "${sourceName}" enabled`);
    return true;
  }

  /**
   * Disable a source
   */
  disableSource(sourceName: string): boolean {
    const source = this.registry[sourceName];
    if (!source) {
      console.warn(`Source "${sourceName}" not found in registry`);
      return false;
    }

    source.enabled = false;
    console.log(`Source "${sourceName}" disabled`);
    return true;
  }

  /**
   * Update source priority
   */
  updatePriority(sourceName: string, newPriority: number): boolean {
    const source = this.registry[sourceName];
    if (!source) {
      console.warn(`Source "${sourceName}" not found in registry`);
      return false;
    }

    const oldPriority = source.priority;
    source.priority = newPriority;
    console.log(`Source "${sourceName}" priority updated: ${oldPriority} -> ${newPriority}`);
    return true;
  }

  /**
   * Register a new source
   */
  registerSource(sourceName: string, config: DataSourceConfig): void {
    if (this.registry[sourceName]) {
      console.warn(`Source "${sourceName}" already registered, overwriting...`);
    }

    this.registry[sourceName] = config;
    this.healthHistory.set(sourceName, {
      sourceName,
      status: 'unknown',
      consecutiveFailures: 0,
      averageLatency: 0,
      uptime: 100,
    });

    console.log(`Source "${sourceName}" registered`);
  }

  /**
   * Unregister a source
   */
  unregisterSource(sourceName: string): boolean {
    if (!this.registry[sourceName]) {
      console.warn(`Source "${sourceName}" not found in registry`);
      return false;
    }

    delete this.registry[sourceName];
    this.healthHistory.delete(sourceName);
    console.log(`Source "${sourceName}" unregistered`);
    return true;
  }

  /**
   * Update source health
   */
  updateSourceHealth(report: SourceHealthReport): void {
    this.healthHistory.set(report.sourceName, report);
  }

  /**
   * Get source health
   */
  getSourceHealth(sourceName: string): SourceHealthReport | undefined {
    return this.healthHistory.get(sourceName);
  }

  /**
   * Get all source health reports
   */
  getAllSourceHealth(): SourceHealthReport[] {
    return Array.from(this.healthHistory.values());
  }

  /**
   * Get sources by capability
   */
  getSourcesByCapability(capability: string): DataSourceConfig[] {
    return Object.values(this.registry)
      .filter((source) => source.provides.includes(capability as any))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Auto-disable unhealthy sources
   * Disables sources with consecutive failures above threshold
   */
  autoDisableUnhealthySources(failureThreshold = 5): string[] {
    const disabled: string[] = [];

    this.healthHistory.forEach((health, sourceName) => {
      if (health.consecutiveFailures >= failureThreshold) {
        const source = this.registry[sourceName];
        if (source && source.enabled) {
          source.enabled = false;
          disabled.push(sourceName);
          console.warn(
            `Auto-disabled source "${sourceName}" due to ${health.consecutiveFailures} consecutive failures`
          );
        }
      }
    });

    return disabled;
  }

  /**
   * Auto-enable recovered sources
   * Re-enables sources that have recovered after being disabled
   */
  autoEnableRecoveredSources(): string[] {
    const enabled: string[] = [];

    this.healthHistory.forEach((health, sourceName) => {
      if (health.status === 'healthy' && health.consecutiveFailures === 0) {
        const source = this.registry[sourceName];
        if (source && !source.enabled) {
          source.enabled = true;
          enabled.push(sourceName);
          console.log(`Auto-enabled recovered source "${sourceName}"`);
        }
      }
    });

    return enabled;
  }

  /**
   * Calculate overall health status
   */
  getOverallHealth(): {
    status: HealthStatus;
    healthySources: number;
    degradedSources: number;
    downSources: number;
    totalSources: number;
  } {
    let healthy = 0;
    let degraded = 0;
    let down = 0;

    this.healthHistory.forEach((health) => {
      switch (health.status) {
        case 'healthy':
          healthy++;
          break;
        case 'degraded':
          degraded++;
          break;
        case 'down':
          down++;
          break;
      }
    });

    const total = this.healthHistory.size;
    let overallStatus: HealthStatus = 'healthy';

    if (down === total) {
      overallStatus = 'down';
    } else if (down > 0 || degraded > total / 2) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      healthySources: healthy,
      degradedSources: degraded,
      downSources: down,
      totalSources: total,
    };
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const all = this.getAllSources();
    const enabled = this.getEnabledSources();

    return {
      totalSources: all.length,
      enabledSources: enabled.length,
      disabledSources: all.length - enabled.length,
      byUpdateFrequency: this.groupByFrequency(all),
      byCapability: this.groupByCapability(all),
      averageReliability: this.calculateAverageReliability(enabled),
    };
  }

  /**
   * Group sources by update frequency
   */
  private groupByFrequency(sources: DataSourceConfig[]) {
    const groups: Record<string, number> = {};
    sources.forEach((source) => {
      groups[source.updateFrequency] = (groups[source.updateFrequency] || 0) + 1;
    });
    return groups;
  }

  /**
   * Group sources by capability
   */
  private groupByCapability(sources: DataSourceConfig[]) {
    const groups: Record<string, string[]> = {};
    sources.forEach((source) => {
      source.provides.forEach((capability) => {
        if (!groups[capability]) {
          groups[capability] = [];
        }
        groups[capability].push(source.name);
      });
    });
    return groups;
  }

  /**
   * Calculate average reliability
   */
  private calculateAverageReliability(sources: DataSourceConfig[]): number {
    if (sources.length === 0) return 0;
    const sum = sources.reduce((acc, source) => acc + source.reliability, 0);
    return sum / sources.length;
  }
}

// Export singleton instance
export const sourceCoordinator = new SourceCoordinator();
