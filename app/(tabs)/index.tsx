import { usePremium } from "@/context/PremiumContext";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from "../../services/supabase";

const MAIN_IMAGE = require("../../assets/gallery/2.webp");

const GALLERY_ITEMS = [
  {
    image: require("../../assets/gallery/1.webp"),
    title: "ვინ დაიბადნენ და ვინ გარდაიცვალნენ ამ დღეს",
    subtitle: "ცნობილი ადამიანები, ბიოგრაფიული მოკლე ცნობები",
  },
  {
    image: require("../../assets/gallery/3.webp"),
    title: "საქართველოს მნიშვნელოვანი მოვლენები",
    subtitle: "ამ დღეს ქვეყნის ისტორიაში მომხდარი ფაქტები",
  },
  {
    image: require("../../assets/gallery/4.webp"),
    title: "მსოფლიოს მნიშვნელოვანი მოვლენები",
    subtitle: "გლობალური ისტორიული მოვლენები ამ თარიღზე",
  },
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { isPremium } = usePremium();
  const router = useRouter();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await fetchTodayHistory();
  };

  const getGeorgiaNow = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 4 * 60 * 60 * 1000);
  };

  const getGeorgiaDateKey = () => {
    const georgiaTime = getGeorgiaNow();
    const year = georgiaTime.getFullYear();
    const month = String(georgiaTime.getMonth() + 1).padStart(2, "0");
    const day = String(georgiaTime.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getGeorgianDate = () => {
    const georgiaTime = getGeorgiaNow();
    const months = [
      "იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი",
      "ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"
    ];
    return `${georgiaTime.getDate()} ${months[georgiaTime.getMonth()]}`;
  };

  // ✅ მხოლოდ ციფრების highlight
  const renderHighlightedText = (text: string) => {
    const regex = /(\d+)/g;
    const parts = text.split(regex);

    return (
      <Text style={styles.cardBodyText}>
        {parts.map((part, index) =>
          /^\d+$/.test(part) ? (
            <Text key={index} style={styles.highlightNumber}>
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  };

  const fetchTodayHistory = async () => {
    const key = getGeorgiaDateKey();

    const { data: historyData } = await supabase
      .from("daily_history")
      .select("*")
      .eq("date", key)
      .single();

    setData(historyData || null);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTodayHistory();
    setRefreshing(false);
  };

  const handleGalleryPress = (index: number) => {
    if (!isPremium) {
      router.push("/subscription");
      return;
    }
    if (index === 0) router.push("/premium/births");
    if (index === 1) router.push("/premium/georgia-events");
    if (index === 2) router.push("/premium/world-events");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.header}>
          <Text style={styles.headerText}>
            დღე საქართველოს ისტორიაში 🇬🇪
          </Text>
        </View>

        <View style={styles.cardWrapper}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#D4AF37"
              />
            }
          >
            <Image source={MAIN_IMAGE} style={styles.mainImage} />

            <Text style={styles.cardDateText}>
              {getGeorgianDate()}
            </Text>

            <View style={styles.divider} />

            <View>
  {data?.georgia_content ? (
    renderHighlightedText(data.georgia_content)
  ) : (
    <Text
      style={[
        styles.cardBodyText,
        { textAlign: "center", opacity: 0.7 },
      ]}
    >
      ინფორმაცია ამ დღისათვის ჯერ არ არის დამატებული.
    </Text>
  )}
</View>

          </ScrollView>
        </View>

        <View style={styles.gallerySection}>
          <Text style={styles.galleryTitle}>დამატებითი ინფორმაცია</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {GALLERY_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.galleryItem}
                onPress={() => handleGalleryPress(index)}
              >
                <Image source={item.image} style={styles.galleryImage} />

                {!isPremium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>PRIME</Text>
                  </View>
                )}

                <Text style={styles.galleryText}>{item.title}</Text>
                <Text style={styles.gallerySubText}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#0A0D14" },
  safeArea: { flex: 1, justifyContent: "space-between" },
  header: { alignItems: "center", marginTop: 20 },
  headerText: {
    color: "#E2D9C5",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  cardWrapper: {
    flex: 1,
    paddingHorizontal: 25,
    marginVertical: 20,
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 20,
  },
  cardContent: { paddingBottom: 20 },
  cardDateText: {
    fontSize: 30,
    color: "#E2D9C5",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: "#A98E56",
    alignSelf: "center",
    marginVertical: 15,
  },
  cardBodyText: {
  fontSize: 18,
  color: "#EAEAEA",
  lineHeight: 30,
  letterSpacing: 0.3,
  textAlign: "left",
},
  highlightNumber: {
  color: "#D4AF37",
  fontWeight: "800",
},
  
  gallerySection: { paddingHorizontal: 20, marginBottom: 20 },
  galleryTitle: {
    color: "#E2D9C5",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 15,
  },
  galleryItem: { width: 200, marginRight: 15 },
  galleryImage: { width: "100%", height: 110, borderRadius: 12 },
  galleryText: {
    color: "#D4AF37",
    fontWeight: "700",
    fontSize: 14,
    marginTop: 8,
  },
  gallerySubText: { color: "#E5E7EB", fontSize: 12, marginTop: 4 },
  premiumBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#D4AF37",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumBadgeText: { color: "#000", fontSize: 10, fontWeight: "800" },
  center: {
    flex: 1,
    backgroundColor: "#0A0D14",
    justifyContent: "center",
    alignItems: "center",
  },
  mainImage: { width: "100%", height: 180, borderRadius: 14, marginBottom: 15 },
});