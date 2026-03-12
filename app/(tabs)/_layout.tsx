import { useThemeCustom } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {

  const { theme } = useThemeCustom();

  const background = theme === "dark" ? "#111827" : "#FFFFFF";

  const handleTabPress = async () => {
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      console.log("Haptics not supported");
    }
  };

  return (

    <Tabs
      screenOptions={{

        headerShown: false,

        tabBarStyle: {
          backgroundColor: background,
          borderTopWidth: 1,
          borderTopColor: "rgba(212,175,55,0.3)",
          height: 65,
        },

        tabBarActiveTintColor: "#D4AF37",
        tabBarInactiveTintColor: "#6B7280",

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 5,
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
        name="science"
        options={{
          title: "მეცნიერება",
          tabBarIcon: ({ color }) => (
            <Ionicons name="flask-outline" size={22} color={color} />
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