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
        text(`Level ${levelGlobal}`),
        anchor("center"),
        color(0, 0, 0),
    ])
    btn.onHoverUpdate(() => {
        btn.color = rgb(200, 200, 200)
        btn.scale = vec2(1.1)
        setCursor("pointer")
    })
    btn.onHoverEnd(() => {
        btn.scale = vec2(1)
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
    //loadSprite("boss", "https://kaboomjs.com/sprites/gigagantrum.png")        // Load assets
    loadSprite("coin", "https://kaboomjs.com/sprites/coin.png")
    loadSprite("ammo", "https://kaboomjs.com/sprites/jumpy.png")
    /*
    loadSprite("blaster", "https://kaboomjs.com/sprites/gun.png")
        const blasterSprite = add([
        sprite("blaster"),
        pos(player.pos),
        anchor("center"),   // So beams spawn at center
        body(),
    ])
    */
    loadBean()
    setGravity(0)
    setBackground(rgb(255, 255, 255))
    addLevel([
        "===================================================================================================",
        "=                                                                                                 =",
        "=                                                                                                 =",
        "=                                                                        =                        =",
        "=                                                                        =                        =",
        "=                                             =                          =                        =",
        "=                                             =                          =                        =",
        "=                                             =                          =                        =",
        "=                                             =                          =                        =                                                             e",
        "=                                             =                                                   =",
        "=                                             =                                                   =",
        "=                ==========                   =                                                   =",
        "=                                                                                                 =",
        "=                                                                                                 =",
        "=                                                       ==================                        =",
        "=                                                                                                 =",
        "=                                                                                                 =",
        "=                                              =                                                  =",
        "=                                              =                                                  =",
        "=           ===========                        =                               ==                 =",
        "=           =                                  =                              ==                  =",
        "=           =                             ======                             ==                   =",
        "=           =                                                               ==                    =",
        "=           =                                                              ==                     =",
        "=           =                                                             ==                      =",
        "=                                                                        ==                       =",
        "=                                                                       ==                        =",
        "=                                                                                                 =",
        "===================================================================================================",
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
                color(30, 30, 30),
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

    const enemies = []
    const minSpawnDist = 400
    let clockLoopCycle = -1
    let enemiesDied = 0
    let isPaused = false
    let mouseDown = false
    let enemiesToKill = 8
    let enemiesToKillCounter = 0
    coins = 0
    document.getElementById("coinsCount").textContent = `Coins: ${coins}`
    
    // Code for beam gadget class
    class BeamGadget{
        constructor(beamSpeed, beamColor, beamDamage, magSize, beamsFired, spread, recoilForce, totalAmmo, isFullAuto = false, fireRate = 100, penetration = 0) {
            this.beamSpeed = beamSpeed  // Technically used as distance per frame
            this.beamColor = beamColor
            this.beamDamage = beamDamage
            this.magSize = magSize
            this.ammoInMag = magSize  // Current charge in magazine
            this.totalAmmo = totalAmmo  // Total charge reserve
            this.beamsFired = beamsFired // So burst beam gadgets can use same code, just increase beams fired (pellets?)
            this.spread = spread
            this.recoilForce = recoilForce  // Force of recoil that pushes player back
            this.isFullAuto = isFullAuto  // true for rapid beam gadgets
            this.fireRate = fireRate      // Milliseconds between shots when full auto is enabled
            this.lastFireTime = 0         // Track time between automatic shots
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
            if (!this.canFire()){
                hintLabel.text = `Reload! (e)`
                return  // Cannot fire if no charge in gadget
            }
            if (this.isFullAuto) {
                const now = Date.now()
                if (now - this.lastFireTime < this.fireRate) {
                    return
                }
                this.lastFireTime = now
            }
            shake(0.002*(this.recoilForce*2))
            const baseDir = toWorld(mousePos()).sub(player.pos).unit()  // toWorld() lets func work outside initial map boundaries for camera code
            
            // Apply recoil - push player backwards opposite to aim direction
            const recoilDir = baseDir.scale(-this.recoilForce)
            player.recoil = player.recoil.add(recoilDir)
            
            for (let i = 0; i < this.beamsFired; i++){
                const angle = baseDir.angle() + rand(-this.spread, this.spread) // Use spread as max possible random angle deviation
                const direction = Vec2.fromAngle(angle)
                const beam = add([
                    pos(player.pos),
                    rect(8,8),
                    area(),
                    color(this.beamColor),
                    "beam",   // For collision detection
                    { speed: this.beamSpeed, dir: direction, penetration: this.penetration },
                    offscreen({ destroy: true }),   // Saves processing power, may need to be changed if using camera code
                ])
                beam.onUpdate(() => {beam.move(beam.dir.scale(this.beamSpeed))})    // Moves in dir by speed every frame, speed is actually dist per frame
                beam.onCollide("enemy", (enemy) => {
                    spawnDamageNumber(enemy.pos, this.beamDamage)
                    enemy.move(beam.dir.scale(this.beamSpeed))  // Enemy pushed back by factor of beam speed
                    enemy.hurt(this.beamDamage)   // enemy.hurt(this.beamDamage*2)
                    if (beam.penetration > 0) {
                        beam.penetration--
                    } else {
                        beam.destroy()
                    }
                })
                beam.onCollide("tile", () => {
                    beam.destroy()   // Beams destroyed on collision with tiles, can be changed for different gadget types
                })
            }
            this.ammoInMag--    // Decrease charge count in magazine
        }
    }

    // amazing beam gadget class can be used for all gadget archetypes
    // beamSpeed, beamColor, beamDamage, magSize, beamsFired, spread, recoilForce, totalAmmo, isFullAuto, fireRate, penetration
    let sparkBlaster = new BeamGadget(1000, rgb(0, 0, 0), 20, 12, 1, 5, 500, 100, false, 100, 0)
    sparkBlasterGlobal = sparkBlaster
    let bubbleBlaster = new BeamGadget(700, rgb(0, 0, 0), 7, 7, 14, 15, 3000, 100, false, 100, 0)
    bubbleBlasterGlobal = bubbleBlaster
    let rapidBlaster = new BeamGadget(800, rgb(50, 50, 50), 12, 30, 1, 6, 2000, 180, true, 80, 10)
    rapidBlasterGlobal = rapidBlaster
    let beamBlaster = new BeamGadget(2000, rgb(0, 0, 0), 999, 5, 1, 0, 7000, 100, false, 200, 99)
    beamBlasterGlobal = beamBlaster

    gadgetGlobal = sparkBlaster   // Assign global gadget initial object
    

    // Function to spawn floating damage numbers
    function spawnDamageNumber(position, damage){
        const damageText = add([
            text(`${damage}`),
            pos(position.x+Math.random()*20, position.y+Math.random()*20),  // Rand so numbers do not overlap (shotguns)
            color(255, 0, 0),
            { visabilityStep: 1 },
        ])
        
        damageText.onUpdate(() => {
            damageText.pos.y -= 100 * dt()  // Float upward
            damageText.visabilityStep -= dt()   // Use deltatime() for smooth changes
            damageText.opacity = damageText.visabilityStep
        })
        
        wait(1, () => {
            destroy(damageText) // Saves processing power
        })
    }

    function spawnCoin(xy){ // Argument cannot be "pos"
        const coin = add([
            sprite("coin"),
            anchor("center"),
            pos(xy),
            area({ collisionIgnore: ["enemy"]}),    // Enemies dont get stuck on coins
            body(),
            "coin", // For collision detection with player
        ])
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
        { speed: 400, recoil: vec2(0, 0) }, // Recoil 2d vector for fluid recoil
    ])
    
    player.onCollide("coin", (coin) => {
        destroy(coin)
        coins=coins+1
        coinsLabel.text = `Coins: ${coins}`
        document.getElementById("coinsCount").textContent = coins
    })
    
    player.onCollide("ammo", (ammoBag) => {
        destroy(ammoBag)
        gadgetGlobal.totalAmmo += 50
        ammoLabel.text = `Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.totalAmmo}`
    })

        
    onCollide("player", "goal", () => {
        go("winScreen")
    })
    

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

    function spawnEnemy(){
        let x
        let y
        // Pick random angle and spawn at minSpawnDist from player
        const angle = Math.random() * 360
        x = player.pos.x + Math.cos(angle) * minSpawnDist
        y = player.pos.y + Math.sin(angle) * minSpawnDist


        const enemy = add([
            sprite("ghosty"),
            pos(x, y),
            area({ collisionIgnore: ["tile"]}), 
            body(),
            health(Math.random() * 30 + 10),
            color(Math.random() * 255 + 100, Math.random() * 100 + 100, Math.random() * 100 + 100),
            "enemy",    // For collision detection
            { speed: (Math.random() * 200) + 50 },
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
            destroy(enemy)
            burp()  // Sound effects built into Kaboom library
            enemies.push(spawnEnemy())  // Spawn new enemy so threat is constant
            enemiesDied++
            if(enemiesDied > highestEnemiesDied){highestEnemiesDied = enemiesDied}
            enemiesToKillCounter++
            if (enemiesToKillCounter == enemiesToKill){   // Check player gets upgrade 
                canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }))
                canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }))  // Reset inputs
                canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }))
                canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }))
                isPaused = true
                enemiesToKill = enemiesToKill + 5   // Threshold increases by 5
                enemiesToKillCounter = 0    // Reset progress
                destroyAll("beam")
                hintLabel.text = `Click to continue`
                websiteGoTo('upgrade')  // Upgrade selection
                onClick(() => upgrade())
            }
        })
        return enemy
        
    }
    function upgrade(){
        isPaused = false
        hintLabel.text = ``
        if(upgradeValue!=0){
            if(upgradeValue==1){player.heal(100), healthLabel.text = `Health: ${player.hp()}`}
            if(upgradeValue==2){gadgetGlobal.beamDamage += 5}
            if(upgradeValue==3){gadgetGlobal.magSize += 3, gadgetGlobal.totalAmmo += 3}
            if(upgradeValue==4){gadgetGlobal.totalAmmo += 50, `Charge: ${gadgetGlobal.ammoInMag}/${gadgetGlobal.totalAmmo}`}
            if(upgradeValue==5){gadgetGlobal.isFullAuto = true}
            upgradeValue=0  // Reset upgrade so does not reapply on click
        }
    }

    const clock = add([timer()]) // Timer for spawning enemies
    clock.loop(4, () => { // Time value acts as diffuculty
        if(!isPaused){
            if(player.hp()<56){                                 // Player heals 5 every loop to max of 55+5
                player.heal(5)
                healthLabel.text = `Health: ${player.hp()}`
            }
            enemies.push(spawnEnemy())  // Array used for movement handling
            if(Math.random()>0){
                let x
                let y
                // Pick random angle and spawn at minSpawnDist from player
                const angle = Math.random() * 360
                x = player.pos.x + Math.cos(angle) * minSpawnDist
                y = player.pos.y + Math.sin(angle) * minSpawnDist
                const ammoBag = add([
                    sprite("ammo"),
                    anchor("center"),
                    pos(x, y),
                    area({ collisionIgnore: ["enemy"]}),    // Enemies dont get stuck on ammo
                    body(),
                    "ammo", // For collision detection with player
                ])
            }
            clockLoopCycle += 1
        }
    })

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
            hintLabel.text = `` // Reload hint is hidden
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
        hintLabel.pos = camPos().add(vec2(0, -height()/2 + 24))
        controlsLabel.pos = camPos().add(vec2(0, -height()/2 + 60))

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
        text("Press r to restart"),
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
    onKeyPress("r", () => go(levelGlobal))    // Overide playLevel() so button level is not started
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
        text("Press R to reset"),
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