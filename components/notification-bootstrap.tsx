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
import { setupTracking } from "@/services/tracking";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

/**
 * ხედავს არაფერს — შესვლის შემდგომ ნებართვებს აწყობს: ჯერ შეტყობინებებს,
 * მერე ATT-ს (Meta SDK, services/tracking.ts).
 *
 * ნებართვას აპის გაშვებისთანავე აღარ ვითხოვთ (splash-ზე გამოტანილ შეკითხვაზე
 * ხალხი უარს ამბობს და iOS-ზე მეორედ კითხვა აღარ შეიძლება) — ვიცდით, სანამ
 * მომხმარებელი შევა, და მხოლოდ ერთხელ ვეკითხებით.
 *
 * ორივე ერთ effect-შია და თანმიმდევრულად სრულდება, რომ iOS-ის ორი სისტემური
 * ფანჯარა ერთმანეთს არ გადაედოს.
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

      if (granted && !cancelled) {
        await scheduleDailyReminder();
        await registerPushToken(user.id);
      }

      if (cancelled) return;

      // Meta SDK — ATT-ზე უარმაც არ უნდა შეაჩეროს: SKAdNetwork მაინც მუშაობს.
      await setupTracking();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return null;
}
