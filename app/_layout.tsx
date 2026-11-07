import { AuthProvider } from "@/context/AuthContext";
import { HistoryProvider } from "@/context/HistoryContext";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Stack, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

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
  const rootNavigationState = useRootNavigationState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // ნოთიფიკაციების გამართვა
    async function setupNotifications() {
      if (Device.isDevice || Platform.OS === "android") {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === "granted") {
          try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            await Notifications.getExpoPushTokenAsync({ projectId });
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

  // აპლიკაცია მხოლოდ მუქ თემაზეა — light ვერსია არ არსებობს.
  return (
    <AuthProvider>
      <HistoryProvider>
        <ThemeProvider value={DarkTheme}>
          {/* დანარჩენი მარშრუტები (settings, profile-details, premium/*)
              expo-router-ის მიერ ავტომატურად რეგისტრირდება. */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </HistoryProvider>
    </AuthProvider>
  );
}
