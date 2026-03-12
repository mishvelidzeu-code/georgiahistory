import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from "../../services/supabase";

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

    return {
      month: georgia.getMonth() + 1,
      day: georgia.getDate(),
    };
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

      if (!error && data) {
        setEvent(data);
      }
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
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={36} color="#D4AF37" />
      </TouchableOpacity>

      <ScrollView style={styles.container}>
        <Image source={IMAGE} style={styles.image} />

        <Text style={styles.title}>
          რა მოხდა მედიცინაში დღეს
        </Text>

        {event ? (
          <>
            <Text style={styles.year}>
              {event.year}
            </Text>

            <Text style={styles.subtitle}>
              {event.title}
            </Text>

            <Text style={styles.text}>
              {event.description}
            </Text>
          </>
        ) : (
          <Text style={styles.text}>
            ამ დღის მონაცემები ჯერ არ არის ატვირთული.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0D14",
    padding: 20,
    paddingTop: 110,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 15,
    zIndex: 10,
    padding: 12,
    borderRadius: 30,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#D4AF37",
    marginBottom: 15,
  },
  year: {
    fontSize: 18,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: "#E5E7EB",
    lineHeight: 26,
  },
  center: {
    flex: 1,
    backgroundColor: "#0A0D14",
    justifyContent: "center",
    alignItems: "center",
  },
});