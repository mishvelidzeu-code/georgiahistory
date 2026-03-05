import { usePremium } from "@/context/PremiumContext";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../services/supabase";

export default function SubscriptionScreen() {
  const { isPremium, refreshPremium } = usePremium();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkUser();
      refreshPremium();
    }, [])
  );

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user ?? null);
  };

  const handlePress = async () => {
    if (!user) {
      router.replace("/profile");
      return;
    }

    try {
      setLoading(true);

      const expireDate = new Date();
      expireDate.setMonth(expireDate.getMonth() + 1);

      const { error } = await supabase
        .from("profiles")
        .update({
          is_premium: true,
          premium_until: expireDate.toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.log(error);
        return;
      }

      await refreshPremium();
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0A0D14", "#111827", "#0A0D14"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.badge}>
  <Text style={{ color: "#FFFFFF" }}>უფასო </Text>
  PRIME
</Text>

        <Text style={styles.title}>აღმოაჩინე მეტი</Text>

        <Text style={styles.subtitle}>
          გახდი PRIME ერთი კლიკით და მიიღე სრული წვდომა
          ისტორიებსა და ინფორმაციაზე 1 თვის განმავლობაში — უფასოდ.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>რას მიიღებ PRIME-ით</Text>

          <Text style={styles.item}>
            • საქართველოს ისტორიული მოვლენები დღევანდელ თარიღზე
          </Text>

          <Text style={styles.item}>
            • მსოფლიო ისტორიის მნიშვნელოვანი ფაქტები
          </Text>

          <Text style={styles.item}>
            • რა მოხდა მეცნიერებაში 
          </Text>

          <Text style={styles.item}>
            • ცნობილი ადამიანები ამ დღეს
          </Text>

          <Text style={styles.item}>
            • გვარების მცირე ისტორია და წარმოშობა დღეში ერთი გვარი
          </Text>
        </View>

        {isPremium ? (
          <Text style={styles.active}>შენ უკვე PRIME წევრი ხარ</Text>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={handlePress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>
  ✨ გააქტიურე <Text style={{ color: "#FFFFFF" }}>Free</Text>
</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => router.replace("/(tabs)" as any)}>
          <Text style={styles.close}>დახურვა</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 30,
    paddingTop: 80,
    alignItems: "center",
  },

  badge: {
    backgroundColor: "#D4AF37",
    color: "#000",
    fontWeight: "900",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    letterSpacing: 1,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#D4AF37",
    marginBottom: 12,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: "#E5E7EB",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 22,
  },

  card: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },

  cardTitle: {
    color: "#D4AF37",
    fontWeight: "700",
    marginBottom: 15,
    fontSize: 16,
  },

  item: {
    color: "#F3F4F6",
    marginBottom: 10,
    fontSize: 14,
    lineHeight: 20,
  },

  button: {
    backgroundColor: "#D4AF37",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 14,
    marginBottom: 15,
  },

  buttonText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },

  active: {
    color: "#22C55E",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 20,
  },

  close: {
    color: "#9CA3AF",
    marginTop: 10,
    padding: 10,
  },
});