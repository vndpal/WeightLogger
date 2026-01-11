import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, TextInput, Platform, Keyboard, useWindowDimensions } from 'react-native';
import { Text, Button, IconButton, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeightStore, useSettingsStore, useAuthStore, useSyncStore } from '../../src/stores';
import { sheetsService } from '../../src/services/google';
import { weightRepository } from '../../src/database';
import { convertToKg, convertFromKg, formatWeight } from '../../src/utils';
import { WeightDial } from '../../src/components/entry/WeightDial';
import { format, startOfDay, isAfter } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';

export default function WeightEntryScreen() {
  const { height } = useWindowDimensions();
  const { unit } = useSettingsStore();
  const { accessToken } = useAuthStore();
  const { sheetId, sheetName } = useSettingsStore();
  const { upsertEntry, getLatestEntry } = useWeightStore();
  const { setIsSyncing, setPendingCount, pendingCount } = useSyncStore();

  // Consider screens shorter than 850px as "short"
  const isShortScreen = height < 850;

  const latestEntry = getLatestEntry();
  const [weightValue, setWeightValue] = useState(() => {
    if (latestEntry) {
      return convertFromKg(latestEntry.weight, unit).toFixed(2);
    }
    return unit === 'kg' ? '70.00' : '154.00';
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Manual weight entry modal
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [tempWeight, setTempWeight] = useState('');

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);

  const adjustWeight = (delta: number) => {
    const current = parseFloat(weightValue) || 0;
    const newValue = Math.max(0.1, Math.min(1000, current + delta));
    setWeightValue(newValue.toFixed(2));
  };

  const handleDialChange = (val: number) => {
    setWeightValue(val.toFixed(2));
  };

  const handleWeightPress = () => {
    setTempWeight(weightValue);
    setShowWeightModal(true);
  };

  const handleWeightSubmit = () => {
    const weight = parseFloat(tempWeight);
    if (!isNaN(weight) && weight >= 0.1 && weight <= 1000) {
      setWeightValue(weight.toFixed(2));
    }
    setShowWeightModal(false);
    Keyboard.dismiss();
  };

  const handleDateChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      const today = startOfDay(new Date());
      if (isAfter(startOfDay(date), today)) {
        Alert.alert('Invalid Date', 'Cannot select a future date.');
        return;
      }
      setSelectedDate(date);
    }
  };

  const handleLogWeight = async () => {
    const weight = parseFloat(weightValue);
    if (isNaN(weight) || weight < 0.1 || weight > 1000) {
      Alert.alert('Invalid Weight', 'Please enter a weight between 0.1 and 1000.');
      return;
    }

    setIsLoading(true);
    try {
      const weightInKg = convertToKg(weight, unit);

      const entry = await upsertEntry(selectedDate, weightInKg);

      // Try to sync to Google Sheets if connected
      if (accessToken && sheetId) {
        try {
          setIsSyncing(true);
          const { rowIndex } = await sheetsService.appendRow(accessToken, sheetId, sheetName, {
            date: entry.date,
            formattedDate: entry.formattedDate,
            weight: weightInKg,
          });

          // Mark as synced locally and in DB
          await weightRepository.markSynced(entry.id, rowIndex);
          const { markEntrySynced } = useWeightStore.getState();
          markEntrySynced(entry.id, rowIndex);
        } catch (syncError: any) {
          console.error('Sync failed:', syncError);
          // Only show alert if it's a specific error we want to bubble up
          Alert.alert('Sync Error', `Could not sync to Google Sheets: ${syncError.message}`);
          setPendingCount(pendingCount + 1);
        } finally {
          setIsSyncing(false);
        }
      }

      Alert.alert('Success', 'Weight logged successfully!');
    } catch (error) {
      console.log('Failed to log weight:', error);
      Alert.alert('Error', 'Failed to log weight. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const change = latestEntry
    ? convertFromKg(convertToKg(parseFloat(weightValue), unit) - latestEntry.weight, unit)
    : 0;

  const isToday = startOfDay(selectedDate).getTime() === startOfDay(new Date()).getTime();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[styles.content, isShortScreen && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
      >

        {/* Weight Entry Card */}
        <View style={[styles.weightCard, isShortScreen && styles.weightCardCompact]}>
          <Text style={styles.cardLabel}>WEIGHT</Text>

          <View style={[styles.weightRow, isShortScreen && styles.weightRowCompact]}>
            <TouchableOpacity
              style={[styles.adjustButton, isShortScreen && styles.adjustButtonCompact]}
              onPress={() => adjustWeight(-0.1)}
              activeOpacity={0.7}
            >
              <IconButton icon="minus" size={isShortScreen ? 20 : 28} iconColor="#6366f1" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleWeightPress} activeOpacity={0.8}>
              <View style={styles.weightDisplay}>
                <Text style={[styles.weightValue, isShortScreen && styles.weightValueCompact]}>
                  {weightValue}
                </Text>
                <Text style={styles.unitLabel}>{unit}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.adjustButton, isShortScreen && styles.adjustButtonCompact]}
              onPress={() => adjustWeight(0.1)}
              activeOpacity={0.7}
            >
              <IconButton icon="plus" size={isShortScreen ? 20 : 28} iconColor="#6366f1" />
            </TouchableOpacity>
          </View>

          {/* Weight Dial Selector */}
          <WeightDial
            value={parseFloat(weightValue)}
            onValueChange={handleDialChange}
            min={0.1}
            max={1000}
            height={100}
          />


        </View>

        {/* Date Picker Card */}
        <TouchableOpacity
          style={[styles.dateCard, isShortScreen && styles.dateCardCompact]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.dateContent}>
            <View style={[styles.dateIconContainer, isShortScreen && styles.dateIconContainerCompact]}>
              <IconButton icon="calendar" size={isShortScreen ? 20 : 24} iconColor="#6366f1" />
            </View>
            <View style={styles.dateTextContainer}>
              <Text style={styles.cardLabel}>DATE</Text>
              <Text style={styles.dateValue}>
                {isToday ? 'Today' : format(selectedDate, 'EEEE')}, {format(selectedDate, 'dd MMM yyyy')}
              </Text>
            </View>
            <IconButton icon="chevron-right" size={isShortScreen ? 20 : 24} iconColor="#9ca3af" />
          </View>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Stats Card */}
        {latestEntry && (
          <View style={[styles.statsCard, isShortScreen && styles.statsCardCompact]}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Last Entry</Text>
              <Text style={[styles.statValue, isShortScreen && styles.statValueCompact]}>
                {formatWeight(latestEntry.weight, unit)}
              </Text>
              <Text style={styles.statSubtext}>{latestEntry.formattedDate}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Change</Text>
              <Text style={[
                styles.statValue,
                isShortScreen && styles.statValueCompact,
                { color: change < 0 ? '#10b981' : change > 0 ? '#ef4444' : '#6b7280' }
              ]}>
                {change > 0 ? '+' : ''}{change.toFixed(1)} {unit}
              </Text>
              <Text style={styles.statSubtext}>
                {change < 0 ? 'Loss' : change > 0 ? 'Gain' : 'No change'}
              </Text>
            </View>
          </View>
        )}

        {/* Log Button */}
        <TouchableOpacity
          style={styles.logButtonContainer}
          onPress={handleLogWeight}
          disabled={isLoading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.logButton, isShortScreen && styles.logButtonCompact]}
          >
            <Text style={styles.logButtonText}>
              {isLoading ? 'Logging...' : 'Log Weight'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      {/* Weight Entry Modal */}
      <Portal>
        <Modal
          visible={showWeightModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWeightModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowWeightModal(false)}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={() => { }}
            >
              <Text style={styles.modalTitle}>Enter Weight</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.weightInput}
                  value={tempWeight}
                  onChangeText={setTempWeight}
                  keyboardType="decimal-pad"
                  autoFocus
                  selectTextOnFocus
                  placeholder="0.0"
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.inputUnit}>{unit}</Text>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowWeightModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={handleWeightSubmit}
                >
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Softer slate background
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  contentCompact: {
    padding: 10,
    paddingBottom: 10,
  },

  // Weight Card
  weightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  weightCardCompact: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  weightRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  weightRowCompact: {
    marginVertical: 2,
  },
  adjustButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonCompact: {
    width: 44,
    height: 44,
  },
  weightDisplay: {
    alignItems: 'center',
    paddingHorizontal: 12,
    minWidth: 140,
  },
  weightValue: {
    fontSize: 56,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -2,
  },
  weightValueCompact: {
    fontSize: 44,
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 4,
  },


  // Date Card
  dateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  dateCardCompact: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateIconContainerCompact: {
    width: 40,
    height: 40,
  },
  dateTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },

  // Stats Card
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statsCardCompact: {
    padding: 10,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  statValueCompact: {
    fontSize: 18,
  },
  statSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },

  // Log Button
  logButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  logButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  logButtonCompact: {
    paddingVertical: 12,
  },
  logButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  weightInput: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    minWidth: 140,
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
    paddingVertical: 8,
  },
  inputUnit: {
    fontSize: 24,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
