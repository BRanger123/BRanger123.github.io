//Import kaboom.js
import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs"
 
//Get the canvas element
const canvas = document.getElementById('gameCanvas')

//Initialize kaboom with canvas element
kaboom({
    canvas: canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    background: [red, green, blue],
    letterBox: true,    //Prevent resize abuse
})

loadFont("jersey", "customFont.ttf", {})    //Custom font, o means outlined
loadFont("jerseyo", "customFont.ttf", { 
    outline: 4
})

loadRoot("sprites/")    //Find folder

loadSprite("piskel", "piskel.png", {
    //Define cols and rows
    sliceX : 2,
    sliceY : 3,
    anims: {
        idle: { from: 0, to: 1, speed: 4, loop: true },
        run: { from: 2, to: 3, speed: 5, loop: true },      //Identify animation frames
        slide: { from: 4, to: 4, speed: 1, loop: true },
    }
})

//Load sprite textures
loadSprite("ghosty", "ghosty.png")
loadSprite("boss", "gigagantrum.png")
loadSprite("coin", "coin.png")
loadSprite("blaster", "gun.png")
loadSprite("dino", "dino.png")
loadSprite("blast", "blast.png")
loadSprite("beam", "beam.png")
loadSprite("cycler", "cycler.png")
loadSprite("bag", "bag.png")
loadSprite("grass", "spike.png")
loadSprite("rock", "rock.png")
loadSprite("mushroom", "mushroom.png")
loadSprite("spawnMarker", "spawnMarker.png")
loadSprite("beamBullet", "beamBullet.png")
loadSprite("sparkBullet", "sparkBullet.png")
loadSprite("blastBullet", "blastBullet.png")
loadSprite("cyclerBullet", "cyclerBullet.png")
loadSprite("enemyBullet", "enemyBullet.png")
//loadSprite("treasure", "treasure.png")
loadBean()

scene("startButton", () => {
    let textColor = rgb(0, 0, 0)
    setBackground(rgb(red, green, blue))
    const btn = add([
        rect(240, 80, { radius: 8 }),
        pos(center()),
        area(),
        scale(1),       //Must initialise scale component to be used later
        anchor("center"),
        outline(4),
        color(232, 232, 232),
    ])
    btn.add([
        text(`Start`, { 
            font: "jersey",
            size: 50 
        }),
        anchor("center"),
        color(80, 80, 80),
    ])
    btn.onHoverUpdate(() => {
        btn.color = rgb(200, 200, 200)
        btn.use(scale(1.1))
        setCursor("pointer")
    })
    btn.onHoverEnd(() => {
        btn.use(scale(1))
        btn.color = rgb(232, 232, 232)
        setCursor("default")
    })
    btn.onClick(() => go(levelGlobal))
    add([
        text(`Press ${controlBindings.dash} to dash`,{  //Hint controls
            font: "jersey",
            size: 40
        }),
        pos(center().x, center().y + 100),
        anchor("center"),
        color(100, 100, 100)
    ])
})

scene(1, () => {
    let red = 255
    let green = 255
    let blue = 255
    let textColor = rgb(255, 255, 255)
    //if(darkMode){red = 0; green = 0; blue = 0; textColor = rgb(255, 255, 255)}
    //else{red = 255; green = 255; blue = 255; textColor = rgb(255, 255, 255)}
    setBackground(rgb(0, 0, 0))
    setGravity(0)

    //Define map size
    const minX = 0
    const minY = 0
    const maxX = 2400
    const maxY = 1800

    let mapRGB = choose(colors) //Rand color from website.js

    add([
        pos(minX, minY),
        rect(maxX, maxY),
        area({ collisionIgnore: ["object"],}),  //Map colour object
        body({ isStatic: true }),
        color(mapRGB),
        opacity(0.5)
    ])

    for(let i = 0; i<15; i++){
        const grass = add([
            pos(rand(minX + 100, maxX - 100), rand(minY + 100, maxY - 100)),
            sprite("grass"),
            area({ collisionIgnore: ["object"],}),
            body({ isStatic: true }),
            color(mapRGB)
        ])
    }
    
    for(let i = 0; i<10; i++){
        const rock = add([
            pos(rand(minX + 100, maxX - 100), rand(minY + 100, maxY - 100)),
            sprite("rock"),
            area({ collisionIgnore: ["object"],}),
            body({ isStatic: true }),
            color(mapRGB),
        ])
    }

    let round = 0
    let isRoundSpecial = false
    //Calculate added difficulty level
    let diffLevel = Number(document.getElementById('difficultySlider').value)
    diffLevel *= diffLevel  //Make values fall at a greater range
    diffLevel /= 9

    const enemies = []      //Used for movement and attack logic
    const spawnDist = 500
    let enemiesLeft
    let roundComplete = false
    let enemiesDied = 0
    let enemiesDiedCounter = 0
    upgradesToApply = []
    upgradeQuality = 1
    let isPaused = false
    let mouseDown = false
    let waiting = false
    coins = 0
    let coinMagForce = 20000
    let coinMagnetDist = 300
    document.getElementById("coinsCount").textContent = `Coins: ${coins}`
    document.getElementById('chosenUpgrade').textContent = 'No upgrade chosen'
    upgradesPurchased = 0
    const beamSprite = `${selectedGadget.toLowerCase()}Bullet`  //Choose what sprite to use
    
    //Code for beam gadget class
    class BeamGadget{
        constructor(beamSpeed, beamColor, beamDamage, magSize, beamsFired, spread, recoilForce, reloadTime, isFullAuto = false, fireRate = 100, penetration = 0, critChance){
            this.beamSpeed = beamSpeed
            this.beamColor = beamColor
            this.beamDamage = beamDamage
            this.magSize = magSize
            this.ammoInMag = magSize  //Current charge in magazine
            this.reloadTime = reloadTime  //Seconds to reload the weapon
            this.isReloading = false
            this.reloadTimer = 0
            this.beamsFired = beamsFired //So shotguns can use same code, just increase beams fired (pellets?)
            this.spread = spread
            this.recoilForce = recoilForce  //Force of recoil that pushes player back
            this.isFullAuto = isFullAuto
            this.fireRate = fireRate      //Milliseconds between shots when full auto is enabled
            this.lastFireTime = 0         //Track time between automatic shots rather than dt()
            this.penetration = penetration //Number of enemies a beam can pass through before disappearing
            this.critChance = critChance
            this.lifeSteal = 0
        }
        
        canFire(){
            return this.ammoInMag > 0 && !this.isReloading   //Checks gadget has charge and is not reloading
        }
        reload(){
            if(this.isReloading || this.ammoInMag >= this.magSize){
                return false    //Can't reload while already reloading or already full
            }
            this.isReloading = true
            this.reloadTimer = this.reloadTime
            return true
        }
        updateReload(dt){   //Update internal reload timer
            if(!this.isReloading){
                return
            }
            this.reloadTimer -= dt  //Decrease reload timer by time passed
            if(this.reloadTimer <= 0){
                this.isReloading = false
                this.reloadTimer = 0
                this.ammoInMag = this.magSize
            }
        }
        fireWeapon(){
            if(!this.canFire()){
                if(this.ammoInMag <= 0){
                    ammoLabel.text = `Reload (${controlBindings.reload})`
                }
                return false  //Cannot fire if no charge in magazine
            }
            if(this.isFullAuto){
                const now = Date.now()
                if(now - this.lastFireTime < this.fireRate){    //If enough time has passed: fire
                    return false
                }
                this.lastFireTime = now
            }
            shake(0.004*(this.recoilForce))
            const baseDir = toWorld(mousePos()).sub(player.pos).unit()  //toWorld() lets func work outside initial map boundaries for camera code
            
            //Apply recoil
            const recoilDir = baseDir.scale(-this.recoilForce)  //Opposite to beam fire direction
            player.recoil = player.recoil.add(recoilDir)
        
            for(let i = 0; i < this.beamsFired; i++){
                let angle
                if(this.beamsFired != 1){angle = baseDir.angle() + (i*(this.spread/this.beamsFired))-(this.spread/2)}   //Equal spread for shotguns
                else{angle = baseDir.angle() + rand(-this.spread, this.spread)} //Use spread as max possible random angle deviation
                const direction = Vec2.fromAngle(angle)
                const beam = add([
                    pos(player.pos.add(direction.scale(blasterSprite.width))),  //Leave weapon barrel
                    sprite(beamSprite),
                    scale(0.6),
                    rotate(angle),
                    area(),
                    "beam",   //For collision detection
                    "object",
                    { speed: this.beamSpeed, dir: direction, penetration: this.penetration },
                    offscreen({ destroy: true }),   //Save processing power
                ])
                beam.onUpdate(() => {if(!isPaused){beam.move(beam.dir.scale(this.beamSpeed))}})    //Moves in dir by speed every frame
                beam.onCollide("enemy", (enemy) => {
                    if(Math.random() <= this.critChance){       //If critical hit
                        if(this.lifeSteal > 0){healPlayer(this.lifeSteal*3)}
                        enemy.hurt(this.beamDamage*3)
                        if(beam.penetration > 0){beam.penetration--}
                        else{beam.destroy()}
                    }
                    else{
                        if(this.lifeSteal > 0){healPlayer(this.lifeSteal)}
                        spawnText(enemy.pos, this.beamDamage)
                        enemy.hurt(this.beamDamage)
                        if(beam.penetration > 0){beam.penetration--}
                        else{beam.destroy()}
                    }
                    enemy.use(color(rgb(255, 0, 0)))
                    wait(0.2, () => {
                        enemy.use(color(enemy.colorRGB))
                    })
                })
            }
            this.ammoInMag--    //Decrease charge count in magazine
            return true //Success
        }
    }
    
    function spawnText(position, textContent, colour){
        const textObject = add([
            anchor("center"),
            text(textContent, { 
                font: "jerseyo",
                size: 32 
            }),
            pos(position.x+Math.random()*20, position.y+Math.random()*20),  //Rand so numbers do not overlap (shotgun)
            color(colour || textColor),
            { visabilityStep: 1 },
        ])
        textObject.onUpdate(() => {
            textObject.pos.y -= 100 * dt()  //Float upward (backwards coordinates)
            textObject.visabilityStep -= dt()   //Use deltatime() for smooth changes
            textObject.opacity = textObject.visabilityStep
        })
        wait(1, () => {
            destroy(textObject)
        })
    }

    function attackPlayer(damage){
        if(Math.random()*100 < (player.dodge/(player.dodge+50))){   //Diminishing returns
            spawnText(player.pos, "Dodge!")
        }
        else{
            damage *= (1-(player.armor/(player.armor+50)))  //Diminishing returns
            damage = Math.floor(damage)
            player.hurt(damage)
            healthLabel.text = `Health: ${Math.floor(player.hp())}` //Update health label
            shake(damage)
            spawnText(player.pos, `-${damage}`, rgb(255, 0, 0))
            player.use(color(rgb(255, 0, 0)))
            wait(0.2, () => {
                player.use(color(rgb(255, 255, 255)))
            })
        }
    }

    function healPlayer(healValue){
        if(doubleHeal){healValue *= 2}
        if(player.hp() == player.maxHealth){return} //Return if full health
        if(player.maxHealth - player.hp() < healValue){     //If heal > hp missing
            spawnText(player.pos, `+${player.maxHealth - player.hp()}`, rgb(0, 255, 0))
            player.heal(player.maxHealth - player.hp()) //Then heal missing hp, not more
        }
        else{
            spawnText(player.pos, `+${healValue}`, rgb(0, 255, 0))
            player.heal(healValue)
        }
        healthLabel.text = `Health: ${player.hp()}`
        player.use(color(rgb(0, 255, 0)))
        wait(0.2, () => {
            player.use(color(rgb(255, 255, 255)))
        })
    }


    function spawnCoin(xy){ //Argument cannot be "pos"
        const coin = add([
            sprite("coin"),
            anchor("center"),
            pos(xy.x+Math.random()*20, xy.y+Math.random()*20),  //Random variation to avoid stacking
            area({ collisionIgnore: ["enemy","ammo"]}),    //Enemies dont get stuck
            body(),
            "coin", //For collision detection
            "object",
        ])
        onUpdate(() => {
            if(!isPaused && player.pos.dist(coin.pos) < coinMagnetDist){
                const direction = player.pos.sub(coin.pos).unit()  //Dir to player
                coin.move(direction.scale(coinMagForce/player.pos.sub(coin.pos).len()))    //Moves to player
            }
        })
    }

    function spawnTreasure(x, y, difficulty){ //Argument cannot be "pos"
        const treasure = add([
            sprite("treasure"),
            anchor("center"),
            pos(x+Math.random()*20, y+Math.random()*20),
            area({ collisionIgnore: ["enemy","ammo"]}),    //Enemies dont get stuck
            body(),
            "treasure", //For collision detection
            "object",
            { coinsValue: 20*difficulty}    //Scales with diff
        ])
    }

   function spawnMushroom(x, y, difficulty){ //Argument cannot be "pos"
        const mushroom = add([
            sprite("mushroom"),
            anchor("center"),
            pos(x, y),
            area({ collisionIgnore: ["enemy","ammo"]}),    //Enemies dont get stuck
            body(),
            "mushroom", //For collision detection with player
            "object",
            { healValue: 20*difficulty }
        ])
    }

    //Player code
    const player = add([
        //sprite(`${playerSprite}`),
        sprite("piskel"),
        scale(1.2),
        pos(maxX/2, maxY/2),
        area(),
        anchor("center"),   //So beams spawn at center
        body(),
        color(255, 255, 255),
        health(100),
        "player",   //For collision detection
        "object",
        //For easy OOP traits/ trackers below
        { speed: 400, recoil: vec2(0, 0), momentum: vec2(0,0), maxHealth: 100, cooldown: 0, dodge: 0, regenValue: 0, armor: 0, passiveCoin: 0 },
    ])
    let playerAnimation = "idle"
    let facingLeft = false
    player.play(playerAnimation)
    
    player.onCollide("coin", (coin) => {
        destroy(coin)
        if(doubleCoins){coins++}
        coins++
        coinsLabel.text = `Coins: ${coins}`
        document.getElementById("coinsCount").textContent = coins   //Update coins in HTML
    })

    player.onCollide("treasure", (treasure) => {
        destroy(treasure)
        if(doubleCoins){coins += treasure.coinsValue}
        coins += treasure.coinsValue    //Worth more coins
        coinsLabel.text = `Coins: ${coins}`
        document.getElementById("coinsCount").textContent = coins   //Update coins in HTML
    })

    player.onCollide("mushroom", (mushroom) => {
        if(player.hp() >= player.maxHealth){    //If player not missing health
            spawnText(player.pos, "+0", rgb(0, 255, 0))
            player.use(color(rgb(0, 255, 0)))
            wait(0.2, () => {
                player.use(color(rgb(255, 255, 255)))
            })
        }
        healPlayer(Math.floor(mushroom.healValue))
        destroy(mushroom)
    })

    const blasterSprite = add([
        sprite("blaster"),
        pos(player.pos),
        anchor("left"),   //Close to player
        body(),
        rotate(0),
        area({ collisionIgnore: ["object"],}),
        "object"
        //scale(0.2) //only for large sprites or could use .use(scale(0.2))
    ])

    //Constructor below
    //beamSpeed, beamColor, beamDamage, magSize, beamsFired, spread, recoilForce, reloadTime, isFullAuto = false, fireRate = 100, penetration = 0, critChance
    let sparkBlaster = new BeamGadget(1000, rgb(0, 0, 0), 35, 6, 1, 3, 1000, 1, false, 200, 0, 0.5)
    sparkBlasterGlobal = sparkBlaster
    let blastBlaster = new BeamGadget(700, rgb(0, 0, 0), 10, 2, 8, 15, 4000, 1.5, false, 100, 1, 0.15)
    blastBlasterGlobal = blastBlaster
    let cyclerBlaster = new BeamGadget(800, rgb(0, 0, 0), 8, 30, 1, 5, 1000, 2, true, 70, 4, 0.1)
    cyclerBlasterGlobal = cyclerBlaster
    let beamBlaster = new BeamGadget(2000, rgb(0, 0, 0), 100, 5, 1, 0, 5000, 2.5, false, 200, 2, 0.2)
    beamBlasterGlobal = beamBlaster

    //Fit sprites indivisually since they are different sizes
    const selectedGadgetName = selectedGadget || "Spark"
    if(selectedGadgetName=="Blast"){
        gadgetGlobal = blastBlasterGlobal
        blasterSprite.use(sprite("blast"))
        blasterSprite.use(scale(2))
        blasterSprite.use(anchor("center"))
    }
    if(selectedGadgetName=="Cycler"){
        gadgetGlobal = cyclerBlasterGlobal
        blasterSprite.use(sprite("cycler"))
        blasterSprite.use(scale(2))
        blasterSprite.use(anchor("top"))
    }
    if(selectedGadgetName=="Beam"){
        gadgetGlobal = beamBlasterGlobal
        blasterSprite.use(sprite("beam"))
        blasterSprite.use(scale(1.6))
        blasterSprite.use(anchor("center"))
    }
    if(selectedGadgetName=="Spark"){gadgetGlobal = sparkBlasterGlobal}
    if(!gadgetGlobal){
        gadgetGlobal = sparkBlasterGlobal
        selectedGadget = "Spark"
    }

    //Initialize labels
    const coinsLabel = add([
        text(`Coins: ${coins}`, { 
            font: "jerseyo",
            size: 40 
        }),
        anchor("right"),
        pos(0, 0),
        color(textColor),
    ])
    const hintLabel = add([
        text("", { 
            font: "jerseyo",
            size: 32 
        }),
        anchor("center"),
        pos(0, 0),
        color(textColor),
    ])
    const ammoLabel = add([
        text(`${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`, { 
            font: "jerseyo",
            size: 32 
        }),
        anchor("top"),
        pos(0, 0),
        color(textColor),
    ])
    const healthLabel = add([
        text(`Health: ${player.hp()}`, { 
                font: "jerseyo",
                size: 40
            }),
        anchor("left"),
        pos(0, 0),
        color(textColor),
    ])
    const controlsLabel = add([
        text("Click to fire", { 
            font: "jerseyo",
            size: 32 
        }),
        anchor("center"),
        pos(0, 0),
        color(textColor),
    ])
    const roundLabel = add([
        text("", { 
            font: "jerseyo",
            size: 65 
        }),
        anchor("center"),
        pos(0, 0),
        color(textColor),
    ])
    const specialRoundLabel = add([
        text("", { 
            font: "jerseyo",
            size: 40 
        }),
        anchor("center"),
        pos(0, 0),
        color(textColor),
    ])

    function spawnEnemy(difficulty, makeBoss){
        const x = rand(minX + 40, maxX - 40)    //Within map, not on outer walls
        const y = rand(minY + 40, maxY - 40)
        const marker = add([
            pos(x, y), sprite("spawnMarker"), opacity(0.75),
            "spawnMarker",
        ])
        wait(1.25, () => {
            //Check game is still in progress
            if(marker.exists()) destroy(marker)
            if(!isPaused && player.exists() && !roundComplete){createEnemy(x, y, difficulty, makeBoss)}
        })
    }

    function createEnemy(x, y, difficulty, makeBoss){
        //Initial stats scale with diff
        let boss = false
        let enemySprite = "ghosty"
        let enemyHealth = 35 * difficulty
        let enemySpeed = Math.max(150, (150) * difficulty * 0.3)
        let enemyType = "chaser"
        let randColor = rgb(Math.random() * 255 + 100, Math.random() * 100 + 100, Math.random() * 100 + 100)
        let maxAttackCooldown = 2
        let enemyDamage = Math.floor(2 * difficulty)
        let coinsDropped = Math.ceil(0.5*difficulty)

        //Override values
        if(makeBoss){
            enemySprite = "boss"
            enemyHealth = 300 * difficulty
            enemyDamage *= 2.5
            coinsDropped *= 5
            boss = true
        }
        else if(Math.random() < 0.25){
            enemySprite = "bag"
            enemyType = "charger"
            enemySpeed *= 1.2
            enemyHealth *= 1.3
            maxAttackCooldown = 1.5
            enemyDamage *= 1.5
        }
        else if(Math.random() < 0.25){
            enemySprite = "dino"
            enemyType = "shooter"
            enemySpeed *= 0.7
            enemyHealth *= 0.7
            maxAttackCooldown = 3
            enemyDamage *= 2
        }

        const enemy = add([
            sprite(`${enemySprite}`),
            pos(x, y),
            area({ collisionIgnore: ["dash"]}), //Cant hit player when dashing
            anchor("center"),
            body(),
            health(enemyHealth),
            color(randColor),
            "enemy",    //For collision detection
            "object",
            "dash", //Enemies dont collide using player dash tag
            //OOP stat tracking for easy coding later
            { speed: enemySpeed, isBoss: boss, enemyType, attackCooldown: 0.5, maxAttackCooldown, chargeDirection: null, chargeTimer: 0, colorRGB: randColor, enemyDamage, coinsDropped },
        ])

        enemy.on("death", () => {
            enemiesLeft--
            //if(Math.random()*1 < 0.7){  //70% chance of explosion
                addKaboom(enemy.pos)
                shake(8)
                //if(player.pos.dist(enemy.pos) < 80){    //Player takes damage if too close
                //player.hurt(20)
                //}
            //}
            for(let i=0; i<enemy.coinsDropped; i++){spawnCoin(enemy.pos)}
            enemiesDiedCounter++
            destroy(enemy)
            enemiesDied++
            if(enemiesDied > highestEnemiesDied){highestEnemiesDied = enemiesDied}  //Update stats if new highscore
        })
        return enemy
    }

    function endRound(){
        roundComplete = true
        isPaused = true
        //Reset conditions
        destroyAll("beam")
        destroyAll("enemyBeam")
        destroyAll("coin")
        destroyAll("enemy")
        destroyAll("spawnMarker")
        destroyAll("mushroom")
        document.getElementById('upgradePrice').textContent = `Upgrade will cost ${upgradesPurchased*5} coins`
        document.getElementById("coinsCount").textContent = `Coins: ${Math.floor(coins).toFixed(0)}`
        resetInputs()   //Avoid sticky key behaviour
        player.play("idle")
        playerAnimation = "idle"
        isRoundSpecial = false
        doubleCoins = false
        doubleHeal = false
        extraSpeed = false
        doubleEnemies = false
        doubleDifficulty = false
        roundLabel.text = ``
        roundLabel.color = rgb(255, 255, 255)
        specialRoundLabel.text = ``
        controlsLabel.text = `Click to continue with upgrade`
        gameQuestions = true    //If quiz happens, tells website it was caused by game and shoudl return upgradeQuality

        let upgradeStrings = [
            "damage","capacity","speed","penetration","lifeSteal","crit",
            "dodge","health","regen","armor","passiveCoin","coinMagnet"
        ]
        //Hide all upgrades
        for(let i=0; i<upgradeStrings.length; i++){
            document.getElementById(`${upgradeStrings[i]}Upgrade`).style.display = "none"
        }
        let randomUpgrades = []
        let randomUpgradeNum = -1
        while(randomUpgrades.length != 4){  //Find random 4 numbers
            randomUpgradeNum = Math.floor((Math.random()*upgradeStrings.length))
            if(!randomUpgrades.includes(randomUpgradeNum)){randomUpgrades.push(randomUpgradeNum)}   //Only allow new numbers
        }
        //Show the random 4 upgrades
        for(let i=0; i<randomUpgrades.length; i++){
            document.getElementById(`${upgradeStrings[randomUpgrades[i]]}Upgrade`).style.display = "flex"
        }
        if(questionsInGame){startQuestion()}
        else{websiteGoTo('upgrade')}
        onClick(() => prepareStart())
    }

    function prepareStart(){
        if(isPaused){
            isPaused = false
            coinsLabel.text = `Coins: ${coins}`
            controlsLabel.text = ``
            upgrade()
            if(player.hp() != player.maxHealth){healPlayer(player.maxHealth - player.hp())} //Heal if missing hp
            let nextWaveTime = 5
            const clock = add([timer()])
            clock.loop(1, () => {
                if(!isPaused){
                    roundLabel.text = `Time untill next wave: ${nextWaveTime}`
                    waiting = true
                    nextWaveTime = nextWaveTime - 1
                    if(nextWaveTime <= -1){ //If clock cycled completely
                        waiting = false
                        startRound()
                        destroy(clock)
                    }
                }
            })
        }
    }

    function upgrade(){
        //Reads array of upgrade numbers and loops for length of array
        //Remove each upgrade when complete
        let arrayLength = upgradesToApply.length
        for(let i = 0; i<arrayLength; i++){
            let nextUpgrade = upgradesToApply.pop()
            //Find and apply upgrade
            if(nextUpgrade==1){gadgetGlobal.beamDamage += Math.ceil(0.3*upgradeQuality*gadgetGlobal.beamDamage)}
            if(nextUpgrade==2){gadgetGlobal.magSize += Math.ceil(0.3*upgradeQuality*gadgetGlobal.magSize); ammoLbel.text = `${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`}
            if(nextUpgrade==3){player.speed += Math.ceil(0.3*upgradeQuality*player.speed)}
            if(nextUpgrade==4){gadgetGlobal.penetration += Math.floor(1*upgradeQuality)}
            if(nextUpgrade==5){gadgetGlobal.lifeSteal += 1 * upgradeQuality}
            if(nextUpgrade==6){gadgetGlobal.critChance += 0.05*upgradeQuality}
            if(nextUpgrade==7){player.dodge += 10*upgradeQuality}
            if(nextUpgrade==8){player.maxHealth += Math.floor(player.maxHealth*0.25*upgradeQuality)}
            if(nextUpgrade==9){player.regenValue += Math.floor(2*upgradeQuality)}
            if(nextUpgrade==10){player.armor += Math.floor(10*upgradeQuality)}
            if(nextUpgrade==11){player.passiveCoin += Math.floor(5*upgradeQuality)}
            if(upgradeValue==12){coinMagForce += Math.floor(coinMagForce*0.6*upgradeQuality); coinsMagDist += Math.floor(coinMageDist*0.8*upgradeQuality)}
        }
        upgradeQuality = 1
        upgradesToApply = []
    }

    function spawnWave(time, waves, enemyNum, difficulty, bosses){
        //Clocks loops every time argument amount of seconds
        //Bosses spawn first before clock starts
        //Every loop spawn enemies up to enemyNum
        for(let i=0; i<bosses; i++){
            spawnEnemy(difficulty, true)
        }
        const clock = add([timer()])
        clock.loop(time, () => {
            if(roundComplete){destroy(clock)}
            else{
                for(let i=0; i<enemyNum; i++){
                    spawnEnemy(difficulty, false)   //False means not boss
                }
            }
        })
    }

    let doubleCoins = false
    let doubleHeal = false
    let extraSpeed = false
    let doubleEnemies = false
    let doubleDifficulty = false

    //Make functions for each special condition
    function doubleCoinsRound(){roundLabel.color = rgb(255, 191, 0); specialRoundLabel.text = `Double Coins!`; doubleCoins = true}
    function doubleHealRound(){roundLabel.color = rgb(89, 255, 0); specialRoundLabel.text = `Double Healing!`; doubleHeal = true}
    function extraSpeedRound(){roundLabel.color = rgb(0, 234, 255); specialRoundLabel.text = `Extra Speed!`; extraSpeed = true}
    function doubleEnemiesRound(){roundLabel.color = rgb(255, 111, 0); specialRoundLabel.text = `Double Enemies!`; doubleEnemies = true}
    function doubleDifficultyRound(){roundLabel.color = rgb(255, 0, 0); specialRoundLabel.text = `Double Difficulty!`; doubleDifficulty = true}
    
    //If special round, pick random index and run function
    const specialRounds = [
        doubleCoinsRound,
        doubleHealRound,
        extraSpeedRound,
        doubleEnemiesRound,
        doubleDifficultyRound,
    ]

    function startRound(){
        round++
        roundComplete = false
        //Decide round stats
        let enemyNum = Math.floor(2 + round * 1.5)
        let waves = Math.min(5, 1 + Math.floor(round / 3))
        let difficulty = 0.8 + round * 0.4
        difficulty *= diffLevel
        let bosses = Math.floor(round/5)
        //if(true){     //For testing special rounds
        if(Math.random() < 0.075){
            isRoundSpecial = true
            choose(specialRounds)() //Activate random special round function
        }
        if(doubleDifficulty){difficulty *= 2}
        if(doubleEnemies){enemyNum *= 2; bosses *= 2}
        
        enemiesLeft = (waves * enemyNum) + bosses
        spawnWave((round*2)+1, waves, enemyNum, difficulty, bosses)
        //Refresh mushrooms
        for(let i = 0; i<5; i++){
            spawnMushroom(rand(minX + 100, maxX - 100), rand(minY + 100, maxY - 100), difficulty)
        }
        //Clock to track how long round will last
        let roundTimer = (round*2+6) + Math.ceil(1/(diffLevel))
        const roundClock = add([timer()])
        roundClock.loop(1, () => {
            if(!isPaused){
                if(roundComplete){destroy(roundClock)}
                else{
                    roundLabel.text = `Round ${round}: ${roundTimer}s`
                    //Regen health
                    if(player.hp() < player.maxHealth && roundTimer % 2 == 0 && player.regenValue > 0){healPlayer(player.regenValue)}
                    roundTimer--
                    if(roundTimer <= -1){   //If clock done
                        destroy(roundClock)
                        coins += (player.passiveCoin*difficulty)    //Earn coins from upgrade
                        endRound()
                    }
                }
            }
        })
    }
    startRound()

    onUpdate(() => {
        for(const enemy of get("enemy")){   //For each enemy
            if(!enemy.exists()){  //Check if enemy destroyed
                continue
            }
            if(!isPaused){
                //Move enemy either to player with charge, by speed or away if too close
                const direction = player.pos.sub(enemy.pos).unit()
                if(enemy.enemyType === "charger"){
                    if(enemy.chargeTimer <= 0){ //If cooldown over then start new charge
                        enemy.chargeDirection = direction
                        enemy.chargeTimer = 1.5
                    }
                    enemy.move(enemy.chargeDirection.scale(enemy.speed * 1.5))
                    enemy.chargeTimer -= dt()
                }
                else if(enemy.enemyType === "shooter"){
                    const distance = enemy.pos.dist(player.pos)
                    if(distance > 360){enemy.move(direction.scale(enemy.speed))}    //Move to player
                    else if(distance < 240){enemy.move(direction.scale(-enemy.speed))}  //Move away from player
                    if(enemy.attackCooldown <= 0){  //If cooldown over then shoot
                        const projectile = add([
                            pos(enemy.pos), sprite("enemyBullet"), area({ collisionIgnore: ["dash"]}), color(255, 20, 20),
                            "enemyBeam", "object",
                            { speed: 300 , dir: direction },
                            offscreen({ destroy: true }),   //Save memory
                        ])
                        //Move to player by speed attribute value
                        projectile.onUpdate(() => {if(!isPaused){projectile.move(projectile.dir.scale(projectile.speed))}})
                        projectile.onCollide("player", (player) => {
                            attackPlayer(enemy.enemyDamage)
                            destroy(projectile)
                        })
                        enemy.attackCooldown = enemy.maxAttackCooldown
                    }
                }
                else enemy.move(direction.scale(enemy.speed))
            }
            enemy.attackCooldown -= dt()    //Cooldown changes by time passed
        }
    })

    //Player controls
    player.onUpdate(() => {
        if(isPaused){ //Dont move if paused
            return
        }
        const dir = vec2(0, 0)  //Dir because normalised
        if(isKeyDown(controlBindings.left)){dir.x = -1}
        if(isKeyDown(controlBindings.right)){dir.x = 1}
        if(isKeyDown(controlBindings.up)){dir.y = -1}
        if(isKeyDown(controlBindings.down)){dir.y = 1}
        const unitVec = dir.unit()  //Vector normalisation (fixes diagonals)
        if(extraSpeed){player.move(unitVec.scale(player.speed*1.3))}
        player.move(unitVec.scale(player.speed))    //Moves in dir by speed every frame

        //Animation logic
        if(dir.x !== 0 && !player.is("dash")){
            //Change direction to way player is moving
            facingLeft = dir.x < 0
            player.flipX = facingLeft
        }
        let nextAnimation
        if(player.is("dash")){
            //Slide while using dash
            nextAnimation = "slide"
        }
        else if(unitVec.len() > 0){nextAnimation = "run"}   //If moving with wasd then use run
        else{nextAnimation = "idle"}
        if(nextAnimation !== playerAnimation){  //Update animation if new one is set
            player.play(nextAnimation)
            playerAnimation = nextAnimation
        }

        //Player max coordinates (keep within the map)
        player.pos.x = Math.max(0, Math.min(player.pos.x, maxX - 32))
        player.pos.y = Math.max(0, Math.min(player.pos.y, maxY - 32))

        if(player.recoil && player.recoil.len() > 0){ //If recoil vector exists and is not zero
            const recoilDamping = 15
            const recoilStep = player.recoil.scale(1 - Math.exp(-recoilDamping * dt())) //Make recoil movement smooth
            player.move(recoilStep)
            player.recoil = player.recoil.sub(recoilStep)   //Reduce recoil vector by the amount moved
            if(player.recoil.len() < 1){  //Round recoil to 0 if small
                player.recoil = vec2(0, 0)  //Reset recoil vector to zero
            }
        }

        //Use same system for momentum
        if(player.momentum && player.momentum.len() > 0){
            const momentumDamping = 3	//Lower damping for further movement
            const momentumStep = player.momentum.scale(1 - Math.exp(-momentumDamping * dt()))	//Momentum code for separate attribute
            player.move(momentumStep)
            player.momentum = player.momentum.sub(momentumStep)
            if(player.momentum.len() < 1){
                player.momentum = vec2(0, 0)
            }
        }
        if(isRoundSpecial && roundComplete == false){shake(1)}

        player.cooldown -= dt()

    })

    onMousePress("left", () => {
        if(isPaused || gadgetGlobal.isFullAuto){
            return
        }
        if(gadgetGlobal.fireWeapon()){    //Zap once per click for semi-auto gadgets
            ammoLabel.text = `${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`
        }
        controlsLabel.text = `` //Click to zap hint hidden
        hintLabel.text = ``
        upgrade()
    })

    onMouseDown("left", () => {
        if(isPaused || !gadgetGlobal.isFullAuto){
            return
        }
        mouseDown = true
        //if(gadgetGlobal.isReloading){ammoLabel.text = "Reloading!"}
    })

    onMouseRelease(() => {
        mouseDown = false
    })

    /*
    function teleport(xy){player.pos = xy}
    function healAbility(){healPlayer(99999999999999999)}
    function explode(xy){
        for (const enemy of get("enemy")){
            if(enemy.pos.dist(xy) < 100 && enemy.exists()){enemy.hurt(9999999); spawnText(enemy.pos, "Bang!")}
        }
    }*/

    /*onMousePress("right", () => {
        const aimMarker = add([
            pos(toWorld(mousePos())),
            circle(20),
            color(250,250,250),
            opacity(0.5)
        ])
        aimMarker.onUpdate(() => {
            aimMarker.pos = toWorld(mousePos())
        })
        onMouseRelease("right", () => {
            //explode(toWorld(mousePos()))
            destroy(aimMarker)
        })
    })*/

    onUpdate(() => {
        if(mouseDown && gadgetGlobal.isFullAuto && !isPaused){    //Use full auto every frame if true
            if(gadgetGlobal.fireWeapon()){    //Automatic zapping while held down
                ammoLabel.text = `${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`
            }
            controlsLabel.text = ``
        }
    })
    onKeyPress(controlBindings.dash, () => {
        if(!isPaused && player.cooldown <= 0){
            const dashDirection = toWorld(mousePos()).sub(player.pos).unit()    //Mouse dir from player
            player.momentum = player.momentum.add(dashDirection.scale(80*player.speed)) //Add momentum vector scaling with speed
            if(dashDirection.x !== 0){
                //For flipping sprite
                facingLeft = dashDirection.x < 0
                player.flipX = facingLeft
            }
            player.cooldown = 1.5
            player.play("slide")
            playerAnimation = "slide"
            player.use("dash")
            spawnText(player.pos, "Dash")
            //Dash for 0.3 seconds with collision ingore tag
            wait(0.3, () => {
                player.unuse("dash")
            })
        }
    })

    onUpdate(() => {
        if(gadgetGlobal && gadgetGlobal.updateReload){
            gadgetGlobal.updateReload(dt())
            if(gadgetGlobal.isReloading){
                //Update ammo label to show reload timer
                ammoLabel.text = `${gadgetGlobal.reloadTimer.toFixed(1)}s`
            }
            else if(ammoLabel.text.endsWith("s")){
                //If reload done then update ammo label
                ammoLabel.text = `${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`
            }
        }
    })
    onKeyPress(controlBindings.reload, () => {
        if(gadgetGlobal.reload()){ //If successful
            ammoLabel.text = `${gadgetGlobal.reloadTimer.toFixed(1)}s`
            spawnText(player.pos, "Reload")
        }
        else if(gadgetGlobal.isReloading){
            //Cancel reload if press button again
            ammoLabel.text = `${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`
            gadgetGlobal.isReloading = false
            spawnText(player.pos, "Nevermind")
        }
        //else{ammoLabel.text = `Magazine full`}
        ammoLabel.text = `${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`
    })

    onKeyPress("b", () => {
        //Used for testing text and sound output
        spawnText(player.pos, blabber())
        burp()
    })

    //Collision with enemy
    onCollideUpdate("player", "enemy", (player, enemy) => {
        if(enemy.attackCooldown > 0 || enemy.enemyType == "shooter"){
            return
        }
        attackPlayer(enemy.enemyDamage)
        enemy.attackCooldown = 0.5
    })

    player.onUpdate(() => { 
        //Camera follows point between player and mouse cursor
        const mouseWorldPos = toWorld(mousePos())
        const targetPos = player.pos.add(mouseWorldPos).scale(0.5)
        camPos(targetPos)

        //Make labels stay relative to camera
        toWorld(camPos())   //Set world origin to camPos()
        coinsLabel.pos = camPos().add(vec2(width()/2 - 20, height()/2 - 30))
        ammoLabel.pos = toWorld(mousePos().add(vec2(0, 30)))
        healthLabel.pos = camPos().add(vec2(-width()/2 + 20, height()/2 - 30))
        hintLabel.pos = camPos().add(vec2(0, -height()/2 + 90))
        controlsLabel.pos = camPos().add(vec2(0, -height()/2 + 200))
        roundLabel.pos = camPos().add(vec2(0, -height()/2 + 60))
        specialRoundLabel.pos = camPos().add(vec2(0, -height()/2 + 120))
        const diff = mouseWorldPos.sub(player.pos)
        let angle = Math.atan2(diff.y, diff.x)*(180/Math.PI)    //Convert to degrees
        blasterSprite.angle = angle
        blasterSprite.pos = player.pos.add(Vec2.fromAngle(angle).scale(30))
    })

    let deathScreenShown = false
    function showDeathScreen(result){   //Round reached
        if(deathScreenShown){
            return
        }
        deathScreenShown = true
        isPaused = true
        gameQuestions = false

        add([
            rect(width(), height()),
            pos(camPos()),
            anchor("center"),
            color(rgb(0, 0, 0)),
            opacity(0.8),
        ])
        add([
            text(`Round: ${round-1}`, { 
                font: "jerseyo",
                size: 65 
            }),
            anchor("center"),
            pos(camPos().add(vec2(0, -height()/2 + 60))),
            color(textColor),
        ])
        const backBtn = add([
            rect(240, 70, { radius: 8 }),
            pos(camPos()),
            area(),
            scale(1),
            anchor("center"),
            outline(4),
            color(220, 220, 220),
        ])
        backBtn.add([
            text(`Menu`, { 
                font: "jerseyo",
                size: 50 
            }),
            anchor("center"),
            color(255, 255, 255),
        ])
        backBtn.onHoverUpdate(() => {
            backBtn.color = rgb(200, 200, 200)
            backBtn.use(scale(1.1))
            setCursor("pointer")
        })
        backBtn.onHoverEnd(() => {
            backBtn.use(scale(1))
            backBtn.color = rgb(220, 220, 220)
            setCursor("default")
        })
        backBtn.onClick(() => {
            websiteGoTo("menu")
        })

        const resetBtn = add([
            rect(240, 80, { radius: 8 }),
            pos(camPos().x, camPos().y + 100),
            area(),
            scale(1),
            anchor("center"),
            outline(4),
            color(220, 220, 220),
        ])
        resetBtn.add([
            text(`Restart?`, { 
                font: "jerseyo",
                size: 40 
            }),
            anchor("center"),
            color(255, 255, 255),
        ])
        resetBtn.onHoverUpdate(() => {
            resetBtn.color = rgb(200, 200, 200)
            resetBtn.use(scale(1.1))
            setCursor("pointer")
        })
        resetBtn.onHoverEnd(() => {
            resetBtn.use(scale(1))
            resetBtn.color = rgb(220, 220, 220)
            setCursor("default")
        })
        resetBtn.onClick(() => {
            resetInputs()
            if(levelGlobal == 1){
                websiteGoTo('weaponSelect')
            }
            else{
                go(levelGlobal)
            }
        })

        add([
            text("You died...", {
                font: "jersey",
                size: 50,
            }),
            pos(camPos().x, camPos().y - 100),
            anchor("center"),
            color(255, 0, 0),
        ])
    }

    player.on("death", () => {
        destroy(player)
        showDeathScreen({ score: enemiesDied*coins, round: Math.max(1, round - 1) })
    })
})

scene("deathScreen", (result) => {
    gameQuestions = false
    let red = 255
    let green = 255
    let blue = 255
    //Match website theme
    if(darkMode){red = 0; green = 0; blue = 0}
    else{red = 255; green = 255; blue = 255}
    setBackground(rgb(red, green, blue))
    add([
        text("Press M to return to menu", { 
            font: "jersey",
            size: 32 
        }),
        pos(center()),
        anchor("center"),
        color(255, 0, 0),
    ])
    add([
        text("You died...", { 
            font: "jersey",
            size: 50 
        }),
        pos(center().x, center().y-100),
        anchor("center"),
        color(255, 0, 0),
    ])
    const scoreLabel = add([
        text(`Score: ${result?.score || 0}`, { 
            font: "jersey",
            size: 32 
        }),
        pos(24, 24),
        color(0, 0, 0),
    ])
})

scene("winScreen", () => {
    let red = 255
    let green = 255
    let blue = 255
    if(darkMode){red = 0; green = 0; blue = 0}
    else{red = 255; green = 255; blue = 255}
    setBackground(rgb(red, green, blue))
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

scene(2, () => {
    let red = 255
    let green = 255
    let blue = 255
    let textColor = rgb(0, 0, 0)
    //Match theme
    if(darkMode){red = 0; green = 0; blue = 0; textColor = rgb(255, 255, 255)}
    else{red = 255; green = 255; blue = 255; textColor = rgb(0, 0, 0)}
    setBackground(rgb(red, green, blue))
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
        color(textColor),
    ])
    const obj = add([
        text("Survive!"),
        pos(center().x-80, 24),
        color(textColor),
    ])
    onUpdate(() => {
        score++
        scoreLabel.text = score
    })
    //Death condition
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
    //Controls
    onKeyPress("space", () => {if(player.isGrounded()){player.jump()}})
    onKeyDown("a", () => {player.move(-player.speed, 0)})
    onKeyDown("d",() => {player.move(+player.speed, 0)})

    player.onCollide("tile", (tile) => {
        tile.unuse("tile")  //VERY IMPORTANT!!! All tiles with "tile" tag are checked for collision, so now cracked tiles are no longer checked for collision
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

scene(3, () => {
    let red = 255
    let green = 255
    let blue = 255
    let textColor = rgb(0, 0, 0)
    if(darkMode){red = 0; green = 0; blue = 0; textColor = rgb(255, 255, 255)}
    else{red = 255; green = 255; blue = 255; textColor = rgb(0, 0, 0)}
    setBackground(rgb(red, green, blue))
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
        //Define the size of tile block
        tileWidth: 32,
        tileHeight: 32,
        //Define what each symbol means, by a function returning a component list (what will be passed to add())
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
        color(textColor),
    ])
    const hintLabel = add([
        text("Press k to restart"),
        pos(width()-450, height()-100),
        color(textColor),
    ])

    //Controls
    onKeyPress("space", () => {
        if(player.isGrounded()){
            player.jump()
        }
        if(rand() < 0.05){
            addKaboom(player.pos)
            if(blocks > 0){
                for (let i=0; i<10; i++){
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
    onKeyPress("k", () => go(levelGlobal))    //Overide playLevel() so button level is not started
    let blocks = 5
    const blockLabel = add([
        text(`Blocks: ${blocks}`),
        pos(24, 24),
        color(textColor),
    ])
    onKeyPress("e", () => {
        if(blocks >0){
            add([
                pos(player.pos.x+50, player.pos.y),
                rect(32, 32),
                area(),
                body({ isStatic: false }),
                color(255, 100, 0),
                outline(4),
            ])
            blocks -= 1
            blockLabel.text = `Blocks: ${blocks}`   //Update label
        }
    })
    onCollide("player", "goal", () => {
        go("winScreen")
    })
})

scene(4, () => {
    let red = 255
    let green = 255
    let blue = 255
    let textColor = rgb(0, 0, 0)
    if(darkMode){red = 0; green = 0; blue = 0; textColor = rgb(255, 255, 255)}
    else{red = 255; green = 255; blue = 255; textColor = rgb(0, 0, 0)}
    setBackground(rgb(red, green, blue))
    setGravity(0)
    let score = 0

    //Original function for firing bullets
    function bullet(){
        let direction = toWorld(mousePos()).sub(player.pos).unit()  //From player
        const bullet = add([
            pos(player.pos),
            rect(8, 8),
            area(),
            color(0, 0, 0),
            "bullet",
            { speed: 500, dir: direction },
            offscreen({ destroy: true }),
        ])
        bullet.onUpdate(() => {
            bullet.move(bullet.dir.scale(bullet.speed))
        })
        bullet.onCollide("enemy", (enemy) => {
            enemy.hurt(20)
            bullet.destroy()
        })
    }
    
    //Experimental code for weapon class
    class gun{
        constructor(fireRate, bulletSpeed, bulletColor, bulletDamage, magSize, bulletsFired, spread){
            this.fireRate = fireRate
            this.bulletSpeed = bulletSpeed
            this.bulletColor = bulletColor
            this.bulletDamage = bulletDamage
            this.magSize = magSize
            this.bulletsFired = bulletsFired
            this.spread = spread
        }
        fireWeapon(){
            const baseDir = toWorld(mousePos()).sub(player.pos).unit()  //toWorld() lets func work outside initial map boundaries
            for (let i = 0; i < this.bulletsFired; i++){
                //Find angle and add random spread
                const angle = baseDir.angle() + rand(-this.spread, this.spread)
                const direction = Vec2.fromAngle(angle)
                const bullet = add([
                    pos(player.pos),
                    rect(8, 8),
                    area(),
                    color(this.bulletColor),
                    "bullet",   //Collision tag
                    { speed: this.bulletSpeed, dir: direction },
                    offscreen({ destroy: true }),
                ])
                //Move by speed attribute every frame
                bullet.onUpdate(() => {bullet.move(bullet.dir.scale(this.bulletSpeed))})
                bullet.onCollide("enemy", (enemy) => {enemy.hurt(this.bulletDamage), bullet.destroy()})
            }
        }
    }

    //Player code
    loadBean()
    const player = add([
        sprite("bean"),
        pos(center()),
        area(),
        anchor("center"),   //So bullets spawn at center
        body(),
        health(100),
        "player",
        { speed: 400 },
        offscreen({ destroy: true }),   //Keep player in bounds
    ])
    //fireRate, bulletSpeed, bulletColor, bulletDamage, magSize, bulletsFired, spread
    let gunTest = new gun(10, 700, rgb(41, 41, 41), 20, 5, 7, 10)

    const scoreLabel = add([
        text(`Score: ${score}`),
        pos(width()-240, height()-100),
        color(textColor),
    ])
    const healthLabel = add([
        text(`Health: ${player.hp()}`),
        pos(24, height()-100),
        color(textColor),
    ])
    const obj = add([
        text("Survive!"),
        pos(center().x-80, 24),
        color(textColor),
    ])
    
    //Make enemies
    const enemyNum = 7
    const enemies = []
    const minSpawnDist = 300

    function spawnEnemy(){
        let x, y
        let tries = 0

        //Brute force spawn until not close to player
        do{
            //Within map
            x = Math.random() * width()
            y = Math.random() * height()
            tries++
        }while(player && player.exists() && player.pos.dist(vec2(x, y)) < minSpawnDist && tries < 50)

        const enemy = add([
            sprite("bean"),
            pos(x, y),
            area(),
            body(),
            health(Math.random() * 50 + 20),
            color(Math.random() * 255, Math.random() * 255, Math.random() * 255),
            "enemy",
            { speed: Math.random() * 200 + 50 },
        ])

        enemy.on("death", () => {
            destroy(enemy)
        })

        return enemy
    }

    for (let i = 0; i < enemyNum; i++){
        enemies.push(spawnEnemy())
    }

    onUpdate(() => {
        score++
        //Update labels
        scoreLabel.text = `Score: ${score}`
        healthLabel.text = `Health: ${player.hp()}`

        for (const enemy of enemies){
            if(!enemy.exists()){
                continue
            }
            //Enemy movement
            const direction = player.pos.sub(enemy.pos).unit()
            enemy.move(direction.scale(enemy.speed))
        }
    })

    //Player controls
    onKeyDown("w", () => player.move(0, -player.speed))
    onKeyDown("a", () => player.move(-player.speed, 0))
    onKeyDown("s", () => player.move(0, player.speed))
    onKeyDown("d", () => player.move(player.speed, 0))
    onKeyDown("e", () => bullet())
    onKeyPress("k", () => addKaboom(player.pos))
    onClick(() => gunTest.fireWeapon())

    //Collision with enemy
    onCollideUpdate("player", "enemy", () => {
        player.hurt(1)
        shake(8)
    })
    onDestroy("enemy", () => {
        //Always 7 enemies on screen
        enemies.push(spawnEnemy())
    })

    //Player death code
    onDestroy("player", () => go("deathScreen", score))
    player.on("death", () => {
        destroy(player)
        go("deathScreen", score)
    })
})