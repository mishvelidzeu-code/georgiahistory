import { useHistory } from "@/context/HistoryContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // npx expo install expo-linear-gradient
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get("window");
const IMAGE = require("../../assets/gallery/3.webp");

export default function GeorgiaEventsScreen() {
  const router = useRouter();
  const { history } = useHistory();

  if (!history) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loaderText}>მატიანე იშლება...</Text>
      </View>
    );
  }

  const content = history?.georgia_content;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />

      {/* დახვეწილი უკან დასაბრუნებელი ღილაკი */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.4)"]}
          style={styles.backGradient}
        >
          <Ionicons name="chevron-back" size={28} color="#D4AF37" />
        </LinearGradient>
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section - კინემატოგრაფიული ზედა ნაწილი */}
        <View style={styles.heroSection}>
          <Image source={IMAGE} style={styles.heroImage} />
          <LinearGradient
            colors={["transparent", "rgba(10, 13, 20, 0.8)", "#0A0D14"]}
            style={styles.heroOverlay}
          />
          <View style={styles.heroTitleContainer}>
            <Ionicons name="library" size={24} color="#D4AF37" />
            <Text style={styles.heroLabel}>საქართველოს ისტორია</Text>
          </View>
        </View>

        {/* მთავარი კონტენტის ბარათი */}
        <View style={styles.contentCard}>
          {/* დეკორატიული ელემენტები კუთხეებში */}
          <View style={[styles.corner, { top: 20, left: 20, borderTopWidth: 1, borderLeftWidth: 1 }]} />
          <View style={[styles.corner, { top: 20, right: 20, borderTopWidth: 1, borderRightWidth: 1 }]} />

          <Text style={styles.title}>
            მნიშვნელოვანი მოვლენები
          </Text>

          {/* ისტორიული გამყოფი */}
          <View style={styles.decorativeDivider}>
            <View style={styles.line} />
            <Ionicons name="shield-checkmark-outline" size={18} color="rgba(212, 175, 55, 0.5)" style={{ marginHorizontal: 12 }} />
            <View style={styles.line} />
          </View>

          {/* ტექსტი - გამოყენებულია Serif შრიფტი ისტორიული იერისთვის */}
          <Text style={styles.text}>
            {content || "ამ დღის მონაცემები ჯერ არ არის ატვირთული."}
          </Text>

          {/* ქვედა მოტივი */}
          <View style={styles.footerMotif}>
            <View style={styles.smallDivider} />
            <Text style={styles.footerText}>წარსული ქმნის მომავალს</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#0A0D14",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  center: {
    flex: 1,
    backgroundColor: "#0A0D14",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    color: "#D4AF37",
    marginTop: 15,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase'
  },

  // Hero Section
  heroSection: {
    width: "100%",
    height: 380,
    justifyContent: 'flex-end',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTitleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroLabel: {
    color: "#D4AF37",
    fontSize: 12,
    letterSpacing: 5,
    textTransform: 'uppercase',
    marginTop: 10,
    fontWeight: '700',
    opacity: 0.9,
  },

  // Floating Back Button
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 100,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  backGradient: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content Card
  contentCard: {
    marginHorizontal: 18,
    marginTop: -40,
    backgroundColor: "#111827",
    borderRadius: 35,
    padding: 30,
    paddingTop: 50,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#E2D9C5",
    textAlign: "center",
    lineHeight: 34,
  },
  decorativeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 25,
  },
  line: {
    width: 50,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  text: {
    fontSize: 17,
    color: "#D1D5DB",
    lineHeight: 28,
    textAlign: "justify",
    // ისტორიული წიგნის შრიფტის იმიტაცია
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // Footer
  footerMotif: {
    marginTop: 50,
    alignItems: 'center',
  },
  smallDivider: {
    width: 30,
    height: 2,
    backgroundColor: '#D4AF37',
    marginBottom: 15,
    borderRadius: 1,
    opacity: 0.6,
  },
  footerText: {
    color: "#D4AF37",
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontWeight: '700',
    opacity: 0.4,
  }
});