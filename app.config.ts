import { ExpoConfig, ConfigContext } from 'expo/config';


const APP_ENV = process.env.APP_ENV;
let AndroidGoogleServicesFile: string | undefined;

if (APP_ENV === "development") {
    AndroidGoogleServicesFile = process.env.GOOGLE_SERVICES_JSON_DEV;
} else if (APP_ENV === "preview") {
    AndroidGoogleServicesFile = process.env.GOOGLE_SERVICES_JSON;
} else if (APP_ENV === "testing") {
    AndroidGoogleServicesFile = process.env.GOOGLE_SERVICES_JSON;
} else {
    AndroidGoogleServicesFile = process.env.GOOGLE_SERVICES_JSON || "./google-services.json";
}

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "LogMyWeight",
    slug: "logmyweight",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "logmyweight",
    // @ts-ignore: newArchEnabled is a valid property but might not be in the type definition yet
    newArchEnabled: true,
    splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
    },
    ios: {
        supportsTablet: true,
        bundleIdentifier: "com.logmyweight.app"
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#ffffff"
        },
        package: "com.logmyweight.app",
        edgeToEdgeEnabled: true,
        googleServicesFile: AndroidGoogleServicesFile
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
        "expo-font",
        "@react-native-firebase/app",
        "@react-native-firebase/crashlytics",
        [
            "expo-build-properties",
            {
                "ios": {
                    "useFrameworks": "static"
                }
            }
        ]
    ],
    experiments: {
        typedRoutes: true
    },
    extra: {
        router: {},
        googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "529320967514-o72b1j724gqgc3dj9o0ntd4c51rbka10.apps.googleusercontent.com",
        "eas": {
            "projectId": "ddebf348-5226-41fd-b679-347d00fdbf0c"
        }
    },
    owner: "vndpal"
});
