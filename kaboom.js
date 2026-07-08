//Import kaboom.js
import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs"

//Get the canvas element
const canvas = document.getElementById('gameCanvas')


//Initialize kaboom with canvas element
kaboom({
    canvas: canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    background: [255, 255, 255],
    font: "arial",
    letterBox: true,
})

loadSprite("ghosty", "https://kaboomjs.com/sprites/ghosty.png")
loadSprite("boss", "https://kaboomjs.com/sprites/gigagantrum.png")        // Load assets
loadSprite("coin", "https://kaboomjs.com/sprites/coin.png")
loadSprite("ammo", "https://kaboomjs.com/sprites/jumpy.png")
loadSprite("blaster", "https://kaboomjs.com/sprites/gun.png")
loadSprite("mark", "https://kaboomjs.com/sprites/mark.png")
loadSprite("dino", "https://kaboomjs.com/sprites/dino.png")
loadSprite("steel", "https://kaboomjs.com/sprites/steel.png")
loadSprite("shotgun", "shotgun.png")
loadSprite("dc", "https://th.bing.com/th/id/OIP.eVtUFzKJT3W0Txa6P05x1wHaLH?w=203&h=304&c=7&r=0&o=7&pid=1.7&rm=3")
loadBean()

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
        tileWidth: 64,
        tileHeight: 64,
        // Define what each symbol means
        tiles: {
            "=": () => [
                sprite("steel"),

                area(),
                body({ isStatic: true }),
                color(138,121,93),
                "tile",
                "object",
            ]
        }
    })

    //spawnWave(1, 3, 5, 2) // spawns 5 enemies 2x as strong for 3 waves every 1 second
    let rounds = [[6, 4, 5, 1.5, false],[5, 2, 3, 2, false],[6, 5, 13, 1.5, false],[1, 1, 1, 1, true],[4, 3, 7, 2, false], [7, 6, 15, 2, false]]      // loop through preset round types. (like BTD6).
    let round = 0

    const enemies = []
    const spawnDist = 500
    let enemiesLeft = -1
    let enemiesDied = 0
    upgradeValue = 0
    let isPaused = false
    let mouseDown = false
    let waiting = false
    coins = 0
    let coinMagForce = 35000
    document.getElementById("coinsCount").textContent = `Coins: ${coins}`
    
    // Code for beam gadget class
    class BeamGadget{
        constructor(beamSpeed, beamColor, beamDamage, magSize, beamsFired, spread, recoilForce, reloadTime, isFullAuto = false, fireRate = 100, penetration = 0) {
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
                    color(this.beamColor),
                    "beam",   // For collision detection
                    "object",
                    { speed: this.beamSpeed, dir: direction, penetration: this.penetration },
                    offscreen({ destroy: true }),   // Save processing power
                ])
                beam.onUpdate(() => {beam.move(beam.dir.scale(this.beamSpeed))})    // Moves in dir by speed every frame
                beam.onCollide("enemy", (enemy) => {
                    spawnDamageNumber(enemy.pos, this.beamDamage)
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
            reloadLabel.text = ``   // Remove mag full message
        }
    }

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
        gadgetGlobal.ammoInMag = gadgetGlobal.magSize
        gadgetGlobal.isReloading = false
        gadgetGlobal.reloadTimer = 0
        ammoLabel.text = `Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`
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

    // amazing gadget class can be used for all gadget archetypes
    // beamSpeed, beamColor, beamDamage, magSize, beamsFired, spread, recoilForce, reloadTime, isFullAuto, fireRate, penetration
    let sparkBlaster = new BeamGadget(1000, rgb(0, 0, 0), 35, 6, 1, 5, 500, 1, false, 100, 1)
    sparkBlasterGlobal = sparkBlaster
    let blastBlaster = new BeamGadget(700, rgb(0, 0, 0), 5, 7, 8, 15, 3000, 2, false, 100, 0)
    blastBlasterGlobal = blastBlaster
    let cyclerBlaster = new BeamGadget(800, rgb(0, 0, 0), 4, 30, 1, 6, 2000, 2.5, true, 70, 3)
    cyclerBlasterGlobal = cyclerBlaster
    let beamBlaster = new BeamGadget(2000, rgb(0, 0, 0), 500, 5, 1, 0, 7000, 3, false, 200, 99)
    beamBlasterGlobal = beamBlaster

    const selectedGadgetName = selectedGadget || "Spark"
    if(selectedGadgetName=="Blast"){gadgetGlobal = blastBlasterGlobal; blasterSprite.use(sprite("shotgun")); blasterSprite.use(scale(0.2)); blasterSprite.use(anchor("center"))}
    if(selectedGadgetName=="Cycler"){gadgetGlobal = cyclerBlasterGlobal}
    if(selectedGadgetName=="Beam"){gadgetGlobal = beamBlasterGlobal}
    if(selectedGadgetName=="Spark"){gadgetGlobal = sparkBlasterGlobal}
    if(!gadgetGlobal){
        gadgetGlobal = sparkBlasterGlobal
        selectedGadget = "Spark"
    }

    // Initialize labels
    const coinsLabel = add([
        text(`Coins: ${coins}`),
        anchor("right"),
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
        text(`Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`),
        anchor("left"),
        pos(0, 0),
        color(0, 0, 0),
    ])
    const healthLabel = add([
        text(`Health: ${player.hp()}`),
        anchor("right"),
        pos(0, 0),
        color(0, 0, 0),
    ])
    const controlsLabel = add([
        text("Click to fire"),
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
    const roundLabel = add([
        text("Round: 1"),
        anchor("left"),
        pos(0, 0),
        color(0, 0, 0),
    ])

    function spawnEnemy(difficulty, makeBoss){
        let x
        let y
        const angle = Math.random() * 360
        x = player.pos.x + Math.cos(angle) * spawnDist
        y = player.pos.y + Math.sin(angle) * spawnDist
        
        let boss = false
        let enemySprite = "ghosty"
        let enemyHealth = (Math.random() * 30 + 10) * difficulty
        let enemySpeed = ((Math.random() * 200) + 50) * difficulty

        if(makeBoss){
            enemySprite = "boss"
            enemyHealth = 1500
            enemySpeed = 500
            boss = true
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
            if(Math.random()<0.1){  // 10% chance of ammo bag
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
                if(round >= rounds.length){
                    go("winScreen")
                }
                else{
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
            }
        })
        return enemy
    }

    function upgrade(){
        if(upgradeValue!=0){
            isPaused = false
            hintLabel.text = ``
            if(upgradeValue==1){player.heal(100), healthLabel.text = `Health: ${player.hp()}`}
            if(upgradeValue==2){gadgetGlobal.beamDamage += Math.floor(gadgetGlobal.beamDamage*0.3)}
            if(upgradeValue==3){gadgetGlobal.magSize += Math.floor(gadgetGlobal.magSize*0.3); ammoLabel.text = `Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.magSize}`}
            if(upgradeValue==4){coinMagForce += 120000}
            if(upgradeValue==5){gadgetGlobal.isFullAuto = true}
            if(upgradeValue==-1){player.use(sprite("mark"))}
            if(upgradeValue==-2){player.use(sprite("ghosty"))}
            if(upgradeValue==-3){player.use(sprite("dino"))}
            if(upgradeValue==-4){player.use(sprite("dc"))}
            upgradeValue=0  // Reset upgrade so does not reapply on click

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
                        spawnWave(rounds[round][0], rounds[round][1], rounds[round][2], rounds[round][3], rounds[round][4])
                        round += 1
                        roundLabel.text = `Round: ${round + 1}`
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
    onUpdate(() => {
        if (gadgetGlobal && gadgetGlobal.updateReload) {
            gadgetGlobal.updateReload(dt())
            if (gadgetGlobal.isReloading) {
                reloadLabel.text = `Reloading... ${gadgetGlobal.reloadTimer.toFixed(1)}s`
            } else if (reloadLabel.text.startsWith("Reloading")) {
                reloadLabel.text = ``
            }
        }
    })
    onKeyPress("e", () => {
        if(gadgetGlobal.reload()){ // If successful
            reloadLabel.text = `Reloading... ${gadgetGlobal.reloadTimer.toFixed(1)}s`
        }
        else if(gadgetGlobal.isReloading){
            reloadLabel.text = `Reloading... ${gadgetGlobal.reloadTimer.toFixed(1)}s`
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
            player.hurt(1)
            healthLabel.text = `Health: ${player.hp()}` // Update health label
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
        blasterSprite.angle = angle
        blasterSprite.pos = player.pos.add(Vec2.fromAngle(angle).scale(30))
    })

    onDestroy("player", () => go("deathScreen", enemiesDied+coins)) // If off screen
    player.on("death", () => {
        destroy(player)
        go("deathScreen", enemiesDied+coins)
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

scene(2, () => {
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

scene(4, () => {
    setGravity(0)
    setBackground(rgb(247, 247, 247))
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
        color(0, 0, 0),
    ])
    const healthLabel = add([
        text(`Health: ${player.hp()}`),
        pos(24, height()-100),
        color(0, 0, 0),
    ])
    const obj = add([
        text("Survive!"),
        pos(center().x-80, 24),
        color(0, 0, 0),
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
    //player.onUpdate(() => {
    //    camPos(player.pos)
    //})
    onDestroy("enemy", () => {
        enemies.push(spawnEnemy())
    })

    onDestroy("player", () => go("deathScreen", score))
    player.on("death", () => {
        destroy(player)
        go("deathScreen", score)
    })
})