const colors = [
    "2191fb","b9faf8","dc6acf","f3c969","ffffff",
    "c56b59","6eb83d","f194b4","c5ebc3","6fbcec",
    "aafac8","c7ffed","ffa770","d3c1d2","cb769e",
    "ff6b35","f7c59f","6fd08c","b47eb3","17b2b5",
    "fffd98","339989","7f4fba","c6d4ff",
    "9d9143","999e57","0afff7","cad8de",
    "d4e09b","f6f4d2","cbdfbd","f19c79","f991cc"
]

/* Random colour buttons
document.getElementById("startButton").style.backgroundColor = `#${colors[Math.floor(Math.random()*colors.length)]}`
document.getElementById("questionButton").style.backgroundColor = `#${colors[Math.floor(Math.random()*colors.length)]}`
document.getElementById("statsButton").style.backgroundColor = `#${colors[Math.floor(Math.random()*colors.length)]}`
document.getElementById("settingsButton").style.backgroundColor = `#${colors[Math.floor(Math.random()*colors.length)]}`
document.getElementById("extrasButton").style.backgroundColor = `#${colors[Math.floor(Math.random()*colors.length)]}`
*/

function blabber(){
    //Random word function for testing text
    const consonants = "bcdfghjklmnpqrstvwxyz"
    const vowels = "aeiou"
    const wordLength = Math.floor(Math.random() * 4) + 4
    let word = ""
    for(let i = 0; i < wordLength; i++){
        if(i % 2 === 0){
            word += consonants[Math.floor(Math.random() * consonants.length)]   //Alternates consonants and vowels for realistic words
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
let levelGlobal = -1        //Globals so Kaboom objects can be seen in entire src
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
let controlBindings = { up: 'w', left: 'a', down: 's', right: 'd', dash: 'q', reload: 'e' }     //Easier to change bindings this way
let bindingTarget = null
let upgradesPurchased = 0
let selectedUpgradeString
let selectedUpgradeNum
let traitName = "None"
let traitValue = 0
const traitInfo = [
    {
        name: "None",
        description: "You are ordinary.",
    },
    {
        name: "Tank",
        description: "Start with 50% more health and deal 25% less damage.",
        maxHealthMultiplier: 1.5,
        damageMultiplier: 0.75,
    },
    {
        name: "Reckless",
        description: "Deal 50% more damage, but start with 40% less health.",
        maxHealthMultiplier: 0.6,
        damageMultiplier: 1.5,
    },
    {
        name: "Insatiable",
        description: "Coins absorb incoming damage before your health does.",
        coinsAsHealth: true,
    },
    {
        name: "Lucky",
        description: "Receive two random upgrades each round instead of choosing upgrades.",
        automaticUpgradesPerRound: 2,
    },
    {
        name: "Combonautic",
        description: "Dodge increases damage, damage upgrades increase dodge, and armor is unavailable.",
        damagePerDodge: 0.01,
        dodgePerDamageUpgrade: 5,
        noArmor: true,
    },
    {
        name: "Catastrophiser",
        description: "Fire twice as many shots, but choose from only two upgrades each round.",
        projectileMultiplier: 2,
        upgradeChoiceCount: 2,
    },
    {
        name: "Indecisive",
        description: "Choose from six upgrades each round. All enemies are chargers.",
        upgradeChoiceCount: 6,
        enemyType: "charger",
    },
    {
        name: "Mercenary",
        description: "Collect coins as soon as they drop. All enemies are shooters.",
        autoCollectCoins: true,
        enemyType: "shooter",
    },
    {
        name: "Precise",
        description: "Every shot is a critical hit, but enemies start at round 3 difficulty.",
        critChance: 1,
        startingRound: 2,
    },
]
window.traitInfo = traitInfo


let red = 232
let green = 232
let blue = 232


function getQuestions() {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', 'questions.txt', false)
    xhr.send()
    if (xhr.status === 200) {
        return xhr.responseText.trim().split('\n').map(line => {        //Maps string of each line by commas
            const parts = line.split(',')
            return {
                question: parts[0].trim(),                              //Cut parts by taking first as question
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
            answers: parts.slice(1).map(a => a.trim()),     //Use same trick even when no file is being used
        }
    })
}

var input = document.getElementById("body")
input.addEventListener("keydown", function(event){
    if(!bindingTarget || event.key.length !== 1) return
    //Detect key presses and bind to selected input
    event.preventDefault()
    controlBindings[bindingTarget] = event.key.toLowerCase()
    document.getElementById(`control-${bindingTarget}`).textContent = event.key.toUpperCase()
    document.getElementById('controlStatus').textContent = 'Control updated.'
    document.querySelectorAll('#controlOptions button').forEach((button) => {
        button.setAttribute('selectedButton', "false")
    })
    bindingTarget = null
})
input.addEventListener("keypress", function(event){
    const gameIsVisible = document.getElementById('gameWindow').style.display !== 'none'
    if (event.key === "m"){
        //Return to menu
        event.preventDefault()
        gameQuestions = false
        playLevel(levelGlobal)
        resetInputs()
        document.getElementById('gameWindow').style.display = 'none'
        websiteGoTo('menu')
        go("startButton")
    }
})

const originalTitle = document.title
document.addEventListener("visibilitychange", () => {
    //Change title if user left page
    if(document.hidden){document.title = "Come back :("}else{document.title = originalTitle}
})

function websiteGoTo(divId){
    //When called, must use div id in '' for function call
    document.getElementById(currentDivId).style.display = "none"
    document.getElementById(divId).style.display = "inline-block"
    currentDivId = divId
}

function selectTrait(traitId){
    const trait = traitInfo[traitId]
    traitValue = traitId
    traitName = trait.name
    document.getElementById('traitName').textContent = `Trait: ${trait.name}`
    document.getElementById('traitInfo').textContent = trait.description
    document.getElementById('traitEntryButton').textContent = `Trait: ${trait.name}`
    document.querySelectorAll('#traitOptions button').forEach((button) => {
        button.setAttribute('selectedButton', String(Number(button.dataset.traitIndex) === traitId))
    })
}

function playLevel(level){
    //Encapsulate go() to add div swapping and global tracking
    levelGlobal = level
    document.getElementById(currentDivId).style.display = 'none'
    document.getElementById('gameWindow').style.display = 'inline-block'
    currentDivId = "gameWindow"
    go("startButton")
}

function selectUpgrade(upgradeString, upgradeNum){
    document.querySelectorAll('#upgradeOptions button').forEach((button) => {
        button.setAttribute('selectedButton', String(Number(button.dataset.upgradeIndex) === upgradeNum))
    })
    selectedUpgradeString = upgradeString; selectedUpgradeNum = upgradeNum  //Can be used later when purchasing upgrade
    document.getElementById('upgradePurchase').style.display = "inline-block"
    document.getElementById('upgradePurchase').textContent = `Purchase ${upgradeString}`
}

function purchaseUpgrade(upgradeString, upgradeNum){
    let price = upgradesPurchased*3
    if(price<=coins){
        coins = coins-price
        playerSprite = sprite
        upgradesToApply.push(upgradeNum)    //Array of upgrades that will be looped through in game
        upgradesPurchased++
        //Code below for updating chosenUpgrade element to add upgrades the player has purchased
        //Only override text content if value is default meaning no upgrade chosen
        //Else add the string value of the purchased upgrade
        if(document.getElementById('chosenUpgrade').textContent == "No upgrade chosen"){document.getElementById('chosenUpgrade').textContent = `${upgradeString}`}
        else{document.getElementById('chosenUpgrade').textContent = `${document.getElementById('chosenUpgrade').textContent}, ${upgradeString}`}
        document.getElementById('upgradePrice').textContent = `Upgrade will cost ${upgradesPurchased*3} coins`
        document.getElementById('coinsCount').textContent = `Coins: ${coins}`
    }
    //Cant afford
    else{document.getElementById('upgradePrice').textContent = `You cannot afford the ${upgradeString} upgrade.`}
}

//purchaseSkin func cannot be used now since there is only one sprite sheet
/*function purchaseSkin(sprite, price, button){
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
        //this.onclick = purchaseSkin(sprite, 0, this)  funny line of code, infinately called causing maximum cell exceeded
    }
    else{
        alert(`You cannot afford ${sprite} skin.`)
    }
}*/

function shuffleArray(array){
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))   //Randomly swaps each indexed item in array
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
    if(gameQuestions){  //If game caused quiz
        document.getElementById('questionBackButton').style.display = 'none'
        document.getElementById('answerStreak').textContent = `Upgrade Multiplier: x${upgradeQuality}`
    }
    else{
        document.getElementById('answerStreak').textContent = `Answer Streak: ${answerStreak}`
    }
    document.getElementById('continueButton').style.display = 'none'
    document.getElementById('continueGameButton').style.display = 'none'
    const sourceQuestion = questions[Math.floor(Math.random() * questions.length)]
    const shuffledAnswers = shuffleArray(sourceQuestion.answers.map((text, idx) => ({   //Shuffle answer strings 
        text,
        isCorrect: idx === 0,   //Default correct answer is first in array part of question
    })))
    currentQuestion = {
        //Package data
        question: sourceQuestion.question,
        answers: shuffledAnswers,
    }
    document.getElementById('question').textContent = currentQuestion.question || ''
    resetAnswerButtons()
    currentQuestion.answers.forEach((answer, answerNum) => {
        //Update button elements
        const button = document.getElementById(`answer${answerNum + 1}`)
        button.textContent = answer.text || ''
        button.onclick = () => checkAnswer(answerNum)
    })
}

function checkAnswer(answerNum){
    if (!currentQuestion) return
    //Find user answer
    const selectedAnswer = currentQuestion.answers[answerNum]
    if (!selectedAnswer) return
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`answer${i}`).disabled = true   //Lock buttons
        document.getElementById(`answer${i}`).style.cursor = 'not-allowed'
    }
    if (selectedAnswer.isCorrect) {
        document.getElementById(`answer${answerNum + 1}`).style.backgroundColor = 'lightgreen'
        answerStreak = answerStreak + 1
        if(answerStreak > highestAnswerStreak){highestAnswerStreak = answerStreak}  //Update stats
        if(gameQuestions){
            upgradeQuality += 0.2
            upgradeQuality = parseFloat(upgradeQuality.toFixed(1))  //Floating point error
            document.getElementById('answerStreak').textContent = `Upgrade Multiplier: x${upgradeQuality}`
            document.getElementById('continueButton').style.display = 'inline-block'
        }
        //Correct answer
    }
    else {
        document.getElementById(`answer${answerNum + 1}`).style.backgroundColor = 'salmon'
        const correctAnswerNum = currentQuestion.answers.findIndex(ans => ans.isCorrect)    //Select correct answer and set to green
        document.getElementById(`answer${correctAnswerNum + 1}`).style.backgroundColor = 'lightgreen'   //Sets correct answer to green
        if(!gameQuestions){answerStreak = 0}
        else{
            document.getElementById('answerStreak').textContent = `Final Upgrade Multiplier: x${upgradeQuality}`
            document.getElementById('continueGameButton').style.display = 'inline-block'    //Return to game button
        }
        //Incorrect answer
    }
    if(gameQuestions){
        document.getElementById('answerStreak').textContent = `Upgrade Multiplier: x${upgradeQuality}`
    }
    else{
        //End quiz and display quit/ continue button
        document.getElementById('answerStreak').textContent = `Answer Streak: ${answerStreak}`
        document.getElementById('continueButton').style.display = 'inline-block'
    }
}

function updateStats(){
    // Update tracked stats when div is opened
    document.getElementById('answerStreakStat').textContent = `${highestAnswerStreak}` || ''
    document.getElementById('enemiesDiedStat').textContent = `${highestEnemiesDied}` || ''
}

function selectGadget(gearName, buttonId){
    document.querySelectorAll('#weaponOptions button').forEach((button) => {
        button.setAttribute('selectedButton', String(Number(button.dataset.gadgetIndex) === buttonId))
    })
    selectedGadget = `${gearName}`
    //Update div elements to display choice and info
    document.getElementById('currentGear').textContent = `Gear: ${gearName}` || ''
    const info = {
        Blast: 'High spread buckshot blaster.',
        Cycler: 'Fully automatic with a large ammo pool.',
        Beam: 'Long range piercing projectile cannon.',
        Spark: '6-shot sidearm with fast reload and critical hits.',
    }
    //Display information
    document.getElementById('weaponInfo').textContent = info[gearName] || ''
    document.getElementById('weaponSelectContinue').style.display = "inline-block"        
}

function beginControlBind(control, buttonId) {
    document.querySelectorAll('#controlOptions button').forEach((button) => {
        button.setAttribute('selectedButton', String(Number(button.dataset.controlIndex) === buttonId))
    })
    bindingTarget = control
    document.getElementById('controlStatus').textContent = `Press a key for ${control}.`
}

function resetInputs(){
    //Force keyup events to avoid sticky key behaviour
    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: `${controlBindings.up}` }))
    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: `${controlBindings.left}` }))
    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: `${controlBindings.down}` }))
    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: `${controlBindings.right}` }))
}

const diffNames = [
    "Lemon Squeezer",
    "Tourist",
    "Rookie",
    "Sensei",
    "Give me God of Bananas"
]

let slider = document.getElementById("difficultySlider")

slider.oninput = function() {
    document.getElementById("difficultyOutput").textContent = `${diffNames[slider.value-slider.step]}`  //uPDATE DIFFICULTY OUTPUT
    //document.getElementById("difficultyOutput").textContent = `${diffNames[slider.value/slider.step-0.5]}`
}

websiteGoTo('menu')
selectTrait(traitValue)
document.getElementById("difficultyOutput").textContent = `${diffNames[slider.value-slider.step]}`