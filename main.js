
const words = ["apple", "banana", "cat", "dog", "elephant", "fish", "grape", "hat", "ice", "juice"];

function displayWords(list) {
    const wordListDiv = document.getElementById("wordList");
    wordListDiv.innerHTML = "";
    list.forEach(word => {
        const p = document.createElement("p");
        p.textContent = word;
        wordListDiv.appendChild(p);
    });
}

document.getElementById("wordBtn").addEventListener("click", () => {
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const todayWords = shuffledWords.slice(0, 3);
    displayWords(todayWords);
});
