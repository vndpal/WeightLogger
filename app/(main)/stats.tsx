import { useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Text, Surface, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { useWeightStore, useSettingsStore } from '../../src/stores';
import { useWeightStats } from '../../src/hooks/useWeightStats';
import { convertFromKg, formatWeight } from '../../src/utils';
import { subDays, subMonths, parseISO } from 'date-fns';

type TimeRange = '1W' | '1M' | '3M' | '6M' | 'ALL';

export default function StatsScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const entries = useWeightStore((state) => state.entries);
  const { unit } = useSettingsStore();
  const stats = useWeightStats();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  const isShortScreen = screenHeight < 800;

  const getFilteredEntries = () => {
    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case '1W': cutoffDate = subDays(now, 7); break;
      case '1M': cutoffDate = subMonths(now, 1); break;
      case '3M': cutoffDate = subMonths(now, 3); break;
      case '6M': cutoffDate = subMonths(now, 6); break;
      default: cutoffDate = new Date(0);
    }

    return entries
      .filter((e) => parseISO(e.date) >= cutoffDate)
      .reverse();
  };

  const filteredEntries = getFilteredEntries();
  const chartData = filteredEntries.map((e, index) => ({
    value: convertFromKg(e.weight, unit),
    label: index % Math.max(1, Math.ceil(filteredEntries.length / 5)) === 0
      ? e.formattedDate.split(', ')[1] || ''
      : '',
  }));

  const renderStatCard = (change: number, label: string) => {
    const displayChange = convertFromKg(change, unit);
    const isPositive = displayChange > 0;
    const isNegative = displayChange < 0;

    return (
      <View style={[styles.statItem, isShortScreen && styles.statItemCompact]}>
        <Text variant="labelMedium" style={styles.statLabel}>{label}</Text>
        <Text
          style={[
            styles.statValueText,
            { color: isNegative ? '#14b8a6' : isPositive ? '#f43f5e' : '#64748b' }
          ]}
        >
          {isPositive ? '+' : ''}{displayChange.toFixed(2)} {unit}
        </Text>
      </View>
    );
  };

  if (entries.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyText}>No data yet</Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Start logging your weight to see statistics
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[styles.content, isShortScreen && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
      >
        <Surface style={[styles.chartCard, isShortScreen && styles.chartCardCompact]} elevation={0}>
          <Text variant="titleMedium" style={styles.chartTitle}>Weight Trend</Text>

          <View style={styles.segmentedButtonsWrapper}>
            <SegmentedButtons
              value={timeRange}
              onValueChange={(v) => setTimeRange(v as TimeRange)}
              density="small"
              buttons={[
                { value: '1W', label: '1W', labelStyle: styles.segmentedButtonLabel, style: styles.segmentedButton },
                { value: '1M', label: '1M', labelStyle: styles.segmentedButtonLabel, style: styles.segmentedButton },
                { value: '3M', label: '3M', labelStyle: styles.segmentedButtonLabel, style: styles.segmentedButton },
                { value: '6M', label: '6M', labelStyle: styles.segmentedButtonLabel, style: styles.segmentedButton },
                { value: 'ALL', label: 'All', labelStyle: styles.segmentedButtonLabel, style: styles.segmentedButton },
              ]}
              style={styles.segmentedButtons}
            />
          </View>

          {chartData.length > 0 ? (
            <LineChart
              data={chartData}
              width={screenWidth - (isShortScreen ? 48 : 72)}
              height={isShortScreen ? 140 : 180}
              spacing={chartData.length > 10 ? (screenWidth - 100) / chartData.length : 40}
              color="#14b8a6"
              thickness={2.5}
              startFillColor="rgba(20, 184, 166, 0.15)"
              endFillColor="rgba(20, 184, 166, 0.0)"
              areaChart
              curved
              hideDataPoints={chartData.length > 20}
              yAxisTextStyle={{ color: '#94a3b8', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#94a3b8', fontSize: 9 }}
              hideRules
              yAxisColor="transparent"
              xAxisColor="#f1f5f9"
            />
          ) : (
            <Text style={styles.noDataText}>No data for selected period</Text>
          )}
        </Surface>

        <Surface style={[styles.summaryCard, isShortScreen && styles.summaryCardCompact]} elevation={0}>
          <View style={styles.statsRow}>
            {renderStatCard(stats.changeSinceLastEntry, 'Recent')}
            <View style={styles.divider} />
            {renderStatCard(stats.weeklyChange, 'Weekly')}
            <View style={styles.divider} />
            {renderStatCard(stats.monthlyChange, 'Monthly')}
          </View>
        </Surface>

        <Surface style={[styles.summaryCard, isShortScreen && styles.summaryCardCompact]} elevation={0}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Lowest</Text>
              <Text style={[styles.summaryValue, { color: '#0d9488' }]}>
                {stats.minWeight ? formatWeight(stats.minWeight.value, unit) : '—'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Highest</Text>
              <Text style={[styles.summaryValue, { color: '#e11d48' }]}>
                {stats.maxWeight ? formatWeight(stats.maxWeight.value, unit) : '—'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Average</Text>
              <Text style={styles.summaryValue}>
                {stats.latestEntry ? formatWeight(stats.latestEntry.weight, unit) : '—'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Entries</Text>
              <Text style={styles.summaryValue}>{stats.totalEntries}</Text>
            </View>
          </View>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 16
  },
  contentCompact: {
    padding: 12
  },
  chartCard: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  chartCardCompact: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 12,
    borderRadius: 20
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  segmentedButtonsWrapper: {
    marginBottom: 20,
    width: '100%',
  },
  segmentedButtons: {
    width: '100%',
  },
  segmentedButton: {
    paddingHorizontal: 0,
    minWidth: 0,
  },
  segmentedButtonLabel: {
    fontSize: 10,
  },
  noDataText: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: 40
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statItemCompact: {
    paddingVertical: 8,
  },
  statLabel: {
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '600',
    fontSize: 11,
    textTransform: 'uppercase'
  },
  statValueText: {
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: '#f1f5f9'
  },
  summaryCard: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16
  },
  summaryCardCompact: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 12
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8
  },
  summaryItem: {
    width: '50%',
    padding: 8,
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155'
  },
  emptySubtext: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center'
  },
});

