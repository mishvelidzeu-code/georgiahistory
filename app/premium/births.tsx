import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../services/supabase";

const IMAGE = require("../../assets/gallery/1.webp");

export default function BirthsScreen() {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const key = `${month}-${day}`;

    const { data } = await supabase
      .from("daily_births")
      .select("*")
      .eq("date", key)
      .single();

    if (data) {
      setContent(data.content);
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
        {content || "მონაცემები დროებით არ არის ხელმისაწვდომი."}
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