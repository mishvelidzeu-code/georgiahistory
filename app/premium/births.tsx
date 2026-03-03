import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { supabase } from "../../services/supabase";

const IMAGE = require("../../assets/gallery/1.webp");

export default function BirthsScreen() {
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
      .select("births_content")
      .eq("date", key)
      .single();

    if (!error && data) {
      setContent(data.births_content);
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
    <ScrollView style={styles.container}>
      <Image source={IMAGE} style={styles.image} />

      <Text style={styles.title}>
        ვინ დაიბადნენ და ვინ გარდაიცვალნენ ამ დღეს
      </Text>

      <Text style={styles.text}>
        {content || "ამ დღის მონაცემები ჯერ არ არის ატვირთული."}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0D14",
    padding: 20,
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