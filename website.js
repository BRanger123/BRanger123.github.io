let gadgetGlobal
let playerSkin = "bean"
let upgradeValue = 0
let upgradeQuality = 1
let levelGlobal = -1        // Globals so Kaboom objects can be seen in entire src
let currentDivId = "menu"
let answerStreak = 0
let highestAnswerStreak = 0
let highestEnemiesDied = 0
let coins
let selectedGadget = ""
let blastBlasterGlobal
let sparkBlasterGlobal
let cyclerBlasterGlobal
let beamBlasterGlobal
let questions
let questionsInGame = false
let gameQuestions = false
let darkMode = false

function getQuestions() {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', 'questions.txt', false)
    xhr.send()
    if (xhr.status === 200) {
        return xhr.responseText.trim().split('\n').map(line => {
            const parts = line.split(',')
            return {
                question: parts[0].trim(),
                answers: parts.slice(1).map(a => a.trim()),
            }
        })
    }
    console.error('Failed to load questions.txt')
    return []
}
questions = getQuestions()

var input = document.getElementById("body")
input.addEventListener("keypress", function(event){
    const gameIsVisible = document.getElementById('gameWindow').style.display !== 'none'
    if (event.key === "m"){
        event.preventDefault()
        playLevel(levelGlobal)
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }))
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }))  // Reset inputs
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }))
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }))
        document.getElementById('gameWindow').style.display = 'none'
        websiteGoTo('menu')
    }
})
input.addEventListener("keypress", function(event) {
    const gameIsVisible = document.getElementById('gameWindow').style.display !== 'none'
    if (event.key === "k" && gameIsVisible){
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }))
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }))  // Reset inputs
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }))
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }))
        if(levelGlobal == 1){
            event.preventDefault()
            websiteGoTo('weaponSelect')
        }
        else{
            event.preventDefault()
            go(levelGlobal)
        }
    }
})

const originalTitle = document.title
    document.addEventListener("visibilitychange", () => {
    document.title = document.hidden ? "Come back :(" : originalTitle
})

// Now define functions for website navigation and level loading



function websiteGoTo(divId){
    document.getElementById(currentDivId).style.display = "none"        // When called, must use div id in '' for function call
    document.getElementById(divId).style.display = "inline-block"
    currentDivId = divId
}

function playLevel(level){
    levelGlobal = level
    document.getElementById(currentDivId).style.display = 'none'
    document.getElementById('gameWindow').style.display = 'inline-block'
    currentDivId = "gameWindow"
    go("startButton")
}

function selectUpgrade(upgradeString){
    document.getElementById('chosenUpgrade').textContent = upgradeString || ''
    document.getElementById('upgradeContinue').style.display = "inline-block"
}

function purchaseSkin(skinIndex, price, skinName){
    if(price<=coins){
        coins = coins-price
        upgradeValue = skinIndex
        document.getElementById('coinsCount').textContent = coins || ''
        document.getElementById('currentSkin').textContent = `Skin: ${skinName}` || ''
    }
}

function shuffleArray(array){
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = array[i]
        array[i] = array[j]
        array[j] = temp
    }
    return array
}

function resetAnswerButtons(){
    for (let i = 1; i <= 4; i++) {
        const button = document.getElementById(`answer${i}`)
        button.disabled = false
        button.style.backgroundColor = ''
        button.style.color = ''
    }
}

function startQuestion(){
    websiteGoTo('questions')
    if(gameQuestions){
        document.getElementById('questionBackButton').style.display = 'none'
        document.getElementById('answerStreak').textContent = `Upgrade Multiplier: x${upgradeQuality}`
    }
    else{
        document.getElementById('answerStreak').textContent = `Answer Streak: ${answerStreak}`
    }
    document.getElementById('continueButton').style.display = 'none'
    document.getElementById('continueGameButton').style.display = 'none'
    const sourceQuestion = questions[Math.floor(Math.random() * questions.length)]
    const shuffledAnswers = shuffleArray(sourceQuestion.answers.map((text, idx) => ({
        text,
        isCorrect: idx === 0,
    })))
    currentQuestion = {
        question: sourceQuestion.question,
        answers: shuffledAnswers,
    }
    document.getElementById('question').textContent = currentQuestion.question || ''
    resetAnswerButtons()
    currentQuestion.answers.forEach((answer, answerNum) => {
        const button = document.getElementById(`answer${answerNum + 1}`)
        button.textContent = answer.text || ''
        button.onclick = () => checkAnswer(answerNum)
    })
}

function checkAnswer(answerNum){
    if (!currentQuestion) return
    const selectedAnswer = currentQuestion.answers[answerNum]
    if (!selectedAnswer) return
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`answer${i}`).disabled = true
    }
    if (selectedAnswer.isCorrect) {
        document.getElementById(`answer${answerNum + 1}`).style.backgroundColor = 'lightgreen'
        answerStreak = answerStreak + 1
        if(answerStreak > highestAnswerStreak){highestAnswerStreak = answerStreak}
        if(gameQuestions){
            upgradeQuality += 0.2
            upgradeQuality = parseFloat(upgradeQuality.toFixed(1))  // Floating point error
            document.getElementById('answerStreak').textContent = `Upgrade Multiplier: x${upgradeQuality}`
            document.getElementById('continueButton').style.display = 'inline-block'
        }
        // alert('Correct answer!')
    }
    else {
        document.getElementById(`answer${answerNum + 1}`).style.backgroundColor = 'salmon'
        const correctAnswerNum = currentQuestion.answers.findIndex(ans => ans.isCorrect)
        document.getElementById(`answer${correctAnswerNum + 1}`).style.backgroundColor = 'lightgreen'   // Sets correct answer to green
        if(!gameQuestions){answerStreak = 0}
        else{
            document.getElementById('answerStreak').textContent = `Final Upgrade Multiplier: x${upgradeQuality}`
            document.getElementById('continueGameButton').style.display = 'inline-block'
        }
        // alert('Incorrect answer.')
    }
    if(gameQuestions){
        document.getElementById('answerStreak').textContent = `Upgrade Multiplier: x${upgradeQuality}`
    }
    else{
        document.getElementById('answerStreak').textContent = `Answer Streak: ${answerStreak}`
        document.getElementById('continueButton').style.display = 'inline-block'
    }
}

function updateStats(){
    document.getElementById('answerStreakStat').textContent = `${highestAnswerStreak}` || ''
    document.getElementById('enemiesDiedStat').textContent = `${highestEnemiesDied}` || ''
}

function selectGadget(gearName) {
    selectedGadget = `${gearName}`
    document.getElementById('currentGear').textContent = `Gear: ${gearName}` || ''
    document.getElementById('weaponSelectContinue').style.display = "inline-block"        
}

websiteGoTo('menu')