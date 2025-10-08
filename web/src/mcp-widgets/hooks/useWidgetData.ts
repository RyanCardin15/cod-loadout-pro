import { useEffect, useState } from 'react';
import {
  LoadoutData,
  CounterSuggestionsData,
  WeaponListData,
  MetaTierListData,
  MyLoadoutsData,
  PlaystyleData,
  BaseWidgetProps,
} from '../types';

// Type guards for data validation
export function isLoadoutData(data: unknown): data is LoadoutData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'loadout' in data &&
    typeof (data as LoadoutData).loadout === 'object'
  );
}

export function isCounterSuggestionsData(data: unknown): data is CounterSuggestionsData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'enemyWeapon' in data &&
    typeof (data as CounterSuggestionsData).enemyWeapon === 'object'
  );
}

export function isWeaponListData(data: unknown): data is WeaponListData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'weapons' in data &&
    Array.isArray((data as WeaponListData).weapons)
  );
}

export function isMetaTierListData(data: unknown): data is MetaTierListData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'tiers' in data &&
    typeof (data as MetaTierListData).tiers === 'object'
  );
}

export function isMyLoadoutsData(data: unknown): data is MyLoadoutsData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'loadouts' in data &&
    Array.isArray((data as MyLoadoutsData).loadouts)
  );
}

export function isPlaystyleData(data: unknown): data is PlaystyleData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'playstyle' in data &&
    typeof (data as PlaystyleData).playstyle === 'object'
  );
}

// Generic hook for extracting widget data
export function useWidgetData<T>(
  toolOutput: BaseWidgetProps<T>['toolOutput'],
  typeGuard: (data: unknown) => data is T
): { data: T | null; isLoading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Access window.openai safely
    const openai = (window as { openai?: { toolOutput?: unknown } }).openai;
    const rawData = toolOutput || openai?.toolOutput;

    // Handle structuredContent wrapper
    const extractedData = (rawData as { structuredContent?: unknown })?.structuredContent || rawData;

    // Validate data using type guard
    if (typeGuard(extractedData)) {
      setData(extractedData);
      setIsLoading(false);
    }
  }, [toolOutput, typeGuard]);

  return { data, isLoading };
}

// Specialized hooks for each widget type
export function useLoadoutData(toolOutput: BaseWidgetProps<LoadoutData>['toolOutput']) {
  return useWidgetData(toolOutput, isLoadoutData);
}

export function useCounterSuggestionsData(
  toolOutput: BaseWidgetProps<CounterSuggestionsData>['toolOutput']
) {
  return useWidgetData(toolOutput, isCounterSuggestionsData);
}

export function useWeaponListData(toolOutput: BaseWidgetProps<WeaponListData>['toolOutput']) {
  return useWidgetData(toolOutput, isWeaponListData);
}

export function useMetaTierListData(toolOutput: BaseWidgetProps<MetaTierListData>['toolOutput']) {
  return useWidgetData(toolOutput, isMetaTierListData);
}

export function useMyLoadoutsData(toolOutput: BaseWidgetProps<MyLoadoutsData>['toolOutput']) {
  return useWidgetData(toolOutput, isMyLoadoutsData);
}

export function usePlaystyleData(toolOutput: BaseWidgetProps<PlaystyleData>['toolOutput']) {
  return useWidgetData(toolOutput, isPlaystyleData);
}
