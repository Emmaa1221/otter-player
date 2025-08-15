
// player.js - 수정버전 (랜덤 단어 3개 & 프리토킹 AI 피드백)

const wordList = [
    "make","people","time","year","thing","man","world","life","hand","part",
    "child","eye","woman","place","work","week","case","point","government",
    "company","number","group","problem","fact","be","have","do","say","get",
    "go","know","take","see","come","think","look","want","give","use",
    "find","tell","ask","work","seem","feel","try","leave","call"
];

document.getElementById("word-btn").addEventListener("click", () => {
    let words = [];
    while (words.length < 3) {
        const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
        if (!words.includes(randomWord)) {
            words.push(randomWord);
        }
    }
    document.getElementById("word-display").innerHTML = words.map(w => `<p>${w}</p>`).join("");
});

// 프리토킹 AI 피드백 (OpenAI API 사용)
async function getAIFeedback(text) {
    const apiKey = "YOUR_OPENAI_API_KEY"; // 여기에 본인 키 입력
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: `Check the grammar of this sentence and give short feedback: ${text}` }],
            max_tokens: 100
        })
    });
    const data = await response.json();
    return data.choices[0].message.content;
}

document.getElementById("free-talk-btn").addEventListener("click", async () => {
    const userSpeech = document.getElementById("free-talk-input").value.trim();
    if (!userSpeech) return alert("Please say or type something.");
    const feedback = await getAIFeedback(userSpeech);
    document.getElementById("free-talk-feedback").innerText = feedback;
});
