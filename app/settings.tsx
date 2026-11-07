import {
  cancelDailyReminder,
  clearPushToken,
  getPermissionGranted,
  isDailyReminderScheduled,
  registerPushToken,
  requestPermission,
  scheduleDailyReminder,
} from "@/services/notifications";
import { Ionicons } from "@expo/vector-icons";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsBusy, setNotificationsBusy] = useState(false);

  // გადამრთველი რეალურ მდგომარეობას უნდა აჩვენებდეს, არა ყოველთვის გამორთულს.
  useEffect(() => {
    const load = async () => {
      const granted = await getPermissionGranted();
      setNotificationsEnabled(granted && (await isDailyReminderScheduled()));
    };
    load();
  }, []);

  // 🔔 შეტყობინებების ჩართვა/გამორთვა
  const handleNotificationToggle = async (value: boolean) => {
    if (notificationsBusy) return;
    setNotificationsBusy(true);

    try {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;

      if (value) {
        if (!Device.isDevice) {
          Alert.alert("შეტყობინებები მუშაობს მხოლოდ რეალურ მოწყობილობაზე");
          return;
        }

        const granted = await requestPermission();

        if (!granted) {
          Alert.alert(
            "ნებართვა არ არის",
            "შეტყობინებები ტელეფონის პარამეტრებშია გამორთული. ჩართე აპლიკაციის პარამეტრებიდან."
          );
          return;
        }

        await scheduleDailyReminder();
        if (userId) await registerPushToken(userId);

        setNotificationsEnabled(true);
        Alert.alert("ჩართულია 🔔", "ყოველდღე 10:00-ზე შეგახსენებთ დღის ისტორიას.");
      } else {
        await cancelDailyReminder();
        if (userId) await clearPushToken(userId);

        setNotificationsEnabled(false);
        Alert.alert("შეტყობინებები გაითიშა");
      }
    } finally {
      setNotificationsBusy(false);
    }
  };

  const deleteAccount = async () => {
    Alert.alert(
      "ანგარიშის წაშლა",
      "ანგარიში და ყველა მონაცემი სამუდამოდ წაიშლება. ამის გაუქმება შეუძლებელია.",
      [
        { text: "გაუქმება", style: "cancel" },
        {
          text: "წაშლა",
          style: "destructive",
          onPress: async () => {
            try {
              // სრული წაშლა (auth.users-იდანაც) ხდება edge function-ით.
              const { error } = await supabase.functions.invoke(
                "delete-account"
              );
              if (error) throw error;

              await supabase.auth.signOut();

              Alert.alert("ანგარიში წაიშალა");
              router.replace("/(tabs)");
            } catch (e) {
              console.log("Delete account error:", e);
              Alert.alert(
                "შეცდომა",
                "ანგარიშის წაშლა ვერ მოხერხდა. სცადეთ მოგვიანებით."
              );
            }
          },
        },
      ]
    );
  };

  const logoutAll = async () => {
    await supabase.auth.signOut();
    Alert.alert("ყველა სესიიდან გამოსვლა შესრულდა");
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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

          <Text style={styles.headerTitle}>პარამეტრები</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Push Notifications */}
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 15 }}>
            <Text style={styles.label}>ყოველდღიური შეხსენება</Text>
            <Text style={styles.labelHint}>ყოველდღე 10:00-ზე</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            disabled={notificationsBusy}
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
          <Text style={[styles.buttonText, { color: "#FFF" }]}>
            ანგარიშის წაშლა
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0D14",
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
    color: "#D4AF37",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    color: "#FFF",
  },
  labelHint: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
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
