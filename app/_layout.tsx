import { PremiumProvider } from "@/context/PremiumContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <PremiumProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: "#0A0D14" }, // 🔥 რომ აღარასოდეს გამოჩნდეს თეთრი fallback
          }}
        >
          {/* მთავარი */}
          <Stack.Screen
            name="index"
            options={{ headerShown: false }}
          />

          {/* Tabs */}
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />

          {/* Auth Modal */}
          <Stack.Screen
            name="(modals)/auth"
            options={{
              presentation: "modal",
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />

          {/* 🔥 Subscription Modal */}
          <Stack.Screen
            name="subscription"
            options={{
              presentation: "modal",
              headerShown: false,
              animation: "slide_from_bottom",
              contentStyle: { backgroundColor: "#0A0D14" },
            }}
          />

          {/* Premium Pages */}
          <Stack.Screen
            name="premium/births"
            options={{
              headerShown: true,
              title: "ვინ დაიბადნენ ამ დღეს",
              headerBackButtonDisplayMode: "minimal",
              headerStyle: { backgroundColor: "#0A0D14" },
              headerTintColor: "#D4AF37",
            }}
          />

          <Stack.Screen
            name="premium/georgia-events"
            options={{
              headerShown: true,
              title: "საქართველოს მოვლენები",
              headerBackButtonDisplayMode: "minimal",
              headerStyle: { backgroundColor: "#0A0D14" },
              headerTintColor: "#D4AF37",
            }}
          />

          <Stack.Screen
            name="premium/world-events"
            options={{
              headerShown: true,
              title: "მსოფლიო მოვლენები",
              headerBackButtonDisplayMode: "minimal",
              headerStyle: { backgroundColor: "#0A0D14" },
              headerTintColor: "#D4AF37",
            }}
          />
        </Stack>

        <StatusBar style="light" />
      </ThemeProvider>
    </PremiumProvider>
  );
}