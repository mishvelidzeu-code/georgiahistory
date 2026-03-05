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
  View,
} from "react-native";
import { supabase } from "../../services/supabase";

const IMAGE = require("../../assets/gallery/4.webp");

export default function WorldEventsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const getGeorgiaDateKey = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const georgia = new Date(utc + 4 * 60 * 60 * 1000);

    const year = georgia.getFullYear();
    const month = String(georgia.getMonth() + 1).padStart(2, "0");
    const day = String(georgia.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const fetchData = async () => {
    const key = getGeorgiaDateKey();

    const { data, error } = await supabase
      .from("daily_history")
      .select("world_content")
      .eq("date", key)
      .single();

    if (!error && data) {
      setContent(data.world_content);
    }

    setLoading(false);
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
          მსოფლიოს მნიშვნელოვანი მოვლენები
        </Text>

        <Text style={styles.text}>
          {content || "ამ დღის მონაცემები ჯერ არ არის ატვირთული."}
        </Text>
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