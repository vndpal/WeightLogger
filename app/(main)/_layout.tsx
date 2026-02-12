import { useEffect } from 'react';
import { Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useNavigation, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWeightStore, useSettingsStore, useAuthStore } from '../../src/stores';
import { sheetsService } from '../../src/services/google';
import { pullFromSheets } from '../../src/services/sync';
import { MaterialTopTabs } from '../../components/MaterialTopTabs';

export default function MainLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const loadEntries = useWeightStore((state) => state.loadEntries);
  const { sheetId, sheetName, setSheetId } = useSettingsStore();
  const { accessToken } = useAuthStore();

  const navigation = useNavigation();
  const segments = useSegments();

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    const syncFromSheets = async () => {
      if (!accessToken || !sheetId) return;

      try {
        await pullFromSheets(accessToken, sheetId, sheetName);
        await loadEntries();
      } catch (error) {
        console.error('Failed to pull latest sheet data:', error);
      }
    };

    syncFromSheets();
  }, [accessToken, sheetId, sheetName, loadEntries]);

  useEffect(() => {
    const checkAndCreateSheet = async () => {
      if (!sheetId && accessToken) {
        try {
          console.log('No sheet connected, creating one...');
          const newSheetId = await sheetsService.createSheet(accessToken, 'LogMyWeight');
          setSheetId(newSheetId);
          console.log('New sheet created and connected:', newSheetId);
          Alert.alert('Google Sheet Connected', 'A new Google Sheet "LogMyWeight" has been created and connected to store your data.');
        } catch (error) {
          console.error('Failed to auto-create sheet:', error);
        }
      }
    };

    checkAndCreateSheet();
  }, [accessToken, sheetId]);

  // Update header title based on current tab
  useEffect(() => {
    const routeName = segments[segments.length - 1];
    let title = 'Log Weight';

    if (routeName === 'history') {
      title = 'History';
    } else if (routeName === 'stats') {
      title = 'Stats';
    } else if (routeName === 'settings') {
      title = 'Settings';
    }

    navigation.setOptions({ title });
  }, [segments, navigation]);

  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#999',
        swipeEnabled: true,
        tabBarIndicatorStyle: { height: 0 }, // Hide indicator to mimic bottom tabs
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          backgroundColor: '#fff',
          elevation: 8, // Add some shadow for Android
          shadowColor: '#000', // Shadow for iOS
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          paddingBottom: Math.max(insets.bottom * 0.8, 8),
        },
        tabBarShowIcon: true,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', textTransform: 'none', marginTop: -4 },
      }}
    >
      <MaterialTopTabs.Screen
        name="index"
        options={{
          title: 'Log Weight',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="plus-circle" size={26} color={color} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="history" size={26} color={color} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chart-line" size={26} color={color} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog" size={26} color={color} />
          ),
        }}
      />
    </MaterialTopTabs>
  );
}
