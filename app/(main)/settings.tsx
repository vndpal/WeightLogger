import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Text, Switch, TextInput, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettingsStore, useAuthStore, useSyncStore } from '../../src/stores';
import { sheetsService } from '../../src/services/google';
import { LinearGradient } from 'expo-linear-gradient';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  if ((global as any).nativeFabricUIManager) {
    // It's a no-op in Fabric, so we don't need to call it.
    // This avoids the warning: "setLayoutAnimationEnabledExperimental is currently a no-op in the New Architecture"
  } else {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function SettingsScreen() {
  const router = useRouter();
  const { unit, setUnit, sheetId, setSheetId, autoSync, setAutoSync } = useSettingsStore();
  const { user, accessToken, clearAuth } = useAuthStore();
  const { pendingCount } = useSyncStore();

  const [sheetUrl, setSheetUrl] = useState(sheetId ? 'https://docs.google.com/spreadsheets/d/' + sheetId : '');
  const [isValidating, setIsValidating] = useState(false);
  const [isSheetSettingsExpanded, setIsSheetSettingsExpanded] = useState(false);

  const handleUnitToggle = () => {
    setUnit(unit === 'kg' ? 'lbs' : 'kg');
  };

  const toggleSheetSettings = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSheetSettingsExpanded(!isSheetSettingsExpanded);
  };

  const handleConnectSheet = async () => {
    if (!sheetUrl.trim()) {
      Alert.alert('Error', 'Please enter a Google Sheet URL');
      return;
    }
    const extractedId = sheetsService.parseSheetIdFromUrl(sheetUrl);
    if (!extractedId) {
      Alert.alert('Invalid URL', 'Please enter a valid Google Sheets URL');
      return;
    }
    if (!accessToken) {
      Alert.alert('Not Signed In', 'Please sign in first');
      return;
    }
    setIsValidating(true);
    try {
      const isValid = await sheetsService.validateSheet(accessToken, extractedId);
      if (isValid) {
        setSheetId(extractedId);
        Alert.alert('Success', 'Google Sheet connected!');
      } else {
        Alert.alert('Access Denied', 'Unable to access this sheet.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate sheet.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      Alert.alert('Not Signed In', 'Please sign in first');
      return;
    }
    setIsValidating(true);
    try {
      const newSheetId = await sheetsService.createSheet(accessToken, 'WeightLog');
      setSheetId(newSheetId);
      setSheetUrl('https://docs.google.com/spreadsheets/d/' + newSheetId);
      Alert.alert('Success', 'New Google Sheet created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create sheet.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await clearAuth();
          router.replace('/(auth)/login');
        }
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* User Profile Card */}
        {user && (
          <View style={styles.card}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                {user.picture ? (
                  <View style={styles.avatarImageWrapper}>
                    <IconButton icon="account" size={28} iconColor="#6366f1" />
                  </View>
                ) : (
                  <View style={styles.avatarImageWrapper}>
                    <Text style={styles.avatarText}>{user.name[0].toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Weight Unit Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>WEIGHT UNIT</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIconContainer}>
                <IconButton icon="scale" size={22} iconColor="#6366f1" />
              </View>
              <Text style={styles.settingText}>Use Pounds (lbs)</Text>
            </View>
            <Switch
              value={unit === 'lbs'}
              onValueChange={handleUnitToggle}
              color="#6366f1"
            />
          </View>
        </View>

        {/* Sync Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>SYNC</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIconContainer}>
                <IconButton icon="sync" size={22} iconColor="#6366f1" />
              </View>
              <View>
                <Text style={styles.settingText}>Auto-sync</Text>
                <Text style={styles.settingHint}>Pending: {pendingCount} entries</Text>
              </View>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              color="#6366f1"
            />
          </View>
        </View>

        {/* Google Sheet Card - Collapsible */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={toggleSheetSettings}
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <View style={styles.settingIconContainer}>
                <IconButton icon="google-spreadsheet" size={22} iconColor="#6366f1" />
              </View>
              <View>
                <Text style={styles.settingText}>Google Sheet Settings</Text>
                <Text style={styles.settingHint}>
                  {sheetId ? 'Connected' : 'Not connected'}
                </Text>
              </View>
            </View>
            <IconButton
              icon={isSheetSettingsExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              iconColor="#9ca3af"
            />
          </TouchableOpacity>

          {isSheetSettingsExpanded && (
            <View style={styles.collapsibleContent}>
              <View style={styles.divider} />
              <Text style={styles.advancedLabel}>Advanced Settings</Text>
              <Text style={styles.advancedHint}>
                Configure your Google Sheet connection. Only modify if you know what you're doing.
              </Text>

              <TextInput
                mode="outlined"
                label="Sheet URL"
                value={sheetUrl}
                onChangeText={setSheetUrl}
                style={styles.input}
                outlineColor="#e5e7eb"
                activeOutlineColor="#6366f1"
                textColor="#1f2937"
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handleConnectSheet}
                  disabled={isValidating}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>
                    {isValidating ? 'Connecting...' : 'Connect'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={handleCreateNewSheet}
                  disabled={isValidating}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isValidating ? 'Creating...' : 'Create New'}
                  </Text>
                </TouchableOpacity>
              </View>

              {sheetId && (
                <TouchableOpacity
                  style={styles.openSheetButton}
                  onPress={() => Linking.openURL('https://docs.google.com/spreadsheets/d/' + sheetId)}
                  activeOpacity={0.7}
                >
                  <IconButton icon="open-in-new" size={18} iconColor="#6366f1" />
                  <Text style={styles.openSheetText}>Open Sheet in Browser</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <IconButton icon="logout" size={20} iconColor="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  // Card Styles
  card: {
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  // User Profile
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarImageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366f1',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  settingHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },

  // Collapsible
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsibleContent: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  advancedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  advancedHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 16,
    lineHeight: 18,
  },

  // Input
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  openSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  openSheetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },

  // Sign Out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5f5',
    borderRadius: 16,
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});
