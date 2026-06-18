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
    loadBean()
    setGravity(0)
    setBackground(rgb(255, 255, 255))

    let enemiesDied = 0
    let isPaused = false
    let enemiesToKill = 10
    let enemiesToKillCounter = 0
    let coins = 0
    
    // Code for weapon class
    class gun{
        constructor(bulletSpeed, bulletColor, bulletDamage, magSize, bulletsFired, spread, recoilForce, totalAmmo) {
            this.bulletSpeed = bulletSpeed  // Technically used as distance per frame
            this.bulletColor = bulletColor
            this.bulletDamage = bulletDamage
            this.magSize = magSize
            this.ammoInMag = magSize  // Current ammo in magazine
            this.totalAmmo = totalAmmo  // Total ammunition magazine (or clip?)
            this.bulletsFired = bulletsFired // So shotguns can use same code, just increase bullets fired (pellets?)
            this.spread = spread
            this.recoilForce = recoilForce  // Force of recoil that pushes player back
        }
        
        canFire(){
            return this.ammoInMag > 0   // Checks weapon is not empty
        }
        reload(){
            if (this.totalAmmo > 0) {
                const ammoToLoad = Math.min(this.magSize, this.totalAmmo)
                this.totalAmmo -= ammoToLoad    // Add bullets to magazine and remove from total
                this.ammoInMag = ammoToLoad
                return true // Successful reload
            }
            return false    // Unsuccessful reload
        }
        fireWeapon(){
            if (!this.canFire()){
                hintLabel.text = `Reload! (e)`
                return  // Cannot fire if no ammo in magazine (or clip?)
            }
            shake(8)
            const baseDir = toWorld(mousePos()).sub(player.pos).unit()  // toWorld() lets func work outside initial map boundaries for camera code
            
            // Apply recoil - push player backwards opposite to aim direction
            const recoilDir = baseDir.scale(-this.recoilForce)
            player.recoil = player.recoil.add(recoilDir)
            
            for (let i = 0; i < this.bulletsFired; i++){
                const angle = baseDir.angle() + rand(-this.spread, this.spread) // Use spread as max possible random angle deviation
                const direction = Vec2.fromAngle(angle)
                const bullet = add([
                    pos(player.pos),
                    rect(8, 8), // circle(5),
                    area(),
                    color(this.bulletColor),
                    "bullet",   // For collision detection
                    { speed: this.bulletSpeed, dir: direction },
                    offscreen({ destroy: true }),   // Saves processing power, may need to be changed if using camera code
                ])
                bullet.onUpdate(() => {bullet.move(bullet.dir.scale(this.bulletSpeed))})    // Moves in dir by speed every frame, speed is actually dist per frame
                bullet.onCollide("enemy", (enemy) => {
                    spawnDamageNumber(enemy.pos, this.bulletDamage)
                    enemy.move(bullet.dir.scale(this.bulletSpeed))  // Enemy pushed back by factor of bulletSpeed
                    enemy.hurt(this.bulletDamage)   // enemy.hurt(this.bulletDamage*2)
                    bullet.destroy()
                })
            }
            this.ammoInMag--    // Decrease ammo count in magazine
        }
    }

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
        anchor("center"),   // So bullets spawn at center
        body(),
        health(100),
        "player",   // For collision detection
        { speed: 400, recoil: vec2(0, 0) }, // Recoil 2d vector for fluid recoil
        offscreen({ destroy: true }),   // Delete if use camera code 
    ])
    
    player.onCollide("coin", (coin) => {
        destroy(coin)
        coins=coins+1
        coinsLabel.text = `Coins: ${coins}`
    })
    
    // bulletSpeed, bulletColor, bulletDamage, magSize, bulletsFired, spread, recoilForce, totalAmmo
    let gunTest = new gun(700, rgb(0, 0, 0), 20, 7, 14, 10, 3000, 100)

    // Initialize labels
    const coinsLabel = add([
        text(`Coins: ${coins}`),
        anchor("right"),
        pos(width()-24, height()-100),
        color(0, 0, 0),
    ])
    const enemiesDiedLabel = add([
        text(`Kills: ${enemiesDied}`),
        anchor("right"),
        pos(width()-24, height()-50),
        color(0, 0, 0),
    ])
    const hintLabel = add([
        text(""),
        anchor("center"),
        pos(center().x, 24),
        color(0, 0, 0),
    ])
    const ammoLabel = add([
        text(`Ammo: ${gunTest.ammoInMag}/${gunTest.totalAmmo}`),
        pos(24, height()-50),
        color(0, 0, 0),
    ])
    const healthLabel = add([
        text(`Health: ${player.hp()}`),
        pos(24, height()-100),
        color(0, 0, 0),
    ])
    const controlsLabel = add([
        text("Click to shoot"),
        pos(center().x-145, 24),
        color(0, 0, 0),
    ])

    const clock = add([timer()]) // Timer for spawning enemies
    
    // Make enemies
    const enemies = []
    const minSpawnDist = 400

    function spawnEnemy(){
        let x, y
        let tries = 0   // Brute force spawning enemies untill dist is minSpawnDist

        do{
            x = Math.random() * width()
            y = Math.random() * height()
            tries++
        }while (player && player.exists() && player.pos.dist(vec2(x, y)) < minSpawnDist && tries < 50)
        /*
        while (player && player.exists() && player.pos.dist(vec2(x, y)) < minSpawnDist && tries < 50){
            x = Math.random() * width()
            y = Math.random() * height()
            tries++
        }
        */

        const enemy = add([
            sprite("ghosty"),
            pos(x, y),
            area(),
            body(),
            health(Math.random() * 100 + 20),
            color(Math.random() * 255 + 100, Math.random() * 100 + 100, Math.random() * 100 + 100),
            "enemy",    // For collision detection
            { speed: (Math.random() * 300) + 50 },
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
            enemiesDiedLabel.text = `Kills: ${enemiesDied}`
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
                destroyAll("bullet")
                hintLabel.text = `Click to continue`
                websiteGoTo('upgrade')  // Upgrade selection
                onClick(() => {
                    if(upgradeValue!=0){
                        isPaused = false
                        hintLabel.text = ``
                        if(upgradeValue==1){player.heal(100), healthLabel.text = `Health: ${player.hp()}`}
                        if(upgradeValue==2){gunTest.bulletDamage += 5}
                        if(upgradeValue==3){gunTest.magSize += 3, gunTest.totalAmmo += 3}
                        if(upgradeValue==4){gunTest.totalAmmo += 50}
                        if(upgradeValue==5){gunTest.recoilForce += 20000}
                        upgradeValue=0  // Reset upgrade so does not reapply on click
                    }
                })
            }
        })
        return enemy
    }

    clock.loop(2.5, () => { // Time value acts as diffuculty
        if(!isPaused){
            if(player.hp()<56){                                 // Player heals 5 every loop to max of 55+5
                player.heal(5)
                healthLabel.text = `Health: ${player.hp()}`
            }
            enemies.push(spawnEnemy())  // Array used for movement handling
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
        gunTest.fireWeapon()    // Shoot
        ammoLabel.text = `Ammo: ${gunTest.ammoInMag}/${gunTest.totalAmmo}`
        controlsLabel.text = `` // Click to shoot hint hidden
    })
    onKeyPress("e", () => {
        if (gunTest.reload()) { // If successful
            hintLabel.text = `` // Reload hint is hidden
            ammoLabel.text = `Ammo: ${gunTest.ammoInMag}/${gunTest.totalAmmo}`
        }
    })

    // Collision with enemy
    onCollideUpdate("player", "enemy", () => {
        if(!isPaused){
            player.hurt(1)
            healthLabel.text = `Health: ${player.hp()}` // Update health label
            shake(8)           
        }
    })
    // Camera code
    // player.onUpdate(() => {
    //     camPos(player.pos)
    // })

    onDestroy("player", () => go("deathScreen", enemiesDied*coins)) // If off screen
    player.on("death", () => {
        destroy(player)
        go("deathScreen", enemiesDied*coins)    // Score = enemiesDied
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