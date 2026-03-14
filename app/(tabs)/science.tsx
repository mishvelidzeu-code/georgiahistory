import { usePremium } from "@/context/PremiumContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../services/supabase";

export default function ScienceScreen() {
  const { isPremium, premiumLoading } = usePremium();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (premiumLoading) return;
    if (!isPremium) {
      setTimeout(() => {
        router.replace("/subscription");
      }, 0);
      return;
    }
    fetchScience();
  }, [premiumLoading, isPremium]);

  const fetchScience = async () => {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      const { data, error } = await supabase
        .from("science_events")
        .select("*")
        .eq("month", month)
        .eq("day", day)
        .maybeSingle();

      if (!error) {
        setData(data);
      }
    } catch (e) {
      console.log("Science fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
      "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
    ];
    return months[month - 1];
  };

  if (premiumLoading || loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView contentContainerStyle={{ padding: 25, flexGrow: 1 }}>
        
        {/* Header Icon & Title */}
        <View style={styles.header}>
          <Ionicons name="flask-outline" size={32} color="#D4AF37" />
          <Text style={styles.headerLabel}>მეცნიერული არქივი</Text>
        </View>

        <View style={styles.card}>
          {/* დეკორატიული კუთხეები */}
          <View style={[styles.corner, { top: 15, left: 15, borderTopWidth: 1, borderLeftWidth: 1 }]} />
          <View style={[styles.corner, { top: 15, right: 15, borderTopWidth: 1, borderRightWidth: 1 }]} />

          {data ? (
            <>
              <Text style={styles.dateLabel}>
                {data.day} {getMonthName(data.month)}, {data.year} წელი
              </Text>

              <Text style={styles.eventTitle}>
                {data.title}
              </Text>

              <View style={styles.decorativeDivider}>
                <View style={styles.line} />
                <Ionicons name="infinite" size={16} color="rgba(212,175,55,0.4)" style={{ marginHorizontal: 10 }} />
                <View style={styles.line} />
              </View>

              <Text style={styles.description}>
                {data.description}
              </Text>

              <LinearGradient
                colors={["transparent", "rgba(212,175,55,0.03)"]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={40} color="rgba(156, 163, 175, 0.3)" />
              <Text style={styles.emptyText}>
                ამ დღეს მეცნიერული ჩანაწერები არ მოიძებნა.
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Motif */}
        <View style={styles.footerMotif}>
          <Text style={styles.footerText}>ცოდნა მარადიულია</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0D14",
  },
  loader: {
    flex: 1,
    backgroundColor: "#0A0D14",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  headerLabel: {
    color: "#E2D9C5",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginTop: 10,
    opacity: 0.8,
  },
  card: {
    flex: 1,
    borderRadius: 35,
    padding: 35,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    minHeight: 400,
    justifyContent: 'center'
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  dateLabel: {
    fontSize: 14,
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  eventTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 20,
  },
  decorativeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212,175,55,0.2)',
  },
  description: {
    fontSize: 17,
    color: "#D1D5DB",
    lineHeight: 28,
    textAlign: "justify",
    // Platform აქ გამოიყენება შრიფტისთვის
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: "#9CA3AF",
    textAlign: "center",
    fontSize: 15,
    marginTop: 15,
    fontStyle: 'italic'
  },
  footerMotif: {
    marginTop: 40,
    alignItems: 'center',
    opacity: 0.4
  },
  footerText: {
    color: "#D4AF37",
    fontSize: 12,
    letterSpacing: 5,
    textTransform: 'uppercase'
  }
});