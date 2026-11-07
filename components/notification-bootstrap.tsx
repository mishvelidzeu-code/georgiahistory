import { useAuth } from "@/context/AuthContext";
import {
  getPermissionGranted,
  hasAskedBefore,
  markAsked,
  registerPushToken,
  requestPermission,
  scheduleDailyReminder,
  setupAndroidChannel,
} from "@/services/notifications";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

/**
 * ხედავს არაფერს — მხოლოდ შეტყობინებებს აწყობს.
 *
 * ნებართვას აპის გაშვებისთანავე აღარ ვითხოვთ (splash-ზე გამოტანილ შეკითხვაზე
 * ხალხი უარს ამბობს და iOS-ზე მეორედ კითხვა აღარ შეიძლება) — ვიცდით, სანამ
 * მომხმარებელი შევა, და მხოლოდ ერთხელ ვეკითხებით.
 */
export default function NotificationBootstrap() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setupAndroidChannel();
  }, []);

  // შეტყობინებაზე დაჭერა — გადაჰყავს იმ ეკრანზე, რომელიც `data.screen`-შია.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const screen = response.notification.request.content.data?.screen;
        if (typeof screen === "string" && screen.startsWith("/")) {
          router.push(screen as any);
        }
      }
    );

    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const run = async () => {
      let granted = await getPermissionGranted();

      if (!granted) {
        if (await hasAskedBefore()) return;
        await markAsked();
        granted = await requestPermission();
      }

      if (!granted || cancelled) return;

      await scheduleDailyReminder();
      await registerPushToken(user.id);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return null;
}
