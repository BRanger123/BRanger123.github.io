//Import kaboom.js
import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs"

//Get the canvas element
const canvas = document.getElementById('gameCanvas')

let gadgetGlobal
let playerSkin = "bean"
let levelGlobal = -1
let currentDivId = "menu"
let answerStreak = 0
let upgradeValue = 0
let highestAnswerStreak = 0
let highestEnemiesDied = 0
let coins = 0
let sparkBlasterGlobal
let bubbleBlasterGlobal
let rapidBlasterGlobal
let beamBlasterGlobal
let currentQuestion = null
let questions = []

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

function websiteGoTo(divId) {
    document.getElementById(currentDivId).style.display = "none"
    document.getElementById(divId).style.display = "inline-block"
    currentDivId = divId
}

function playLevel(level) {
    levelGlobal = level
    document.getElementById(currentDivId).style.display = 'none'
    document.getElementById('gameWindow').style.display = 'inline-block'
    currentDivId = "gameWindow"
    go("startButton")
}

function selectUpgrade(upgradeString, newUpgradeValue) {
    document.getElementById('chosenUpgrade').textContent = upgradeString || ''
    upgradeValue = newUpgradeValue
    document.getElementById('upgradeContinue').style.display = "inline-block"
}

function purchaseSkin(skinIndex, price, skinName) {
    if (price > coins){
    }
    else{
        coins = coins - price
        upgradeValue = skinIndex
        document.getElementById('coinsCount').textContent = coins || ''
        document.getElementById('currentSkin').textContent = `Skin: ${skinName}` || ''
    }
}

function purchaseGadget(price, gearName) {
    if (price > coins){

    }
    else{
        coins = coins - price
        if(gearName=="Bubble Blaster (20)"){gadgetGlobal = bubbleBlasterGlobal}
        if(gearName=="Rapid Blaster (20)"){gadgetGlobal = rapidBlasterGlobal}
        if(gearName=="Beam Blaster (20)"){gadgetGlobal = beamBlasterGlobal}
        document.getElementById('coinsCount').textContent = coins || ''
        document.getElementById('currentGear').textContent = `Gear: ${gearName}` || ''
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = array[i]
        array[i] = array[j]
        array[j] = temp
    }
    return array
}

function resetAnswerButtons() {
    for (let i = 1; i <= 4; i++) {
        const button = document.getElementById(`answer${i}`)
        button.disabled = false
        button.style.backgroundColor = ''
        button.style.color = ''
    }
}

function startQuestion() {
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

function checkAnswer(answerNum) {
    if (!currentQuestion) return
    const selectedAnswer = currentQuestion.answers[answerNum]
    if (!selectedAnswer) return
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`answer${i}`).disabled = true
    }
    if (selectedAnswer.isCorrect) {
        document.getElementById(`answer${answerNum + 1}`).style.backgroundColor = 'lightgreen'
        answerStreak = answerStreak + 1
        if (answerStreak > highestAnswerStreak) {
            highestAnswerStreak = answerStreak
        }
    } else {
        document.getElementById(`answer${answerNum + 1}`).style.backgroundColor = 'salmon'
        const correctAnswerNum = currentQuestion.answers.findIndex(ans => ans.isCorrect)
        document.getElementById(`answer${correctAnswerNum + 1}`).style.backgroundColor = 'lightgreen'
        answerStreak = 0
    }
    document.getElementById('answerStreak').textContent = `${answerStreak}`
    document.getElementById('continueButton').style.display = 'inline-block'
}

function updateStats() {
    document.getElementById('answerStreakStat').textContent = `${highestAnswerStreak}` || ''
    document.getElementById('enemiesDiedStat').textContent = `${highestEnemiesDied}` || ''
}

function handleUpgradeContinueClick() {
    const continueButton = document.getElementById('upgradeContinue')
    if (continueButton) {
        continueButton.style.display = 'none'
    }
    websiteGoTo('shop')
}

function handleQuestionContinueClick() {
    const continueButton = document.getElementById('continueButton')
    if (continueButton) {
        continueButton.style.display = 'none'
    }
    startQuestion()
}

const bodyElement = document.getElementById('body')
bodyElement.addEventListener('keypress', (event) => {
    const gameIsVisible = document.getElementById('gameWindow').style.display !== 'none'
    if (event.key === 'm') {
        event.preventDefault()
        playLevel(levelGlobal)
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }))
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }))
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }))
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }))
        document.getElementById('gameWindow').style.display = 'none'
        websiteGoTo('menu')
    }
})

bodyElement.addEventListener('keypress', (event) => {
    const gameIsVisible = document.getElementById('gameWindow').style.display !== 'none'
    if (event.key === 'k' && gameIsVisible) {
        event.preventDefault()
        go(levelGlobal)
    }
})

window.websiteGoTo = websiteGoTo
window.playLevel = playLevel
window.selectUpgrade = selectUpgrade
window.purchaseSkin = purchaseSkin
window.purchaseGadget = purchaseGadget
window.startQuestion = startQuestion
window.checkAnswer = checkAnswer
window.updateStats = updateStats
window.handleUpgradeContinueClick = handleUpgradeContinueClick
window.handleQuestionContinueClick = handleQuestionContinueClick

window.addEventListener('DOMContentLoaded', () => {
    websiteGoTo('menu')
})

//Initialize kaboom with canvas element
kaboom({
    canvas: canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    background: [255, 255, 255],
    font: "arial",
})

scene("startButton", () => {
    const btn = add([
        rect(240, 80, { radius: 8 }),
        pos(center()),
        area(),
        scale(1),
        anchor("center"),
        outline(4),
        color(220, 220, 220),
    ])
    btn.add([
        text(`Start`),
        anchor("center"),
        color(0, 0, 0),
    ])
    btn.onHoverUpdate(() => {
        btn.color = rgb(200, 200, 200)
        btn.use(scale(1.1))
        setCursor("pointer")
    })
    btn.onHoverEnd(() => {
        btn.use(scale(1))
        btn.color = rgb(220, 220, 220)
        setCursor("default")
    })
    btn.onClick(() => go(levelGlobal))
    add([
        text("Press M to return to menu"),
        pos(center().x, center().y+100),
        anchor("center"),
        color(0, 0, 0),
    ])
})

scene(1, () => {
    setGravity(1600)
    setCursor("default")
    addLevel([
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "    ========                           =====          ",
        "               ============                           ",
        "                                    ======            ",
        "                                                      ",
        "       ======                                 ====    ",
        "                    =======      =======              ",
        "                                                      ",
        "           =======         =                          ",
        "                                    ===========       ",
        "                         =======                      ",
        "       ======                                         ",
        "                =                                     ",
        "                    =========           ===           ",
        "   =======                                            ",
    ],
    {
        //Define the size of tile block
        tileWidth: 32,
        tileHeight: 32,
        //Define what each symbol means, by a function returning a component list (what will be passed to add())
        tiles: {
            "=": () => [
                rect(32, 32),
                area(),
                body({ isStatic: true }),
                color(130, 180, 180),
                "tile",
            ]
        }
    })
    let score = 0
    const scoreLabel = add([
        text(score),
        pos(24, 24),
        color(0, 0, 0),
    ])
    const obj = add([
        text("Survive!"),
        pos(center().x-80, 24),
        color(0, 0, 0),
    ])
    onUpdate(() => {
        score++
        scoreLabel.text = score
    })
    add([
        pos(-600, 850),
        rect(4000, 40),
        area(),
        body({ isStatic: true }),
        color(0, 0, 0),
        "death"
    ])
    loadBean()
    const player = add([
        sprite("bean"),  //Renders as a sprite
        pos(200, 80),    //Position in world
        area(),          //Has a collider
        body(),          //Responds to physics and gravity
        "player",
        "friendly",
        {
            speed: 300,
        },
    ])
    onKeyPress("space", () => {if (player.isGrounded()) {player.jump()}})
    onKeyDown("a", () => {player.move(-player.speed, 0)})
    onKeyDown("d",() => {player.move(+player.speed, 0)})
    player.onCollide("tile", (tile) => {
        tile.unuse("tile")  // VERY IMPORTANT!!! All tiles with "tile" tag are checked for collision, so now cracked tiles are no longer checked for collision
        tile.use(color(255, 0, 0))
        wait(0.7, () => {
            shake()
            tile.use(body({ isStatic: false }))
            tile.unuse("area")
        })
        wait(1.3, () => {
            tile.destroy()
        })
    })
    player.onCollide("death", () => {
        go("deathScreen", score)
    })
})

scene(2, () => {
    loadSprite("ghosty", "https://kaboomjs.com/sprites/ghosty.png")
    loadSprite("boss", "https://kaboomjs.com/sprites/gigagantrum.png")        // Load assets
    loadSprite("coin", "https://kaboomjs.com/sprites/coin.png")
    loadSprite("ammo", "https://kaboomjs.com/sprites/jumpy.png")
    loadSprite("blaster", "https://kaboomjs.com/sprites/gun.png")
    loadSprite("mark", "https://kaboomjs.com/sprites/mark.png")
    loadSprite("dino", "https://kaboomjs.com/sprites/dino.png")
    loadSprite("dc", "https://th.bing.com/th/id/OIP.eVtUFzKJT3W0Txa6P05x1wHaLH?w=203&h=304&c=7&r=0&o=7&pid=1.7&rm=3")
    loadBean()

    setGravity(0)
    setBackground(rgb(255, 255, 255))
    addLevel([
        "===================================================================================================",
        "=                                                                                                 =",
        "=                                                                                                 =",
        "=                         =                                              =                        =",
        "=                         =                                              =                        =",
        "=                         =                   =                          =                        =",
        "=    ========             =                   =                          =                        =",
        "=                         =                   =                          =                        =",
        "=                                             =                          =                        =",
        "=                                             =                                    ==             =",
        "=                                             =                                     ==            =",
        "=                ==========                   =                                      ==           =",
        "=                                  ==                                                 ==          =",
        "=                                 ==                                                              =",
        "=                                ==                     ==================                        =",
        "=                               ==                                                                =",
        "=                              ==                                                                 =",
        "=                             ==               =              =                                   =",
        "=                                              =              =                                   =",
        "=           ===========                        =              =                ==                 =",
        "=           =                                  =                              ==                  =",
        "=           =                             ======                             ==                   =",
        "=           =                                                               ==                    =",
        "=           =                     =                                        ==                     =",
        "=           =                     =                                       ==                      =",
        "=                                 =                                      ==                       =",
        "=                                                                       ==                        =",
        "=                                                                                                 =",
        "===================================================================================================",
    ],
    {
        // Define the size of tile block
        tileWidth: 50,
        tileHeight: 50,
        // Define what each symbol means
        tiles: {
            "=": () => [
                rect(50, 50),
                area(),
                body({ isStatic: true }),
                color(30, 30, 30),
                "tile",
                "object",
            ]
        }
    })

    //spawnWave(1, 3, 5, 2) // spawns 5 enemies 2x as strong for 3 waves every 1 second
    let rounds = [[6, 4, 5, 1, false],[5, 2, 3, 2, false],[6, 5, 13, 0.5, false],[1, 1, 1, 1, true]]      // loop through preset round types. (like BTD6).
    let round = 0

    function getRoundConfig(roundIndex) {
        const roundConfig = rounds[roundIndex] || rounds[rounds.length - 1]
        return {
            time: roundConfig[0],
            waves: roundConfig[1],
            enemyNum: roundConfig[2],
            difficulty: roundConfig[3],
            makeBoss: roundConfig[4],
        }
    }
    const enemies = []
    const minSpawnDist = 500
    let enemiesLeft = -1
    let enemiesDied = 0
    let isPaused = false
    let mouseDown = false
    let waiting = false
    coins = 0
    let coinMagForce = 35000
    document.getElementById("coinsCount").textContent = `Coins: ${coins}`
    
    // Code for beam gadget class
    class BeamGadget{
        constructor(beamSpeed, beamColor, beamDamage, magSize, beamsFired, spread, recoilForce, totalAmmo, isFullAuto = false, fireRate = 100, penetration = 0) {
            this.beamSpeed = beamSpeed
            this.beamColor = beamColor
            this.beamDamage = beamDamage
            this.magSize = magSize
            this.ammoInMag = magSize  // Current charge in magazine
            this.totalAmmo = totalAmmo  // Total charge reserve
            this.beamsFired = beamsFired // So shotguns can use same code, just increase beams fired (pellets?)
            this.spread = spread
            this.recoilForce = recoilForce  // Force of recoil that pushes player back
            this.isFullAuto = isFullAuto
            this.fireRate = fireRate      // Milliseconds between shots when full auto is enabled
            this.lastFireTime = 0         // Track time between automatic shots rather than dt()
            this.penetration = penetration // Number of enemies a beam can pass through before disappearing
        }
        
        canFire(){
            return this.ammoInMag > 0   // Checks gadget has charge
        }
        reload(){
            if (this.totalAmmo > 0) {
                const ammoToLoad = Math.min(this.magSize, this.totalAmmo)
                this.totalAmmo -= ammoToLoad    // Add charge to magazine and remove from reserve
                this.ammoInMag = ammoToLoad
                return true // Successful reload
            }
            return false    // Unsuccessful reload
        }
        fireWeapon(){
            if(!this.canFire()){
                reloadLabel.text = `Reload! (e)`
                return  // Cannot fire if no charge in gadget
            }
            if(this.isFullAuto){
                const now = Date.now()
                if(now - this.lastFireTime < this.fireRate){    // If enough time has passed: fire
                    return
                }
                this.lastFireTime = now
            }
            shake(0.002*(this.recoilForce*2))
            const baseDir = toWorld(mousePos()).sub(player.pos).unit()  // toWorld() lets func work outside initial map boundaries for camera code
            
            // Apply recoil
            const recoilDir = baseDir.scale(-this.recoilForce)  // Opposite to beam fire direction
            player.recoil = player.recoil.add(recoilDir)
            
            for(let i = 0; i < this.beamsFired; i++){
                const angle = baseDir.angle() + rand(-this.spread, this.spread) // Use spread as max possible random angle deviation
                const direction = Vec2.fromAngle(angle)
                const beam = add([
                    pos(player.pos),    // Use blasterSprite.pos ?///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    rect(8,8),
                    area(),
                    color(this.beamColor),
                    "beam",   // For collision detection
                    "object",
                    { speed: this.beamSpeed, dir: direction, penetration: this.penetration },
                    offscreen({ destroy: true }),   // Saves processing power, may need to be changed if using camera code///////////////////////////////////////////////////////////////////////////
                ])
                beam.onUpdate(() => {beam.move(beam.dir.scale(this.beamSpeed))})    // Moves in dir by speed every frame
                beam.onCollide("enemy", (enemy) => {
                    spawnDamageNumber(enemy.pos, this.beamDamage)
                    //enemy.move(beam.dir.scale(this.beamSpeed))  // Enemy pushed back by factor of beam speed//////////////////////////////////////////////////////////////////////////////////////
                    enemy.hurt(this.beamDamage)
                    if(beam.penetration > 0){
                        beam.penetration--
                    }
                    else{
                        beam.destroy()
                    }
                })
                beam.onCollide("tile", () => {beam.destroy()})
            }
            this.ammoInMag--    // Decrease charge count in magazine
        }
    }

    // amazing gadget class can be used for all gadget archetypes
    // beamSpeed, beamColor, beamDamage, magSize, beamsFired, spread, recoilForce, totalAmmo, isFullAuto, fireRate, penetration
    let sparkBlaster = new BeamGadget(1000, rgb(0, 0, 0), 20, 12, 1, 5, 500, 100, false, 100, 0)
    sparkBlasterGlobal = sparkBlaster
    let bubbleBlaster = new BeamGadget(700, rgb(0, 0, 0), 7, 7, 14, 15, 3000, 100, false, 100, 0)
    bubbleBlasterGlobal = bubbleBlaster
    let rapidBlaster = new BeamGadget(800, rgb(50, 50, 50), 12, 30, 1, 6, 2000, 180, true, 80, 10)  // Globalise all gadgets
    rapidBlasterGlobal = rapidBlaster
    let beamBlaster = new BeamGadget(2000, rgb(0, 0, 0), 999, 5, 1, 0, 7000, 100, false, 200, 99)
    beamBlasterGlobal = beamBlaster

    gadgetGlobal = sparkBlaster   // Assign global gadget initial object
    

    function spawnDamageNumber(position, damage){
        const damageText = add([
            text(`${damage}`),
            pos(position.x+Math.random()*20, position.y+Math.random()*20),  // Rand so numbers do not overlap (shotgun)
            color(255, 0, 0),
            { visabilityStep: 1 },
        ])
        
        damageText.onUpdate(() => {
            damageText.pos.y -= 100 * dt()  // Float upward (backwards coordinates)
            damageText.visabilityStep -= dt()   // Use deltatime() for smooth changes
            damageText.opacity = damageText.visabilityStep
        })
        
        wait(1, () => {
            destroy(damageText)
        })
    }

    function spawnCoin(xy){ // Argument cannot be "pos"
        const coin = add([
            sprite("coin"),
            anchor("center"),
            pos(xy),
            area({ collisionIgnore: ["enemy","ammo"]}),    // Enemies dont get stuck on coins
            body(),
            "coin", // For collision detection with player
            "object",
        ])
        onUpdate(() => {
            if(!isPaused){
                const direction = player.pos.sub(coin.pos).unit()  // Dir to player found
                coin.move(direction.scale(coinMagForce/player.pos.sub(coin.pos).len()))    // Moves to player
            }
        })
    }

    // Player code
    const player = add([
        sprite("bean"),
        pos(center()),
        area(),
        anchor("center"),   // So beams spawn at center
        body(),
        health(100),
        "player",   // For collision detection
        "object",
        { speed: 400, recoil: vec2(0, 0) }, // Recoil 2d vector for fluid recoil
    ])
    
    player.onCollide("coin", (coin) => {
        destroy(coin)
        coins=coins+1
        coinsLabel.text = `Coins: ${coins}`
        document.getElementById("coinsCount").textContent = coins   // Update coins in HTML
    })
    
    player.onCollide("ammo", (ammoBag) => {
        destroy(ammoBag)
        gadgetGlobal.totalAmmo += 50
        ammoLabel.text = `Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.totalAmmo}`
    })

    const blasterSprite = add([
        sprite("blaster"),
        pos(player.pos),
        anchor("left"),   // Close to player
        body(),
        rotate(0),
        area({ collisionIgnore: ["object"],}),
        //scale(0.2) // only for large sprites or could use .use(scale(0.2))
    ])

    // Initialize labels
    const coinsLabel = add([
        text(`Coins: ${coins}`),
        anchor("center"),
        pos(0, 0),
        color(0, 0, 0),
    ])
    const hintLabel = add([
        text(""),
        anchor("center"),
        pos(0, 0),
        color(0, 0, 0),
    ])
    const ammoLabel = add([
        text(`Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.totalAmmo}`),
        anchor("center"),
        pos(0, 0),
        color(0, 0, 0),
    ])
    const healthLabel = add([
        text(`Health: ${player.hp()}`),
        anchor("center"),
        pos(0, 0),
        color(0, 0, 0),
    ])
    const controlsLabel = add([
        text("Click to zap"),
        anchor("center"),
        pos(0, 0),
        color(0, 0, 0),
    ])
    const reloadLabel = add([
        text(""),
        anchor("center"),
        pos(0, 0),
        color(0, 0, 0),
    ])
    const nextWaveTimeLabel = add([
        text(""),
        anchor("center"),
        pos(0, 0),
        color(0, 0, 0),
    ])

    function spawnEnemy(difficulty, makeBoss){
        let x
        let y
        const angle = Math.random() * 360
        x = player.pos.x + Math.cos(angle) * minSpawnDist
        y = player.pos.y + Math.sin(angle) * minSpawnDist
        
        let boss = false
        let enemySprite = "ghosty"
        let enemyHealth = (Math.random() * 30 + 10) * difficulty
        let enemySpeed = ((Math.random() * 200) + 50) * difficulty

        if(makeBoss){
            enemySprite = "boss"
            enemyHealth = 1000
            enemySpeed = 500
            boss = true
        }

        const enemy = add([
            sprite(`${enemySprite}`),
            pos(x, y),
            area({ collisionIgnore: ["tile"]}), 
            body(),
            health(enemyHealth),
            color(Math.random() * 255 + 100, Math.random() * 100 + 100, Math.random() * 100 + 100),
            "enemy",    // For collision detection
            "object",
            { speed: enemySpeed },
        ])

        enemy.on("death", () => {
            if(Math.random()*1 < 0.7){  // 70% chance of explosion
                addKaboom(enemy.pos)
                shake(8)
                if(player.pos.dist(enemy.pos) < 80){    // Player takes damage if too close
                    player.hurt(20)
                }
            }
            spawnCoin(enemy.pos)
            if(Math.random()<0.05){
                const ammoBag = add([
                    sprite("ammo"),
                    anchor("center"),
                    pos(enemy.pos),
                    area({ collisionIgnore: ["enemy"]}),    // Enemies dont get stuck on ammo
                    body(),
                    "ammo", // For collision detection with player
                    "object",
                ])
            }
            destroy(enemy)
            burp()  // Sound effects built into Kaboom library
            enemiesDied++
            if(enemiesDied > highestEnemiesDied){highestEnemiesDied = enemiesDied}
            enemiesLeft = enemiesLeft - 1
            if(enemiesLeft <= 0){
                canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }))
                canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }))  // Reset inputs
                canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }))
                canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }))
                isPaused = true
                destroyAll("beam")
                hintLabel.text = `Click to continue with upgrade`
                websiteGoTo('upgrade')  // Upgrade selection
                onClick(() => upgrade())
            }
        })
        return enemy
    }

    function upgrade(){
        if(upgradeValue!=0){
            isPaused = false
            hintLabel.text = ``
            if(upgradeValue==1){player.heal(100), healthLabel.text = `Health: ${player.hp()}`}
            if(upgradeValue==2){gadgetGlobal.beamDamage += 5}
            if(upgradeValue==3){gadgetGlobal.magSize += 3, gadgetGlobal.totalAmmo += 3}
            if(upgradeValue==4){coinMagForce += 120000}
            if(upgradeValue==5){gadgetGlobal.isFullAuto = true}
            if(upgradeValue==-1){player.use(sprite("mark"))}
            if(upgradeValue==-2){player.use(sprite("ghosty"))}
            if(upgradeValue==-3){player.use(sprite("dino"))}
            if(upgradeValue==-4){player.use(sprite("dc"))}
            upgradeValue=0  // Reset upgrade so does not reapply on click

            let nextWaveTime = 10
            const clock = add([timer()])
            clock.loop(1, () => {
                nextWaveTimeLabel.text = `Time untill next wave: ${nextWaveTime}`
                waiting = true
                nextWaveTime = nextWaveTime - 1
                if(nextWaveTime <= -1){
                    nextWaveTimeLabel.text = ``
                    waiting = false
                    const nextRound = getRoundConfig(round)
                    spawnWave(nextRound.time, nextRound.waves, nextRound.enemyNum, nextRound.difficulty, nextRound.makeBoss)
                    round += 1
                    if(rounds >= 3){go("winScreen")}
                    destroy(clock)
                }
            })
        }
    }

    function spawnWave(time, waves, enemyNum, difficulty, makeBoss){
        let clockLoopCycle = 1
        enemiesLeft = enemyNum*waves
        const clock = add([timer()])
        clock.loop(time, () => {
            if(!isPaused && clockLoopCycle < waves+1){
                for(let i=0; i<enemyNum; i++){
                    enemies.push(spawnEnemy(difficulty, makeBoss))
                }
                clockLoopCycle += 1
            }
        })
    }
    //spawnWave(1, 3, 5, 2, false) // spawns 5 non boss enemies 2x as strong for 3 waves every 1 second
    spawnWave(1, 1, 3, 0.5, false) // Tutorial

    onUpdate(() => {
        for (const enemy of enemies) {
            if (!enemy.exists()) {  // Check if enemy destroyed
                continue
            }
            if(!isPaused){  // if not paused
                const direction = player.pos.sub(enemy.pos).unit()  // Dir to player found
                enemy.move(direction.scale(enemy.speed))    // Moves in dir by speed every frame
            }
        }
    })

    // Player controls
    player.onUpdate(() => {
        if (isPaused){ // Dont move if paused
            return
        }
        const dir = vec2(0, 0)  // Dir because normalised
        if (isKeyDown("a")){dir.x = -1}
        if (isKeyDown("d")){dir.x = 1} // Inputs
        if (isKeyDown("w")){dir.y = -1}
        if (isKeyDown("s")){dir.y = 1}
        const unitVec = dir.unit()  // Vector normalisation (fixes diagonals)
        player.move(unitVec.scale(player.speed))    // Moves in dir by speed every frame

        if (player.recoil && player.recoil.len() > 0){ // If recoil vector exists and is not zero
            const recoilDamping = 15
            const recoilStep = player.recoil.scale(1 - Math.exp(-recoilDamping * dt())) // Make recoil movement smooth
            player.move(recoilStep)
            player.recoil = player.recoil.sub(recoilStep)   // Reduce recoil vector by the amount moved
            if (player.recoil.len() < 1) {  // Round recoil to 0 if small
                player.recoil = vec2(0, 0)  // Reset recoil vector to zero
            }
        }
    })

    onClick(() => {
        coinsLabel.text = `Coins: ${coins}`
        if (isPaused || gadgetGlobal.isFullAuto) {
            return
        }
        gadgetGlobal.fireWeapon()    // Zap once per click for semi-auto gadgets
        ammoLabel.text = `Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.totalAmmo}`
        controlsLabel.text = `` // Click to zap hint hidden
        hintLabel.text = ``
        upgrade()
    })

    onMouseDown(() => {
        if (isPaused || !gadgetGlobal.isFullAuto) {
            return
        }
        mouseDown = true
    })

    onMouseRelease(() => {
        mouseDown = false
    })

    onUpdate(() => {
        if (mouseDown && gadgetGlobal.isFullAuto && !isPaused) {
            gadgetGlobal.fireWeapon()    // Automatic zapping while held down
            ammoLabel.text = `Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.totalAmmo}`
            controlsLabel.text = ``
        }
    })
    onKeyPress("e", () => {
        if (gadgetGlobal.reload()) { // If successful
            reloadLabel.text = `` // Reload hint is hidden
            ammoLabel.text = `Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.totalAmmo}`
        }
    })

    onKeyPress("p", () => {
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }))
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }))  // Reset inputs
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }))
        canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }))
        isPaused = true
        destroyAll("beam")
        hintLabel.text = `Click to continue`
        websiteGoTo('shop')
        onClick(() => {
            isPaused = false
            hintLabel.text = ``
        })
    })

    // Collision with enemy
    onCollideUpdate("player", "enemy", () => {
        if(!isPaused){
            player.hurt(1)
            healthLabel.text = `Health: ${player.hp()}` // Update health label
            shake(8)           
        }
    })

    player.onUpdate(() => {
        // Camera follows point between player and mouse cursor
        const mouseWorldPos = toWorld(mousePos())
        const targetPos = player.pos.add(mouseWorldPos).scale(0.5)
        camPos(targetPos)

        // Make labels stay relative to camera
        toWorld(camPos())   // Set world origin to camPos()
        coinsLabel.pos = camPos().add(vec2(width()/2 - 100, -height()/2 + 24))
        ammoLabel.pos = camPos().add(vec2(-width()/2 + 120, height()/2 - 24))
        healthLabel.pos = camPos().add(vec2(width()/2 - 110, height()/2 - 24))
        hintLabel.pos = camPos().add(vec2(0, -height()/2 + 90))
        controlsLabel.pos = camPos().add(vec2(0, -height()/2 + 60))
        reloadLabel.pos = camPos().add(vec2(0, -height()/2 + 150))
        nextWaveTimeLabel.pos = camPos().add(vec2(0, -height()/2 + 60))
        const diff = mouseWorldPos.sub(player.pos)
        let angle = Math.atan2(diff.y, diff.x)*(180/Math.PI)
        blasterSprite.angle = angle
        blasterSprite.pos = player.pos.add(Vec2.fromAngle(angle).scale(30))
    })

    onDestroy("player", () => go("deathScreen", enemiesDied+coins)) // If off screen
    player.on("death", () => {
        destroy(player)
        go("deathScreen", enemiesDied+coins)
    })
})

scene(3, () => {
    setGravity(1600)
    setCursor("default")
    addLevel([
        "=                                                    =",
        "=                                                    =",
        "=                                                    =",
        "=                                                    =",
        "=                                                    =",
        "=                                                    =",
        "=                                                    =",
        "=                                                    =",
        "=                      =                             =",
        "=                      =                             =",
        "=                      =            =       =        =",
        "=                      =                             =",
        "=                      =                             =",
        "=               ==     =          ==   eee   ==      =",
        "=                      =            =========        =",
        "=                      =                             =",
        "=                                                    =",
        "======================================================",
    ],
    {
        // define the size of tile block
        tileWidth: 32,
        tileHeight: 32,
        // define what each symbol means, by a function returning a component list (what will be passed to add())
        tiles: {
            "=": () => [
                rect(32, 32),
                area(),
                body({ isStatic: true }),
                color(127, 200, 200),
                "tile",
            ],
            "e": () => [
                rect(32, 32),
                area(),
                body({ isStatic: true }),
                color(10, 200, 10),
                "goal",
            ]
        }
    })
    loadBean()
    const player = add([
        sprite("bean"),  //Renders as a sprite
        pos(200, 80),    //Position in world
        area(),          //Has a collider
        body(),          //Responds to physics and gravity
        "player",
        "friendly",
        {
            dir: RIGHT,
            dead: false,
            speed: 300,
        },
    ])
    const controlsLabel = add([
        text("Press e to place blocks"),
        pos(center().x-250, 24),
        color(0, 0, 0),
    ])
    const hintLabel = add([
        text("Press k to restart"),
        pos(width()-450, height()-100),
        color(0, 0, 0),
    ])
    onKeyPress("space", () => {
        if (player.isGrounded()) {
            player.jump()
        }
        if (rand() < 0.05) {
            addKaboom(player.pos)
            if (blocks > 0) {
                for (let i=0; i<10; i++) {
                    add([
                        pos(player.pos.x+50, player.pos.y),
                        rect(32, 32),
                        area(),
                        body({ isStatic: false }),
                        color(255, 100, 0),
                        outline(4),
                    ])
                }
            }
            blocks = 0
            blockLabel.text = `you tripped`
        }
    })
    onKeyDown("a", () => {player.move(-player.speed, 0)})
    onKeyDown("d", () => {player.move(+player.speed, 0)})
    onKeyDown("s", () => {shake()})
    onKeyPress("k", () => go(levelGlobal))    // Overide playLevel() so button level is not started
    let blocks = 5
    const blockLabel = add([
        text(`Blocks: ${blocks}`),
        pos(24, 24),
        color(0, 0, 0),
    ])
    onKeyPress("e", () => {
        if (blocks >0) {
            add([
                pos(player.pos.x+50, player.pos.y),
                rect(32, 32),
                area(),
                body({ isStatic: false }),
                color(255, 100, 0),
                outline(4),
            ])
            blocks -= 1
            blockLabel.text = `Blocks: ${blocks}`
        }
    })
    onCollide("player", "goal", () => {
        go("winScreen")
    })
})


scene("deathScreen", (score) => {
    add([
        text("Press M to return to menu"),
        pos(center()),
        anchor("center"),
        color(255, 0, 0),
    ])
    add([
        text("Press k to reset"),
        pos(center().x, center().y-50),
        anchor("center"),
        color(255, 0, 0),
    ])
    add([
        text("You died..."),
        pos(center().x, center().y-100),
        anchor("center"),
        color(255, 0, 0),
    ])
    const scoreLabel = add([
        text(`Score: ${score || 0}`),       //If the game does not pass a score, the score will be 0 instead of undefined
        pos(24, 24),
        color(0, 0, 0),
    ])
})

scene("winScreen", () => {
    add([
        text("Press M to return to menu"),
        pos(center()),
        anchor("center"),
        color(0, 0, 255),
    ])
    add([
        text("You won!"),
        pos(center().x, center().y-100),
        anchor("center"),
        color(0, 0, 255),
    ])
})