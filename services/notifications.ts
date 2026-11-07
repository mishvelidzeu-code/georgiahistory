import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

/** ყოველდღიური შეხსენების დრო (მოწყობილობის ლოკალური დროით). */
export const DAILY_REMINDER_HOUR = 10;
export const DAILY_REMINDER_MINUTE = 0;

export const ANDROID_CHANNEL_ID = "daily-history";

/** ნებართვაზე ერთხელ ვეკითხებით — მეორედ აღარ ვაწუხებთ. */
const ASKED_KEY = "notifications_permission_asked";

/**
 * Android-ზე არხის გარეშე შეტყობინება ხმისა და „heads-up"-ის გარეშე მოდის.
 * უსაფრთხოა ყოველ გაშვებაზე გამოძახება.
 */
export async function setupAndroidChannel() {
  if (Platform.OS !== "android") return;

  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "დღის ისტორია",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#D4AF37",
      sound: "default",
    });
  } catch (e) {
    console.log("Notification channel error:", e);
  }
}

export async function getPermissionGranted(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

/** ითხოვს ნებართვას და აბრუნებს შედეგს. */
export async function requestPermission(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch (e) {
    console.log("Notification permission error:", e);
    return false;
  }
}

export async function hasAskedBefore(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ASKED_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function markAsked() {
  try {
    await AsyncStorage.setItem(ASKED_KEY, "1");
  } catch {
    // ქეშის შეცდომა კრიტიკული არ არის
  }
}

/**
 * ყოველდღიური ლოკალური შეხსენება 10:00-ზე.
 * ჯერ ვასუფთავებთ ძველს, რომ დუბლიკატები არ დაგროვდეს.
 */
export async function scheduleDailyReminder() {
  try {
    await cancelDailyReminder();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "დღის ისტორია",
        body: "ნახე, რა მოხდა ამ დღეს წლების წინ 📜",
        sound: "default",
        data: { screen: "/(tabs)" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: DAILY_REMINDER_HOUR,
        minute: DAILY_REMINDER_MINUTE,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  } catch (e) {
    console.log("Schedule reminder error:", e);
  }
}

export async function cancelDailyReminder() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.log("Cancel reminder error:", e);
  }
}

export async function isDailyReminderScheduled(): Promise<boolean> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.length > 0;
  } catch {
    return false;
  }
}

/**
 * Expo push token-ს ინახავს `profiles.push_token`-ში.
 * მხოლოდ ავტორიზებული მომხმარებლისთვის აქვს აზრი.
 */
export async function registerPushToken(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return null;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;

    await supabase
      .from("profiles")
      .update({ push_token: token })
      .eq("id", userId);

    return token;
  } catch (e) {
    console.log("Push token error:", e);
    return null;
  }
}

/** გამორთვისას ტოკენს ბაზიდანაც ვშლით, თორემ სერვერი მაინც გამოაგზავნის. */
export async function clearPushToken(userId: string) {
  try {
    await supabase
      .from("profiles")
      .update({ push_token: null })
      .eq("id", userId);
  } catch (e) {
    console.log("Clear push token error:", e);
  }
}
