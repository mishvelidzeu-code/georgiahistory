import { useHistory } from "@/context/HistoryContext";
import { usePremium } from "@/context/PremiumContext";
import { LinearGradient } from "expo-linear-gradient"; // npx expo install expo-linear-gradient
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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

const MAIN_IMAGE = require("../../assets/gallery/2.webp");

const GALLERY_ITEMS = [
  {
    image: require("../../assets/gallery/3.webp"),
    title: "საქართველოს მოვლენები",
    subtitle: "ამ დღეს ქვეყნის ისტორიაში",
  },
  {
    image: require("../../assets/gallery/4.webp"),
    title: "მსოფლიო ისტორია",
    subtitle: "გლობალური მნიშვნელობის ფაქტები",
  },
  {
    image: require("../../assets/gallery/9.webp"),
    title: "მედიცინის მატიანე",
    subtitle: "მეცნიერული მიღწევები ამ დღეს",
  },
  {
    image: require("../../assets/gallery/1.webp"),
    title: "პერსონალიები",
    subtitle: "ვინ დაიბადნენ და გარდაიცვალნენ",
  },
];

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { isPremium } = usePremium();
  const router = useRouter();
  const { history, refreshHistory } = useHistory();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await refreshHistory();
    } catch (e) {
      console.log("Init error:", e);
    }
  };

  const getGeorgiaNow = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 4 * 60 * 60 * 1000);
  };

  const getGeorgianDate = () => {
    const georgiaTime = getGeorgiaNow();
    const months = [
      "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
      "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
    ];
    return `${georgiaTime.getDate()} ${months[georgiaTime.getMonth()]}`;
  };

  const renderHighlightedText = (text: string) => {
    const regex = /(\d+)/g;
    const parts = text.split(regex);
    return (
      <Text style={styles.cardBodyText}>
        {parts.map((part, index) =>
          /^\d+$/.test(part) ? (
            <Text key={index} style={styles.highlightNumber}>{part}</Text>
          ) : part
        )}
      </Text>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHistory();
    setRefreshing(false);
  };

  const handleGalleryPress = (index: number) => {
    if (!isPremium) {
      router.push("/subscription");
      return;
    }

    // მისამართების მასივი მკაცრი ტიპიზაციით
    const premiumRoutes = [
      "/premium/georgia-events",
      "/premium/world-events",
      "/premium/medicina",
      "/premium/births",
    ] as const;

    const targetRoute = premiumRoutes[index];

    if (targetRoute) {
      // ვიყენებთ 'as any' მხოლოდ აქ, რომ Expo-ს მკაცრმა ტიპიზაციამ არ იწუწუნოს
      router.push(targetRoute as any);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>ისტორიული კალენდარი</Text>
          <Text style={styles.headerTitle}>დღეს საქართველოში 🇬🇪</Text>
        </View>

        {/* Main Content Card */}
        <View style={styles.cardWrapper}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
            }
          >
            <View style={styles.imageContainer}>
              <Image source={MAIN_IMAGE} style={styles.mainImage} />
              <LinearGradient
                colors={["transparent", "rgba(17, 24, 39, 0.8)"]}
                style={styles.imageOverlay}
              />
              <Text style={styles.cardDateText}>{getGeorgianDate()}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.textContainer}>
              {history?.georgia_content ? (
                renderHighlightedText(history.georgia_content)
              ) : (
                <Text style={styles.emptyText}>ინფორმაცია ამ დღისათვის ჯერ არ არის დამატებული.</Text>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Gallery Section */}
        <View style={styles.gallerySection}>
          <View style={styles.galleryHeader}>
            <View style={styles.shortLine} />
            <Text style={styles.galleryTitle}>აღმოაჩინე მეტი</Text>
            <View style={styles.shortLine} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
            {GALLERY_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                style={styles.galleryItem}
                onPress={() => handleGalleryPress(index)}
              >
                <Image source={item.image} style={styles.galleryImage} />
                <LinearGradient
                  colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.9)"]}
                  style={StyleSheet.absoluteFill}
                />
                
                {!isPremium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>PRIME</Text>
                  </View>
                )}

                <View style={styles.galleryTextContainer}>
                  <Text style={styles.galleryText} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.gallerySubText} numberOfLines={2}>{item.subtitle}</Text>
                </View>
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
  safeArea: { flex: 1 },
  center: { flex: 1, backgroundColor: "#0A0D14", justifyContent: "center", alignItems: "center" },
  
  // Header
  header: { alignItems: "center", marginTop: 15, marginBottom: 10 },
  headerLabel: { color: "#D4AF37", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", opacity: 0.8 },
  headerTitle: { color: "#E2D9C5", fontSize: 18, fontWeight: "700", marginTop: 4 },

  // Card
  cardWrapper: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: "#111827",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  cardContent: { paddingBottom: 30 },
  imageContainer: { width: "100%", height: 220, justifyContent: "flex-end" },
  mainImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  cardDateText: {
    fontSize: 32,
    color: "#D4AF37",
    fontWeight: "900",
    paddingHorizontal: 20,
    marginBottom: 15,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  divider: {
    width: 40,
    height: 3,
    backgroundColor: "#D4AF37",
    marginLeft: 20,
    borderRadius: 2,
    marginBottom: 20,
  },
  textContainer: { paddingHorizontal: 20 },
  cardBodyText: {
    fontSize: 17,
    color: "#D1D5DB",
    lineHeight: 28,
    textAlign: "left",
    fontWeight: "400",
  },
  highlightNumber: { color: "#D4AF37", fontWeight: "800" },
  emptyText: { color: "#9CA3AF", textAlign: "center", marginTop: 20, fontStyle: "italic" },

  // Gallery
  gallerySection: { marginTop: 25, marginBottom: 20 },
  galleryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 15 },
  shortLine: { width: 30, height: 1, backgroundColor: "rgba(212, 175, 55, 0.3)", marginHorizontal: 10 },
  galleryTitle: { color: "#D4AF37", fontSize: 14, fontWeight: "700", letterSpacing: 1 },
  galleryScroll: { paddingLeft: 20 },
  galleryItem: { 
    width: 180, 
    height: 140, 
    marginRight: 15, 
    borderRadius: 16, 
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  galleryImage: { width: "100%", height: "100%" },
  galleryTextContainer: { position: "absolute", bottom: 12, left: 12, right: 12 },
  galleryText: { color: "#FFF", fontWeight: "800", fontSize: 13, marginBottom: 2 },
  gallerySubText: { color: "#D1D5DB", fontSize: 10, opacity: 0.8 },
  premiumBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#D4AF37",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
  },
  premiumBadgeText: { color: "#000", fontSize: 9, fontWeight: "900" },
});