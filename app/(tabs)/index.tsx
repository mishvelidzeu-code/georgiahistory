import { useAuth } from "@/context/AuthContext";
import { useHistory } from "@/context/HistoryContext";
import { getGeorgianDateLabel } from "@/services/date";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // npx expo install expo-linear-gradient
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

const MAIN_IMAGE = require("../../assets/gallery/2.webp");

// მისამართი თითოეულ ბარათზევე წერია — ასე ინდექსები ვერასდროს აცდება.
const GALLERY_ITEMS = [
  {
    image: require("../../assets/gallery/4.webp"),
    title: "მსოფლიო ისტორია",
    subtitle: "გლობალური მნიშვნელობის ფაქტები",
    route: "/premium/world-events",
    icon: null,
  },
  {
    image: require("../../assets/gallery/science.webp"),
    title: "მეცნიერული არქივი",
    subtitle: "აღმოჩენები და გამოგონებები",
    route: "/premium/science",
    icon: null,
  },
  {
    image: require("../../assets/gallery/1.webp"),
    title: "პიროვნებები",
    subtitle: "ვინ დაიბადნენ და გარდაიცვალნენ",
    route: "/premium/births",
    icon: null,
  },
  {
    image: require("../../assets/gallery/9.webp"),
    title: "მედიცინის მატიანე",
    subtitle: "სამედიცინო აღმოჩენები ამ დღეს",
    route: "/premium/medicina",
    icon: null,
  },
] as const;

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const { history, refreshHistory } = useHistory();

  useEffect(() => {
    // ყურადღება: აქ `cancelAllScheduledNotificationsAsync()` აღარ იძახება —
    // ის ყოველ გახსნაზე შლიდა ყოველდღიურ შეხსენებას.
    refreshHistory();
  }, [refreshHistory]);

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

  const goToLogin = () => router.push("/(tabs)/profile");

  const handleGalleryPress = (route: string) => {
    // შესვლის გარეშე ისტორიები არ იხსნება — პირდაპირ ავტორიზაციაზე გადავყავთ.
    if (!user) {
      goToLogin();
      return;
    }
    router.push(route as any);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>

        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>ისტორიული კალენდარი</Text>
          <Text style={styles.headerTitle}>ამ დღეს მსოფლიოში </Text>
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
              <Text style={styles.cardDateText}>{getGeorgianDateLabel()}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.textContainer}>
              {authLoading ? (
                <ActivityIndicator color="#D4AF37" style={{ marginTop: 20 }} />
              ) : !user ? (
                /* ჩაკეტილი ბლოკი — ტექსტი არ ჩანს, დაჭერით შესვლაზე გადადის */
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={goToLogin}
                  style={styles.lockedBlock}
                >
                  <Ionicons name="lock-closed-outline" size={40} color="#D4AF37" />
                  <Text style={styles.lockedTitle}>ისტორია ჩაკეტილია</Text>
                  <Text style={styles.lockedText}>
                    ამ დღის ისტორიის წასაკითხად გაიარე ავტორიზაცია — უფასოა.
                  </Text>
                  <View style={styles.lockedButton}>
                    <LinearGradient colors={["#D4AF37", "#AA8E56"]} style={styles.lockedButtonGradient}>
                      <Ionicons name="log-in-outline" size={18} color="#000" />
                      <Text style={styles.lockedButtonText}>შესვლა / რეგისტრაცია</Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              ) : history?.georgia_content ? (
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
                onPress={() => handleGalleryPress(item.route)}
              >
                {item.image ? (
                  <>
                    <Image source={item.image} style={styles.galleryImage} />
                    <LinearGradient
                      colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.9)"]}
                      style={StyleSheet.absoluteFill}
                    />
                  </>
                ) : (
                  <>
                    <LinearGradient
                      colors={["#1A2440", "#131A2B", "#0A0D14"]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.galleryIconWrap}>
                      <Ionicons name={item.icon ?? "flask-outline"} size={40} color="rgba(212,175,55,0.65)" />
                    </View>
                  </>
                )}

                {!user && !authLoading && (
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={11} color="#000" />
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

  // ჩაკეტილი მდგომარეობა
  lockedBlock: { alignItems: "center", paddingVertical: 10 },
  lockedTitle: { color: "#E2D9C5", fontSize: 18, fontWeight: "900", marginTop: 14 },
  lockedText: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  lockedButton: { width: "100%", height: 52, borderRadius: 14, overflow: "hidden" },
  lockedButtonGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  lockedButtonText: { color: "#000", fontWeight: "900", fontSize: 15, marginLeft: 8 },

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
  galleryIconWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 26,
  },
  lockBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#D4AF37",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
