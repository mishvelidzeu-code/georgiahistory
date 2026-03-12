import { useThemeCustom } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../services/supabase";

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeCustom();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // 🔔 Push Permission
  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      if (!Device.isDevice) {
        Alert.alert("Push შეტყობინებები მუშაობს მხოლოდ რეალურ მოწყობილობაზე");
        return;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } =
          await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert("Permission უარყოფილია");
        return;
      }

      const token = (
  await Notifications.getExpoPushTokenAsync({
    projectId: "10febd73-7545-4658-9a01-a2680d34f272"
  })
).data;

      console.log("Expo Push Token:", token);

      // 🔥 TOKEN შენახვა Supabase-ში
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        await supabase
          .from("profiles")
          .update({ push_token: token })
          .eq("id", data.user.id);
      }

      setNotificationsEnabled(true);
      Alert.alert("Push შეტყობინებები გააქტიურდა 🔔");
    } else {
      setNotificationsEnabled(false);
      Alert.alert("Push შეტყობინებები გაითიშა");
    }
  };

  const deleteAccount = async () => {
    Alert.alert("ანგარიშის წაშლა", "დარწმუნებული ხარ?", [
      { text: "გაუქმება", style: "cancel" },
      {
        text: "წაშლა",
        style: "destructive",
        onPress: async () => {
          const { data } = await supabase.auth.getUser();
          if (!data?.user) return;

          await supabase
            .from("profiles")
            .delete()
            .eq("id", data.user.id);

          await supabase.auth.signOut();

          Alert.alert("ანგარიში წაიშალა");
          router.replace("/(tabs)");
        },
      },
    ]);
  };

  const logoutAll = async () => {
    await supabase.auth.signOut();
    Alert.alert("ყველა სესიიდან გამოსვლა შესრულდა");
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme === "dark" ? "#0A0D14" : "#FFFFFF" },
      ]}
    >
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.customHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="arrow-back" size={24} color="#D4AF37" />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              { color: theme === "dark" ? "#D4AF37" : "#000" },
            ]}
          >
            პარამეტრები
          </Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Dark Mode */}
        <View style={styles.row}>
          <Text
            style={[
              styles.label,
              { color: theme === "dark" ? "#FFF" : "#000" },
            ]}
          >
            Dark Mode
          </Text>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ true: "#D4AF37" }}
          />
        </View>

        {/* Push Notifications */}
        <View style={styles.row}>
          <Text
            style={[
              styles.label,
              { color: theme === "dark" ? "#FFF" : "#000" },
            ]}
          >
            Push შეტყობინებები
          </Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ true: "#D4AF37" }}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={logoutAll}>
          <Text style={styles.buttonText}>ყველა სესიიდან გამოსვლა</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#7F1D1D" }]}
          onPress={deleteAccount}
        >
          <Text style={styles.buttonText}>ანგარიშის წაშლა</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginBottom: 25,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
  },
  button: {
    backgroundColor: "#D4AF37",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#000",
    fontWeight: "700",
  },
});