//Import kaboom.js
import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs"

//Get the canvas element
const canvas = document.getElementById('gameCanvas')

//Initialize kaboom with canvas element
kaboom({
    canvas: canvas,
    width: 1900,
    height: 900,
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
        "    ========                           ==             ",
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
        "                             ======                   ",
        "                      =                       ====    ",
        "       =========                       =====          ",
        "                                                      ",
        "                  ====            ========            ",
        "    ====                                              ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
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
        pos(-300, 850),
        rect(2200, 40),
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
    onKeyPress("space", () => {
        if (player.isGrounded()) {
            player.jump()
        }
    })
    onKeyDown("a", () => {
        player.move(-player.speed, 0)
    })
    onKeyDown("d",() => {
        player.move(+player.speed, 0)
    })
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
    addLevel([
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
        "                                                      ",
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
                color(0, 0, 0),
                "tile",
            ]
        }
    })
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
            health(Math.random() * 150 + 20),
            color(Math.random() * 255 + 100, Math.random() * 100 + 100, Math.random() * 100 + 100),
            "enemy",
            { speed: Math.random() * 350 + 50 },
        ])

        enemy.on("death", () => {
            if(Math.random()*1 < 0.2){
                addKaboom(enemy.pos)
                if(player.pos.dist(enemy.pos) < 150){
                    player.hurt(20)
                    shake(8)
                }
            }
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
    onKeyDown("b", () => bullet())
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

scene("deathScreen", (score) => {
    add([
        text("Press M to return to menu"),
        pos(center()),
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