/**
 * Data Lineage Tracker
 *
 * Core lineage tracking functionality including confidence calculation,
 * conflict detection, and data quality assessment.
 */

import {
  DataSource,
  ConfidenceScore,
  ConfidenceConfig,
  DataLineage,
  MultiSourceField,
  SourceRecord,
  ConflictDetail,
  LineageMetadata,
  LineageHistoryRecord,
  SOURCE_RELIABILITY,
  DEFAULT_CONFIDENCE_CONFIG,
} from './lineage-schema';

/**
 * Main lineage tracker class
 */
export class LineageTracker {
  private config: ConfidenceConfig;

  /**
   * Create a new LineageTracker instance
   * @param config - Optional confidence configuration
   */
  constructor(config: ConfidenceConfig = DEFAULT_CONFIDENCE_CONFIG) {
    this.config = config;
  }

  /**
   * Calculate confidence score for a data point
   *
   * Formula: confidence = sourceReliability × e^(-0.05 × age_days) × qualityFactor
   *
   * @param source - Data source
   * @param timestamp - When data was collected
   * @param qualityFactor - Data quality metric (0-1)
   * @returns Confidence score with breakdown
   */
  public calculateConfidence(
    source: DataSource,
    timestamp: number,
    qualityFactor: number = 1.0
  ): ConfidenceScore {
    // Get source reliability
    const sourceReliability = SOURCE_RELIABILITY[source] || 0.3;

    // Calculate freshness (exponential decay)
    const ageMs = Date.now() - timestamp;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const freshness = Math.exp(-this.config.freshnessDecayRate * ageDays);

    // Clamp quality factor
    const clampedQuality = Math.max(
      this.config.minQualityFactor,
      Math.min(this.config.maxQualityFactor, qualityFactor)
    );

    // Calculate overall confidence
    const value = sourceReliability * freshness * clampedQuality;

    return {
      value: Math.max(0, Math.min(1, value)),
      sourceReliability,
      freshness,
      quality: clampedQuality,
      calculatedAt: Date.now(),
    };
  }

  /**
   * Calculate data quality factor based on source count and conflicts
   *
   * Formula: quality = (sourceCount / 3) × (1 - min(conflictCount × 0.05, 0.3))
   *
   * @param sourceCount - Number of sources
   * @param conflictCount - Number of conflicts
   * @returns Quality factor (0-1)
   */
  public calculateDataQuality(
    sourceCount: number,
    conflictCount: number = 0
  ): number {
    // Source diversity factor (max at 3 sources)
    const diversityFactor = Math.min(sourceCount / 3, 1.0);

    // Conflict penalty (capped at config max)
    const conflictPenalty = Math.min(
      conflictCount * this.config.conflictPenalty,
      this.config.maxConflictPenalty
    );

    // Quality = diversity × (1 - conflict penalty)
    const quality = diversityFactor * (1 - conflictPenalty);

    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Check if data is stale based on threshold
   *
   * @param timestamp - Data timestamp
   * @returns True if data is stale
   */
  public isStale(timestamp: number): boolean {
    const ageMs = Date.now() - timestamp;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return ageDays > this.config.staleThresholdDays;
  }

  /**
   * Detect conflicts between different sources for the same field
   *
   * @param sources - Array of source records
   * @param field - Field name
   * @returns Conflict detail if conflict exists, null otherwise
   */
  public detectConflict(
    sources: SourceRecord[],
    field: string
  ): ConflictDetail | null {
    if (sources.length < 2) {
      return null;
    }

    // Group sources by value (using JSON stringify for deep comparison)
    const valueGroups = new Map<string, SourceRecord[]>();
    for (const source of sources) {
      const valueKey = JSON.stringify(source.value);
      if (!valueGroups.has(valueKey)) {
        valueGroups.set(valueKey, []);
      }
      valueGroups.get(valueKey)!.push(source);
    }

    // Conflict exists if we have multiple different values
    if (valueGroups.size <= 1) {
      return null;
    }

    // Build conflict detail
    const values = Array.from(valueGroups.values()).map((group) => ({
      source: group[0].source,
      value: group[0].value,
      timestamp: group[0].timestamp,
    }));

    return {
      field,
      values,
      detectedAt: Date.now(),
      resolved: false,
    };
  }

  /**
   * Create a multi-source field from source records
   *
   * @param sources - Array of source records
   * @param field - Field name
   * @returns Multi-source field with primary value selected
   */
  public createMultiSourceField(
    sources: SourceRecord[],
    field: string
  ): MultiSourceField {
    if (sources.length === 0) {
      throw new Error('Cannot create multi-source field with no sources');
    }

    // Detect conflicts
    const conflict = this.detectConflict(sources, field);
    const conflictCount = conflict ? conflict.values.length - 1 : 0;

    // Calculate quality factor
    const qualityFactor = this.calculateDataQuality(
      sources.length,
      conflictCount
    );

    // Select primary source (most recent from highest reliability source)
    const sortedSources = [...sources].sort((a, b) => {
      const reliabilityDiff =
        SOURCE_RELIABILITY[b.source] - SOURCE_RELIABILITY[a.source];
      if (Math.abs(reliabilityDiff) > 0.01) {
        return reliabilityDiff > 0 ? 1 : -1;
      }
      return b.timestamp - a.timestamp;
    });

    const primaryRecord = sortedSources[0];
    const confidence = this.calculateConfidence(
      primaryRecord.source,
      primaryRecord.timestamp,
      qualityFactor
    );

    return {
      sources,
      currentValue: primaryRecord.value,
      primarySource: primaryRecord.source,
      confidence,
      lastUpdated: primaryRecord.timestamp,
      hasConflict: conflict !== null,
      conflictDetails: conflict ? [conflict] : undefined,
    };
  }

  /**
   * Update lineage metadata based on current field data
   *
   * @param fields - Record of multi-source fields
   * @returns Updated metadata
   */
  public calculateMetadata(
    fields: Record<string, MultiSourceField>
  ): LineageMetadata {
    const fieldArray = Object.values(fields);

    // Collect all unique sources
    const uniqueSources = new Set<DataSource>();
    let totalConfidence = 0;
    let conflictCount = 0;
    let staleDataCount = 0;

    for (const field of fieldArray) {
      // Track sources
      for (const source of field.sources) {
        uniqueSources.add(source.source);
      }

      // Sum confidence
      totalConfidence += field.confidence.value;

      // Count conflicts
      if (field.hasConflict) {
        conflictCount++;
      }

      // Check for stale data
      for (const source of field.sources) {
        if (this.isStale(source.timestamp)) {
          staleDataCount++;
        }
      }
    }

    const averageConfidence =
      fieldArray.length > 0 ? totalConfidence / fieldArray.length : 0;

    return {
      totalSources: uniqueSources.size,
      averageConfidence: Math.max(0, Math.min(1, averageConfidence)),
      conflictCount,
      staleDataCount,
      lastValidated: Date.now(),
    };
  }

  /**
   * Create a complete data lineage record
   *
   * @param weaponId - Weapon ID
   * @param fields - Record of multi-source fields
   * @param existingLineage - Optional existing lineage to update
   * @returns Complete data lineage record
   */
  public createLineageRecord(
    weaponId: string,
    fields: Record<string, MultiSourceField>,
    existingLineage?: DataLineage
  ): DataLineage {
    const metadata = this.calculateMetadata(fields);
    const now = Date.now();

    return {
      weaponId,
      fields,
      metadata,
      createdAt: existingLineage?.createdAt || now,
      updatedAt: now,
    };
  }

  /**
   * Create a history record for a field change
   *
   * @param weaponId - Weapon ID
   * @param field - Field name
   * @param oldValue - Previous value
   * @param newValue - New value
   * @param source - Data source
   * @param qualityFactor - Optional quality factor
   * @param reason - Optional reason for change
   * @param reference - Optional reference
   * @returns History record
   */
  public createHistoryRecord(
    weaponId: string,
    field: string,
    oldValue: any,
    newValue: any,
    source: DataSource,
    qualityFactor: number = 1.0,
    reason?: string,
    reference?: string
  ): LineageHistoryRecord {
    const timestamp = Date.now();
    const confidence = this.calculateConfidence(
      source,
      timestamp,
      qualityFactor
    );

    return {
      weaponId,
      field,
      oldValue,
      newValue,
      source,
      timestamp,
      confidence,
      reason,
      reference,
    };
  }

  /**
   * Compare two values for equality (handles deep comparison)
   *
   * @param a - First value
   * @param b - Second value
   * @returns True if values are equal
   */
  public valuesEqual(a: any, b: any): boolean {
    // Handle null/undefined
    if (a === null || a === undefined || b === null || b === undefined) {
      return a === b;
    }

    // Handle primitives
    if (typeof a !== 'object' || typeof b !== 'object') {
      return a === b;
    }

    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.valuesEqual(item, b[index]));
    }

    // Handle objects (use JSON comparison for simplicity)
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }

  /**
   * Add or update a source for a field
   *
   * @param multiSourceField - Existing multi-source field
   * @param newSource - New source record to add/update
   * @param fieldName - Field name for conflict detection
   * @returns Updated multi-source field
   */
  public addOrUpdateSource(
    multiSourceField: MultiSourceField,
    newSource: SourceRecord,
    fieldName: string
  ): MultiSourceField {
    // Check if source already exists
    const existingIndex = multiSourceField.sources.findIndex(
      (s) => s.source === newSource.source
    );

    let updatedSources: SourceRecord[];
    if (existingIndex >= 0) {
      // Update existing source
      updatedSources = [...multiSourceField.sources];
      updatedSources[existingIndex] = newSource;
    } else {
      // Add new source
      updatedSources = [...multiSourceField.sources, newSource];
    }

    // Recreate field with updated sources
    return this.createMultiSourceField(updatedSources, fieldName);
  }
}

/**
 * Singleton instance of LineageTracker
 */
export const lineageTracker = new LineageTracker();
