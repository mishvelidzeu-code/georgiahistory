import { useHistory } from "@/context/HistoryContext";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import { supabase } from "../services/supabase";

const { height, width } = Dimensions.get("window");
const FLAG = require("../assets/gallery/6.webp");

// ვიწრო ეკრანები (iPhone SE/13 mini/15 — 375–393 pt): 42 pt-ზე „ყოველდღიური"
// ბოლო ასოს ქვედა ხაზზე აგდებდა, ამიტომ ზომა და letterSpacing მცირდება.
const NARROW = width < 400;
const TITLE_SIZE = NARROW ? 36 : 42;
const TITLE_SPACING = NARROW ? 1 : 2;

// ნაწილაკების კომპონენტი (ატმოსფეროსთვის)
const DustParticle = ({ delay }: { delay: number }) => {
  const moveAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacityAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(moveAnim, {
            toValue: -100,
            duration: 7000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacityAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const randomX = Math.random() * width;
  const randomY = Math.random() * height;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: randomX,
          top: randomY,
          opacity: opacityAnim,
          transform: [{ translateY: moveAnim }],
        },
      ]}
    />
  );
};

export default function SplashIntro() {
  const router = useRouter();
  const { refreshHistory } = useHistory();

  // ანიმაციები
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1.4)).current; // იწყება ძალიან ახლოდან
  const textReveal = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await playSound();
        await waitForSession();
        await refreshHistory();
      } catch (e) {
        console.log(e);
      }
    };

    init();

    // 1. ფონისა და მთლიანი ეკრანის გამოჩენა
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 8000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. ტექსტის "ელეგანტური" გამოჩენა
    Animated.timing(textReveal, {
      toValue: 1,
      duration: 3000,
      delay: 500,
      useNativeDriver: true,
    }).start(() => {
      // გადასვლა
      setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 1500, useNativeDriver: true }).start(() => {
          router.replace("/(tabs)");
        });
      }, 1000);
    });

    return () => {
      soundRef.current?.unloadAsync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require("../assets/sounds/intro.wav"));
      soundRef.current = sound;
      await sound.playAsync();
    } catch {}
  };

  const waitForSession = async () => {
    let tries = 0;
    while (tries < 10) {
      const { data } = await supabase.auth.getSession();
      if (data.session) return;
      await new Promise((r) => setTimeout(r, 200));
      tries++;
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar hidden />

      {/* ფონი Ken Burns ეფექტით */}
      <Animated.Image
        source={FLAG}
        style={[styles.background, { transform: [{ scale: scaleAnim }] }]}
        resizeMode="cover"
      />

      {/* ისტორიული ფილტრი (Sepia/Dark Overlay) */}
      <LinearGradient
        colors={["rgba(20, 15, 10, 0.4)", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.95)"]}
        style={StyleSheet.absoluteFill}
      />

      {/* "მტვრის" ნაწილაკები */}
      {[...Array(15)].map((_, i) => (
        <DustParticle key={i} delay={i * 500} />
      ))}

      <View style={styles.content}>
        <Animated.View style={{ opacity: textReveal }}>
          {/* ყველა წარწერა ერთ ხაზზე რჩება — სისტემის გადიდებული ფონტიც
              ვერ გადაიტანს ასოს ქვევით (allowFontScaling=false), ხოლო
              adjustsFontSizeToFit ვიწრო ეკრანზე ოდნავ აპატარავებს. */}
          <Text
            style={styles.subTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            allowFontScaling={false}
          >
            მსოფლიოს მატიანე
          </Text>
          <View style={styles.mainTitleContainer}>
            <Text
              style={styles.titleLine}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              allowFontScaling={false}
            >
              ყოველდღიური
            </Text>
            <Text
              style={[styles.titleLine, styles.goldText]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              allowFontScaling={false}
            >
              ისტორია
            </Text>
          </View>
          <View style={styles.divider} />
          <Text
            style={styles.tagline}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            allowFontScaling={false}
          >
            წარსული ცოცხლდება დღეს
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: height,
  },
  particle: {
    position: "absolute",
    width: 2,
    height: 2,
    backgroundColor: "rgba(212, 175, 55, 0.4)",
    borderRadius: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: NARROW ? 20 : 30,
    alignSelf: "stretch",
  },
  subTitle: {
    color: "#D4AF37",
    fontSize: 14,
    letterSpacing: NARROW ? 4 : 6,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 10,
    opacity: 0.8,
  },
  mainTitleContainer: {
    alignItems: "center",
    alignSelf: "stretch",
  },
  titleLine: {
    color: "#FFF",
    fontSize: TITLE_SIZE,
    // ქართულ ასოებს ქვედა კიდეები აქვს (ყ, ღ, უ) — ხაზის სიმაღლე ფართოდ.
    lineHeight: Math.round(TITLE_SIZE * 1.35),
    fontWeight: "300",
    letterSpacing: TITLE_SPACING,
    textAlign: "center",
    alignSelf: "stretch",
  },
  goldText: {
    color: "#D4AF37",
    fontWeight: "800",
    marginTop: -5,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: "#D4AF37",
    marginVertical: 20,
    alignSelf: "center",
  },
  tagline: {
    color: "#888",
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    letterSpacing: 1,
  },
});