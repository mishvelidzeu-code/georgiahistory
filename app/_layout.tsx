import NotificationBootstrap from "@/components/notification-bootstrap";
import { AuthProvider } from "@/context/AuthContext";
import { HistoryProvider } from "@/context/HistoryContext";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

// ნოთიფიკაციების ქცევა (როცა აპი ღიაა)
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
          {/* შეტყობინებების გამართვა (არაფერს ხატავს) */}
          <NotificationBootstrap />

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
