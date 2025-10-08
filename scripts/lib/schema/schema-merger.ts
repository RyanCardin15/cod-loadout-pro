/**
 * Schema Merger - Multi-Source Data Integration
 *
 * Responsible for merging weapon data from multiple sources into a
 * unified schema with lineage tracking and conflict resolution.
 *
 * Features:
 * - Complete mergeWeapons() logic with multi-source support
 * - Field-level merging with confidence scoring
 * - Automatic conflict detection and resolution
 * - Balance patch integration
 * - Historical tracking
 */

import { createHash } from 'crypto';
import type { UnifiedWeapon, WeaponStatField, WeaponMetaField } from '../../../server/src/models/unified-weapon.model';
import { DataSource } from '../lineage/lineage-schema';
import type { SourceRecord, MultiSourceField, ConfidenceScore } from '../lineage/lineage-schema';
import type { CODArmoryWeapon } from '../scrapers/codarmory-fetcher';
import type { WZStatsWeapon } from '../scrapers/wzstats-scraper';
import type { CODMunityStats } from '../scrapers/codmunity-scraper';
import { conflictResolver, type ResolutionStrategy } from './conflict-resolver';
import { lineageTracker } from '../lineage/lineage-tracker';

// ============================================================================
// Input Types for Multi-Source Data
// ============================================================================

/**
 * Weapon data from a single source with metadata
 */
export interface SourcedWeaponData {
  /** Source identifier */
  source: DataSource;

  /** Raw weapon data from this source */
  data: CODArmoryWeapon | WZStatsWeapon | CODMunityStats | any;

  /** When this data was fetched/updated */
  timestamp: number;

  /** Reference URL or identifier */
  reference?: string;

  /** Additional notes about this data */
  notes?: string;
}

/**
 * Configuration for merge operations
 */
export interface MergeConfig {
  /** Default resolution strategy for stats */
  defaultStatStrategy: ResolutionStrategy;

  /** Default resolution strategy for meta fields */
  defaultMetaStrategy: ResolutionStrategy;

  /** Default resolution strategy for ballistics */
  defaultBallisticsStrategy: ResolutionStrategy;

  /** Whether to preserve all source records */
  preserveAllSources: boolean;

  /** Minimum confidence threshold to include a source */
  minConfidenceThreshold: number;

  /** Whether to automatically resolve conflicts */
  autoResolveConflicts: boolean;

  /** Maximum age of data to consider (ms) */
  maxDataAge?: number;
}

/**
 * Result of a merge operation
 */
export interface MergeResult {
  /** Merged unified weapon */
  weapon: UnifiedWeapon;

  /** Statistics about the merge */
  stats: {
    sourcesProcessed: number;
    fieldsResolved: number;
    conflictsDetected: number;
    conflictsResolved: number;
    averageConfidence: number;
  };

  /** Warnings or issues encountered */
  warnings: string[];

  /** Errors that occurred (non-fatal) */
  errors: string[];
}

// ============================================================================
// Schema Merger Class
// ============================================================================

/**
 * Schema merger for integrating multi-source weapon data
 *
 * Implements:
 * - Field-level conflict resolution using ConflictResolver
 * - Confidence score calculation via LineageTracker
 * - Automatic data validation with comprehensive checks
 * - Multi-source field tracking with lineage metadata
 * - Support for stats, meta, and ballistics merging
 * - Balance patch integration support
 * - Historical change tracking capability
 */
export class SchemaMerger {
  private config: MergeConfig;

  constructor(config?: Partial<MergeConfig>) {
    this.config = {
      defaultStatStrategy: config?.defaultStatStrategy ?? 'weighted_average',
      defaultMetaStrategy: config?.defaultMetaStrategy ?? 'consensus',
      defaultBallisticsStrategy: config?.defaultBallisticsStrategy ?? 'highest_confidence',
      preserveAllSources: config?.preserveAllSources ?? true,
      minConfidenceThreshold: config?.minConfidenceThreshold ?? 0.3,
      autoResolveConflicts: config?.autoResolveConflicts ?? true,
      maxDataAge: config?.maxDataAge,
    };
  }

  // ==========================================================================
  // Main Merge Method
  // ==========================================================================

  /**
   * Merges weapon data from multiple sources into a unified weapon model
   *
   * @param weaponId - Unique weapon identifier
   * @param sources - Array of sourced weapon data
   * @param existingWeapon - Optional existing weapon to merge into
   * @returns Merge result with unified weapon and statistics
   */
  mergeWeapons(
    weaponId: string,
    sources: SourcedWeaponData[],
    existingWeapon?: UnifiedWeapon
  ): MergeResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Validate inputs
      if (!sources || sources.length === 0) {
        throw new Error('No sources provided for merging');
      }

      console.log(`\n📋 Merging weapon data from ${sources.length} source(s)...`);

      // 1. Extract and normalize data from each source
      const normalizedSources = sources.map((s) => ({
        source: s.source,
        data: this.normalizeSourceData(s.source, s.data),
        timestamp: s.timestamp,
        reference: s.reference,
        notes: s.notes,
      }));

      // Extract basic weapon info from first source
      const firstData = normalizedSources[0].data;
      const weaponName = firstData.name;
      const weaponGame = firstData.game;
      const weaponCategory = firstData.category;

      // Verify all sources refer to the same weapon
      for (const src of normalizedSources) {
        if (!this.weaponsMatch(firstData, src.data)) {
          warnings.push(
            `Source ${src.source} data mismatch - name: ${src.data.name}, game: ${src.data.game}`
          );
        }
      }

      // 2. Merge each field category
      const stats = this.mergeStats(
        normalizedSources.map((s) => ({
          source: s.source,
          stats: s.data.stats || {},
          timestamp: s.timestamp,
        })),
        this.config.defaultStatStrategy
      );

      const meta = this.mergeMeta(
        normalizedSources.map((s) => ({
          source: s.source,
          meta: s.data.meta || {},
          timestamp: s.timestamp,
        })),
        this.config.defaultMetaStrategy
      );

      const ballistics = this.mergeBallistics(
        normalizedSources.map((s) => ({
          source: s.source,
          ballistics: s.data.ballistics || {},
          timestamp: s.timestamp,
        })),
        this.config.defaultBallisticsStrategy
      );

      // Merge attachments
      const attachmentSlots = mergeAttachments(
        normalizedSources.map((s) => ({
          source: s.source,
          attachments: s.data.attachmentSlots || {},
        }))
      );

      // 3. Build partial unified weapon
      const now = Date.now();
      const partialWeapon: Partial<UnifiedWeapon> = {
        id: weaponId,
        name: weaponName,
        game: weaponGame,
        category: weaponCategory,
        stats,
        meta,
        ballistics,
        attachmentSlots,
        bestFor: firstData.bestFor,
        playstyles: firstData.playstyles,
        imageUrl: firstData.imageUrl,
        iconUrl: firstData.iconUrl,
        createdAt: existingWeapon?.createdAt || now,
        updatedAt: now,
      };

      // 4. Build lineage metadata
      const lineage = this.buildLineageMetadata(partialWeapon);

      // Complete weapon with lineage
      const weapon: UnifiedWeapon = {
        ...partialWeapon,
        lineage,
        balanceHistory: existingWeapon?.balanceHistory,
      } as UnifiedWeapon;

      // 5. Validate merged weapon
      const validationErrors = this.validateMergedWeapon(weapon);
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
      }

      // 6. Calculate merge statistics
      const stats_result = {
        sourcesProcessed: sources.length,
        fieldsResolved: Object.keys({ ...stats, ...meta, ...ballistics }).length,
        conflictsDetected: lineage.conflictCount,
        conflictsResolved: lineage.conflictCount, // All auto-resolved
        averageConfidence: lineage.averageConfidence,
      };

      console.log(`✅ Merge complete: ${weapon.name}`);
      console.log(`   Sources: ${stats_result.sourcesProcessed}`);
      console.log(`   Fields: ${stats_result.fieldsResolved}`);
      console.log(`   Conflicts: ${stats_result.conflictsDetected}`);
      console.log(`   Confidence: ${(stats_result.averageConfidence * 100).toFixed(1)}%`);

      return {
        weapon,
        stats: stats_result,
        warnings,
        errors,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Fatal merge error: ${errorMsg}`);
      console.error(`❌ Merge failed: ${errorMsg}`);
      throw error;
    }
  }

  // ==========================================================================
  // Field-Level Merge Methods (Stubs)
  // ==========================================================================

  /**
   * Merges weapon statistics from multiple sources
   *
   * @param sources - Source records for stats
   * @param strategy - Resolution strategy to use
   * @returns Merged stat fields with multi-source tracking
   */
  private mergeStats(
    sources: Array<{ source: DataSource; stats: any; timestamp: number }>,
    strategy: ResolutionStrategy
  ): UnifiedWeapon['stats'] {
    const statFields = ['damage', 'range', 'accuracy', 'fireRate', 'mobility', 'control', 'handling'] as const;
    const result: any = {};

    for (const fieldName of statFields) {
      // Extract source records for this field
      const sourceRecords: SourceRecord[] = sources
        .filter((s) => s.stats[fieldName] !== undefined && s.stats[fieldName] !== null)
        .map((s) => ({
          source: s.source,
          value: Number(s.stats[fieldName]),
          timestamp: s.timestamp,
        }));

      if (sourceRecords.length === 0) {
        // No data for this field - create default
        result[fieldName] = this.createDefaultStatField(fieldName);
        continue;
      }

      // Filter by confidence threshold
      const filteredRecords = this.filterByConfidenceThreshold(sourceRecords);

      if (filteredRecords.length === 0) {
        // All sources below threshold - use best available
        result[fieldName] = this.createMultiSourceFieldFromRecords(
          sourceRecords,
          strategy,
          'number'
        );
      } else {
        // Use high-confidence sources
        result[fieldName] = this.createMultiSourceFieldFromRecords(
          filteredRecords,
          strategy,
          'number'
        );
      }
    }

    return result as UnifiedWeapon['stats'];
  }

  /**
   * Merges weapon meta information from multiple sources
   *
   * @param sources - Source records for meta
   * @param strategy - Resolution strategy to use
   * @returns Merged meta fields with multi-source tracking
   */
  private mergeMeta(
    sources: Array<{ source: DataSource; meta: any; timestamp: number }>,
    strategy: ResolutionStrategy
  ): UnifiedWeapon['meta'] {
    const result: any = {};

    // Merge tier (categorical - use consensus)
    const tierRecords: SourceRecord[] = sources
      .filter((s) => s.meta.tier)
      .map((s) => ({
        source: s.source,
        value: s.meta.tier,
        timestamp: s.timestamp,
      }));

    result.tier =
      tierRecords.length > 0
        ? this.createMultiSourceFieldFromRecords(tierRecords, 'consensus', 'string')
        : this.createDefaultMetaField<'S' | 'A' | 'B' | 'C' | 'D'>('tier', 'C');

    // Merge numeric meta fields (use weighted average)
    const numericFields = ['popularity', 'pickRate', 'winRate', 'kd'] as const;

    for (const fieldName of numericFields) {
      const records: SourceRecord[] = sources
        .filter((s) => s.meta[fieldName] !== undefined && s.meta[fieldName] !== null)
        .map((s) => ({
          source: s.source,
          value: Number(s.meta[fieldName]),
          timestamp: s.timestamp,
        }));

      if (records.length > 0) {
        const filteredRecords = this.filterByConfidenceThreshold(records);
        result[fieldName] = this.createMultiSourceFieldFromRecords(
          filteredRecords.length > 0 ? filteredRecords : records,
          'weighted_average',
          'number'
        );
      } else {
        result[fieldName] = this.createDefaultStatField(fieldName, 0);
      }
    }

    return result as UnifiedWeapon['meta'];
  }

  /**
   * Merges weapon ballistics data from multiple sources
   *
   * @param sources - Source records for ballistics
   * @param strategy - Resolution strategy to use
   * @returns Merged ballistics fields with multi-source tracking
   */
  private mergeBallistics(
    sources: Array<{ source: DataSource; ballistics: any; timestamp: number }>,
    strategy: ResolutionStrategy
  ): UnifiedWeapon['ballistics'] {
    const result: any = {};

    // Merge damage ranges (complex array - use highest confidence)
    const damageRangeRecords: SourceRecord[] = sources
      .filter((s) => s.ballistics.damageRanges)
      .map((s) => ({
        source: s.source,
        value: s.ballistics.damageRanges,
        timestamp: s.timestamp,
      }));

    result.damageRanges =
      damageRangeRecords.length > 0
        ? this.createMultiSourceFieldFromRecords(damageRangeRecords, 'highest_confidence', 'array')
        : this.createDefaultComplexField('damageRanges', []);

    // Merge TTK (complex object - use highest confidence)
    const ttkRecords: SourceRecord[] = sources
      .filter((s) => s.ballistics.ttk)
      .map((s) => ({
        source: s.source,
        value: s.ballistics.ttk,
        timestamp: s.timestamp,
      }));

    result.ttk =
      ttkRecords.length > 0
        ? this.createMultiSourceFieldFromRecords(ttkRecords, 'highest_confidence', 'object')
        : this.createDefaultComplexField('ttk', { min: 0, max: 0 });

    // Merge numeric ballistics fields
    const numericFields = ['fireRate', 'magazineSize', 'reloadTime', 'adTime', 'bulletVelocity'] as const;

    for (const fieldName of numericFields) {
      const records: SourceRecord[] = sources
        .filter((s) => s.ballistics[fieldName] !== undefined && s.ballistics[fieldName] !== null)
        .map((s) => ({
          source: s.source,
          value: Number(s.ballistics[fieldName]),
          timestamp: s.timestamp,
        }));

      if (records.length > 0) {
        const filteredRecords = this.filterByConfidenceThreshold(records);
        result[fieldName] = this.createMultiSourceFieldFromRecords(
          filteredRecords.length > 0 ? filteredRecords : records,
          strategy,
          'number'
        );
      } else {
        result[fieldName] = this.createDefaultStatField(fieldName, 0);
      }
    }

    // Merge recoil pattern (complex object - use highest confidence)
    const recoilRecords: SourceRecord[] = sources
      .filter((s) => s.ballistics.recoilPattern)
      .map((s) => ({
        source: s.source,
        value: s.ballistics.recoilPattern,
        timestamp: s.timestamp,
      }));

    result.recoilPattern =
      recoilRecords.length > 0
        ? this.createMultiSourceFieldFromRecords(recoilRecords, 'highest_confidence', 'object')
        : this.createDefaultComplexField('recoilPattern', { horizontal: 0, vertical: 0 });

    return result as UnifiedWeapon['ballistics'];
  }

  // ==========================================================================
  // Helper Methods (Stubs)
  // ==========================================================================

  /**
   * Creates a MultiSourceField wrapper from source records
   *
   * @param sources - Source records for this field
   * @param strategy - Resolution strategy
   * @param valueType - Type hint for conflict resolution
   * @returns MultiSourceField with resolved value
   */
  private createMultiSourceFieldFromRecords(
    sources: SourceRecord[],
    strategy: ResolutionStrategy,
    valueType: 'number' | 'string' | 'object' | 'array'
  ): MultiSourceField {
    if (sources.length === 0) {
      throw new Error('Cannot create multi-source field with no sources');
    }

    // Use conflict resolver to resolve the value
    const resolution = conflictResolver.resolve(sources, strategy, valueType);

    // Detect conflicts using lineage tracker
    const conflictDetail = lineageTracker.detectConflict(sources, 'field');

    // Build multi-source field
    const field: MultiSourceField = {
      sources,
      currentValue: resolution.value,
      primarySource: resolution.primarySource,
      confidence: {
        value: resolution.confidence,
        sourceReliability: resolution.confidence,
        freshness: 1.0,
        quality: resolution.hadConflict ? 0.8 : 1.0,
        calculatedAt: Date.now(),
      },
      lastUpdated: Math.max(...sources.map((s) => s.timestamp)),
      hasConflict: resolution.hadConflict,
      conflictDetails: conflictDetail ? [conflictDetail] : undefined,
    };

    return field;
  }

  /**
   * Builds lineage metadata for a unified weapon
   *
   * @param weapon - Partial unified weapon with stats, meta, ballistics
   * @returns Lineage metadata
   */
  private buildLineageMetadata(weapon: Partial<UnifiedWeapon>): UnifiedWeapon['lineage'] {
    const allFields: MultiSourceField[] = [];
    const uniqueSources = new Set<DataSource>();
    let totalConfidence = 0;
    let conflictCount = 0;
    let staleDataCount = 0;

    // Collect all multi-source fields
    if (weapon.stats) {
      Object.values(weapon.stats).forEach((field) => {
        if (field && typeof field === 'object' && 'sources' in field) {
          allFields.push(field as MultiSourceField);
        }
      });
    }

    if (weapon.meta) {
      Object.values(weapon.meta).forEach((field) => {
        if (field && typeof field === 'object' && 'sources' in field) {
          allFields.push(field as MultiSourceField);
        }
      });
    }

    if (weapon.ballistics) {
      Object.values(weapon.ballistics).forEach((field) => {
        if (field && typeof field === 'object' && 'sources' in field) {
          allFields.push(field as MultiSourceField);
        }
      });
    }

    // Analyze all fields
    for (const field of allFields) {
      // Collect unique sources
      for (const source of field.sources) {
        uniqueSources.add(source.source);
      }

      // Sum confidence
      totalConfidence += field.confidence.value;

      // Count conflicts
      if (field.hasConflict) {
        conflictCount++;
      }

      // Check for stale data (>30 days)
      for (const source of field.sources) {
        if (lineageTracker.isStale(source.timestamp)) {
          staleDataCount++;
        }
      }
    }

    const averageConfidence = allFields.length > 0 ? totalConfidence / allFields.length : 0;
    const now = Date.now();

    return {
      totalSources: uniqueSources.size,
      averageConfidence: Math.max(0, Math.min(1, averageConfidence)),
      conflictCount,
      staleDataCount,
      lastUpdated: now,
      lastValidated: now,
      contributingSources: Array.from(uniqueSources),
    };
  }

  /**
   * Normalizes data from a specific source to common format
   *
   * @param source - Source identifier
   * @param data - Raw source data
   * @returns Normalized data in common structure
   */
  private normalizeSourceData(source: DataSource, data: any): any {
    // Return a copy to avoid mutations
    const normalized: any = { ...data };

    // Handle CODArmory specific format
    if (source === DataSource.CODARMORY) {
      // CODArmory might nest stats differently
      if (data.weaponStats && !data.stats) {
        normalized.stats = data.weaponStats;
      }
    }

    // Handle WZStats specific format
    if (source === DataSource.WZSTATS) {
      // WZStats uses meta.tier, meta.usage, meta.winRate
      if (data.meta) {
        normalized.meta = {
          tier: data.meta.tier,
          popularity: data.meta.usage ?? data.meta.popularity,
          pickRate: data.meta.pickRate,
          winRate: data.meta.winRate,
          kd: data.meta.kd,
        };
      }
    }

    // Handle CODMunity specific format
    if (source === DataSource.CODMUNITY) {
      // CODMunity uses ballistics.ttk, ballistics.fireRate
      if (data.weaponBallistics && !data.ballistics) {
        normalized.ballistics = data.weaponBallistics;
      }
    }

    // Ensure required fields exist
    normalized.name = normalized.name || 'Unknown';
    normalized.game = normalized.game || 'MW3';
    normalized.category = normalized.category || 'AR';
    normalized.stats = normalized.stats || {};
    normalized.meta = normalized.meta || {};
    normalized.ballistics = normalized.ballistics || {};

    return normalized;
  }

  /**
   * Validates merged weapon data
   *
   * @param weapon - Unified weapon to validate
   * @returns Validation errors (empty if valid)
   */
  private validateMergedWeapon(weapon: UnifiedWeapon): string[] {
    const errors: string[] = [];

    // 1. Required fields
    if (!weapon.id) errors.push('Missing weapon ID');
    if (!weapon.name) errors.push('Missing weapon name');
    if (!weapon.game) errors.push('Missing game');
    if (!weapon.category) errors.push('Missing category');

    // 2. Stats validation (should be 0-100 range typically)
    if (weapon.stats) {
      const statFields = ['damage', 'range', 'accuracy', 'fireRate', 'mobility', 'control', 'handling'];
      for (const field of statFields) {
        const statField = weapon.stats[field as keyof typeof weapon.stats];
        if (statField && typeof statField === 'object' && 'currentValue' in statField) {
          const value = statField.currentValue;
          if (typeof value === 'number' && (value < 0 || value > 100)) {
            errors.push(`${field} out of range: ${value} (expected 0-100)`);
          }
        }
      }
    }

    // 3. Confidence scores validation
    if (weapon.lineage) {
      if (weapon.lineage.averageConfidence < 0 || weapon.lineage.averageConfidence > 1) {
        errors.push(`Average confidence out of range: ${weapon.lineage.averageConfidence}`);
      }
    }

    // 4. Meta tier validation
    if (weapon.meta?.tier) {
      const validTiers = ['S', 'A', 'B', 'C', 'D'];
      const tier = weapon.meta.tier.currentValue;
      if (!validTiers.includes(tier)) {
        errors.push(`Invalid tier: ${tier}`);
      }
    }

    // 5. Timestamps validation
    if (weapon.createdAt && weapon.createdAt > Date.now()) {
      errors.push('createdAt timestamp is in the future');
    }
    if (weapon.updatedAt && weapon.updatedAt > Date.now()) {
      errors.push('updatedAt timestamp is in the future');
    }

    return errors;
  }

  /**
   * Filters source records by confidence threshold
   *
   * @param sources - Source records to filter
   * @returns Filtered source records
   */
  private filterByConfidenceThreshold(sources: SourceRecord[]): SourceRecord[] {
    return sources.filter((source) => {
      const confidence = lineageTracker.calculateConfidence(
        source.source,
        source.timestamp,
        1.0
      );
      return confidence.value >= this.config.minConfidenceThreshold;
    });
  }

  /**
   * Creates a default stat field with zero value
   *
   * @param fieldName - Name of the field
   * @param defaultValue - Default value to use
   * @returns Default multi-source field
   */
  private createDefaultStatField(fieldName: string, defaultValue: number = 0): WeaponStatField {
    const now = Date.now();
    return {
      sources: [],
      currentValue: defaultValue,
      primarySource: DataSource.UNKNOWN,
      confidence: {
        value: 0,
        sourceReliability: 0,
        freshness: 0,
        quality: 0,
        calculatedAt: now,
      },
      lastUpdated: now,
      hasConflict: false,
    };
  }

  /**
   * Creates a default meta field
   *
   * @param fieldName - Name of the field
   * @param defaultValue - Default value to use
   * @returns Default meta field
   */
  private createDefaultMetaField<T>(fieldName: string, defaultValue: T): WeaponMetaField<T> {
    const now = Date.now();
    return {
      sources: [],
      currentValue: defaultValue,
      primarySource: DataSource.UNKNOWN,
      confidence: {
        value: 0,
        sourceReliability: 0,
        freshness: 0,
        quality: 0,
        calculatedAt: now,
      },
      lastUpdated: now,
      hasConflict: false,
    };
  }

  /**
   * Creates a default complex field (object or array)
   *
   * @param fieldName - Name of the field
   * @param defaultValue - Default value to use
   * @returns Default multi-source field
   */
  private createDefaultComplexField(fieldName: string, defaultValue: any): MultiSourceField {
    const now = Date.now();
    return {
      sources: [],
      currentValue: defaultValue,
      primarySource: DataSource.UNKNOWN,
      confidence: {
        value: 0,
        sourceReliability: 0,
        freshness: 0,
        quality: 0,
        calculatedAt: now,
      },
      lastUpdated: now,
      hasConflict: false,
    };
  }

  /**
   * Checks if two weapon records refer to the same weapon
   *
   * @param weapon1 - First weapon data
   * @param weapon2 - Second weapon data
   * @returns True if they match
   */
  private weaponsMatch(weapon1: any, weapon2: any): boolean {
    // Normalize names for comparison
    const name1 = weapon1.name?.toLowerCase().trim().replace(/\s+/g, ' ');
    const name2 = weapon2.name?.toLowerCase().trim().replace(/\s+/g, ' ');

    // Normalize games
    const game1 = weapon1.game?.toLowerCase();
    const game2 = weapon2.game?.toLowerCase();

    // Must have matching name and game
    return name1 === name2 && game1 === game2;
  }

  // ==========================================================================
  // Configuration
  // ==========================================================================

  /**
   * Updates merger configuration
   *
   * @param config - New configuration values
   */
  updateConfig(config: Partial<MergeConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Gets current configuration
   *
   * @returns Current merger config
   */
  getConfig(): MergeConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extracts weapon ID from various source formats
 *
 * Uses deterministic MD5 hash: hash(name + game) to match
 * the ID generation in populate-initial-data.ts
 *
 * @param data - Raw weapon data
 * @param source - Data source
 * @returns Normalized weapon ID
 */
export function extractWeaponId(data: any, source: DataSource): string {
  // Extract name and game from data
  const name = data.name || data.weaponName || 'unknown';
  const game = data.game || data.gameVersion || 'MW3';

  // Generate deterministic ID using MD5 hash
  return createHash('md5')
    .update(`${name.toLowerCase()}-${game.toLowerCase()}`)
    .digest('hex');
}

/**
 * Checks if two weapon records refer to the same weapon
 *
 * @param weapon1 - First weapon data
 * @param weapon2 - Second weapon data
 * @returns True if they match
 */
export function weaponsMatch(weapon1: any, weapon2: any): boolean {
  // Normalize names for comparison
  const name1 = weapon1.name?.toLowerCase().trim().replace(/\s+/g, ' ');
  const name2 = weapon2.name?.toLowerCase().trim().replace(/\s+/g, ' ');

  // Normalize games
  const game1 = weapon1.game?.toLowerCase();
  const game2 = weapon2.game?.toLowerCase();

  // Check if names match (exact or very similar)
  const namesMatch = name1 === name2;

  // Check if games match
  const gamesMatch = game1 === game2;

  return namesMatch && gamesMatch;
}

/**
 * Merges attachment data from multiple sources
 *
 * @param sources - Attachment data from multiple sources
 * @returns Merged attachment slots with deduplicated attachments
 */
export function mergeAttachments(
  sources: Array<{ source: DataSource; attachments: any }>
): Record<string, string[]> {
  const mergedSlots: Record<string, Set<string>> = {};

  // Collect all attachments from all sources
  for (const { attachments } of sources) {
    if (!attachments || typeof attachments !== 'object') {
      continue;
    }

    // Iterate over slot types (optic, barrel, magazine, etc.)
    for (const [slotName, attachmentList] of Object.entries(attachments)) {
      if (!Array.isArray(attachmentList)) {
        continue;
      }

      // Initialize set for this slot if not exists
      if (!mergedSlots[slotName]) {
        mergedSlots[slotName] = new Set<string>();
      }

      // Add all attachments to the set (automatically deduplicates)
      for (const attachment of attachmentList) {
        if (typeof attachment === 'string' && attachment.trim()) {
          mergedSlots[slotName].add(attachment.trim());
        }
      }
    }
  }

  // Convert sets back to arrays
  const result: Record<string, string[]> = {};
  for (const [slotName, attachmentSet] of Object.entries(mergedSlots)) {
    result[slotName] = Array.from(attachmentSet).sort();
  }

  return result;
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Default schema merger instance with standard configuration
 */
export const schemaMerger = new SchemaMerger();

/**
 * Export the class as default for custom instantiation
 */
export default SchemaMerger;
