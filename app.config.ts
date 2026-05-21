import { ExpoConfig, ConfigContext } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? "[Dev] Airsoft App" : "Airsoft App",
  slug: "airsoft-app",
  version: "1.1.1",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: IS_DEV ? "airsoft-dev" : "airsoft",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: IS_DEV ? "dev.melkoh.airsoft.dev" : "dev.melkoh.airsoft",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#0F172A",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    package: IS_DEV ? "dev.melkoh.airsoft.dev" : "dev.melkoh.airsoft",
  },
  web: {
    output: "static" as const,
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "./plugins/withReleaseSigning",
    [
      "expo-build-properties",
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#0F172A",
        android: {
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      },
    ],
    "@react-native-community/datetimepicker",
    "expo-localization",
    "expo-sqlite",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Airsoft App uses your location to show weather at the field.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
  },
});
