import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { supabase } from "../../services/supabase";

export default function QuizScreen() {
    const router = useRouter();

    const [questions, setQuestions] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [finished, setFinished] = useState(false);
    const [alreadyPlayed, setAlreadyPlayed] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [options, setOptions] = useState<string[]>([]);
    const [timeLeft, setTimeLeft] = useState("");

    // --- ლოგიკა (უცვლელი) ---
    useEffect(() => {
        init();
        const stop = startCountdown();
        return stop;
    }, []);

    useEffect(() => {
        if (questions.length > 0) {
            const q = questions[currentQuestion];
            const shuffled = [q.option1, q.option2, q.option3, q.option4].sort(() => Math.random() - 0.5);
            setOptions(shuffled);
        }
    }, [questions, currentQuestion]);

    function startCountdown() {
        const update = () => {
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const diff = tomorrow.getTime() - now.getTime();
            const hours = Math.floor(diff / 1000 / 60 / 60);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            setTimeLeft(`${hours}ს ${minutes}წ`);
        };
        update();
        const timer = setInterval(update, 60000);
        return () => clearInterval(timer);
    }

    async function init() {
        try {
            await Promise.all([fetchQuestions(), checkTodayQuiz(), fetchLeaderboard()]);
        } catch (e) {
            console.log("Quiz init error", e);
        } finally {
            setLoading(false);
        }
    }

    async function fetchQuestions() {
        try {
            const today = new Date();
            const { data, error } = await supabase
                .from("quiz_questions")
                .select("*")
                .eq("day", today.getDate())
                .eq("month", today.getMonth() + 1)
                .limit(4);
            if (!error) setQuestions(data || []);
        } catch (e) { console.log(e); }
    }

    async function fetchLeaderboard() {
        try {
            const { data, error } = await supabase.rpc("leaderboard");
            if (!error) setLeaderboard(data || []);
        } catch (e) { console.log(e); }
    }

    async function checkTodayQuiz() {
        try {
            const { data } = await supabase.auth.getSession();
            const user = data?.session?.user;
            if (!user) return;
            const today = new Date().toISOString().split("T")[0];
            const { data: played } = await supabase
                .from("quiz_scores")
                .select("*")
                .eq("user_id", user.id)
                .gte("created_at", today);
            if (played && played.length > 0) {
                setScore(played[0].score);
                setFinished(true);
                setAlreadyPlayed(true);
            }
        } catch (e) { console.log(e); }
    }

    async function saveScore(finalScore: number) {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) return;
        await supabase.from("quiz_scores").insert({
            user_id: user.id,
            score: finalScore,
            xp: finalScore * 10,
            mode: "normal"
        });
        fetchLeaderboard();
    }

    const selectAnswer = (option: string) => {
        if (selected) return;
        setSelected(option);
        setShowResult(true);
        const correct = option === questions[currentQuestion].correct;
        if (correct) setScore(prev => prev + 1);

        setTimeout(() => {
            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(prev => prev + 1);
                setSelected(null);
                setShowResult(false);
            } else {
                const finalScore = score + (correct ? 1 : 0);
                saveScore(finalScore);
                setFinished(true);
            }
        }, 1000);
    };

    async function onRefresh() {
        setRefreshing(true);
        await init();
        setRefreshing(false);
    }

    // --- ვიზუალური ნაწილი ---

    if (loading) {
        return (
            <View style={styles.centerLoader}>
                <ActivityIndicator size="large" color="#D4AF37" />
                <Text style={styles.loaderText}>მატიანე იშლება...</Text>
            </View>
        );
    }

    // Leaderboard Component (Reusable)
    const RenderLeaderboard = () => (
        <View style={styles.leaderboardSection}>
            <View style={styles.sectionHeader}>
                <Ionicons name="trophy-outline" size={20} color="#D4AF37" />
                <Text style={styles.sectionTitle}>დღის ლიდერები</Text>
            </View>
            {leaderboard.map((player, index) => {
                const medals = ["🥇", "🥈", "🥉"];
                return (
                    <View key={index} style={styles.leaderboardRow}>
                        <Text style={styles.medal}>{medals[index] || `${index + 1}.`}</Text>
                        <Text style={styles.username}>{player.username}</Text>
                        <Text style={styles.userScore}>{player.total_score} ქულა</Text>
                    </View>
                );
            })}
        </View>
    );

    if (finished) {
        return (
            <ScrollView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.finishedContent}>
                    <View style={styles.resultCard}>
                        <Ionicons name={alreadyPlayed ? "calendar-outline" : "ribbon-outline"} size={60} color="#D4AF37" />
                        <Text style={styles.finishTitle}>
                            {alreadyPlayed ? "დღევანდელი გამოცდა ჩაბარებულია" : "გამოცდა დასრულდა!"}
                        </Text>
                        
                        <View style={styles.scoreContainer}>
                            <Text style={styles.scoreNumber}>{score}</Text>
                            <Text style={styles.scoreLabel}>ქულა</Text>
                        </View>

                        <View style={styles.xpBadge}>
                            <Text style={styles.xpText}>+{score * 10} XP</Text>
                        </View>

                        <View style={styles.nextQuizBox}>
                            <Text style={styles.nextText}>შემდეგი კითხვები ხვალ</Text>
                            <View style={styles.timerRow}>
                                <Ionicons name="time-outline" size={16} color="#D4AF37" />
                                <Text style={styles.timeLeftText}>{timeLeft}</Text>
                            </View>
                        </View>
                    </View>

                    <RenderLeaderboard />
                </View>
            </ScrollView>
        );
    }

    if (questions.length === 0) {
        return (
            <View style={styles.centerLoader}>
                <Ionicons name="hourglass-outline" size={50} color="#D4AF37" />
                <Text style={styles.loaderText}>დღევანდელი ქვიზი მზადდება...</Text>
            </View>
        );
    }

    const question = questions[currentQuestion];

    return (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}>
            <StatusBar barStyle="light-content" />
            <View style={styles.quizContent}>
                
                {/* Header Navigation */}
                <View style={styles.quizHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="#D4AF37" />
                    </TouchableOpacity>
                    <View style={styles.progressContainer}>
                        <Text style={styles.progressText}>{currentQuestion + 1} / {questions.length}</Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${((currentQuestion + 1) / questions.length) * 100}%` }]} />
                        </View>
                    </View>
                </View>

                {/* Question Area */}
                <View style={styles.questionBox}>
                    <Text style={styles.categoryBadge}>{question.category || "ისტორია"}</Text>
                    <Text style={styles.questionText}>{question.question}</Text>
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {options.map(option => {
                        let borderColor = "rgba(212,175,55,0.2)";
                        let bgColor = "#111827";
                        
                        if (showResult) {
                            if (option === question.correct) {
                                borderColor = "#16a34a";
                                bgColor = "rgba(22, 163, 74, 0.1)";
                            } else if (option === selected) {
                                borderColor = "#dc2626";
                                bgColor = "rgba(220, 38, 38, 0.1)";
                            }
                        }

                        return (
                            <TouchableOpacity
                                key={option}
                                activeOpacity={0.7}
                                onPress={() => selectAnswer(option)}
                                style={[styles.optionBtn, { borderColor, backgroundColor: bgColor }]}
                            >
                                <Text style={styles.optionText}>{option}</Text>
                                {showResult && option === question.correct && <Ionicons name="checkmark-circle" size={20} color="#16a34a" />}
                                {showResult && option === selected && option !== question.correct && <Ionicons name="close-circle" size={20} color="#dc2626" />}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.divider} />
                <RenderLeaderboard />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0A0D14" },
    centerLoader: { flex: 1, backgroundColor: "#0A0D14", justifyContent: "center", alignItems: "center" },
    loaderText: { color: "#D4AF37", marginTop: 15, fontSize: 16, letterSpacing: 1 },
    
    quizContent: { padding: 25, paddingTop: 60 },
    finishedContent: { padding: 25, paddingTop: 80 },

    // Header
    quizHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    backBtn: { marginRight: 20 },
    progressContainer: { flex: 1 },
    progressText: { color: "#D4AF37", fontSize: 12, fontWeight: "700", marginBottom: 5, textAlign: 'right' },
    progressBarBg: { height: 4, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 2 },
    progressBarFill: { height: 4, backgroundColor: "#D4AF37", borderRadius: 2 },

    // Question
    questionBox: { marginBottom: 30 },
    categoryBadge: { color: "#D4AF37", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: "700", marginBottom: 10 },
    questionText: { color: "#E2D9C5", fontSize: 24, fontWeight: "700", lineHeight: 32 },

    // Options
    optionsContainer: { marginBottom: 40 },
    optionBtn: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    optionText: { color: "#FFF", fontSize: 17, fontWeight: "500" },

    // Result Card
    resultCard: {
        backgroundColor: "#111827",
        borderRadius: 30,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: "rgba(212,175,55,0.15)",
        marginBottom: 40
    },
    finishTitle: { color: "#E2D9C5", fontSize: 18, fontWeight: "700", textAlign: 'center', marginTop: 20 },
    scoreContainer: { alignItems: 'center', marginVertical: 20 },
    scoreNumber: { color: "#D4AF37", fontSize: 64, fontWeight: "900" },
    scoreLabel: { color: "#D4AF37", fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, marginTop: -10 },
    xpBadge: { backgroundColor: "rgba(212,175,55,0.1)", paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
    xpText: { color: "#D4AF37", fontWeight: "800", fontSize: 16 },
    nextQuizBox: { marginTop: 30, alignItems: 'center' },
    nextText: { color: "#9CA3AF", fontSize: 14, marginBottom: 5 },
    timerRow: { flexDirection: 'row', alignItems: 'center' },
    timeLeftText: { color: "#D4AF37", fontWeight: "700", marginLeft: 6 },

    // Leaderboard
    leaderboardSection: { marginTop: 20, paddingBottom: 50 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { color: "#D4AF37", fontSize: 16, fontWeight: "800", marginLeft: 10, letterSpacing: 1 },
    leaderboardRow: {
        backgroundColor: "rgba(17, 24, 39, 0.6)",
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.03)"
    },
    medal: { fontSize: 16, width: 30 },
    username: { flex: 1, color: "#E2D9C5", fontWeight: "600", fontSize: 15 },
    userScore: { color: "#D4AF37", fontWeight: "800" },
    divider: { height: 1, backgroundColor: "rgba(212,175,55,0.1)", marginVertical: 10 }
});