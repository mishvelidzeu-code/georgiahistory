import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // npx expo install expo-linear-gradient
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { supabase } from "../../services/supabase";

const { width } = Dimensions.get("window");
const IMAGE = require("../../assets/gallery/9.webp");

type MedicineEvent = {
  year: number;
  title: string;
  description: string;
};

export default function MedicineScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<MedicineEvent | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const getGeorgiaDate = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const georgia = new Date(utc + 4 * 60 * 60 * 1000);
    return { month: georgia.getMonth() + 1, day: georgia.getDate() };
  };

  const fetchData = async () => {
    try {
      const { month, day } = getGeorgiaDate();
      const { data, error } = await supabase
        .from("medicine_events")
        .select("*")
        .eq("month", month)
        .eq("day", day)
        .maybeSingle();

      if (!error && data) setEvent(data);
    } catch (e) {
      console.log("Medicine events fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loaderText}>არქივი იძებნება...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />

      {/* პრემიუმ უკან დასაბრუნებელი ღილაკი */}
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
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image source={IMAGE} style={styles.heroImage} />
          <LinearGradient
            colors={["transparent", "rgba(10, 13, 20, 0.8)", "#0A0D14"]}
            style={styles.heroOverlay}
          />
          <View style={styles.heroTitleContainer}>
            <Ionicons name="medical" size={24} color="#D4AF37" />
            <Text style={styles.heroLabel}>მედიცინის ისტორია</Text>
          </View>
        </View>

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* დეკორატიული კუთხეები */}
          <View style={[styles.corner, { top: 20, left: 20, borderTopWidth: 1, borderLeftWidth: 1 }]} />
          <View style={[styles.corner, { top: 20, right: 20, borderTopWidth: 1, borderRightWidth: 1 }]} />

          <Text style={styles.title}>რა მოხდა მედიცინაში</Text>

          {event ? (
            <>
              <View style={styles.yearBadge}>
                <Text style={styles.yearText}>{event.year} წელი</Text>
              </View>

              <Text style={styles.eventSubtitle}>{event.title}</Text>

              <View style={styles.decorativeDivider}>
                <View style={styles.line} />
                <Ionicons name="fitness-outline" size={18} color="rgba(212, 175, 55, 0.4)" style={{ marginHorizontal: 12 }} />
                <View style={styles.line} />
              </View>

              <Text style={styles.descriptionText}>{event.description}</Text>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color="rgba(212, 175, 55, 0.2)" />
              <Text style={styles.emptyText}>ამ დღის მონაცემები ჯერ არ არის ატვირთული.</Text>
            </View>
          )}

          {/* Footer Motif */}
          <View style={styles.footerMotif}>
            <View style={styles.smallDivider} />
            <Text style={styles.footerText}>მეცნიერება და პროგრესი</Text>
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
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
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

  // Back Button
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
    fontSize: 24,
    fontWeight: "900",
    color: "#E2D9C5",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 15,
  },
  yearBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  yearText: {
    color: "#D4AF37",
    fontWeight: "800",
    fontSize: 16,
  },
  eventSubtitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 10,
  },
  decorativeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  line: {
    width: 50,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  descriptionText: {
    fontSize: 17,
    color: "#D1D5DB",
    lineHeight: 28,
    textAlign: "justify",
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 15,
    fontStyle: 'italic',
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