import { ExpoConfig, ConfigContext } from 'expo/config';
import * as fs from 'fs';
import * as path from 'path';

const GOOGLE_SERVICES_JSON_PATH = path.join(__dirname, 'google-services.json');

// Check if the environment variable is set
if (process.env.GOOGLE_SERVICES_JSON) {
    try {
        // Write the content to google-services.json
        // We assume the environment variable contains the raw JSON string
        fs.writeFileSync(GOOGLE_SERVICES_JSON_PATH, process.env.GOOGLE_SERVICES_JSON);
        console.log(`Successfully generated ${GOOGLE_SERVICES_JSON_PATH} from environment variable.`);
    } catch (error) {
        console.error('Error writing google-services.json from environment variable:', error);
    }
}

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "WeightLog",
    slug: "weightlog",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "weightlog",
    // @ts-ignore: newArchEnabled is a valid property but might not be in the type definition yet
    newArchEnabled: true,
    splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#4CAF50"
    },
    ios: {
        supportsTablet: true,
        bundleIdentifier: "com.weightlog.app"
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#4CAF50"
        },
        package: "com.weightlog.app",
        edgeToEdgeEnabled: true,
        googleServicesFile: "./google-services.json"
    },
    web: {
        favicon: "./assets/favicon.png",
        bundler: "metro"
    },
    plugins: [
        "expo-router",
        "expo-sqlite",
        "expo-secure-store",
        "@react-native-google-signin/google-signin",
        "@react-native-community/datetimepicker",
        "expo-font"
    ],
    experiments: {
        typedRoutes: true
    },
    extra: {
        router: {},
        eas: {
            projectId: "06c3a595-d258-4c18-acf0-d1dc88ce056e"
        }
    },
    owner: "vndpal"
});
