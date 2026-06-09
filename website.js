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
    setGravity(0)
    setBackground(rgb(247, 247, 247))
    let enemiesDied = 0
    let isPaused = false
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
        constructor(bulletSpeed, bulletColor, bulletDamage, magSize, bulletsFired, spread, recoilForce, totalAmmo) {
            this.bulletSpeed = bulletSpeed
            this.bulletColor = bulletColor
            this.bulletDamage = bulletDamage
            this.magSize = magSize
            this.ammoInMag = magSize  // Current ammo in magazine
            this.totalAmmo = totalAmmo  // Total ammunition available (including loaded)
            this.bulletsFired = bulletsFired
            this.spread = spread
            this.recoilForce = recoilForce  // Force of recoil that pushes player back
        }
        
        canFire() {
            return this.ammoInMag > 0
        }
        
        reload() {
            if (this.totalAmmo > 0) {
                const ammoToLoad = Math.min(this.magSize, this.totalAmmo)
                this.totalAmmo -= ammoToLoad
                this.ammoInMag = ammoToLoad
                return true
            }
            return false
        }
        
        fireWeapon(){
            if (!this.canFire()) {
                hintLabel.text = `Reload! (e)`
                return  // Cannot fire if no ammo in magazine
            }
            
            const baseDir = toWorld(mousePos()).sub(player.pos).unit()  // toWorld() lets func work outside initial map boundaries for camera code
            
            // Apply recoil - push player backwards opposite to aim direction
            const recoilDir = baseDir.scale(-this.recoilForce)
            player.move(recoilDir)
            
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
            
            // Decrease ammo count
            this.ammoInMag--
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
    // bulletSpeed, bulletColor, bulletDamage, magSize, bulletsFired, spread, recoilForce, totalAmmo
    let gunTest = new gun(700, rgb(41, 41, 41), 20, 7, 7, 10, 1000, 100)

    const hintLabel = add([
        text(""),
        pos(center().x-175, 24),
        color(0, 0, 0),
    ])
    const ammoLabel = add([
        text(`Ammo: ${gunTest.ammoInMag}/${gunTest.totalAmmo}`),
        pos(24, height()-50),
        color(0, 0, 0),
    ])
    const enemiesDiedLabel = add([
        text(`Kills: ${enemiesDied}`),
        pos(width()-240, height()-50),
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
    const obj = add([
        timer()
    ])
    
    // Make enemies
    const enemies = []
    const minSpawnDist = 400

    function spawnEnemy(){
        let x, y
        let tries = 0

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
            sprite("bean"),
            pos(x, y),
            area(),
            body(),
            health(Math.random() * 100 + 20),
            color(Math.random() * 255 + 100, Math.random() * 100 + 100, Math.random() * 100 + 100),
            "enemy",
            { speed: (Math.random() * 300) + 50 },
        ])

        enemy.on("death", () => {
            if(Math.random()*1 < 0.6){
                addKaboom(enemy.pos)
                shake(8)                                // Shake anyway rather than if player takes damage so game feels more responsive
                if(player.pos.dist(enemy.pos) < 80){
                    player.hurt(20)
                }
            }
            destroy(enemy)
            enemies.push(spawnEnemy())
            enemiesDied++
            enemiesDiedLabel.text = `Kills: ${enemiesDied}`
            if (enemiesDied % 10 == 0){
                canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }))
                canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }))
                canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }))
                canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }))
                isPaused = true
                destroyAll("bullet")
                hintLabel.text = `Click to continue`
                websiteGoTo('upgrade')
                onClick(() => {
                    isPaused = false
                    hintLabel.text = ``
                    if(upgradeValue==1){
                        player.heal(100)
                        healthLabel.text = `Health: ${player.hp()}`
                    }
                    if(upgradeValue==2){
                        gunTest.bulletDamage += 5
                    }
                    if(upgradeValue==3){
                        gunTest.magSize += 3
                        gunTest.totalAmmo += 3
                    }
                    upgradeValue=0
                })
            }
        })
        return enemy
    }
    obj.loop(1.9, () => {
        if(!isPaused){
            if(player.hp()<56){                                 // Player heals 5 every loop to max of 55+5
                player.heal(5)
                healthLabel.text = `Health: ${player.hp()}`
            }
            enemies.push(spawnEnemy())
        }
    })   // Time value acts as diffuculty

    onUpdate(() => {
        healthLabel.text = `Health: ${player.hp()}`
        ammoLabel.text = `Ammo: ${gunTest.ammoInMag}/${gunTest.totalAmmo}`
        for (const enemy of enemies) {
            if (!enemy.exists()) {
                continue
            }
            if(!isPaused){
                const direction = player.pos.sub(enemy.pos).unit()
                enemy.move(direction.scale(enemy.speed))
            }
        }
    })

    // Player controls
    player.onUpdate(() => {
        if (isPaused) {
            return
        }
        const dir = vec2(0, 0)
        if (isKeyDown("a")) {dir.x = -1}
        if (isKeyDown("d")) {dir.x = 1}
        if (isKeyDown("w")) {dir.y = -1}
        if (isKeyDown("s")) {dir.y = 1}
        const unitVec = dir.unit()
        player.move(unitVec.scale(player.speed))
    })
    onClick(() => {
        gunTest.fireWeapon()
        controlsLabel.text = ``
    })
    onKeyPress("e", () => {
        if (gunTest.reload()) {
            hintLabel.text = ``
        }
    })

    // Collision with enemy
    onCollideUpdate("player", "enemy", () => {
        player.hurt(1)
        shake(8)
    })
    //player.onUpdate(() => {
    //    camPos(player.pos)
    //})

    onDestroy("player", () => go("deathScreen", enemiesDied))
    player.on("death", () => {
        destroy(player)
        go("deathScreen", enemiesDied)
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