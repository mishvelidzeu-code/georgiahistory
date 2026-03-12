import { useHistory } from "@/context/HistoryContext";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View
} from "react-native";
import { supabase } from "../services/supabase";

const { height } = Dimensions.get("window");
const FLAG = require("../assets/gallery/6.webp");

export default function SplashIntro() {

  const router = useRouter();
  const { refreshHistory } = useHistory();

  const w1Y = useRef(new Animated.Value(height)).current;
  const w2Y = useRef(new Animated.Value(height)).current;
  const w3Y = useRef(new Animated.Value(height)).current;

  const w1Scale = useRef(new Animated.Value(2)).current;
  const w2Scale = useRef(new Animated.Value(2)).current;
  const w3Scale = useRef(new Animated.Value(2)).current;

  const w1Opacity = useRef(new Animated.Value(0)).current;
  const w2Opacity = useRef(new Animated.Value(0)).current;
  const w3Opacity = useRef(new Animated.Value(0)).current;

  const bgScale = useRef(new Animated.Value(1)).current;
  const bgTranslate = useRef(new Animated.Value(0)).current;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const waitForSession = async () => {

    let tries = 0;

    while (tries < 10) {

      const { data } = await supabase.auth.getSession();

      if (data.session) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      tries++;

    }

  };

  useEffect(() => {

    const init = async () => {

      await waitForSession();     // დაელოდე session-ს
      await refreshHistory();     // მერე ჩატვირთე history
      playSound();

    };

    init();

    Animated.timing(bgScale, {
      toValue: 1.15,
      duration: 5000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    const parallax = Animated.loop(
      Animated.sequence([
        Animated.timing(bgTranslate, {
          toValue: 15,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bgTranslate, {
          toValue: -15,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    parallax.start();

    Animated.sequence([
      animateWord(w1Y, w1Scale, w1Opacity),
      animateWord(w2Y, w2Scale, w2Opacity),
      animateWord(w3Y, w3Scale, w3Opacity),
    ]).start(() => {

      timeoutRef.current = setTimeout(() => {
        router.replace("/(tabs)");
      }, 700);

    });

    return () => {

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      soundRef.current?.unloadAsync();

      parallax.stop();
    };

  }, [router, refreshHistory]);

  async function playSound() {
    try {

      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/intro.wav")
      );

      soundRef.current = sound;

      await sound.playAsync();

    } catch (e) {
      console.log("Intro sound error:", e);
    }
  }

  function animateWord(
    y: Animated.Value,
    scale: Animated.Value,
    opacity: Animated.Value
  ) {
    return Animated.parallel([
      Animated.timing(y, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]);
  }

  return (
    <View style={styles.container}>

      <Animated.Image
        source={FLAG}
        style={[
          styles.background,
          {
            transform: [
              { scale: bgScale },
              { translateX: bgTranslate }
            ],
          },
        ]}
        resizeMode="cover"
      />

      <View style={styles.overlay} />
      <View style={styles.vignette} />

      <View style={styles.centerContent}>

        <Animated.Text
          style={[
            styles.text,
            {
              opacity: w1Opacity,
              transform: [
                { translateY: w1Y },
                { scale: w1Scale },
              ],
            },
          ]}
        >
          ზოგადი
        </Animated.Text>

        <Animated.Text
          style={[
            styles.text,
            {
              opacity: w2Opacity,
              transform: [
                { translateY: w2Y },
                { scale: w2Scale },
              ],
            },
          ]}
        >
          განათლების
        </Animated.Text>

        <Animated.Text
          style={[
            styles.text,
            {
              opacity: w3Opacity,
              transform: [
                { translateY: w3Y },
                { scale: w3Scale },
              ],
            },
          ]}
        >
          სივრცე
        </Animated.Text>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 2,
    marginVertical: 12,
    textAlign: "center",
    color: "#D4AF37",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  }

});