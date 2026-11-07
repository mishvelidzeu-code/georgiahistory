import AuthGate from "@/components/auth-gate";
import { useAuth } from "@/context/AuthContext";
import { getGeorgianDateLabel, getGeorgianMonthName, getGeorgiaMonthDay } from "@/services/date";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabase";

export default function ScienceScreen() {
  const router = useRouter();
  const { user, authLoading } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchScience = useCallback(async () => {
    try {
      const { month, day } = getGeorgiaMonthDay();

      const { data, error } = await supabase
        .from("science_events")
        .select("*")
        .eq("month", month)
        .eq("day", day)
        .maybeSingle();

      if (!error) setData(data);
    } catch (e) {
      console.log("Science fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchScience();
    } else {
      setLoading(false);
    }
  }, [authLoading, user, fetchScience]);

  if (authLoading || (user && loading)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loaderText}>არქივი იძებნება...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <AuthGate
        title="მეცნიერული არქივი ჩაკეტილია"
        message="ამ დღის მეცნიერული აღმოჩენების სანახავად გაიარე ავტორიზაცია — უფასოა."
        icon="flask-outline"
      />
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />

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
        {/* Hero */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={["#131A2B", "#0F1626", "#0A0D14"]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.heroRing}>
            <Ionicons name="flask-outline" size={54} color="#D4AF37" />
          </View>

          <View style={styles.heroTitleContainer}>
            <Text style={styles.heroLabel}>მეცნიერული არქივი</Text>
            <Text style={styles.heroDate}>{getGeorgianDateLabel()}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentCard}>
          <View style={[styles.corner, { top: 20, left: 20, borderTopWidth: 1, borderLeftWidth: 1 }]} />
          <View style={[styles.corner, { top: 20, right: 20, borderTopWidth: 1, borderRightWidth: 1 }]} />

          <Text style={styles.title}>რა აღმოაჩინეს ამ დღეს</Text>

          {data ? (
            <>
              <View style={styles.yearBadge}>
                <Text style={styles.yearText}>
                  {data.day} {getGeorgianMonthName(data.month)}
                  {data.year ? `, ${data.year} წელი` : ""}
                </Text>
              </View>

              <Text style={styles.eventSubtitle}>{data.title}</Text>

              <View style={styles.decorativeDivider}>
                <View style={styles.line} />
                <Ionicons name="infinite" size={16} color="rgba(212,175,55,0.4)" style={{ marginHorizontal: 12 }} />
                <View style={styles.line} />
              </View>

              <Text style={styles.descriptionText}>{data.description}</Text>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color="rgba(212, 175, 55, 0.2)" />
              <Text style={styles.emptyText}>ამ დღის მონაცემები ჯერ არ არის ატვირთული.</Text>
            </View>
          )}

          <View style={styles.footerMotif}>
            <View style={styles.smallDivider} />
            <Text style={styles.footerText}>ცოდნა მარადიულია</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#0A0D14" },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 50 },
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
    textTransform: "uppercase",
  },

  backButton: {
    position: "absolute",
    top: 55,
    left: 20,
    zIndex: 10,
    borderRadius: 25,
    overflow: "hidden",
  },
  backGradient: {
    width: 46,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    borderRadius: 25,
  },

  heroSection: {
    width: "100%",
    height: 320,
    justifyContent: "center",
    alignItems: "center",
  },
  heroRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    backgroundColor: "rgba(212,175,55,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitleContainer: {
    alignItems: "center",
    marginTop: 18,
    marginBottom: 55,
  },
  heroLabel: {
    color: "#D4AF37",
    fontSize: 12,
    letterSpacing: 4,
    textTransform: "uppercase",
    opacity: 0.9,
  },
  heroDate: {
    color: "#D4AF37",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
    letterSpacing: 0.5,
  },

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
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  corner: {
    position: "absolute",
    width: 22,
    height: 22,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#E2D9C5",
    textAlign: "center",
    marginBottom: 18,
  },
  yearBadge: {
    alignSelf: "center",
    backgroundColor: "rgba(212,175,55,0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
  },
  yearText: {
    color: "#D4AF37",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  eventSubtitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 28,
  },
  decorativeDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  line: { flex: 1, height: 1, backgroundColor: "rgba(212,175,55,0.2)" },
  descriptionText: {
    fontSize: 17,
    color: "#D1D5DB",
    lineHeight: 28,
    textAlign: "left",
  },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  emptyText: {
    color: "#9CA3AF",
    textAlign: "center",
    fontSize: 15,
    marginTop: 15,
    fontStyle: "italic",
  },
  footerMotif: { marginTop: 35, alignItems: "center", opacity: 0.4 },
  smallDivider: {
    width: 30,
    height: 1,
    backgroundColor: "#D4AF37",
    marginBottom: 10,
  },
  footerText: {
    color: "#D4AF37",
    fontSize: 11,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
});
