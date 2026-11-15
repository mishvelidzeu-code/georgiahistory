import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // ხუთი ტაბი ვიწრო ეკრანზე (iPhone SE/15 — 375–393 pt) ≈ 75 pt-ს იღებს,
  // 11 pt-ზე კი გრძელი სახელები იჭრებოდა („კალენდარ…").
  const labelSize = width < 400 ? 9.5 : 11;

  // ტაბ-ბარი სისტემის ნავიგაციის ზოლს ზემოდან უნდა დაადგეს, თორემ
  // ანდროიდზე (edge-to-edge) იკონები ძალიან ჩაწეული ჩანს.
  const bottomInset = Math.max(insets.bottom, 10);

  const handleTabPress = async () => {
    try {
      await Haptics.selectionAsync();
    } catch {
      console.log("Haptics not supported");
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: "#111827",
          borderTopWidth: 1,
          borderTopColor: "rgba(212,175,55,0.3)",
          height: 60 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
        },

        tabBarActiveTintColor: "#D4AF37",
        tabBarInactiveTintColor: "#6B7280",

        tabBarIconStyle: {
          marginBottom: 2,
        },

        // სისტემის გადიდებული ფონტი ვერ ჭრის სახელებს.
        tabBarAllowFontScaling: false,

        tabBarItemStyle: {
          paddingHorizontal: 2,
        },

        tabBarLabelStyle: {
          fontSize: labelSize,
          fontWeight: "600",
        },
      }}
      screenListeners={{
        tabPress: handleTabPress,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "ისტორია",
          tabBarIcon: ({ color }) => (
            <Ionicons name="book-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "გვარები",
          tabBarIcon: ({ color }) => (
            <Ionicons name="search-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: "კალენდარი",
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="quiz"
        options={{
          title: "ქვიზი",
          tabBarIcon: ({ color }) => (
            <Ionicons name="help-circle-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "პროფილი",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
