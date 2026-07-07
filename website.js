let gadgetGlobal
let playerSkin = "bean"
let upgradeValue = 0
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
    document.getElementById('continueButton').style.display = 'none'
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
        // alert('Correct answer!')
    }
    else {
        document.getElementById(`answer${answerNum + 1}`).style.backgroundColor = 'salmon'
        const correctAnswerNum = currentQuestion.answers.findIndex(ans => ans.isCorrect)
        document.getElementById(`answer${correctAnswerNum + 1}`).style.backgroundColor = 'lightgreen'   // Sets correct answer to green
        answerStreak = 0
        // alert('Incorrect answer.')
    }
    document.getElementById('answerStreak').textContent = `${answerStreak}`
    document.getElementById('continueButton').style.display = 'inline-block'
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