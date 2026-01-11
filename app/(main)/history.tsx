import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Surface, IconButton, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeightStore, useSettingsStore } from '../../src/stores';
import { formatWeight } from '../../src/utils';
import { WeightEntry } from '../../src/types';

export default function HistoryScreen() {
  const { entries, loadEntries, deleteEntry } = useWeightStore();
  const { unit } = useSettingsStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  }, [loadEntries]);

  const handleDelete = (entry: WeightEntry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this weight entry for ' + entry.formattedDate + '?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEntry(entry.id),
        },
      ]
    );
  };

  const renderEntry = ({ item }: { item: WeightEntry }) => {
    const prevEntry = entries[entries.indexOf(item) + 1];
    const change = prevEntry ? item.weight - prevEntry.weight : 0;

    return (
      <Surface style={styles.entryCard} elevation={0}>
        <View style={styles.entryContent}>
          <View style={styles.entryLeft}>
            <Text style={styles.weight}>
              {formatWeight(item.weight, unit)}
            </Text>
            <Text style={styles.date}>
              {item.formattedDate}
            </Text>
          </View>

          <View style={styles.entryRight}>
            {change !== 0 && (
              <Chip
                compact
                style={[
                  styles.changeChip,
                  { backgroundColor: change < 0 ? '#dcfce7' : '#fee2e2' }
                ]}
                textStyle={{
                  color: change < 0 ? '#15803d' : '#b91c1c',
                  fontSize: 12,
                  fontWeight: '700'
                }}
              >
                {change > 0 ? '+' : ''}{change.toFixed(1)}
              </Chip>
            )}

            <Chip
              compact
              style={[
                styles.syncChip,
                { backgroundColor: item.syncStatus === 'synced' ? '#e0e7ff' : '#f1f5f9' }
              ]}
              textStyle={{
                fontSize: 10,
                color: item.syncStatus === 'synced' ? '#4338ca' : '#475569',
                fontWeight: '700'
              }}
            >
              {item.syncStatus === 'synced' ? 'Synced' : 'Pending'}
            </Chip>
          </View>

          <IconButton
            icon="delete-outline"
            size={20}
            iconColor="#64748b"
            onPress={() => handleDelete(item)}
          />
        </View>
      </Surface>
    );
  };

  if (entries.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyText}>No entries yet</Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Start logging your weight to see your history here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Softer slate background (matches index)
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  entryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20, // Increased radius
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  entryLeft: {
    flex: 1,
  },
  weight: {
    fontSize: 20,
    fontWeight: '700', // Matches index statValue
    color: '#1f2937',
  },
  date: {
    fontSize: 12,
    color: '#64748b', // Darker gray for better visibility
    marginTop: 4,
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  changeChip: {
    paddingHorizontal: 4,
    borderRadius: 8,
    // Removed fixed height to fix trimming
  },
  syncChip: {
    paddingHorizontal: 4,
    borderRadius: 8,
    // Removed fixed height to fix trimming
  },
  separator: {
    height: 12, // Increased spacing
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
});
