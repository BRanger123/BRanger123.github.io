//Import kaboom.js
import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs"

//Get the canvas element
const canvas = document.getElementById('gameCanvas')


//Initialize kaboom with canvas element
kaboom({
    canvas: canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    background: [0, 0, 0],              //////////////////////redgreenblue/////////////////////////////////////////////////////////////
    letterBox: true,
})

/*
loadFont("", "customFont.ttf", { 
    outline: 4
})
*/

loadSprite("ghosty", "https://kaboomjs.com/sprites/ghosty.png")
loadSprite("boss", "https://kaboomjs.com/sprites/gigagantrum.png")        // Load assets
loadSprite("coin", "https://kaboomjs.com/sprites/coin.png")
loadSprite("ammo", "ammo.png")
loadSprite("blaster", "https://kaboomjs.com/sprites/gun.png")
loadSprite("mark", "https://kaboomjs.com/sprites/mark.png")
loadSprite("dino", "https://kaboomjs.com/sprites/dino.png")
loadSprite("steel", "https://kaboomjs.com/sprites/steel.png")
loadSprite("blast", "blast.png")
loadSprite("beam", "beam.png")
loadSprite("cycler", "cycler.png")
loadSprite("dc", "https://th.bing.com/th/id/OIP.eVtUFzKJT3W0Txa6P05x1wHaLH?w=203&h=304&c=7&r=0&o=7&pid=1.7&rm=3")
loadSprite("treasure", "https://th.bing.com/th/id/OIP.7TqZRNeJth1vSAPD073pywAAAA?w=96&h=96&c=7&r=0&o=7&pid=1.7&rm=3")
loadBean()

scene("startButton", () => {
    let red = 255
    let green = 255
    let blue = 255
    let textColor = rgb(0, 0, 0)
    if(darkMode){red = 0; green = 0; blue = 0; textColor = rgb(255, 255, 255)}
    else{red = 255; green = 255; blue = 255; textColor = rgb(0, 0, 0)}
    setBackground(rgb(red, green, blue))
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
        text(`Start`, { 
            font: "arial",
            size: 32 
        }),
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
        text("Press M to return to menu", { 
            font: "arial",
            size: 32 
        }),
        pos(center().x, center().y+100),
        anchor("center"),
        color(0, 0, 0),
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

    /*
loadShader("vignette", null, `
    uniform vec2 u_resolution;
    uniform float u_intensity; // Controls overall darkness
    uniform float u_roundness; // Higher values make it more circular

    vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
        // Fetch the base game rendering color
        vec4 baseColor = texture2D(tex, pos);
        
        // Calculate distance of current UV coordinate from the center (0.5, 0.5)
        vec2 uvCenter = uv - vec2(0.5);
        
        // Compute vignette mask strength based on distance from center
        float dist = length(uvCenter);
        float vignette = smoothstep(0.8, u_roundness, dist * u_intensity);
        
        // Multiply original colors by the vignette calculation
        return baseColor * vec4(vec3(vignette), 1.0) * color;
    }
`);
usePostEffect("vignette", {
    "u_resolution": vec2(width(), height()),
    "u_intensity": 1.5,   // Tweak this to increase/decrease edge shadow spread
    "u_roundness": 0.4,   // Tweak this to sharpen or soften the vignette falloff
});
*/

    const minX = 0
    const minY = 0
    const maxX = 1600
    const maxY = 1000

    add([
        pos(minX, minY),
        rect(maxX, maxY),
        area({ collisionIgnore: ["object"],}),
        body({ isStatic: true }),
        color(255, 255, 255),
        opacity(0.5)
    ])

    //spawnWave(1, 3, 5, 2) // spawns 5 enemies 2x as strong for 3 waves every 1 second
    let round = 1

    const enemies = []
    const spawnDist = 500
    let enemiesLeft = -1
    let enemiesDied = 0
    let enemiesDiedCounter = 0
    upgradeValue = 0
    upgradeQuality = 1
    let isPaused = false
    let mouseDown = false
    let waiting = false
    coins = 0
    let coinMagForce = 35000
    document.getElementById("coinsCount").textContent = `Coins: ${coins}`
    
    // Code for beam gadget class
    class BeamGadget{
        constructor(beamSpeed, beamColor, beamDamage, magSize, beamsFired, spread, recoilForce, reloadTime, isFullAuto = false, fireRate = 100, penetration = 0, critChance) {
            this.beamSpeed = beamSpeed
            this.beamColor = beamColor
            this.beamDamage = beamDamage
            this.magSize = magSize
            this.ammoInMag = magSize  // Current charge in magazine
            this.reloadTime = reloadTime  // Seconds to reload the weapon
            this.isReloading = false
            this.reloadTimer = 0
            this.beamsFired = beamsFired // So shotguns can use same code, just increase beams fired (pellets?)
            this.spread = spread
            this.recoilForce = recoilForce  // Force of recoil that pushes player back
            this.isFullAuto = isFullAuto
            this.fireRate = fireRate      // Milliseconds between shots when full auto is enabled
            this.lastFireTime = 0         // Track time between automatic shots rather than dt()
            this.penetration = penetration // Number of enemies a beam can pass through before disappearing
            this.critChance = critChance
        }
        
        canFire(){
            return this.ammoInMag > 0 && !this.isReloading   // Checks gadget has charge and is not reloading
        }
        reload(){
            if (this.isReloading || this.ammoInMag >= this.magSize) {
                return false    // Can't reload while already reloading or already full
            }
            this.isReloading = true
            this.reloadTimer = this.reloadTime
            return true
        }
        updateReload(dt){
            if (!this.isReloading) {
                return
            }
            this.reloadTimer -= dt
            if (this.reloadTimer <= 0) {
                this.isReloading = false
                this.reloadTimer = 0
                this.ammoInMag = this.magSize
            }
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
                    pos(player.pos),
                    rect(8,8),
                    area(),
                    color(0,0,0),
                    "beam",   // For collision detection
                    "object",
                    { speed: this.beamSpeed, dir: direction, penetration: this.penetration },
                    offscreen({ destroy: true }),   // Save processing power
                ])
                beam.onUpdate(() => {beam.move(beam.dir.scale(this.beamSpeed))})    // Moves in dir by speed every frame
                beam.onCollide("enemy", (enemy) => {
                    if(Math.random() <= this.critChance){
                        spawnText(enemy.pos, this.beamDamage, true)
                        enemy.hurt(this.beamDamage*3)
                        if(beam.penetration > 0){
                            beam.penetration--
                        }
                        else{
                            beam.destroy()
                        }
                    }
                    else{
                        spawnText(enemy.pos, this.beamDamage, false)
                        enemy.hurt(this.beamDamage)
                        if(beam.penetration > 0){
                            beam.penetration--
                        }
                        else{
                            beam.destroy()
                        }
                    }
                })
                beam.onCollide("tile", () => {beam.destroy()})
            }
            this.ammoInMag--    // Decrease charge count in magazine
            reloadLabel.text = ``   // Remove mag full message
        }
    }
    
    function spawnText(position, textContent, crit){
        if(crit){
            textContent = "Critical Hit!" 
        }


        const textObject = add([
            anchor("center"),
            text(textContent, { 
                font: "",
                size: 32 
            }),
            pos(position.x+Math.random()*20, position.y+Math.random()*20),  // Rand so numbers do not overlap (shotgun)
            color(textColor),
            { visabilityStep: 1 },
        ])
       
        textObject.onUpdate(() => {
            textObject.pos.y -= 100 * dt()  // Float upward (backwards coordinates)
            textObject.visabilityStep -= dt()   // Use deltatime() for smooth changes
            textObject.opacity = textObject.visabilityStep
        })
       
        wait(1, () => {
            destroy(textObject)
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
        pos(maxX/2, maxY/2),
        area(),
        anchor("center"),   // So beams spawn at center
        body(),
        health(100),
        "player",   // For collision detection
        "object",
        { speed: 400, recoil: vec2(0, 0), momentum: vec2(0,0), maxHealth: 100, dodge: 0 }, // Recoil 2d vector for fluid recoil
    ])
    
    player.onCollide("coin", (coin) => {
        destroy(coin)
        coins=coins+1
        coinsLabel.text = `Coins: ${coins}`
        document.getElementById("coinsCount").textContent = coins   // Update coins in HTML
    })

    const blasterSprite = add([
        sprite("blaster"),
        pos(player.pos),
        anchor("left"),   // Close to player
        body(),
        rotate(0),
        area({ collisionIgnore: ["object"],}),
        "object"
        //scale(0.2) // only for large sprites or could use .use(scale(0.2))
    ])

    // amazing gadget class can be used for all gadget archetypes
    // beamSpeed, beamColor, beamDamage, magSize, beamsFired, spread, recoilForce, reloadTime, isFullAuto = false, fireRate = 100, penetration = 0, critChance
    let sparkBlaster = new BeamGadget(1000, rgb(0, 0, 0), 35, 6, 1, 5, 1000, 1, false, 200, 0, 0.3)
    sparkBlasterGlobal = sparkBlaster
    let blastBlaster = new BeamGadget(700, rgb(0, 0, 0), 10, 2, 8, 15, 8000, 1.5, false, 100, 1, 0.15)
    blastBlasterGlobal = blastBlaster
    let cyclerBlaster = new BeamGadget(800, rgb(0, 0, 0), 5, 30, 1, 6, 3000, 2.5, true, 70, 3, 0.05)
    cyclerBlasterGlobal = cyclerBlaster
    let beamBlaster = new BeamGadget(2000, rgb(0, 0, 0), 500, 5, 1, 0, 9000, 3, false, 200, 99, 0.2)
    beamBlasterGlobal = beamBlaster

    const selectedGadgetName = selectedGadget || "Spark"
    if(selectedGadgetName=="Blast"){
        gadgetGlobal = blastBlasterGlobal
        blasterSprite.use(sprite("blast"))
        blasterSprite.use(scale(0.2))
        blasterSprite.use(anchor("center"))
    }
    if(selectedGadgetName=="Cycler"){
        gadgetGlobal = cyclerBlasterGlobal
        blasterSprite.use(sprite("cycler"))
        blasterSprite.use(scale(0.2))
        blasterSprite.use(anchor("center"))
    }
    if(selectedGadgetName=="Beam"){
        gadgetGlobal = beamBlasterGlobal
        blasterSprite.use(sprite("beam"))
        blasterSprite.use(scale(0.2))
        blasterSprite.use(anchor("center"))
    }
    if(selectedGadgetName=="Spark"){gadgetGlobal = sparkBlasterGlobal}
    if(!gadgetGlobal){
        gadgetGlobal = sparkBlasterGlobal
        selectedGadget = "Spark"
    }

    // Initialize labels
    const coinsLabel = add([
        text(`Coins: ${coins}`, { 
            font: "",
            size: 32 
        }),
        anchor("right"),
        pos(0, 0),
        color(textColor),
    ])
    const hintLabel = add([
        text("", { 
            font: "",
            size: 32 
        }),
        anchor("center"),
        pos(0, 0),
        color(textColor),
    ])
    const ammoLabel = add([
        text(`Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`, { 
            font: "",
            size: 32 
        }),
        anchor("left"),
        pos(0, 0),
        color(textColor),
    ])
    const healthLabel = add([
        text(`Health: ${player.hp()}`, { 
                font: "",
                size: 32
            }),
        anchor("right"),
        pos(0, 0),
        color(textColor),
    ])
    const controlsLabel = add([
        text("Click to fire", { 
            font: "",
            size: 32 
        }),
        anchor("center"),
        pos(0, 0),
        color(textColor),
    ])
    const reloadLabel = add([
        text("", { 
            font: "",
            size: 32 
        }),
        anchor("center"),
        pos(0, 0),
        color(textColor),
    ])
    const nextWaveTimeLabel = add([
        text("", { 
            font: "",
            size: 32 
        }),
        anchor("center"),
        pos(0, 0),
        color(textColor),
    ])
    const roundLabel = add([
        text("Round: 1", { 
            font: "",
            size: 32 
        }),
        anchor("left"),
        pos(0, 0),
        color(textColor),
    ])

    function spawnEnemy(difficulty, makeBoss){
        const x = rand(minX + 40, maxX - 40)
        const y = rand(minY + 40, maxY - 40)
        const marker = add([
            pos(x, y), circle(24), color(255, 0, 0), opacity(0.75),
            outline(4, textColor), "spawnMarker",
        ])
        wait(1.25, () => {
            if (marker.exists()) destroy(marker)
            if (!isPaused && player.exists()) createEnemy(x, y, difficulty, makeBoss)
        })
    }

    function createEnemy(x, y, difficulty, makeBoss){
        let boss = false
        let enemySprite = "ghosty"
        let enemyHealth = (Math.random() * 30 + 10) * difficulty
        let enemySpeed = ((Math.random() * 200) + 50) * difficulty
        let enemyType = "chaser"

        if(makeBoss){
            enemySprite = "boss"
            enemyHealth = 1500
            enemySpeed = 500
            boss = true
        }
        else if(Math.random() < 0.25){
            enemyType = "charger"
            enemySpeed *= 1.4
            enemyHealth *= 1.25
        }
        else if(Math.random() < 0.25){
            enemyType = "shooter"
            enemySpeed *= 0.7
        }

        const enemy = add([
            sprite(`${enemySprite}`),
            pos(x, y),
            area({ collisionIgnore: ["tile"]}),
            anchor("center"),
            body(),
            health(enemyHealth),
            color(Math.random() * 255 + 100, Math.random() * 100 + 100, Math.random() * 100 + 100),
            "enemy",    // For collision detection
            "object",
            { speed: enemySpeed, isBoss: boss, enemyType, attackCooldown: 1.5, chargeDirection: null, chargeTimer: 0 },
        ])

        enemy.on("death", () => {
            if(Math.random()*1 < 0.7){  // 70% chance of explosion
                addKaboom(enemy.pos)
                shake(8)
                if(player.pos.dist(enemy.pos) < 80 && Math.random() >= player.dodge){    // Player takes damage if too close
                    player.hurt(20)
                }
            }
            spawnCoin(enemy.pos)
            enemiesDiedCounter++
            destroy(enemy)
            burp()  // Sound effects built into Kaboom library
            enemiesDied++
            if(enemiesDied > highestEnemiesDied){highestEnemiesDied = enemiesDied}
            enemiesLeft = enemiesLeft - 1
            if(enemiesLeft <= 0){
                {
                    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }))
                    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }))  // Reset inputs
                    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }))
                    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }))
                    isPaused = true
                    destroyAll("beam")
                    hintLabel.text = `Click to continue with upgrade`
                    gameQuestions = true
                    if(questionsInGame){startQuestion()}
                    else{websiteGoTo('upgrade')}
                    onClick(() => upgrade())
                }
            }
        })
        return enemy
    }

    function upgrade(){
        if(upgradeValue!=0){
            isPaused = false
            hintLabel.text = ``
            if(upgradeValue==1){gadgetGlobal.beamDamage += Math.floor(gadgetGlobal.beamDamage*0.3*upgradeQuality)}
            if(upgradeValue==2){gadgetGlobal.magSize += Math.floor(gadgetGlobal.magSize*0.3*upgradeQuality); ammoLabel.text = `Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`}
            if(upgradeValue==3){player.speed += Math.floor(player.speed*0.3*upgradeQuality)}
            if(upgradeValue==4){gadgetGlobal.penetration += Math.floor(1*upgradeQuality)}
            if(upgradeValue==5){player.dodge = Math.min(0.75, player.dodge + 0.05*upgradeQuality)}
            if(upgradeValue==6){gadgetGlobal.critChance += 0.05*upgradeQuality}
            if(upgradeValue==7){coinMagForce += 120000*upgradeQuality}
            if(upgradeValue==8){player.maxHealth += Math.floor(25*upgradeQuality); player.heal(player.maxHealth - player.hp())}
            if(upgradeValue==-1){player.use(sprite("mark"))}
            if(upgradeValue==-2){player.use(sprite("ghosty"))}
            if(upgradeValue==-3){player.use(sprite("dino"))}
            if(upgradeValue==-4){player.use(sprite("dc"))}
            upgradeValue=0  // Reset upgrade so does not reapply on click
            upgradeQuality = 1

            let nextWaveTime = 5
            const clock = add([timer()])
            clock.loop(1, () => {
                if(!isPaused){
                    nextWaveTimeLabel.text = `Time untill next wave: ${nextWaveTime}`
                    waiting = true
                    nextWaveTime = nextWaveTime - 1
                    if(nextWaveTime <= -1){
                        nextWaveTimeLabel.text = ``
                        waiting = false
                        //set player health to 100
                        if(player.hp() < player.maxHealth){
                            player.heal(player.maxHealth - player.hp())
                        }
                        healthLabel.text = `Health: ${player.hp()}`
                        startRound()
                        destroy(clock)
                    }
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
                    spawnEnemy(difficulty, false) //bosses broken rn
                }
                clockLoopCycle += 1
            }
        })
    }
    function startRound(){
        const enemyNum = Math.floor(2 + round * 1.5)
        const waves = Math.min(5, 1 + Math.floor(round / 3))
        const difficulty = 0.5 + round * 0.12
        const makeBoss = round % 5 === 0
        roundLabel.text = `Round: ${round}`
        spawnWave(round*0.75, waves, enemyNum, difficulty, makeBoss)
        round++
    }
    startRound()

    onUpdate(() => {
        for (const enemy of get("enemy")) {
            if (!enemy.exists()) {  // Check if enemy destroyed
                continue
            }
            if(!isPaused){
                const direction = player.pos.sub(enemy.pos).unit()
                if(enemy.enemyType === "charger"){
                    if(enemy.chargeTimer <= 0){
                        enemy.chargeDirection = direction
                        enemy.chargeTimer = 1.5
                    }
                    enemy.move(enemy.chargeDirection.scale(enemy.speed * 1.5))
                    enemy.chargeTimer -= dt()
                }
                else if(enemy.enemyType === "shooter"){
                    const distance = enemy.pos.dist(player.pos)
                    if(distance > 360) enemy.move(direction.scale(enemy.speed))
                    else if(distance < 240) enemy.move(direction.scale(-enemy.speed))
                    enemy.attackCooldown -= dt()
                    if(enemy.attackCooldown <= 0){
                        const projectile = add([
                            pos(enemy.pos), rect(12, 12), area(), color(255, 20, 20),
                            "enemyProjectile", "object",
                            { speed: 260, dir: direction }, offscreen({ destroy: true }),
                        ])
                        projectile.onUpdate(() => projectile.move(projectile.dir.scale(projectile.speed)))
                        projectile.onCollide("player", () => {
                            if(Math.random() >= player.dodge) player.hurt(12)
                            destroy(projectile)
                        })
                        enemy.attackCooldown = 2
                    }
                }
                else enemy.move(direction.scale(enemy.speed))
            }
        }
    })

    // Player controls
    player.onUpdate(() => {
        if (isPaused){ // Dont move if paused
            return
        }
        const dir = vec2(0, 0)  // Dir because normalised
        if (isKeyDown(controlBindings.left)){dir.x = -1}
        if (isKeyDown(controlBindings.right)){dir.x = 1}
        if (isKeyDown(controlBindings.up)){dir.y = -1}
        if (isKeyDown(controlBindings.down)){dir.y = 1}
        const unitVec = dir.unit()  // Vector normalisation (fixes diagonals)
        player.move(unitVec.scale(player.speed))    // Moves in dir by speed every frame
        player.pos.x = Math.max(0, Math.min(player.pos.x, maxX - 32))
        player.pos.y = Math.max(0, Math.min(player.pos.y, maxY - 32))

        if (player.recoil && player.recoil.len() > 0){ // If recoil vector exists and is not zero
            const recoilDamping = 15
            const recoilStep = player.recoil.scale(1 - Math.exp(-recoilDamping * dt())) // Make recoil movement smooth
            player.move(recoilStep)
            player.recoil = player.recoil.sub(recoilStep)   // Reduce recoil vector by the amount moved
            if (player.recoil.len() < 1) {  // Round recoil to 0 if small
                player.recoil = vec2(0, 0)  // Reset recoil vector to zero
            }
        }

        if (player.momentum && player.momentum.len() > 0){
            const momentumDamping = 2	//lower damping for further movement
            const momentumStep = player.momentum.scale(1 - Math.exp(-momentumDamping * dt()))	//momentum code for separate attribute
            player.move(momentumStep)
            player.momentum = player.momentum.sub(momentumStep)
            if (player.momentum.len() < 1) {
                player.momentum = vec2(0, 0)
            }
        }

    })

    onClick(() => {
        coinsLabel.text = `Coins: ${coins}`
        if (isPaused || gadgetGlobal.isFullAuto) {
            return
        }
        gadgetGlobal.fireWeapon()    // Zap once per click for semi-auto gadgets
        ammoLabel.text = `Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`
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
            ammoLabel.text = `Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`
            controlsLabel.text = ``
        }
    })
    onKeyPress(controlBindings.dash, () => {
        player.momentum = player.momentum.add(toWorld(mousePos()).sub(player.pos).unit().scale(35000))
    })

    onUpdate(() => {
        if (gadgetGlobal && gadgetGlobal.updateReload) {
            gadgetGlobal.updateReload(dt())
            if(gadgetGlobal.isReloading){
                reloadLabel.text = `Reloading... ${gadgetGlobal.reloadTimer.toFixed(1)}s`
            }
            else if(reloadLabel.text.startsWith("Reloading")){
                reloadLabel.text = ``
            }
        }
    })
    onKeyPress(controlBindings.reload, () => {
        if(gadgetGlobal.reload()){ // If successful
            reloadLabel.text = `Reloading... ${gadgetGlobal.reloadTimer.toFixed(1)}s`
        }
        else if(gadgetGlobal.isReloading){
            reloadLabel.text = ``
            gadgetGlobal.isReloading = false
        }
        else{
            reloadLabel.text = `Magazine full`
        }
        ammoLabel.text = `Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`
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
            if(Math.random() >= player.dodge) player.hurt(0.5)
            healthLabel.text = `Health: ${Math.floor(player.hp())}` // Update health label
            shake(8)           
        }
    })

    camScale(1)
    camRot(0)
    player.onUpdate(() => {
        // Camera follows point between player and mouse cursor
        const mouseWorldPos = toWorld(mousePos())
        const targetPos = player.pos.add(mouseWorldPos).scale(0.5)
        camPos(targetPos)

        // Make labels stay relative to camera
        toWorld(camPos())   // Set world origin to camPos()
        coinsLabel.pos = camPos().add(vec2(width()/2 - 20, -height()/2 + 24))
        ammoLabel.pos = camPos().add(vec2(-width()/2 + 20, height()/2 - 24))
        healthLabel.pos = camPos().add(vec2(width()/2 - 20, height()/2 - 24))
        hintLabel.pos = camPos().add(vec2(0, -height()/2 + 90))
        controlsLabel.pos = camPos().add(vec2(0, -height()/2 + 60))
        reloadLabel.pos = camPos().add(vec2(0, -height()/2 + 150))
        nextWaveTimeLabel.pos = camPos().add(vec2(0, -height()/2 + 60))
        roundLabel.pos = camPos().add(vec2(-width()/2 + 20, -height()/2 + 24))
        const diff = mouseWorldPos.sub(player.pos)
        let angle = Math.atan2(diff.y, diff.x)*(180/Math.PI)
        if(selectedGadgetName=="Beam"){
            angle += 15     // Beam png is rotated in src
        }
        blasterSprite.angle = angle
        blasterSprite.pos = player.pos.add(Vec2.fromAngle(angle).scale(30))
    })

    onDestroy("player", () => go("deathScreen", { score: enemiesDied*coins, round: Math.max(1, round - 1) })) // If off screen
    player.on("death", () => {
        destroy(player)
        go("deathScreen", { score: enemiesDied*coins, round: Math.max(1, round - 1) })
    })
})

scene("deathScreen", (result) => {
    let red = 255
    let green = 255
    let blue = 255
    if(darkMode){red = 0; green = 0; blue = 0}
    else{red = 255; green = 255; blue = 255}
    setBackground(rgb(red, green, blue))
    add([
        text("Press M to return to menu", { 
            font: "arial",
            size: 32 
        }),
        pos(center()),
        anchor("center"),
        color(255, 0, 0),
    ])
    add([
        text("Press k to reset", { 
            font: "arial",
            size: 32 
        }),
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
        text(`Score: ${result?.score || 0}`, { 
            font: "arial",
            size: 32 
        }),
        pos(24, 24),
        color(0, 0, 0),
    ])
    add([
        text(`Round reached: ${result?.round || 1}`, { 
            font: "arial",
            size: 32 
        }),
        pos(24, 58),
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
        color(textColor),
    ])
    const hintLabel = add([
        text("Press k to restart"),
        pos(width()-450, height()-100),
        color(textColor),
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
        color(textColor),
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
    function bullet() {
        let direction = toWorld(mousePos()).sub(player.pos).unit()
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
    
    // Experimental code for weapon class
    class gun{
        constructor(fireRate, bulletSpeed, bulletColor, bulletDamage, magSize, bulletsFired, spread) {  // ADD RECOIL
            this.fireRate = fireRate
            this.bulletSpeed = bulletSpeed
            this.bulletColor = bulletColor
            this.bulletDamage = bulletDamage
            this.magSize = magSize
            this.bulletsFired = bulletsFired
            this.spread = spread
        }
        fireWeapon(){
            const baseDir = toWorld(mousePos()).sub(player.pos).unit()  // toWorld() lets func work outside initial map boundaries
            for (let i = 0; i < this.bulletsFired; i++) {
                const angle = baseDir.angle() + rand(-this.spread, this.spread)
                const direction = Vec2.fromAngle(angle)
                const bullet = add([
                    pos(player.pos),
                    rect(8, 8),
                    area(),
                    color(this.bulletColor),
                    "bullet",
                    { speed: this.bulletSpeed, dir: direction },
                    offscreen({ destroy: true }),
                ])
                bullet.onUpdate(() => {bullet.move(bullet.dir.scale(this.bulletSpeed))})
                bullet.onCollide("enemy", (enemy) => {enemy.hurt(this.bulletDamage), bullet.destroy()})
            }
        }
    }

    // Player code
    loadBean()
    const player = add([
        sprite("bean"),
        pos(center()),
        area(),
        anchor("center"),   // So bullets spawn at center
        body(),
        health(100),
        "player",
        { speed: 400 },
        offscreen({ destroy: true }),
    ])
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
    
    // Make enemies
    const enemyNum = 7
    const enemies = []
    const minSpawnDist = 300

    function spawnEnemy() {
        let x, y
        let tries = 0

        do {
            x = Math.random() * width()
            y = Math.random() * height()
            tries++
        } while (player && player.exists() && player.pos.dist(vec2(x, y)) < minSpawnDist && tries < 50)

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

    for (let i = 0; i < enemyNum; i++) {
        enemies.push(spawnEnemy())
    }

    onUpdate(() => {
        score++
        scoreLabel.text = `Score: ${score}`
        healthLabel.text = `Health: ${player.hp()}`

        for (const enemy of enemies) {
            if (!enemy.exists()) {
                continue
            }
            const direction = player.pos.sub(enemy.pos).unit()
            enemy.move(direction.scale(enemy.speed))
        }
    })

    // Player controls
    onKeyDown("w", () => player.move(0, -player.speed))
    onKeyDown("a", () => player.move(-player.speed, 0))
    onKeyDown("s", () => player.move(0, player.speed))
    onKeyDown("d", () => player.move(player.speed, 0))
    onKeyDown("e", () => bullet())
    onKeyPress("k", () => addKaboom(player.pos))
    onClick(() => gunTest.fireWeapon())

    // Collision with enemy
    onCollideUpdate("player", "enemy", () => {
        player.hurt(1)
        shake(8)
    })
    onDestroy("enemy", () => {
        enemies.push(spawnEnemy())
    })

    onDestroy("player", () => go("deathScreen", score))
    player.on("death", () => {
        destroy(player)
        go("deathScreen", score)
    })
})