import AuthGate from "@/components/auth-gate";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../services/supabase";

type Stats = {
  generated_at: string;
  today_key: string;
  users: {
    total: number; today: number; last_7: number; last_30: number;
    with_push: number; with_name: number; admins: number;
  };
  providers: Record<string, number>;
  quiz: {
    total_games: number; today: number; last_7: number;
    players_total: number; players_7: number;
    avg_score: number; max_score: number;
  };
  content: {
    daily_total: number; daily_georgia: number; daily_world: number; daily_births: number;
    science: number; medicine: number;
    quiz_questions: number; quiz_days: number;
    holidays: number; holidays_with_history: number; surnames: number;
  };
  today_content: {
    georgia: boolean; world: boolean; births: boolean;
    science: boolean; medicine: boolean; quiz: number;
  };
  daily: { d: string; signups: number; games: number }[];
  top_players: { name: string; score: number; days: number }[];
  recent_users: { name: string; at: string; push: boolean }[];
};

const YEAR_DAYS = 366;

/** UTC+4 — საქართველოს დრო, Intl-ის გარეშე */
function geoTime(iso: string) {
  const d = new Date(new Date(iso).getTime() + 4 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    time: `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`,
    date: `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}`,
  };
}

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  email: "ელფოსტა",
  unknown: "უცნობი",
};

export default function AdminScreen() {
  const router = useRouter();
  const { user, authLoading } = useAuth();

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) {
        setDenied(true);
        setStats(null);
      } else {
        setDenied(false);
        setStats(data as Stats);
      }
    } catch {
      setDenied(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (user) load();
    else setLoading(false);
  }, [authLoading, user, load]);

  if (authLoading || (user && loading)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!user) {
    return (
      <AuthGate
        title="ადმინ პანელი ჩაკეტილია"
        message="სტატისტიკის სანახავად გაიარე ავტორიზაცია."
        icon="shield-checkmark-outline"
      />
    );
  }

  if (denied || !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={46} color="#4B5563" />
          <Text style={styles.deniedTitle}>წვდომა შეზღუდულია</Text>
          <Text style={styles.deniedText}>
            ეს გვერდი მხოლოდ ადმინისტრატორისთვისაა.
          </Text>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>უკან</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const gen = geoTime(stats.generated_at);
  const maxDaily = Math.max(
    1,
    ...stats.daily.map((d) => Math.max(d.signups, d.games))
  );

  const todayItems: { label: string; ok: boolean; extra?: string }[] = [
    { label: "საქართველო", ok: stats.today_content.georgia },
    { label: "მსოფლიო", ok: stats.today_content.world },
    { label: "პიროვნებები", ok: stats.today_content.births },
    { label: "მეცნიერება", ok: stats.today_content.science },
    { label: "მედიცინა", ok: stats.today_content.medicine },
    {
      label: "ქვიზი",
      ok: stats.today_content.quiz > 0,
      extra: `${stats.today_content.quiz} კითხვა`,
    },
  ];

  const coverage: { label: string; have: number; total: number }[] = [
    { label: "ისტორია — საქართველო", have: stats.content.daily_georgia, total: YEAR_DAYS },
    { label: "ისტორია — მსოფლიო", have: stats.content.daily_world, total: YEAR_DAYS },
    { label: "პიროვნებები", have: stats.content.daily_births, total: YEAR_DAYS },
    { label: "მეცნიერება", have: stats.content.science, total: YEAR_DAYS },
    { label: "მედიცინა", have: stats.content.medicine, total: YEAR_DAYS },
    { label: "ქვიზის დღეები", have: stats.content.quiz_days, total: YEAR_DAYS },
  ];

  const providers = Object.entries(stats.providers).sort((a, b) => b[1] - a[1]);
  const providerTotal = providers.reduce((s, [, n]) => s + n, 0) || 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor="#D4AF37"
          />
        }
      >
        {/* თავსართი */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#D4AF37" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>ადმინ პანელი</Text>
            <Text style={styles.headerSub}>განახლდა {gen.time}-ზე</Text>
          </View>
          <Ionicons name="shield-checkmark" size={26} color="#D4AF37" />
        </View>

        {/* დღევანდელი დღე */}
        <Section title={`დღევანდელი დღე — ${stats.today_key}`}>
          <View style={styles.chipWrap}>
            {todayItems.map((it) => (
              <View key={it.label} style={[styles.chip, it.ok ? styles.chipOk : styles.chipBad]}>
                <Ionicons
                  name={it.ok ? "checkmark-circle" : "alert-circle"}
                  size={14}
                  color={it.ok ? "#6EE7A8" : "#F87171"}
                />
                <Text style={[styles.chipText, { color: it.ok ? "#A7F3C8" : "#FCA5A5" }]}>
                  {it.label}
                  {it.extra ? ` · ${it.extra}` : ""}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        {/* მომხმარებლები */}
        <Section title="მომხმარებლები">
          <View style={styles.tileRow}>
            <Tile value={stats.users.total} label="სულ" big />
            <Tile value={stats.users.today} label="დღეს" />
            <Tile value={stats.users.last_7} label="7 დღე" />
            <Tile value={stats.users.last_30} label="30 დღე" />
          </View>
          <Row label="შეტყობინებები ჩართული" value={`${stats.users.with_push} / ${stats.users.total}`} />
          <Row label="სახელი შევსებული" value={`${stats.users.with_name} / ${stats.users.total}`} />
          <Row label="ადმინისტრატორი" value={String(stats.users.admins)} last />
        </Section>

        {/* ავტორიზაციის წყარო */}
        <Section title="ავტორიზაციის წყარო">
          {providers.map(([prov, n]) => (
            <View key={prov} style={styles.barRow}>
              <Text style={styles.barLabel}>{PROVIDER_LABEL[prov] || prov}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(n / providerTotal) * 100}%` }]} />
              </View>
              <Text style={styles.barValue}>{n}</Text>
            </View>
          ))}
        </Section>

        {/* ქვიზი */}
        <Section title="ქვიზის აქტივობა">
          <View style={styles.tileRow}>
            <Tile value={stats.quiz.total_games} label="ნათამაშები" big />
            <Tile value={stats.quiz.today} label="დღეს" />
            <Tile value={stats.quiz.last_7} label="7 დღე" />
            <Tile value={stats.quiz.players_total} label="მოთამაშე" />
          </View>
          <Row label="აქტიური მოთამაშე (7 დღე)" value={String(stats.quiz.players_7)} />
          <Row label="საშუალო ქულა" value={String(stats.quiz.avg_score)} />
          <Row label="საუკეთესო შედეგი" value={String(stats.quiz.max_score)} last />
        </Section>

        {/* ბოლო 14 დღე */}
        <Section title="ბოლო 14 დღე">
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#D4AF37" }]} />
              <Text style={styles.legendText}>რეგისტრაცია</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#60A5FA" }]} />
              <Text style={styles.legendText}>ქვიზი</Text>
            </View>
          </View>

          <View style={styles.chart}>
            {stats.daily.map((d) => (
              <View key={d.d} style={styles.chartCol}>
                <View style={styles.chartBars}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: Math.max(2, (d.signups / maxDaily) * 70),
                        backgroundColor: "#D4AF37",
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: Math.max(2, (d.games / maxDaily) * 70),
                        backgroundColor: "#60A5FA",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{d.d.slice(0, 2)}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* კონტენტის დაფარვა */}
        <Section title="კონტენტის დაფარვა">
          {coverage.map((c) => {
            const pct = Math.round((c.have / c.total) * 100);
            return (
              <View key={c.label} style={styles.barRow}>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {c.label}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${pct}%`, backgroundColor: pct === 100 ? "#6EE7A8" : "#D4AF37" },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{c.have}</Text>
              </View>
            );
          })}
          <Row label="ქვიზის კითხვები" value={String(stats.content.quiz_questions)} />
          <Row
            label="უქმე დღეები (ისტორიით)"
            value={`${stats.content.holidays_with_history} / ${stats.content.holidays}`}
          />
          <Row label="გვარები" value={String(stats.content.surnames)} last />
        </Section>

        {/* ტოპ მოთამაშეები */}
        <Section title="ტოპ მოთამაშეები">
          {stats.top_players.length === 0 ? (
            <Text style={styles.empty}>ჯერ არავის უთამაშია.</Text>
          ) : (
            stats.top_players.map((p, i) => (
              <View key={`${p.name}-${i}`} style={styles.listRow}>
                <Text style={styles.rank}>{i + 1}</Text>
                <Text style={styles.listName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.listMeta}>{p.days} დღე</Text>
                <Text style={styles.listValue}>{p.score}</Text>
              </View>
            ))
          )}
        </Section>

        {/* ბოლო რეგისტრაციები */}
        <Section title="ბოლო რეგისტრაციები">
          {stats.recent_users.length === 0 ? (
            <Text style={styles.empty}>ჯერ არავინ დარეგისტრირებულა.</Text>
          ) : (
            stats.recent_users.map((u, i) => {
              const t = geoTime(u.at);
              return (
                <View key={`${u.name}-${i}`} style={styles.listRow}>
                  <Ionicons
                    name={u.push ? "notifications" : "notifications-off-outline"}
                    size={16}
                    color={u.push ? "#D4AF37" : "#4B5563"}
                  />
                  <Text style={[styles.listName, { marginLeft: 10 }]} numberOfLines={1}>
                    {u.name}
                  </Text>
                  <Text style={styles.listMeta}>
                    {t.date} {t.time}
                  </Text>
                </View>
              );
            })
          )}
        </Section>

        <Text style={styles.note}>
          თარიღები საქართველოს დროითაა (UTC+4). ჩამოქაჩე ქვემოთ განსაახლებლად.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- პატარა კომპონენტები ---------- */

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.card}>
    <LinearGradient
      colors={["rgba(212,175,55,0.10)", "transparent"]}
      style={StyleSheet.absoluteFill}
    />
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

const Tile = ({ value, label, big }: { value: number; label: string; big?: boolean }) => (
  <View style={styles.tile}>
    <Text style={[styles.tileValue, big && styles.tileValueBig]}>{value}</Text>
    <Text style={styles.tileLabel}>{label}</Text>
  </View>
);

const Row = ({ label, value, last }: { label: string; value: string; last?: boolean }) => (
  <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0D14" },
  center: {
    flex: 1,
    backgroundColor: "#0A0D14",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  content: { padding: 18, paddingBottom: 50 },

  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18, marginTop: 6 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { color: "#D4AF37", fontSize: 20, fontWeight: "900", letterSpacing: 0.5 },
  headerSub: { color: "#6B7280", fontSize: 12, marginTop: 2 },

  deniedTitle: { color: "#E2D9C5", fontSize: 18, fontWeight: "800", marginTop: 16 },
  deniedText: { color: "#6B7280", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 22 },
  backLink: { marginTop: 22, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: "rgba(212,175,55,0.35)" },
  backLinkText: { color: "#D4AF37", fontWeight: "800" },

  card: {
    backgroundColor: "#111827",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
    overflow: "hidden",
  },
  cardTitle: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 14,
  },

  tileRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  tile: {
    flex: 1,
    backgroundColor: "rgba(212,175,55,0.07)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  tileValue: { color: "#E2D9C5", fontSize: 20, fontWeight: "900" },
  tileValueBig: { color: "#D4AF37", fontSize: 24 },
  tileLabel: { color: "#6B7280", fontSize: 11, marginTop: 3 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  rowLabel: { color: "#9CA3AF", fontSize: 14, flex: 1 },
  rowValue: { color: "#E2D9C5", fontSize: 14, fontWeight: "800" },

  barRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  barLabel: { color: "#9CA3AF", fontSize: 13, width: 130 },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  barFill: { height: 8, borderRadius: 4, backgroundColor: "#D4AF37" },
  barValue: { color: "#E2D9C5", fontSize: 13, fontWeight: "800", width: 42, textAlign: "right" },

  legend: { flexDirection: "row", gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: "#6B7280", fontSize: 12 },

  chart: { flexDirection: "row", alignItems: "flex-end", height: 96, gap: 2 },
  chartCol: { flex: 1, alignItems: "center" },
  chartBars: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 74 },
  chartBar: { width: 5, borderRadius: 2 },
  chartLabel: { color: "#4B5563", fontSize: 9, marginTop: 5 },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  rank: { color: "#D4AF37", fontSize: 13, fontWeight: "900", width: 24 },
  listName: { color: "#E2D9C5", fontSize: 14, flex: 1 },
  listMeta: { color: "#6B7280", fontSize: 12, marginRight: 10 },
  listValue: { color: "#D4AF37", fontSize: 14, fontWeight: "900" },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipOk: { borderColor: "rgba(110,231,168,0.3)", backgroundColor: "rgba(110,231,168,0.08)" },
  chipBad: { borderColor: "rgba(248,113,113,0.3)", backgroundColor: "rgba(248,113,113,0.08)" },
  chipText: { fontSize: 12, fontWeight: "700" },

  empty: { color: "#6B7280", fontSize: 13, fontStyle: "italic" },
  note: { color: "#4B5563", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 8 },
});
