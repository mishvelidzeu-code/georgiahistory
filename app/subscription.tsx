import { usePremium } from "@/context/PremiumContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Purchases from 'react-native-purchases';
import { supabase } from "../services/supabase";

export default function SubscriptionScreen() {
  const { isPremium, refreshPremium } = usePremium();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);

  // --- ლოგიკა (უცვლელი) ---
  useEffect(() => {
    checkUser();
    fetchOfferings();
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

  const fetchOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        setPackages(offerings.current.availablePackages);
      }
    } catch (e) {
      console.log("Error fetching offerings", e);
    }
  };

  const handlePress = async () => {
    if (!user) {
      router.replace("/profile");
      return;
    }

    if (packages.length === 0) {
      Alert.alert("ყურადღება", "პაკეტები არ იტვირთება. გთხოვთ, სცადოთ მოგვიანებით.");
      return;
    }

    try {
      setLoading(true);
      let latestCustomerInfo = await Purchases.restorePurchases();
      let hasPremium = typeof latestCustomerInfo.entitlements.active['Premium'] !== "undefined";

      if (!hasPremium) {
        const result = await Purchases.purchasePackage(packages[0]);
        latestCustomerInfo = result.customerInfo;
        if (typeof latestCustomerInfo.entitlements.active['Premium'] !== "undefined") {
          hasPremium = true;
        }
      }

      if (hasPremium) {
        const expirationDate = latestCustomerInfo.entitlements.active['Premium'].expirationDate;
        const { error } = await supabase
          .from("profiles")
          .update({
            is_premium: true,
            premium_until: expirationDate,
          })
          .eq("id", user.id);

        if (error) throw error;

        await refreshPremium();
        Alert.alert("წარმატება", "14 დღიანი უფასო პერიოდი გააქტიურებულია!", [
          { text: "OK", onPress: () => router.replace("/(tabs)") }
        ]);
      } else {
        Alert.alert("ინფორმაცია", "აქტიური გამოწერა ვერ მოიძებნა.");
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert("შეცდომა", e.message || "ოპერაცია ვერ შესრულდა");
      }
    } finally {
      setLoading(false);
    }
  };

  // ახალი ფუნქცია გამოწერის აღდგენისთვის (Apple-ის მოთხოვნა)
  const handleRestore = async () => {
    if (!user) {
      router.replace("/profile");
      return;
    }

    try {
      setLoading(true);
      const latestCustomerInfo = await Purchases.restorePurchases();
      const hasPremium = typeof latestCustomerInfo.entitlements.active['Premium'] !== "undefined";

      if (hasPremium) {
        const expirationDate = latestCustomerInfo.entitlements.active['Premium'].expirationDate;
        const { error } = await supabase
          .from("profiles")
          .update({
            is_premium: true,
            premium_until: expirationDate,
          })
          .eq("id", user.id);

        if (error) throw error;

        await refreshPremium();
        Alert.alert("წარმატება", "თქვენი PRIME სტატუსი აღდგენილია!");
        router.replace("/(tabs)");
      } else {
        Alert.alert("ინფორმაცია", "აქტიური გამოწერა ვერ მოიძებნა.");
      }
    } catch (e: any) {
      Alert.alert("შეცდომა", "აღდგენა ვერ მოხერხდა.");
    } finally {
      setLoading(false);
    }
  };

  // დამხმარე კომპონენტი სიისთვის
  const FeatureItem = ({ text }: { text: string }) => (
    <View style={styles.featureItem}>
      <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />
      <Text style={styles.itemText}>{text}</Text>
    </View>
  );

  return (
    <LinearGradient colors={["#0A0D14", "#111827", "#0A0D14"]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* პრემიუმ ბეიჯი */}
        <View style={styles.badgeContainer}>
          <LinearGradient colors={["#D4AF37", "#AA8E56"]} style={styles.badgeGradient}>
            <Text style={styles.badgeText}>უფასო 14 დღე</Text>
          </LinearGradient>
        </View>

        <Ionicons name="diamond-outline" size={50} color="#D4AF37" style={{ marginBottom: 15 }} />
        <Text style={styles.title}>გახდი PRIME წევრი</Text>
        <Text style={styles.subtitle}>
          გახსენი ისტორიის ყველა კარი. მიიღე სრული წვდომა უნიკალურ მასალებზე, ბიოგრაფიებსა და მეცნიერულ აღმოჩენებზე.
        </Text>

        {/* Features Card */}
        <View style={styles.card}>
          {/* დეკორატიული კუთხეები */}
          <View style={[styles.corner, { top: 15, left: 15, borderTopWidth: 1, borderLeftWidth: 1 }]} />
          <View style={[styles.corner, { top: 15, right: 15, borderTopWidth: 1, borderRightWidth: 1 }]} />

          <Text style={styles.cardTitle}>პრემიუმ შესაძლებლობები:</Text>

          <FeatureItem text="საქართველოს სრული მატიანე" />
          <FeatureItem text="გლობალური ისტორიული ფაქტები" />
          <FeatureItem text="მეცნიერული აღმოჩენების არქივი" />
          <FeatureItem text="სახელოვანი ადამიანების ბიოგრაფიები" />
          <FeatureItem text="გვარების ისტორია და წარმოშობა" />
        </View>

        {isPremium ? (
          <View style={styles.activeContainer}>
            <Ionicons name="ribbon" size={24} color="#22C55E" />
            <Text style={styles.active}>თქვენ უკვე PRIME წევრი ხართ</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={handlePress}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient colors={["#D4AF37", "#AA8E56"]} style={styles.buttonGradient}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>
                  ✨ დაიწყე უფასო პერიოდი
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* აღდგენის ღილაკი Apple-ის რევიუერებისთვის */}
        <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>გამოწერის აღდგენა (Restore Purchases)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(tabs)" as any)} style={styles.closeBtn}>
          <Text style={styles.closeText}>დახურვა</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          გაუქმება შესაძლებელია ნებისმიერ დროს.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 30, paddingTop: 70, alignItems: "center" },
  
  badgeContainer: { marginBottom: 20 },
  badgeGradient: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: "#000", fontWeight: "900", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },

  title: { fontSize: 30, fontWeight: "900", color: "#E2D9C5", textAlign: "center", marginBottom: 12 },
  subtitle: { fontSize: 15, color: "#9CA3AF", textAlign: "center", marginBottom: 35, lineHeight: 22, paddingHorizontal: 10 },

  card: {
    width: "100%",
    backgroundColor: "rgba(17, 24, 39, 0.7)",
    borderRadius: 28,
    padding: 25,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  corner: { position: 'absolute', width: 15, height: 15, borderColor: 'rgba(212, 175, 55, 0.4)' },
  cardTitle: { color: "#D4AF37", fontWeight: "800", marginBottom: 20, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
  
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  itemText: { color: "#F3F4F6", marginLeft: 12, fontSize: 14, fontWeight: "500", flex: 1 },

  button: { width: "100%", height: 60, borderRadius: 16, overflow: 'hidden', marginBottom: 5, elevation: 8, shadowColor: "#D4AF37", shadowOpacity: 0.3, shadowRadius: 10 },
  buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  buttonText: { color: "#000", fontWeight: "900", fontSize: 16 },

  activeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  active: { color: "#22C55E", fontWeight: "800", fontSize: 16, marginLeft: 10 },

  // სტილები აღდგენის ღილაკისთვის
  restoreBtn: { padding: 10, marginTop: 10 },
  restoreText: { color: "#9CA3AF", fontSize: 12, textDecorationLine: 'underline' },

  closeBtn: { padding: 15 },
  closeText: { color: "#6B7280", fontSize: 14, fontWeight: "600" },
  
  footerNote: { color: "#4B5563", fontSize: 11, marginTop: 10, textAlign: 'center' }
});