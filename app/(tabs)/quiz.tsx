import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { supabase } from "../../services/supabase";

export default function QuizScreen(){

const router = useRouter()

const [questions,setQuestions] = useState<any[]>([])
const [leaderboard,setLeaderboard] = useState<any[]>([])

const [currentQuestion,setCurrentQuestion] = useState(0)
const [score,setScore] = useState(0)

const [selected,setSelected] = useState<string|null>(null)
const [showResult,setShowResult] = useState(false)

const [finished,setFinished] = useState(false)
const [alreadyPlayed,setAlreadyPlayed] = useState(false)

const [refreshing,setRefreshing] = useState(false)
const [loading,setLoading] = useState(true)

const [options,setOptions] = useState<string[]>([])
const [timeLeft,setTimeLeft] = useState("")

useEffect(()=>{

init()

const stop = startCountdown()

return stop

},[])

useEffect(()=>{

if(questions.length>0){

const q = questions[currentQuestion]

const shuffled = [
q.option1,
q.option2,
q.option3,
q.option4
].sort(()=>Math.random()-0.5)

setOptions(shuffled)

}

},[questions,currentQuestion])

function startCountdown(){

const update=()=>{

const now=new Date()
const tomorrow=new Date()

tomorrow.setDate(now.getDate()+1)
tomorrow.setHours(0,0,0,0)

const diff=tomorrow.getTime()-now.getTime()

const hours=Math.floor(diff/1000/60/60)
const minutes=Math.floor((diff/1000/60)%60)

setTimeLeft(`${hours} საათი ${minutes} წუთი`)

}

update()

const timer = setInterval(update,60000)

return ()=>clearInterval(timer)

}

async function init(){

try{

await Promise.all([
fetchQuestions(),
checkTodayQuiz(),
fetchLeaderboard()
])

}catch(e){

console.log("Quiz init error",e)

}finally{

setLoading(false)

}

}

async function fetchQuestions(){

try{

const today = new Date()
const day = today.getDate()
const month = today.getMonth()+1

const {data,error} = await supabase
.from("quiz_questions")
.select("*")
.eq("day",day)
.eq("month",month)
.limit(4)

if(error){
console.log("Quiz questions error",error)
return
}

setQuestions(data||[])

}catch(e){
console.log("Quiz questions catch",e)
}

}

async function fetchLeaderboard(){

try{

const {data,error} = await supabase.rpc("leaderboard")

if(error){
console.log("Leaderboard error",error)
return
}

setLeaderboard(data||[])

}catch(e){
console.log("Leaderboard catch",e)
}

}

async function checkTodayQuiz(){

try{

const { data } = await supabase.auth.getSession();
const user = data?.session?.user;
if(!user) return

const today = new Date().toISOString().split("T")[0]

const { data: played } = await supabase
.from("quiz_scores")
.select("*")
.eq("user_id",user.id)
.gte("created_at",today)

if(played && played.length>0){

setScore(played[0].score)
setFinished(true)
setAlreadyPlayed(true)

}

}catch(e){
console.log("Today quiz error",e)
}

}

async function saveScore(finalScore:number){

const {data} = await supabase.auth.getUser()
const user = data?.user
if(!user) return

await supabase
.from("quiz_scores")
.insert({
user_id:user.id,
score:finalScore,
xp: finalScore * 10,
mode:"normal"
})

fetchLeaderboard()

}

async function onRefresh(){
setRefreshing(true)
await init()
setRefreshing(false)
}

if(loading){
return(

<View style={{
flex:1,
backgroundColor:"#0A0D14",
justifyContent:"center",
alignItems:"center"
}}>
<Text style={{color:"white"}}>
ქვიზი იტვირთება...
</Text>
</View>

)
}

if(finished){
return(

<ScrollView style={{flex:1,backgroundColor:"#0A0D14"}}>

<View style={{padding:30,paddingTop:80}}>

<Text style={{
color:"#D4AF37",
fontSize:30,
textAlign:"center",
marginBottom:20
}}>
{alreadyPlayed ? "დღევანდელი ქვიზი უკვე ითამაშე" : "🎉 ქვიზი დასრულდა"}
</Text>

<Text style={{
color:"white",
fontSize:20,
textAlign:"center"
}}>
თქვენ მიიღეთ
</Text>

<Text style={{
color:"#22c55e",
fontSize:42,
fontWeight:"bold",
textAlign:"center",
marginVertical:10
}}>
{score} ქულა
</Text>

<Text style={{
color:"#9CA3AF",
textAlign:"center",
marginBottom:10
}}>
XP: {score*10}
</Text>

<Text style={{
color:"#9CA3AF",
textAlign:"center",
fontSize:16,
marginBottom:5
}}>
შემდეგი ქვიზისთვის დაბრუნდით ხვალ
</Text>

<Text style={{
color:"#D4AF37",
textAlign:"center",
marginBottom:30
}}>
დარჩა: {timeLeft}
</Text>

<Text style={{
color:"#D4AF37",
fontSize:24,
textAlign:"center",
marginBottom:20
}}>
🏆 Leaderboard
</Text>

{leaderboard.map((player,index)=>{

const medals=["🥇","🥈","🥉"]
const medal = medals[index]||`${index+1}.`

return(

<View
key={index}
style={{
backgroundColor:"#111827",
padding:16,
borderRadius:14,
marginBottom:10,
flexDirection:"row",
alignItems:"center",
justifyContent:"space-between"
}}
>

<Text>{medal}</Text>

<Text style={{color:"white"}}>
{player.username}
</Text>

<Text style={{
color:"#D4AF37",
fontWeight:"700"
}}>
{player.total_score}
</Text>

</View>

)

})}

</View>

</ScrollView>

)
}

if(questions.length===0){
return(
<View style={{
flex:1,
justifyContent:"center",
alignItems:"center",
backgroundColor:"#0A0D14"
}}>
<Text style={{color:"white"}}>
დღევანდელი ქვიზი ჯერ არ არის
</Text>
</View>
)
}

const question = questions[currentQuestion]

const selectAnswer = (option:string)=>{

if(selected) return

setSelected(option)
setShowResult(true)

const correct = option===question.correct

if(correct) setScore(prev=>prev+1)

setTimeout(()=>{

if(currentQuestion<questions.length-1){

setCurrentQuestion(prev=>prev+1)
setSelected(null)
setShowResult(false)

}else{

const finalScore = score+(correct?1:0)
setScore(finalScore)
saveScore(finalScore)
setFinished(true)

}

},1000)

}

return(

<ScrollView
style={{flex:1,backgroundColor:"#0A0D14"}}
refreshControl={
<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
}
>

<View style={{padding:20,paddingTop:80}}>

<TouchableOpacity onPress={()=>router.back()}>
<Ionicons name="arrow-back" size={26} color="#D4AF37"/>
</TouchableOpacity>

<Text style={{color:"#D4AF37"}}>
{question.category}
</Text>

<Text style={{
color:"white",
fontSize:22,
marginVertical:20
}}>
{question.question}
</Text>

{options.map(option=>{

let bg="#111827"

if(showResult){
if(option===question.correct) bg="#16a34a"
else if(option===selected) bg="#dc2626"
}

return(

<TouchableOpacity
key={option}
onPress={()=>selectAnswer(option)}
style={{
backgroundColor:bg,
padding:16,
borderRadius:14,
marginBottom:12
}}
>

<Text style={{color:"white",fontSize:18}}>
{option}
</Text>

</TouchableOpacity>

)

})}

<Text style={{
color:"#9CA3AF",
textAlign:"center"
}}>
კითხვა {currentQuestion+1}/{questions.length}
</Text>

<View style={{marginTop:60}}>

<Text style={{
color:"#D4AF37",
fontSize:24,
textAlign:"center",
marginBottom:20
}}>
🏆 Leaderboard
</Text>

{leaderboard.map((player,index)=>{

const medals=["🥇","🥈","🥉"]
const medal = medals[index]||`${index+1}.`

return(

<View
key={index}
style={{
backgroundColor:"#111827",
padding:16,
borderRadius:14,
marginBottom:10,
flexDirection:"row",
alignItems:"center",
justifyContent:"space-between"
}}
>

<Text>{medal}</Text>

<Text style={{color:"white"}}>
{player.username}
</Text>

<Text style={{
color:"#D4AF37",
fontWeight:"700"
}}>
{player.total_score}
</Text>

</View>

)

})}

</View>

</View>

</ScrollView>

)

}