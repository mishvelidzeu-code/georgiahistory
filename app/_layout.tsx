import { PremiumProvider } from "@/context/PremiumContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <PremiumProvider>
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

        <StatusBar style="light" />
      </ThemeProvider>
    </PremiumProvider>
  );
}