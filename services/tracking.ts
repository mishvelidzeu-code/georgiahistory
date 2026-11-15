import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { Platform } from "react-native";
import { Settings } from "react-native-fbsdk-next";

/**
 * Meta SDK + App Tracking Transparency.
 *
 * ერთადერთი მიზანი: Meta-ს App promotion კამპანიამ იმუშაოს. SDK-ის გარეშე
 * Meta iOS 14+ ინსტალების კამპანიას არ უშვებს — „you need to set up Apple's
 * SKAdNetwork". ინსტალებს Apple ითვლის SKAdNetwork-ით (აგრეგირებულად,
 * 24 საათის დაყოვნებით), IDFA მხოლოდ მაშინ გვაქვს, თუ მომხმარებელი
 * ATT-ის ფანჯარაში „Allow"-ს აირჩევს.
 *
 * ნებართვას splash-ზე არ ვითხოვთ — იგივე მიზეზით, რაც შეტყობინებებზე:
 * პირველივე წამში გამოტანილ შეკითხვაზე ხალხი უარს ამბობს და iOS მეორედ
 * კითხვის საშუალებას აღარ იძლევა. იხ. components/notification-bootstrap.tsx.
 */

let initialized = false;

/** SDK-ის ჩართვა მოცემული ATT პასუხით. უსაფრთხოა რამდენჯერმე გამოძახება. */
async function initSdk(trackingAllowed: boolean) {
  // iOS-ზე ეს დროშა ATT-მდე უნდა დაისვას, თორემ SDK IDFA-ს არ აგროვებს.
  await Settings.setAdvertiserTrackingEnabled(trackingAllowed);

  if (!initialized) {
    Settings.initializeSDK();
    initialized = true;
  }
}

/**
 * ითხოვს ATT ნებართვას (მხოლოდ იქ, სადაც ჯერ არ გვიკითხავს) და შესაბამისად
 * რთავს Meta SDK-ს. აბრუნებს, დართო თუ არა მომხმარებელმა ნება.
 */
export async function setupTracking(): Promise<boolean> {
  // Android-ზე ATT არ არსებობს — expo „granted"-ს აბრუნებს და SDK ჩვეულებრივ მუშაობს.
  if (Platform.OS !== "ios") {
    await initSdk(true);
    return true;
  }

  let { status, canAskAgain } = await getTrackingPermissionsAsync();

  if (status === "undetermined" && canAskAgain) {
    ({ status } = await requestTrackingPermissionsAsync());
  }

  const allowed = status === "granted";
  await initSdk(allowed);
  return allowed;
}
