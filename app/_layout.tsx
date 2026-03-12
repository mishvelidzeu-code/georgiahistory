import { AuthProvider } from "@/context/AuthContext";
import { HistoryProvider } from "@/context/HistoryContext";
import { PremiumProvider } from "@/context/PremiumContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import Constants from 'expo-constants';
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Stack, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";

// ნოთიფიკაციების ქცევა
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const rootNavigationState = useRootNavigationState(); 
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. RevenueCat ინიციალიზაცია (მხოლოდ ნამდვილ Build-ში)
    const isExpoGo = Constants.appOwnership === 'expo';

    if (!isExpoGo) {
      try {
        Purchases.configure({
          apiKey: Platform.select({
            android: "goog_AWcflwfDmDjyxrSHNPgVZfMqOBT", // 👈 ახალი გასაღები ჩასმულია!
            ios: "appl_TGfDhXlKQcsZDoxsVYnntnmhigF",
          })!,
        });
      } catch (e) {
        console.log("RevenueCat configuration error:", e);
      }
    } else {
      console.warn("RevenueCat: Running in Expo Go, skipping native configuration.");
    }

    // 2. ნოთიფიკაციების გამართვა
    async function setupNotifications() {
      if (Device.isDevice || Platform.OS === 'android') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === "granted") {
          try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log("Push Token:", token);
          } catch (e) {
            console.log("ტოკენის ამოღების შეცდომა:", e);
          }
        }
      }
    }

    setupNotifications();
  }, []);

  useEffect(() => {
    if (rootNavigationState?.key) {
      setIsReady(true);
    }
  }, [rootNavigationState?.key]);

  if (!isReady) return null;

  return (
    <AuthProvider>
      <PremiumProvider>
        <HistoryProvider>
          <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="subscription"
                options={{
                  presentation: "modal",
                  animation: "slide_from_bottom",
                }}
              />
              <Stack.Screen name="(modals)/auth" />
              <Stack.Screen name="premium/births" />
              <Stack.Screen name="premium/georgia-events" />
              <Stack.Screen name="premium/world-events" />
            </Stack>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          </ThemeProvider>
        </HistoryProvider>
      </PremiumProvider>
    </AuthProvider>
  );
}