import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { configureGoogleSignIn, signInWithGoogle } from '../../src/services/google';
import { useAuthStore } from '../../src/stores';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { user, accessToken } = await signInWithGoogle();

      await setTokens(accessToken, '');
      setUser(user);
      router.replace('/(main)');
    } catch (err: any) {
      console.error('Sign in error:', err);
      if (err.message !== 'Sign in cancelled') {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="scale-bathroom" size={80} color="#4CAF50" />
          <Text variant="headlineLarge" style={styles.title}>WeightLog</Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Track your weight privately in your own Google Sheet
          </Text>
        </View>

        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>Privacy First</Text>
          <Text variant="bodyMedium" style={styles.cardText}>
            Your weight data is stored in your personal Google Sheet. We never store your data on our servers.
          </Text>
        </Surface>

        <View style={styles.features}>
          <FeatureItem icon="chart-line" text="Track weight trends over time" />
          <FeatureItem icon="sync" text="Sync across devices via Google Sheets" />
          <FeatureItem icon="wifi-off" text="Works offline with local backup" />
        </View>

        {error && (
          <Text variant="bodyMedium" style={styles.errorText}>
            {error}
          </Text>
        )}

        <Button
          mode="contained"
          icon="google"
          onPress={handleSignIn}
          disabled={isLoading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </Button>

        {isLoading && (
          <ActivityIndicator animating={true} style={styles.loader} />
        )}

        <Text variant="bodySmall" style={styles.disclaimer}>
          By signing in, you grant access to create and edit a Google Sheet for weight logging.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <MaterialCommunityIcons name={icon as any} size={24} color="#4CAF50" />
      <Text variant="bodyMedium" style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginTop: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  cardText: {
    color: '#666',
  },
  features: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 12,
    color: '#333',
  },
  button: {
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  loader: {
    marginBottom: 16,
  },
  disclaimer: {
    textAlign: 'center',
    color: '#999',
  },
});
