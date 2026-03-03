import { usePremium } from "@/context/PremiumContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../services/supabase";

export default function SubscriptionScreen() {
  const { isPremium } = usePremium();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user ?? null);
  };

  const handlePress = () => {
    if (!user) {
      // 1. ჯერ ვხურავთ PRIME-ის მოდალურ ფანჯარას
      router.back(); 
      
      // 2. მცირე დაყოვნებით (რომ ჩაკეცვის ანიმაცია დასრულდეს) გადავდივართ პროფილზე
      setTimeout(() => {
        router.push("/(tabs)/profile");
      }, 150); 
      
      return;
    }

    // 🔥 აქ მოგვიანებით ჩაერთვება გადახდა
    alert("აქ ჩაერთვება PRIME გადახდის სისტემა");
  };

  return (
    <LinearGradient
      colors={["#0A0D14", "#111827", "#0A0D14"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        
        <Text style={styles.badge}>PRIME</Text>

        <Text style={styles.title}>
          გახსენი ისტორიის დახურული კარი
        </Text>

        <Text style={styles.subtitle}>
          მიიღე წვდომა იმ ინფორმაციაზე,
          რომელსაც სხვა მომხმარებლები ვერ ხედავენ.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>რატომ ირჩევენ PRIME-ს?</Text>

          <Text style={styles.item}>
            • აღმოაჩინე საქართველოს ისტორიული მოვლენები ზუსტად დღევანდელ თარიღზე
          </Text>

          <Text style={styles.item}>
            • გაეცანი მსოფლიო ისტორიის გარდამტეხ ფაქტებს
          </Text>

          <Text style={styles.item}>
            • ნახე ცნობილი ადამიანები ამ დღეს
          </Text>

          <Text style={styles.item}>
            • მოძებნე შენი გვარის ისტორიული პირველწყარო და აღმოაჩინე ფესვები
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handlePress}>
          <Text style={styles.buttonText}>
            {user ? "გახდი PRIME ახლავე" : "გახდი PRIME"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
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
    shadowColor: "#D4AF37",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },
  close: {
    color: "#9CA3AF",
    marginTop: 10,
    padding: 10, // ცოტა padding დავუმატე, რომ თითის დაჭერა უფრო მარტივი იყოს
  },
});