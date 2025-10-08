/**
 * MultiSource Field Utilities
 *
 * Provides type-safe extraction of values from V3 MultiSourceField objects
 * and backward compatibility with V1 primitive values.
 */

/**
 * MultiSourceField structure from V3 schema
 */
export interface MultiSourceField<T = any> {
  currentValue: T;
  sources: Array<{
    source: string;
    value: T;
    timestamp: number;
    reference?: string;
  }>;
  primarySource: string;
  confidence: {
    level: 'high' | 'medium' | 'low';
    score: number;
  };
  lastUpdated: number;
  hasConflict: boolean;
}

/**
 * Type guard to check if a value is a MultiSourceField
 */
export function isMultiSourceField(value: any): value is MultiSourceField {
  return (
    value !== null &&
    typeof value === 'object' &&
    'currentValue' in value &&
    'sources' in value &&
    Array.isArray(value.sources)
  );
}

/**
 * Safely extracts the current value from a field that might be a MultiSourceField
 * or a primitive value. Provides backward compatibility with V1 schema.
 *
 * @param field - The field value (either primitive or MultiSourceField)
 * @returns The actual value to use
 *
 * @example
 * getCurrentValue(weapon.meta.tier) // Returns "S" regardless of V1 or V3
 * getCurrentValue(weapon.stats.damage) // Returns 85 regardless of V1 or V3
 */
export function getCurrentValue<T>(field: T | MultiSourceField<T>): T {
  if (isMultiSourceField(field)) {
    return field.currentValue;
  }
  return field;
}

/**
 * Extracts current values from all properties of an object that might contain
 * MultiSourceField values.
 *
 * @param obj - Object with potentially MultiSourceField properties
 * @returns Object with extracted primitive values
 */
export function normalizeObject<T extends Record<string, any>>(obj: T): T {
  const normalized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      normalized[key as keyof T] = value;
    } else if (isMultiSourceField(value)) {
      normalized[key as keyof T] = value.currentValue;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively normalize nested objects
      normalized[key as keyof T] = normalizeObject(value);
    } else {
      normalized[key as keyof T] = value;
    }
  }

  return normalized;
}
