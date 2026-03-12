import { usePremium } from "@/context/PremiumContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
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
      "იანვარი",
      "თებერვალი",
      "მარტი",
      "აპრილი",
      "მაისი",
      "ივნისი",
      "ივლისი",
      "აგვისტო",
      "სექტემბერი",
      "ოქტომბერი",
      "ნოემბერი",
      "დეკემბერი",
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

      <ScrollView contentContainerStyle={{ padding: 25 }}>

        <View style={styles.card}>

          <Text style={styles.title}>
            მეცნიერებაში ამ დღეს
          </Text>

          {data ? (
            <>

              <Text style={styles.date}>
                {data.day} {getMonthName(data.month)} {data.year}
              </Text>

              <View style={styles.divider} />

              <Text style={styles.eventTitle}>
                {data.title}
              </Text>

              <Text style={styles.description}>
                {data.description}
              </Text>

            </>
          ) : (

            <Text style={styles.empty}>
              ამ დღეს მეცნიერებაში ჩანაწერი არ არის.
            </Text>

          )}

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

  card: {
    borderRadius: 28,
    padding: 25,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 15,
  },

  date: {
    fontSize: 15,
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  eventTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 15,
  },

  description: {
    fontSize: 16,
    color: "#E5E7EB",
    lineHeight: 24,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 15,
  },

  empty: {
    color: "#9CA3AF",
    textAlign: "center",
    fontSize: 15,
  },

});