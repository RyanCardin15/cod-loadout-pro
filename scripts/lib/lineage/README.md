# Data Lineage Tracking System

Complete implementation of Phase 2, Task 2.1 - Data Lineage Tracking System.

## Overview

The Data Lineage Tracking System provides comprehensive tracking of data sources, confidence scores, and data quality metrics across weapon data collection. It enables:

- Multi-source data tracking
- Confidence score calculation with exponential freshness decay
- Conflict detection between sources
- Historical change tracking
- Data quality assessment
- Firestore integration for persistent storage

## Architecture

### Component Structure

```
lineage/
├── lineage-schema.ts      # Type definitions and interfaces
├── lineage-tracker.ts     # Core tracking logic and calculations
├── lineage-query.ts       # Query service and Firestore integration
├── index.ts               # Public API exports
├── test-lineage.ts        # Unit tests
└── README.md              # This file
```

## Components

### 1. Lineage Schema (`lineage-schema.ts`)

**Lines of Code:** 266

**Purpose:** Complete type definitions for the lineage system.

**Key Types:**

- `DataSource` - Enum of possible data sources (API, Wiki, User, Manual, Image, Unknown)
- `SourceRecord` - Single source of data for a field
- `MultiSourceField` - Field with multiple potential sources
- `ConfidenceScore` - Confidence calculation breakdown
- `DataLineage` - Complete lineage record for a weapon
- `LineageHistoryRecord` - Historical record of field changes
- `LineageStatistics` - Statistics about data lineage
- `ConflictDetail` - Details about conflicts between sources

**Constants:**

- `SOURCE_RELIABILITY` - Reliability scores for each source type (0-1)
- `DEFAULT_CONFIDENCE_CONFIG` - Default configuration for confidence calculations

### 2. Lineage Tracker (`lineage-tracker.ts`)

**Lines of Code:** 402

**Purpose:** Core lineage tracking functionality.

**Key Methods:**

#### `calculateConfidence(source, timestamp, qualityFactor)`
Calculates confidence score using the formula:
```
confidence = sourceReliability × e^(-0.05 × age_days) × qualityFactor
```

**Parameters:**
- `source`: Data source type
- `timestamp`: When data was collected
- `qualityFactor`: Data quality metric (0-1)

**Returns:** `ConfidenceScore` with breakdown

#### `calculateDataQuality(sourceCount, conflictCount)`
Calculates data quality factor:
```
quality = (sourceCount / 3) × (1 - min(conflictCount × 0.05, 0.3))
```

**Parameters:**
- `sourceCount`: Number of sources
- `conflictCount`: Number of conflicts

**Returns:** Quality factor (0-1)

#### `isStale(timestamp)`
Checks if data is stale (>30 days old).

#### `detectConflict(sources, field)`
Detects conflicts between different sources for the same field.

#### `createMultiSourceField(sources, field)`
Creates a multi-source field with automatic primary value selection.

#### `createHistoryRecord(...)`
Creates a history record for a field change.

### 3. Lineage Query Service (`lineage-query.ts`)

**Lines of Code:** 450

**Purpose:** Querying, history tracking, and Firestore integration.

**Key Methods:**

#### `queryHistory(filters)`
Query lineage history with filters (weaponId, field, source, time range, confidence threshold).

**Parameters:**
- `filters`: `LineageQueryFilters` object

**Returns:** Array of `LineageHistoryRecord`

#### `getFieldHistory(weaponId, field, limit)`
Get complete history for a specific field.

**Returns:** `FieldHistory` with all changes

#### `calculateStatistics(weaponId?)`
Calculate comprehensive statistics about lineage data.

**Returns:** `LineageStatistics` with metrics

#### `storeHistoryRecord(record)`
Store a single history record in Firestore.

#### `batchStoreHistory(records)`
Store multiple history records in batches (500 per batch).

#### `getLatestLineage(weaponId)`
Reconstruct the latest complete lineage record from history.

**Returns:** `DataLineage` or null

#### `deleteLineageHistory(weaponId)`
Delete all lineage history for a weapon.

#### `hasLineageData(weaponId)`
Check if a weapon has lineage data.

### 4. Index (`index.ts`)

**Lines of Code:** 40

**Purpose:** Public API exports.

Exports all types, enums, constants, and singleton instances.

## Usage Examples

### Basic Confidence Calculation

```typescript
import { lineageTracker, DataSource } from './lineage';

const confidence = lineageTracker.calculateConfidence(
  DataSource.OFFICIAL_API,
  Date.now(),
  1.0
);

console.log('Confidence:', confidence.value); // 1.000
console.log('Source reliability:', confidence.sourceReliability); // 1.0
console.log('Freshness:', confidence.freshness); // 1.0
console.log('Quality:', confidence.quality); // 1.0
```

### Multi-Source Field Creation

```typescript
import { lineageTracker, DataSource, SourceRecord } from './lineage';

const sources: SourceRecord[] = [
  {
    source: DataSource.OFFICIAL_API,
    value: 100,
    timestamp: Date.now(),
  },
  {
    source: DataSource.WIKI,
    value: 95,
    timestamp: Date.now() - 1000,
  },
];

const field = lineageTracker.createMultiSourceField(sources, 'damage');

console.log('Primary value:', field.currentValue); // 100
console.log('Has conflict:', field.hasConflict); // true
console.log('Confidence:', field.confidence.value); // 0.950
```

### Querying History

```typescript
import { lineageQueryService } from './lineage';

// Query with filters
const history = await lineageQueryService.queryHistory({
  weaponId: 'weapon_001',
  field: 'damage',
  startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
  minConfidence: 0.8,
});

console.log('Found', history.length, 'records');
```

### Calculating Statistics

```typescript
import { lineageQueryService } from './lineage';

const stats = await lineageQueryService.calculateStatistics('weapon_001');

console.log('Total fields:', stats.totalFields);
console.log('Average confidence:', stats.averageConfidence);
console.log('Conflicts:', stats.conflictCount);
console.log('Completeness:', stats.completeness, '%');
```

### Storing History

```typescript
import { lineageTracker, lineageQueryService, DataSource } from './lineage';

// Create history record
const record = lineageTracker.createHistoryRecord(
  'weapon_001',
  'damage',
  100,
  110,
  DataSource.OFFICIAL_API,
  1.0,
  'Balance update'
);

// Store single record
await lineageQueryService.storeHistoryRecord(record);

// Or batch store
await lineageQueryService.batchStoreHistory([record1, record2, record3]);
```

## Algorithms

### Confidence Calculation

**Formula:**
```
confidence = sourceReliability × e^(-0.05 × age_days) × qualityFactor
```

**Components:**
- **Source Reliability** (0-1): Based on source type
  - Official API: 1.0
  - Wiki: 0.8
  - Manual: 0.7
  - User Submission: 0.6
  - Image Analysis: 0.5
  - Unknown: 0.3

- **Freshness** (0-1): Exponential decay with rate 0.05/day
  - Formula: `e^(-0.05 × days_old)`
  - 1 day old: 0.951
  - 7 days old: 0.705
  - 30 days old: 0.223

- **Quality Factor** (0.5-1.0): Based on source diversity and conflicts
  - Formula: `(sourceCount / 3) × (1 - min(conflictCount × 0.05, 0.3))`
  - More sources = higher quality (capped at 3)
  - Conflicts reduce quality (max penalty 30%)

### Data Quality Calculation

**Formula:**
```
quality = (sourceCount / 3) × (1 - min(conflictCount × 0.05, 0.3))
```

**Examples:**
- 1 source, no conflicts: 0.333
- 3 sources, no conflicts: 1.000
- 3 sources, 2 conflicts: 0.900
- 5 sources, 10 conflicts: 0.700

### Stale Detection

**Threshold:** 30 days

**Formula:**
```
isStale = (Date.now() - timestamp) > 30_days_ms
```

## Configuration

### Default Configuration

```typescript
{
  freshnessDecayRate: 0.05,      // Per day decay rate
  staleThresholdDays: 30,        // Days before data is stale
  minQualityFactor: 0.5,         // Minimum quality
  maxQualityFactor: 1.0,         // Maximum quality
  conflictPenalty: 0.05,         // Penalty per conflict
  maxConflictPenalty: 0.3,       // Maximum total penalty
}
```

### Custom Configuration

```typescript
import { LineageTracker } from './lineage';

const customTracker = new LineageTracker({
  freshnessDecayRate: 0.1,  // Faster decay
  staleThresholdDays: 14,   // Shorter threshold
  conflictPenalty: 0.1,     // Higher penalty
  // ... other config
});
```

## Firestore Integration

### Collection Structure

**Collection:** `weapon_lineage`

**Document ID Format:** `{weaponId}_{field}_{timestamp}`

**Document Schema:**
```typescript
{
  weaponId: string;
  field: string;
  oldValue: any;
  newValue: any;
  source: DataSource;
  timestamp: number;
  confidence: ConfidenceScore;
  reason?: string;
  reference?: string;
}
```

### Batch Operations

**Batch Size:** 500 records per batch

**Usage:**
```typescript
// Automatically batches large arrays
await lineageQueryService.batchStoreHistory(manyRecords);
```

## Testing

### Run Tests

```bash
npx ts-node scripts/lib/lineage/test-lineage.ts
```

### Test Coverage

- ✅ Confidence calculation
- ✅ Data quality calculation
- ✅ Stale detection
- ✅ Conflict detection
- ✅ Multi-source field creation
- ✅ History record creation
- ✅ Export verification

### Test Output

```
Data Lineage System Tests
=========================

=== Testing Confidence Calculation ===
Official API (fresh): 1.000
Wiki (1 day old): 0.761
User submission (30 days old): 0.134
Official API (low quality): 0.500

=== Testing Data Quality ===
1 source, no conflicts: 0.333
3 sources, no conflicts: 1.000
3 sources, 2 conflicts: 0.900
5 sources, many conflicts: 0.700

=== Testing Stale Detection ===
Recent data (10 days): false
Stale data (35 days): true

=== Testing Conflict Detection ===
Same values: No conflict
Different values: Conflict detected (2 values)

=== Testing Multi-Source Field ===
Primary value: 100
Primary source: official_api
Has conflict: true
Confidence: 0.950
Number of sources: 3

=== All Tests Completed Successfully ===
```

## Performance Considerations

### Batch Operations
- Always use `batchStoreHistory()` for multiple records
- Firestore batches limited to 500 operations
- Automatic batching handles large datasets

### Query Optimization
- Use specific filters to reduce result set
- Index on frequently queried fields (weaponId, field, source, timestamp)
- Limit results when possible

### Memory Management
- History records are loaded into memory for filtering
- Consider pagination for large result sets
- Use streaming for very large datasets

## Error Handling

All methods include comprehensive error handling:

```typescript
try {
  const history = await lineageQueryService.queryHistory(filters);
} catch (error) {
  console.error('Query failed:', error);
  // Handle error appropriately
}
```

Common error scenarios:
- Firebase not initialized
- Invalid filters
- Network errors
- Batch operation failures

## Integration Points

### Firebase Admin
- Uses existing Firebase admin instance from `server/src/firebase/admin`
- Requires Firebase environment variables:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`

### Collection Name
- `weapon_lineage` - Firestore collection for history

### Dependencies
- `firebase-admin` - Firestore integration
- No external dependencies beyond Firebase

## Future Enhancements

Potential improvements:
- Real-time conflict resolution UI
- Automated source validation
- Machine learning for conflict resolution
- Performance metrics dashboard
- Source reputation scoring
- Automatic stale data alerts

## Summary

**Total Lines of Code:** 1,379 (including tests)

**Core Implementation:** 1,158 lines

**Components:**
- ✅ Complete schema with 14 TypeScript interfaces
- ✅ Full lineage tracker with 10+ methods
- ✅ Comprehensive query service with Firestore integration
- ✅ Public API with all exports
- ✅ Unit tests with 100% pass rate

**Key Features:**
- ✅ Exponential freshness decay (e^(-0.05 × days))
- ✅ Data quality calculation with conflict penalty
- ✅ 30-day stale threshold
- ✅ Automatic conflict detection
- ✅ Multi-source field management
- ✅ History tracking with Firestore
- ✅ Batch operations (500 per batch)
- ✅ Comprehensive statistics
- ✅ TypeScript strict mode compliant

**Status:** ✅ Complete and tested
