'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';

export interface CounterData {
  enemyWeapon: {
    id: string;
    name: string;
    category: string;
    strengths: string[];
    weaknesses: string[];
  };
  counterWeapons: Array<{
    weaponId: string;
    weaponName: string;
    category: string;
    effectiveness: number;
    reasoning: string;
  }>;
  strategies: string[];
  tacticalAdvice: string[];
}

export function useCounters() {
  const [counterData, setCounterData] = useState<CounterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const analyzeCounter = async (weaponId: string) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/counters?weaponId=${weaponId}`);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.counterData) {
        throw new Error('No counter data available');
      }

      setCounterData(data.counterData);
      setError(null);
    } catch (err) {
      logger.apiError('GET', `/api/counters?weaponId=${weaponId}`, err);
      setError(err instanceof Error ? err : new Error('Failed to analyze counter'));
      setCounterData(null);
    } finally {
      setLoading(false);
    }
  };

  return { counterData, loading, error, analyzeCounter };
}
