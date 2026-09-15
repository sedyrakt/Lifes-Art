// src/hooks/useDashboardData.ts
// ⭐ FIX: Nesorina ny lastFetchKey guard — mba hanao fetch foana isaky ny miova période
//         (nisakana ny refresh teo aloha)

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  DashboardStats,
  DashboardChartsData,
  DateRangeType,
} from './dashboard/types';
import { INITIAL_STATS, INITIAL_CHARTS, DEBUG } from './dashboard/constants';
import { getDateRange } from './dashboard/dateRange';
import { getGroupBy } from './dashboard/groupBy';
import { useDashboardFetch } from './dashboard/useDashboardFetch';

export type {
  DashboardStats,
  DashboardChartsData,
  DateRangeType,
};

export const useDashboardData = () => {
  const isMounted = useRef(true);
  const requestId = useRef(0);
  const firstLoadDone = useRef(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeType>('mois');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [chartsData, setChartsData] = useState<DashboardChartsData>(INITIAL_CHARTS);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const { loadData } = useDashboardFetch({
    dateRange,
    customStartDate,
    customEndDate,
    setStats,
    setChartsData,
    setLoading,
    setRefreshing,
    isMountedRef: isMounted,
    requestIdRef: requestId,
    firstLoadDoneRef: firstLoadDone,
  });

  const getDateRangeCallback = useCallback(
    () => getDateRange(dateRange, customStartDate, customEndDate),
    [dateRange, customStartDate, customEndDate]
  );

  const getGroupByCallback = useCallback(
    () => getGroupBy(dateRange),
    [dateRange]
  );

  // ⭐ Rechargement automatique — TSY MISY GUARD
  const effectiveCustomStart = dateRange === 'custom' ? customStartDate : '';
  const effectiveCustomEnd = dateRange === 'custom' ? customEndDate : '';

  useEffect(() => {
    const isInitial = !firstLoadDone.current;

    if (DEBUG) {
      console.log('[useDashboardData] ✅ Fetch:', {
        dateRange,
        effectiveCustomStart,
        effectiveCustomEnd,
        isInitial,
      });
    }

    loadData(!isInitial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, effectiveCustomStart, effectiveCustomEnd]);

  return {
    loading,
    refreshing,
    stats,
    chartsData,
    loadData,
    dateRange,
    setDateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    getDateRange: getDateRangeCallback,
    getGroupBy: getGroupByCallback,
  };
};

export default useDashboardData;