const words = [
    "blabber", "blabble", "blab", "blah", "donk", "jarp", "raggle", "abbles", "plonk"
]

const sentences = [
    [5, "get","out","of","my","farm"],
    ["","","","","","",""],
    ["","","","","","",""],
    ["","","","","","",""],
    ["","","","","","",""],
    ["","","","","","",""],
    ["","","","","","",""],
]

const colors = [
    "2191fb","b9faf8","dc6acf","d84727","f3c969",
    "c56b59","6eb83d","f194b4","c5ebc3","6fbcec",
    "aafac8","c7ffed","ffa770","d3c1d2","cb769e",
    "ff6b35","f7c59f","6fd08c","b47eb3","17b2b5",
    "fffd98","339989","7f4fba","c6d4ff","ff23f6",
    "9d9143","999e57","0afff7","cad8de",
    "d4e09b","f6f4d2","cbdfbd","f19c79","f991cc"
]

/*
document.getElementById("startButton").style.backgroundColor = `#${colors[Math.floor(Math.random()*colors.length)]}`
document.getElementById("questionButton").style.backgroundColor = `#${colors[Math.floor(Math.random()*colors.length)]}`
document.getElementById("statsButton").style.backgroundColor = `#${colors[Math.floor(Math.random()*colors.length)]}`
document.getElementById("settingsButton").style.backgroundColor = `#${colors[Math.floor(Math.random()*colors.length)]}`
document.getElementById("extrasButton").style.backgroundColor = `#${colors[Math.floor(Math.random()*colors.length)]}`
*/

function blabber(){
    const consonants = "bcdfghjklmnpqrstvwxyz"
    const vowels = "aeiou"
    const wordLength = Math.floor(Math.random() * 4) + 4
    let word = ""
    for(let i = 0; i < wordLength; i++){
        if(i % 2 === 0){
            word += consonants[Math.floor(Math.random() * consonants.length)]
        }
        else{
            word += vowels[Math.floor(Math.random() * vowels.length)]
        }
    }
    return word.charAt(0).toUpperCase() + word.slice(1)
}

let gadgetGlobal
let playerSprite = "piskel"
let spritesOwned = ["bean"]
let upgradesToApply = []
let upgradeQuality = 1
let levelGlobal = -1        // Globals so Kaboom objects can be seen in entire src
let currentDivId = "menu"
let answerStreak = 0
let highestAnswerStreak = 0
let highestEnemiesDied = 0
let coins = 0
let selectedGadget = ""
let blastBlasterGlobal
let sparkBlasterGlobal
let cyclerBlasterGlobal
let beamBlasterGlobal
let questions
let questionsInGame = false 
let gameQuestions = false
let darkMode = false
let controlBindings = { up: 'w', left: 'a', down: 's', right: 'd', dash: 'q', reload: 'e' }
let bindingTarget = null
let upgradesPurchased = 0
let selectedUpgradeString
let selectedUpgradeNum
let red = 232
let green = 232
let blue = 232


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

function changeQuestions(){
    return document.getElementById('customQuestions').value.trim().split('\n').map(line => {
        const parts = line.split(',')
        return {
            question: parts[0].trim(),
            answers: parts.slice(1).map(a => a.trim()),
        }
    })
}

var input = document.getElementById("body")
input.addEventListener("keydown", function(event){
    if(!bindingTarget || event.key.length !== 1) return
    event.preventDefault()
    controlBindings[bindingTarget] = event.key.toLowerCase()
    document.getElementById(`control-${bindingTarget}`).textContent = event.key.toUpperCase()
    document.getElementById('controlStatus').textContent = 'Control updated.'
    bindingTarget = null
})
input.addEventListener("keypress", function(event){
    const gameIsVisible = document.getElementById('gameWindow').style.display !== 'none'
    if (event.key === "m"){
        event.preventDefault()
        gameQuestions = false
        playLevel(levelGlobal)
        resetInputs()
        document.getElementById('gameWindow').style.display = 'none'
        websiteGoTo('menu')
    }
})

const originalTitle = document.title
document.addEventListener("visibilitychange", () => {
    document.title = document.hidden ? "Come back :(" : originalTitle
})

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

function selectUpgrade(upgradeString, upgradeNum){
    selectedUpgradeString = upgradeString; selectedUpgradeNum = upgradeNum
    document.getElementById('upgradePurchase').style.display = "inline-block"
    document.getElementById('upgradePurchase').textContent = `Purchase ${upgradeString}`
}

function purchaseUpgrade(upgradeString, upgradeNum){
    let price = upgradesPurchased*5
    if(price<=coins){
        coins = coins-price
        playerSprite = sprite
        upgradesToApply.push(upgradeNum)
        upgradesPurchased++
        if(document.getElementById('chosenUpgrade').textContent == "No upgrade chosen"){document.getElementById('chosenUpgrade').textContent = `${upgradeString}`}
        else{document.getElementById('chosenUpgrade').textContent = `${document.getElementById('chosenUpgrade').textContent}, ${upgradeString}`}
        document.getElementById('upgradePrice').textContent = `Upgrade will cost ${upgradesPurchased*5} coins`
        document.getElementById('coinsCount').textContent = `Coins: ${coins}`
    }
    else{document.getElementById('upgradePrice').textContent = `You cannot afford the ${upgradeString} upgrade.`}
}

function purchaseSkin(sprite, price, button){
    if(spritesOwned.includes(sprite)){
        document.getElementById('currentSkin').textContent = `Skin: ${sprite}` || ''
        playerSprite = sprite
    }    
    else if(price<=coins){
        coins = coins-price
        playerSprite = sprite
        document.getElementById('coinsCount').textContent = `Coins: ${coins}`
        document.getElementById('currentSkin').textContent = `Skin: ${sprite}` || ''
        button.textContent = sprite
        spritesOwned.push(sprite)
        //this.onclick = purchaseSkin(sprite, 0, this)  funny line of code, infinately called causing stack overflow/ maximum cell exceeded
    }
    else{
        alert(`You cannot afford ${sprite} skin.`)
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
        button.style.cursor = 'default'
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
        document.getElementById(`answer${i}`).style.cursor = 'not-allowed'
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
    const info = {
        Blast: 'High spread buckshot blaster.',
        Cycler: 'Fully automatic with a large ammo pool.',
        Beam: 'Long range piercing projectile cannon.',
        Spark: '6-shot sidearm with fast reload and critical hits.',
    }
    document.getElementById('weaponInfo').textContent = info[gearName] || ''
    document.getElementById('weaponSelectContinue').style.display = "inline-block"        
}

function beginControlBind(control) {
    bindingTarget = control
    document.getElementById('controlStatus').textContent = `Press a key for ${control}.`
}

function resetInputs(){
    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: `${controlBindings.up}` }))
    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: `${controlBindings.left}` }))  // Reset inputs
    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: `${controlBindings.down}` }))
    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: `${controlBindings.right}` }))
}

//window.addEventListener('beforeunload', (event) => {
//    event.preventDefault()
//})

websiteGoTo('menu')