import { useMemo } from 'react';
import { useWeightStore, useSettingsStore } from '../stores';
import { WeightStats } from '../types';
import { getThisWeekRange, getLastWeekRange, getThisMonthRange, getLastMonthRange, formatDateForSheet } from '../utils';

export function useWeightStats(): WeightStats {
  const entries = useWeightStore((state) => state.entries);

  return useMemo(() => {
    if (entries.length === 0) {
      return {
        latestEntry: null,
        changeSinceLastEntry: 0,
        thisWeekAverage: 0,
        lastWeekAverage: 0,
        weeklyChange: 0,
        thisMonthAverage: 0,
        lastMonthAverage: 0,
        monthlyChange: 0,
        minWeight: null,
        maxWeight: null,
        totalEntries: 0,
      };
    }

    const latestEntry = entries[0];
    const previousEntry = entries[1];
    const changeSinceLastEntry = previousEntry ? latestEntry.weight - previousEntry.weight : 0;

    const calcAverage = (start: Date, end: Date) => {
      const startStr = formatDateForSheet(start);
      const endStr = formatDateForSheet(end);
      const rangeEntries = entries.filter((e) => e.date >= startStr && e.date <= endStr);
      if (rangeEntries.length === 0) return 0;
      return rangeEntries.reduce((sum, e) => sum + e.weight, 0) / rangeEntries.length;
    };

    const thisWeek = getThisWeekRange();
    const lastWeek = getLastWeekRange();
    const thisMonth = getThisMonthRange();
    const lastMonth = getLastMonthRange();

    const thisWeekAverage = calcAverage(thisWeek.start, thisWeek.end);
    const lastWeekAverage = calcAverage(lastWeek.start, lastWeek.end);
    const thisMonthAverage = calcAverage(thisMonth.start, thisMonth.end);
    const lastMonthAverage = calcAverage(lastMonth.start, lastMonth.end);

    let minWeight = { value: entries[0].weight, date: entries[0].date };
    let maxWeight = { value: entries[0].weight, date: entries[0].date };
    
    entries.forEach((e) => {
      if (e.weight < minWeight.value) {
        minWeight = { value: e.weight, date: e.date };
      }
      if (e.weight > maxWeight.value) {
        maxWeight = { value: e.weight, date: e.date };
      }
    });

    return {
      latestEntry,
      changeSinceLastEntry,
      thisWeekAverage,
      lastWeekAverage,
      weeklyChange: thisWeekAverage - lastWeekAverage,
      thisMonthAverage,
      lastMonthAverage,
      monthlyChange: thisMonthAverage - lastMonthAverage,
      minWeight,
      maxWeight,
      totalEntries: entries.length,
    };
  }, [entries]);
}
