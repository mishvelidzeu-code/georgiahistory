import AuthGate from "@/components/auth-gate";
import { useAuth } from "@/context/AuthContext";
import { getGeorgiaNow, getGeorgianMonthName } from "@/services/date";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabase";

type Holiday = {
  month: number;
  day: number;
  title: string;
  description: string;
  is_dayoff: boolean;
};

const WEEKDAYS = ["ორ", "სა", "ოთ", "ხუ", "პა", "შა", "კვ"];

/**
 * მართლმადიდებლური აღდგომა (იულიუსის კალენდრით გამოთვლილი და
 * გრიგორიანულზე გადმოყვანილი — 1900-2099 წლებისთვის +13 დღე).
 */
function orthodoxEaster(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;

  const julian = new Date(Date.UTC(year, month - 1, day));
  julian.setUTCDate(julian.getUTCDate() + 13);
  return julian;
}

/** აღდგომასთან დაკავშირებული მოძრავი დღეები მოცემული წლისთვის */
function movableHolidays(year: number): Holiday[] {
  const easter = orthodoxEaster(year);
  const shift = (days: number) => {
    const d = new Date(easter);
    d.setUTCDate(d.getUTCDate() + days);
    return { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
  };

  return [
    {
      ...shift(-2),
      title: "წითელი პარასკევი",
      description:
        "ვნების კვირის პარასკევი — იესო ქრისტეს ჯვარცმის დღე. ოფიციალური დასვენების დღეა და ყოველწლიურად აღდგომის მიხედვით იცვლება.",
      is_dayoff: true,
    },
    {
      ...shift(-1),
      title: "დიდი შაბათი",
      description:
        "აღდგომის წინა დღე. საღამოს ეკლესიებში იწყება სააღდგომო მსახურება და ქრისტეს აღდგომის დახვედრა.",
      is_dayoff: true,
    },
    {
      ...shift(0),
      title: "აღდგომა",
      description:
        "ქრისტეს აღდგომის დღესასწაული — მართლმადიდებლური ეკლესიის მთავარი დღესასწაული. სუფრაზე წითელი კვერცხი და პასკაა, მისალმება კი — „ქრისტე აღდგა“.",
      is_dayoff: true,
    },
    {
      ...shift(1),
      title: "შავი ორშაბათი",
      description:
        "აღდგომის მომდევნო ორშაბათი, გარდაცვლილთა მოხსენიების დღე. ოჯახები სასაფლაოზე მიდიან და ახლობლებს იხსენებენ.",
      is_dayoff: true,
    },
  ];
}

export default function CalendarScreen() {
  const { user, authLoading } = useAuth();

  const today = getGeorgiaNow();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [selected, setSelected] = useState<Holiday | null>(null);

  const [rows, setRows] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHolidays = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("holidays")
        .select("month, day, title, description, is_dayoff");
      if (!error) setRows(data || []);
    } catch (e) {
      console.log("Holidays fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchHolidays();
    } else {
      setLoading(false);
    }
  }, [authLoading, user, fetchHolidays]);

  // ფიქსირებული + მოძრავი დღეები მიმდინარე წლისთვის
  const all = useMemo(
    () => [...rows, ...movableHolidays(year)],
    [rows, year]
  );

  const monthHolidays = useMemo(
    () => all.filter((h) => h.month === month).sort((a, b) => a.day - b.day),
    [all, month]
  );

  const byDay = useMemo(() => {
    const m = new Map<number, Holiday>();
    for (const h of monthHolidays) if (!m.has(h.day)) m.set(h.day, h);
    return m;
  }, [monthHolidays]);

  // თვის ბადე: ორშაბათიდან კვირამდე
  const grid = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // ორშაბათი = 0

    const cells: (number | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, [month, year]);

  const shiftMonth = (delta: number) => {
    setSelected(null);
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  };

  const isToday = (d: number) =>
    d === today.getDate() &&
    month === today.getMonth() + 1 &&
    year === today.getFullYear();

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
        title="კალენდარი ჩაკეტილია"
        message="უქმე დღეებისა და დღესასწაულების სანახავად გაიარე ავტორიზაცია."
        icon="calendar-outline"
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="calendar-outline" size={30} color="#D4AF37" />
          <Text style={styles.headerLabel}>კალენდარი</Text>
        </View>

        {/* თვის გადამრთველი */}
        <View style={styles.monthBar}>
          <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.arrow} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color="#D4AF37" />
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Text style={styles.monthName}>{getGeorgianMonthName(month)}</Text>
            <Text style={styles.yearText}>{year}</Text>
          </View>

          <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.arrow} hitSlop={12}>
            <Ionicons name="chevron-forward" size={22} color="#D4AF37" />
          </TouchableOpacity>
        </View>

        {/* ბადე */}
        <View style={styles.calendarCard}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={w} style={[styles.weekday, i >= 5 && styles.weekdayRest]}>
                {w}
              </Text>
            ))}
          </View>

          {grid.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((d, di) => {
                const holiday = d ? byDay.get(d) : undefined;
                const dayoff = holiday?.is_dayoff || di >= 5;

                return (
                  <TouchableOpacity
                    key={di}
                    activeOpacity={holiday ? 0.7 : 1}
                    disabled={!holiday}
                    onPress={() => setSelected(holiday ?? null)}
                    style={styles.dayCell}
                  >
                    {d && (
                      <View
                        style={[
                          styles.dayInner,
                          isToday(d) && styles.dayToday,
                          selected && holiday && selected.day === d && styles.daySelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            dayoff && styles.dayTextRest,
                            holiday && styles.dayTextHoliday,
                          ]}
                        >
                          {d}
                        </Text>
                        {!!holiday && <View style={styles.dot} />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* არჩეული დღე */}
        {!!selected && (
          <View style={styles.selectedCard}>
            <LinearGradient
              colors={["rgba(212,175,55,0.12)", "transparent"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.selectedDate}>
              {selected.day} {getGeorgianMonthName(selected.month)}
            </Text>
            <Text style={styles.selectedTitle}>{selected.title}</Text>
            <Text style={styles.selectedText}>{selected.description}</Text>
            {selected.is_dayoff && (
              <View style={styles.dayoffBadge}>
                <Ionicons name="bed-outline" size={13} color="#0A0D14" />
                <Text style={styles.dayoffText}>დასვენების დღე</Text>
              </View>
            )}
          </View>
        )}

        {/* თვის დღესასწაულები */}
        <View style={styles.listHeader}>
          <View style={styles.line} />
          <Text style={styles.listTitle}>ამ თვის დღეები</Text>
          <View style={styles.line} />
        </View>

        {monthHolidays.length === 0 ? (
          <Text style={styles.emptyText}>ამ თვეში უქმე დღეები არ არის.</Text>
        ) : (
          monthHolidays.map((h, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.8}
              onPress={() => setSelected(h)}
              style={styles.listRow}
            >
              <View style={styles.listDate}>
                <Text style={styles.listDay}>{h.day}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listName}>{h.title}</Text>
                <Text style={styles.listKind}>
                  {h.is_dayoff ? "დასვენების დღე" : "აღსანიშნავი დღე"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#4B5563" />
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.note}>
          აღდგომასთან დაკავშირებული დღეები ყოველ წელს იცვლება და ავტომატურად გამოითვლება.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0D14" },
  center: {
    flex: 1,
    backgroundColor: "#0A0D14",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { padding: 20, paddingBottom: 40 },

  header: { alignItems: "center", marginTop: 10, marginBottom: 20 },
  headerLabel: {
    color: "#E2D9C5",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginTop: 8,
    opacity: 0.85,
  },

  monthBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  monthName: { color: "#D4AF37", fontSize: 20, fontWeight: "900", letterSpacing: 1 },
  yearText: { color: "#6B7280", fontSize: 12, marginTop: 2 },

  calendarCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.12)",
  },
  weekRow: { flexDirection: "row" },
  weekday: {
    flex: 1,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 8,
  },
  weekdayRest: { color: "rgba(212,175,55,0.6)" },

  dayCell: { flex: 1, aspectRatio: 1, justifyContent: "center", alignItems: "center" },
  dayInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  dayToday: { borderWidth: 1, borderColor: "rgba(212,175,55,0.5)" },
  daySelected: { backgroundColor: "rgba(212,175,55,0.18)" },
  dayText: { color: "#D1D5DB", fontSize: 15 },
  dayTextRest: { color: "#9CA3AF" },
  dayTextHoliday: { color: "#D4AF37", fontWeight: "800" },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D4AF37",
    marginTop: 2,
  },

  selectedCard: {
    marginTop: 18,
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    overflow: "hidden",
  },
  selectedDate: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  selectedTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
    marginBottom: 10,
  },
  selectedText: { color: "#D1D5DB", fontSize: 15, lineHeight: 25 },
  dayoffBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#D4AF37",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 14,
  },
  dayoffText: { color: "#0A0D14", fontSize: 11, fontWeight: "900" },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    marginBottom: 14,
  },
  line: { width: 28, height: 1, backgroundColor: "rgba(212,175,55,0.3)", marginHorizontal: 10 },
  listTitle: { color: "#D4AF37", fontSize: 13, fontWeight: "700", letterSpacing: 1 },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(17,24,39,0.6)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  listDate: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(212,175,55,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  listDay: { color: "#D4AF37", fontSize: 17, fontWeight: "900" },
  listName: { color: "#E2D9C5", fontSize: 15, fontWeight: "700" },
  listKind: { color: "#6B7280", fontSize: 12, marginTop: 2 },

  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 6,
  },
  note: {
    color: "#4B5563",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 22,
  },
});
