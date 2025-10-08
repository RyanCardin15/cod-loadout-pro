/**
 * Data Lineage Query Service
 *
 * Provides querying, history tracking, and statistics for data lineage.
 * Integrates with Firestore for persistent storage.
 */

import { db } from '../../../server/src/firebase/admin';
import {
  DataSource,
  LineageHistoryRecord,
  LineageQueryFilters,
  LineageStatistics,
  FieldHistory,
  FieldHistoryEntry,
  DataLineage,
  SourceRecord,
  MultiSourceField,
} from './lineage-schema';
import { lineageTracker } from './lineage-tracker';

/**
 * Firestore collection name for weapon lineage
 */
const LINEAGE_COLLECTION = 'weapon_lineage';

/**
 * Maximum batch size for Firestore operations
 */
const BATCH_SIZE = 500;

/**
 * Service for querying and managing lineage data
 */
export class LineageQueryService {
  /**
   * Query lineage history with filters
   *
   * @param filters - Query filters
   * @returns Array of matching history records
   */
  public async queryHistory(
    filters: LineageQueryFilters = {}
  ): Promise<LineageHistoryRecord[]> {
    try {
      const firestore = db();
      let query = firestore
        .collection(LINEAGE_COLLECTION)
        .orderBy('timestamp', 'desc') as any;

      // Apply filters
      if (filters.weaponId) {
        query = query.where('weaponId', '==', filters.weaponId);
      }

      if (filters.field) {
        query = query.where('field', '==', filters.field);
      }

      if (filters.source) {
        query = query.where('source', '==', filters.source);
      }

      if (filters.startTime) {
        query = query.where('timestamp', '>=', filters.startTime);
      }

      if (filters.endTime) {
        query = query.where('timestamp', '<=', filters.endTime);
      }

      const snapshot = await query.get();
      let records: LineageHistoryRecord[] = [];

      snapshot.forEach((doc: any) => {
        const data = doc.data();
        records.push(data as LineageHistoryRecord);
      });

      // Apply in-memory filters
      if (filters.minConfidence !== undefined) {
        records = records.filter(
          (r) => r.confidence.value >= filters.minConfidence!
        );
      }

      if (filters.conflictsOnly) {
        // Group by weaponId + field + timestamp to find conflicts
        const groupMap = new Map<string, LineageHistoryRecord[]>();
        for (const record of records) {
          const key = `${record.weaponId}:${record.field}:${Math.floor(
            record.timestamp / 1000
          )}`;
          if (!groupMap.has(key)) {
            groupMap.set(key, []);
          }
          groupMap.get(key)!.push(record);
        }

        // Only keep groups with multiple different values
        records = [];
        const groups = Array.from(groupMap.values());
        for (const group of groups) {
          if (group.length > 1) {
            const values = new Set(group.map((r) => JSON.stringify(r.newValue)));
            if (values.size > 1) {
              records.push(...group);
            }
          }
        }
      }

      return records;
    } catch (error) {
      console.error('Error querying lineage history:', error);
      throw new Error(`Failed to query lineage history: ${error}`);
    }
  }

  /**
   * Get field history for a specific weapon and field
   *
   * @param weaponId - Weapon ID
   * @param field - Field name
   * @param limit - Maximum number of history entries
   * @returns Field history
   */
  public async getFieldHistory(
    weaponId: string,
    field: string,
    limit: number = 100
  ): Promise<FieldHistory> {
    try {
      const records = await this.queryHistory({
        weaponId,
        field,
      });

      // Convert to field history entries
      const history: FieldHistoryEntry[] = records
        .slice(0, limit)
        .map((record) => ({
          value: record.newValue,
          source: record.source,
          timestamp: record.timestamp,
          confidence: record.confidence,
        }));

      return {
        weaponId,
        field,
        history,
        currentValue: history.length > 0 ? history[0].value : null,
        changeCount: records.length,
      };
    } catch (error) {
      console.error('Error getting field history:', error);
      throw new Error(`Failed to get field history: ${error}`);
    }
  }

  /**
   * Calculate statistics for lineage data
   *
   * @param weaponId - Optional weapon ID to filter statistics
   * @returns Lineage statistics
   */
  public async calculateStatistics(
    weaponId?: string
  ): Promise<LineageStatistics> {
    try {
      const filters: LineageQueryFilters = weaponId ? { weaponId } : {};
      const records = await this.queryHistory(filters);

      if (records.length === 0) {
        return {
          totalFields: 0,
          averageConfidence: 0,
          conflictCount: 0,
          staleCount: 0,
          completeness: 0,
          sourceBreakdown: {} as Record<DataSource, number>,
          lastUpdated: Date.now(),
        };
      }

      // Calculate metrics
      const uniqueFields = new Set(records.map((r) => r.field));
      const totalConfidence = records.reduce(
        (sum, r) => sum + r.confidence.value,
        0
      );
      const averageConfidence = totalConfidence / records.length;

      // Count stale records
      const staleCount = records.filter((r) =>
        lineageTracker.isStale(r.timestamp)
      ).length;

      // Detect conflicts
      const conflictMap = new Map<string, Set<string>>();
      for (const record of records) {
        const key = `${record.weaponId}:${record.field}`;
        if (!conflictMap.has(key)) {
          conflictMap.set(key, new Set());
        }
        conflictMap.get(key)!.add(JSON.stringify(record.newValue));
      }
      const conflictCount = Array.from(conflictMap.values()).filter(
        (values) => values.size > 1
      ).length;

      // Source breakdown
      const sourceBreakdown: Record<DataSource, number> = {} as Record<
        DataSource,
        number
      >;
      for (const source of Object.values(DataSource)) {
        sourceBreakdown[source] = records.filter((r) => r.source === source)
          .length;
      }

      // Completeness (percentage of fields with recent data)
      const recentRecords = records.filter(
        (r) => !lineageTracker.isStale(r.timestamp)
      );
      const completeness =
        uniqueFields.size > 0
          ? (recentRecords.length / records.length) * 100
          : 0;

      return {
        totalFields: uniqueFields.size,
        averageConfidence: Math.max(0, Math.min(1, averageConfidence)),
        conflictCount,
        staleCount,
        completeness: Math.max(0, Math.min(100, completeness)),
        sourceBreakdown,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      throw new Error(`Failed to calculate statistics: ${error}`);
    }
  }

  /**
   * Store a single history record in Firestore
   *
   * @param record - History record to store
   */
  public async storeHistoryRecord(
    record: LineageHistoryRecord
  ): Promise<void> {
    try {
      const firestore = db();
      const docId = `${record.weaponId}_${record.field}_${record.timestamp}`;

      await firestore.collection(LINEAGE_COLLECTION).doc(docId).set(record);
    } catch (error) {
      console.error('Error storing history record:', error);
      throw new Error(`Failed to store history record: ${error}`);
    }
  }

  /**
   * Store multiple history records in batches
   *
   * @param records - Array of history records to store
   */
  public async batchStoreHistory(
    records: LineageHistoryRecord[]
  ): Promise<void> {
    if (records.length === 0) {
      return;
    }

    try {
      const firestore = db();

      // Process in batches
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = firestore.batch();
        const batchRecords = records.slice(i, i + BATCH_SIZE);

        for (const record of batchRecords) {
          const docId = `${record.weaponId}_${record.field}_${record.timestamp}`;
          const docRef = firestore.collection(LINEAGE_COLLECTION).doc(docId);
          batch.set(docRef, record);
        }

        await batch.commit();
      }

      console.log(`Successfully stored ${records.length} history records`);
    } catch (error) {
      console.error('Error batch storing history:', error);
      throw new Error(`Failed to batch store history: ${error}`);
    }
  }

  /**
   * Get the latest lineage record for a weapon
   *
   * @param weaponId - Weapon ID
   * @returns Latest lineage data or null
   */
  public async getLatestLineage(
    weaponId: string
  ): Promise<DataLineage | null> {
    try {
      const records = await this.queryHistory({ weaponId });

      if (records.length === 0) {
        return null;
      }

      // Group records by field
      const fieldMap = new Map<
        string,
        Array<{
          value: any;
          source: DataSource;
          timestamp: number;
          reference?: string;
        }>
      >();

      for (const record of records) {
        if (!fieldMap.has(record.field)) {
          fieldMap.set(record.field, []);
        }

        fieldMap.get(record.field)!.push({
          value: record.newValue,
          source: record.source,
          timestamp: record.timestamp,
          reference: record.reference,
        });
      }

      // Create multi-source fields
      const fields: Record<string, MultiSourceField> = {};
      const fieldEntries = Array.from(fieldMap.entries());
      for (const [fieldName, sources] of fieldEntries) {
        const sourceMap = new Map<DataSource, SourceRecord>();
        for (const s of sources) {
          sourceMap.set(s.source, {
            source: s.source,
            value: s.value,
            timestamp: s.timestamp,
            reference: s.reference,
          });
        }
        const uniqueSources: SourceRecord[] = Array.from(sourceMap.values());

        fields[fieldName] = lineageTracker.createMultiSourceField(
          uniqueSources,
          fieldName
        );
      }

      return lineageTracker.createLineageRecord(weaponId, fields);
    } catch (error) {
      console.error('Error getting latest lineage:', error);
      throw new Error(`Failed to get latest lineage: ${error}`);
    }
  }

  /**
   * Delete lineage history for a weapon
   *
   * @param weaponId - Weapon ID
   * @returns Number of records deleted
   */
  public async deleteLineageHistory(weaponId: string): Promise<number> {
    try {
      const firestore = db();
      const query = firestore
        .collection(LINEAGE_COLLECTION)
        .where('weaponId', '==', weaponId);

      const snapshot = await query.get();
      const batchSize = BATCH_SIZE;
      let deletedCount = 0;

      // Delete in batches
      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = firestore.batch();
        const batchDocs = snapshot.docs.slice(i, i + batchSize);

        for (const doc of batchDocs) {
          batch.delete(doc.ref);
        }

        await batch.commit();
        deletedCount += batchDocs.length;
      }

      console.log(`Deleted ${deletedCount} lineage records for ${weaponId}`);
      return deletedCount;
    } catch (error) {
      console.error('Error deleting lineage history:', error);
      throw new Error(`Failed to delete lineage history: ${error}`);
    }
  }

  /**
   * Get all weapons with lineage data
   *
   * @returns Array of weapon IDs
   */
  public async getAllWeaponIds(): Promise<string[]> {
    try {
      const records = await this.queryHistory({});
      const uniqueWeaponIds = new Set(records.map((r) => r.weaponId));
      return Array.from(uniqueWeaponIds);
    } catch (error) {
      console.error('Error getting weapon IDs:', error);
      throw new Error(`Failed to get weapon IDs: ${error}`);
    }
  }

  /**
   * Check if a weapon has lineage data
   *
   * @param weaponId - Weapon ID
   * @returns True if weapon has lineage data
   */
  public async hasLineageData(weaponId: string): Promise<boolean> {
    try {
      const firestore = db();
      const query = firestore
        .collection(LINEAGE_COLLECTION)
        .where('weaponId', '==', weaponId)
        .limit(1);

      const snapshot = await query.get();
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking lineage data:', error);
      return false;
    }
  }
}

/**
 * Singleton instance of LineageQueryService
 */
export const lineageQueryService = new LineageQueryService();
