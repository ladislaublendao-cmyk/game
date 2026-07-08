import Phaser from 'phaser'
import { EventBus } from '../EventBus.js'

// ── Habilidades do jogador ────────────────────────────────────────────────────
// ESPAÇO → Flame Jet  (Flame_jet anim  + Charge.png projétil)    10 MP  cooldown 700ms
// Q      → Fireball   (Attack_2 anim   + Fireball.png projétil)  25 MP  cooldown 1400ms
// E      → Melee      (Attack_1 anim   + hit em área ~120px)     15 MP  cooldown 800ms

export class MainScene extends Phaser.Scene {
  constructor() { super({ key: 'MainScene' }) }

  // ── PRELOAD ─────────────────────────────────────────────────────────────────
  preload() {
    for (let i = 1; i <= 7; i++) {
      this.load.image(`layer${i}`, `/cenario/PNG/1_game_background/layers/${i}.png`)
    }

    // ── Fire Wizard ──
    // Idle 896x128 7f | Run 1024x128 8f | Walk 768x128 6f | Jump 1152x128 9f
    this.load.spritesheet('idle',      '/Player/Fire Wizard/Idle.png',     { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('run',       '/Player/Fire Wizard/Run.png',      { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('jump',      '/Player/Fire Wizard/Jump.png',     { frameWidth: 128, frameHeight: 128 })
    // Habilidade ESPAÇO: Flame_jet 1792x128 14f → dispara Charge 768x64 (frameW:128 frameH:64) 6f
    this.load.spritesheet('flame_jet', '/Player/Fire Wizard/Flame_jet.png',{ frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('charge',    '/Player/Fire Wizard/Charge.png',   { frameWidth: 128, frameHeight: 64  }) // ← FIX: frameH=64
    // Habilidade Q: Attack_2 512x128 4f → dispara Fireball 1024x128 8f
    this.load.spritesheet('fw_attack2','/Player/Fire Wizard/Attack_2.png', { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('fireball',  '/Player/Fire Wizard/Fireball.png', { frameWidth: 128, frameHeight: 128 })
    // Habilidade E: Attack_1 512x128 4f → melee corpo-a-corpo
    this.load.spritesheet('fw_attack1','/Player/Fire Wizard/Attack_1.png', { frameWidth: 128, frameHeight: 128 })
    // Dano / Morte
    this.load.spritesheet('fw_hurt',   '/Player/Fire Wizard/Hurt.png',     { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('fw_dead',   '/Player/Fire Wizard/Dead.png',     { frameWidth: 128, frameHeight: 128 })

    // ── Wanderer Magician ──
    this.load.spritesheet('w_idle',   '/Player/Wanderer Magican/Idle.png',         { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('w_run',    '/Player/Wanderer Magican/Run.png',          { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('w_jump',   '/Player/Wanderer Magican/Jump.png',         { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('w_hurt',   '/Player/Wanderer Magican/Hurt.png',         { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('w_dead',   '/Player/Wanderer Magican/Dead.png',         { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('w_attack', '/Player/Wanderer Magican/Attack_1.png',     { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('w_sphere', '/Player/Wanderer Magican/Magic_sphere.png', { frameWidth: 128, frameHeight: 128 })

    // ── Lightning Mage ──
    this.load.spritesheet('lm_idle',    '/Player/Lightning Mage/Idle.png',      { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('lm_run',     '/Player/Lightning Mage/Run.png',       { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('lm_jump',    '/Player/Lightning Mage/Jump.png',      { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('lm_hurt',    '/Player/Lightning Mage/Hurt.png',      { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('lm_dead',    '/Player/Lightning Mage/Dead.png',      { frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('lm_attack',  '/Player/Lightning Mage/Attack_1.png',  { frameWidth: 128, frameHeight: 128 }) // ranged
    this.load.spritesheet('lm_attack2', '/Player/Lightning Mage/Attack_2.png',  { frameWidth: 128, frameHeight: 128 }) // melee
    this.load.spritesheet('lm_ball',    '/Player/Lightning Mage/Light_ball.png',{ frameWidth: 128, frameHeight: 128 })
    this.load.spritesheet('lm_charge',  '/Player/Lightning Mage/Charge.png',    { frameWidth: 128, frameHeight: 64  }) // projétil: 640x64, 5 frames
  }

  // ── CREATE ──────────────────────────────────────────────────────────────────
  create() {
    const W = 800, H = 600

    // Estado
    this.playerHealth = 100
    this.playerMana   = 100
    this.score        = 0
    this.gameState    = 'playing'
    this.isAttacking  = false
    this.isHurt       = false
    this.bgLayers     = []

    this.playerClass = 'fire' // 'fire', 'lightning', 'wanderer'
    this.animKeys = {
      fire: { 
        idle: 'idle_anim', run: 'run_anim', jump: 'jump_anim',
        hurt: 'fw_hurt_anim', shield: 'fw_shield_anim',
        attackW: 'flamejet_anim', attackQ: 'attack2_anim', attackE: 'attack1_anim',
        projTex: 'charge', projAnim: 'charge_anim'
      },
      lightning: { 
        idle: 'lm_idle_anim', run: 'lm_run_anim', jump: 'lm_jump_anim',
        hurt: 'lm_hurt_anim', shield: 'lm_hurt_anim',
        attackW: 'lm_attack2_anim', attackQ: 'lm_ball_anim', attackE: 'lm_attack2_anim',
        projTex: 'lm_charge', projAnim: 'lm_charge_anim'
      },
      wanderer: { 
        idle: 'w_idle_anim', run: 'w_run_anim', jump: 'w_jump_anim',
        hurt: 'w_hurt_anim', shield: 'w_hurt_anim',
        attackW: 'w_attack_anim', attackQ: 'w_attack_anim', attackE: 'w_attack_anim',
        projTex: 'w_sphere', projAnim: 'w_sphere_anim'
      }
    }

    // Cooldowns das habilidades (timestamp)
    this.cdFlameJet = 0
    this.cdFireball = 0
    this.cdMelee    = 0
    this.cdShield   = 0
    this.shieldActive = false

    // Parallax (7 layers, 1920x1080 → tileScale 600/1080)
    const tileScale = 600 / 1080
    const speeds = [0, 0.02, 0.04, 0.07, 0.11, 0.16, 0.24, 0.38]
    for (let i = 1; i <= 7; i++) {
      const l = this.add.tileSprite(0, 0, W, H, `layer${i}`)
        .setOrigin(0, 0).setTileScale(tileScale, tileScale)
      this.bgLayers.push({ sprite: l, speed: speeds[i] })
    }

    // Chão
    this.platforms = this.physics.add.staticGroup()
    this.platforms.add(this.add.rectangle(W / 2, H - 18, W, 36, 0x000000, 0))

    // Jogador
    this.player = this.physics.add.sprite(120, 450, 'idle')
    this.player.setBounce(0.1).setCollideWorldBounds(true)
    this.player.body.setSize(40, 60).setOffset(44, 68)
    this.player.isAlive = true
    this.physics.add.collider(this.player, this.platforms)

    // Grupos
    this.fireballs        = this.physics.add.group()
    this.enemyProjectiles = this.physics.add.group()
    this.enemiesGroup     = this.physics.add.group()
    this.physics.add.collider(this.enemiesGroup, this.platforms)
    this.physics.add.overlap(this.fireballs,        this.enemiesGroup, this.onFireballHitEnemy,    null, this)
    this.physics.add.overlap(this.enemyProjectiles, this.player,       this.onProjectileHitPlayer, null, this)

    // ── Animações Fire Wizard ──
    this.anims.create({ key: 'idle_anim',     frames: this.anims.generateFrameNumbers('idle',       { start:0, end:6  }), frameRate: 8,  repeat:-1 })
    this.anims.create({ key: 'run_anim',      frames: this.anims.generateFrameNumbers('run',        { start:0, end:7  }), frameRate: 12, repeat:-1 })
    this.anims.create({ key: 'jump_anim',     frames: this.anims.generateFrameNumbers('jump',       { start:0, end:8  }), frameRate: 10, repeat: 0 })
    // ESPAÇO — Flame Jet
    this.anims.create({ key: 'flamejet_anim', frames: this.anims.generateFrameNumbers('flame_jet',  { start:0, end:13 }), frameRate: 18, repeat: 0 })
    this.anims.create({ key: 'charge_anim',   frames: this.anims.generateFrameNumbers('charge',     { start:0, end:5  }), frameRate: 12, repeat:-1 }) // 6 frames (FIX)
    // Q — Fireball
    this.anims.create({ key: 'attack2_anim',  frames: this.anims.generateFrameNumbers('fw_attack2', { start:0, end:3  }), frameRate: 15, repeat: 0 })
    this.anims.create({ key: 'fireball_anim', frames: this.anims.generateFrameNumbers('fireball',   { start:0, end:7  }), frameRate: 14, repeat: 0 }) // animação do jogador (repeat:0 = toca uma vez)
    // E — Melee
    this.anims.create({ key: 'attack1_anim',  frames: this.anims.generateFrameNumbers('fw_attack1', { start:0, end:3  }), frameRate: 15, repeat: 0 })
    // Dano / Morte
    this.anims.create({ key: 'fw_hurt_anim',   frames: this.anims.generateFrameNumbers('fw_hurt', { start:0, end:2 }), frameRate: 10, repeat: 0 })
    this.anims.create({ key: 'fw_shield_anim', frames: this.anims.generateFrameNumbers('fw_hurt', { start:0, end:2 }), frameRate: 6,  repeat:-1 }) // escudo = hurt em loop
    this.anims.create({ key: 'fw_dead_anim',   frames: this.anims.generateFrameNumbers('fw_dead', { start:0, end:5 }), frameRate: 8,  repeat: 0 })

    // ── Animações Wanderer ──
    this.anims.create({ key: 'w_idle_anim',   frames: this.anims.generateFrameNumbers('w_idle',   { start:0, end:7  }), frameRate: 8,  repeat:-1 })
    this.anims.create({ key: 'w_run_anim',    frames: this.anims.generateFrameNumbers('w_run',    { start:0, end:7  }), frameRate: 12, repeat:-1 })
    this.anims.create({ key: 'w_jump_anim',   frames: this.anims.generateFrameNumbers('w_jump',   { start:0, end:7  }), frameRate: 10, repeat: 0 })
    this.anims.create({ key: 'w_hurt_anim',   frames: this.anims.generateFrameNumbers('w_hurt',   { start:0, end:3  }), frameRate: 10, repeat: 0 })
    this.anims.create({ key: 'w_dead_anim',   frames: this.anims.generateFrameNumbers('w_dead',   { start:0, end:3  }), frameRate: 8,  repeat: 0 })
    this.anims.create({ key: 'w_attack_anim', frames: this.anims.generateFrameNumbers('w_attack', { start:0, end:6  }), frameRate: 12, repeat: 0 })
    this.anims.create({ key: 'w_sphere_anim', frames: this.anims.generateFrameNumbers('w_sphere', { start:0, end:15 }), frameRate: 12, repeat:-1 })

    // ── Animações Lightning Mage ──
    this.anims.create({ key: 'lm_idle_anim',    frames: this.anims.generateFrameNumbers('lm_idle',    { start:0, end:6  }), frameRate: 8,  repeat:-1 })
    this.anims.create({ key: 'lm_run_anim',     frames: this.anims.generateFrameNumbers('lm_run',     { start:0, end:7  }), frameRate: 12, repeat:-1 })
    this.anims.create({ key: 'lm_jump_anim',    frames: this.anims.generateFrameNumbers('lm_jump',    { start:0, end:7  }), frameRate: 10, repeat: 0 })
    this.anims.create({ key: 'lm_hurt_anim',    frames: this.anims.generateFrameNumbers('lm_hurt',    { start:0, end:2  }), frameRate: 10, repeat: 0 })
    this.anims.create({ key: 'lm_dead_anim',    frames: this.anims.generateFrameNumbers('lm_dead',    { start:0, end:4  }), frameRate: 8,  repeat: 0 })
    this.anims.create({ key: 'lm_attack_anim',  frames: this.anims.generateFrameNumbers('lm_attack',  { start:0, end:9  }), frameRate: 14, repeat: 0 }) // ranged
    this.anims.create({ key: 'lm_attack2_anim', frames: this.anims.generateFrameNumbers('lm_attack2', { start:0, end:3  }), frameRate: 14, repeat: 0 }) // melee
    this.anims.create({ key: 'lm_ball_anim',    frames: this.anims.generateFrameNumbers('lm_ball',    { start:0, end:6 }), frameRate: 12, repeat: 0 }) // animação de ataque no sprite do LM
    this.anims.create({ key: 'lm_charge_anim',  frames: this.anims.generateFrameNumbers('lm_charge',  { start:0, end:4 }), frameRate: 12, repeat:-1 }) // projétil (640x64, frameH:64)

    // Listeners de animação do jogador (genéricos para todos)
    this.player.on('animationcomplete', (anim) => {
      const k = anim.key
      if (k.includes('attack') || k.includes('flamejet') || k.includes('fireball') || k.includes('ball')) {
        this.isAttacking = false
      }
      if (k.includes('hurt')) {
        this.isHurt = false
      }
    })

    // ── Controlos ──
    this.cursors  = this.input.keyboard.createCursorKeys()
    this.key1     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE)
    this.key2     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
    this.key3     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyW     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.keyQ     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q)
    this.keyE     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    ])

    this.player.anims.play('idle_anim', true)

    // Notifica React do estado inicial
    EventBus.emit('wave-change',   { label: 'Sandbox' })
    EventBus.emit('player-hp',     this.playerHealth)
    EventBus.emit('player-mana',   this.playerMana)
    EventBus.emit('score-change',  this.score)
    EventBus.emit('ability-ready', { flamejet: true, fireball: true, melee: true, shield: true })
  }

  // ── UPDATE ───────────────────────────────────────────────────────────────────
  update(time) {
    if (this.gameState !== 'playing') return

    // Parallax
    const vx = this.player?.body?.velocity.x ?? 0
    for (const l of this.bgLayers) l.sprite.tilePositionX += vx * l.speed * 0.016

    if (!this.player.isAlive) return

    // Regeneração de mana
    if (this.playerMana < 100) {
      this.playerMana = Math.min(100, this.playerMana + 0.07)
      EventBus.emit('player-mana', this.playerMana)
    }

    // ── Emite estado de cooldowns para o HUD ──
    EventBus.emit('cooldowns', {
      flamejet: Math.max(0, this.cdFlameJet - time),
      fireball: Math.max(0, this.cdFireball - time),
      melee:    Math.max(0, this.cdMelee    - time),
      shield:   Math.max(0, this.cdShield   - time),
    })

    // ── TROCA DE PERSONAGEM ──
    if (Phaser.Input.Keyboard.JustDown(this.key1)) {
      this.playerClass = 'fire'
      this.player.anims.play(this.animKeys.fire.idle, true)
    } else if (Phaser.Input.Keyboard.JustDown(this.key2)) {
      this.playerClass = 'lightning'
      this.player.anims.play(this.animKeys.lightning.idle, true)
    } else if (Phaser.Input.Keyboard.JustDown(this.key3)) {
      this.playerClass = 'wanderer'
      this.player.anims.play(this.animKeys.wanderer.idle, true)
    }

    const anims = this.animKeys[this.playerClass]

    // ── Movimento ──
    if (!this.isHurt) {
      if (this.cursors.left.isDown)       { this.player.setVelocityX(-200); this.player.setFlipX(true) }
      else if (this.cursors.right.isDown) { this.player.setVelocityX(200);  this.player.setFlipX(false) }
      else                                { this.player.setVelocityX(0) }
    }

    if (!this.isAttacking && !this.isHurt && !this.shieldActive) {
      if (!this.player.body.touching.down) { /* mantém pulo */ }
      else if (this.cursors.left.isDown || this.cursors.right.isDown) this.player.anims.play(anims.run, true)
      else this.player.anims.play(anims.idle, true)
    }

    if (this.cursors.up.isDown && this.player.body.touching.down && !this.isHurt) {
      this.player.setVelocityY(-430)
      if (!this.isAttacking) this.player.anims.play(anims.jump, true)
    }

    // ── Habilidades ──
    if (!this.isHurt && !this.isAttacking) {
      // ESPAÇO — Escudo
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.playerMana >= 20 && time > this.cdShield && !this.shieldActive) {
        this.castShield(time)
      }
      // W — Flame Jet
      if (Phaser.Input.Keyboard.JustDown(this.keyW) && this.playerMana >= 10 && time > this.cdFlameJet) {
        this.castFlameJet(time)
      }
      // Q — Fireball (mais poderosa)
      if (Phaser.Input.Keyboard.JustDown(this.keyQ) && this.playerMana >= 25 && time > this.cdFireball) {
        this.castFireball(time)
      }
      // E — Melee (corpo-a-corpo)
      if (Phaser.Input.Keyboard.JustDown(this.keyE) && this.playerMana >= 15 && time > this.cdMelee) {
        this.castMelee(time)
      }
    }

    // Inimigos desativados por enquanto
    // this.updateEnemies(time)

    // Verifica fim de onda desativado

  }

  // ── ESPAÇO: ESCUDO ──────────────────────────────────────────────────────────────
  // Usa anim.shield em loop — enquanto ativo, o jogador é invulnerável
  castShield(time) {
    this.playerMana -= 20
    this.shieldActive = true
    this.player.anims.play(this.animKeys[this.playerClass].shield, true)
    this.player.setTint(0xffd700)          // dourado = escudo ativo
    this.cdShield = time + 3000            // cooldown de 3s após uso
    EventBus.emit('player-mana', this.playerMana)

    // Escudo dura 1.5s
    this.time.delayedCall(1500, () => {
      this.shieldActive = false
      if (this.player.active) {
        this.player.clearTint()
        this.player.anims.play('idle_anim', true)
      }
    })
  }

  // ── ESPAÇO: FLAME JET ────────────────────────────────────────────────────────
  // Jato de fogo contínuo de curta distância — não é um projétil!
  // Aplica dano em ticks a inimigos dentro de 200px à frente do jogador
  castFlameJet(time) {
    this.playerMana -= 10
    this.isAttacking = true
    this.player.anims.play('flamejet_anim', true)
    EventBus.emit('player-mana', this.playerMana)
    this.cdFlameJet = time + 700

    this.time.delayedCall(1000, () => { this.isAttacking = false })

    // Aplica dano em 6 ticks durante os frames do jato (de 100ms a 700ms)
    const RANGE = 200   // alcance do jato em px
    const DMG   = 10    // dano por tick

    for (let i = 1; i <= 6; i++) {
      this.time.delayedCall(i * 100, () => {
        if (!this.player.isAlive) return
        const dir = this.player.flipX ? -1 : 1
        // Hitbox: centro do jato fica a RANGE/2 à frente do jogador
        const hitX = this.player.x + dir * (RANGE / 2)
        const hitY = this.player.y

        this.enemiesGroup.getChildren().forEach(e => {
          if (!e.isAlive) return
          // Verifica se o inimigo está dentro do cone (largura RANGE, altura 80px)
          const dx = (e.x - this.player.x) * dir // só à frente (sinal positivo)
          const dy = Math.abs(e.y - hitY)
          if (dx > 0 && dx < RANGE && dy < 60) {
            e.hp -= DMG
            e.setTint(0xff6600)
            this.time.delayedCall(80, () => { if (e.active && e.isAlive) e.clearTint() })
            this.score += 2
            EventBus.emit('score-change', this.score)

            if (e.hp <= 0 && e.isAlive) {
              e.isAlive = false; e.isAttacking = false
              e.setVelocityX(0)
              e.anims.play(e.deadAnim, true)
              e.body.enable = false
              this.score += 50
              EventBus.emit('score-change', this.score)
            }
          }
        })
      })
    }
  }

  // ── Q: PROJÉTIL ──────────────────────────────────────────────────────────────
  castFireball(time) {
    this.playerMana -= 25
    this.isAttacking = true
    const anims = this.animKeys[this.playerClass]
    this.player.anims.play(anims.attackQ, true)
    EventBus.emit('player-mana', this.playerMana)
    this.cdFireball = time + 1400

    this.time.delayedCall(900, () => { this.isAttacking = false })
    this.time.delayedCall(250, () => {
      const dir = this.player.flipX ? -1 : 1
      const fb  = this.physics.add.sprite(this.player.x + dir * 45, this.player.y + 10, anims.projTex)
      this.fireballs.add(fb)
      fb.body.setAllowGravity(false).setSize(100, 56)
      fb.setFlipX(this.player.flipX)
      fb.setScale(this.playerClass === 'fire' ? 2 : (this.playerClass === 'lightning' ? 1.2 : 0.6))
      fb.anims.play(anims.projAnim, true)
      fb.setVelocityX(dir * 620)    // mais rápido
      fb.damage = 50
      this.time.delayedCall(1300, () => { if (fb?.active) fb.destroy() })
    })
  }

  // ── E: MELEE STRIKE ──────────────────────────────────────────────────────────
  castMelee(time) {
    this.playerMana -= 15
    this.isAttacking = true
    this.player.anims.play(this.animKeys[this.playerClass].attackE, true)
    EventBus.emit('player-mana', this.playerMana)
    this.cdMelee = time + 800

    this.time.delayedCall(700, () => { this.isAttacking = false })

    this.time.delayedCall(130, () => {
      const dir    = this.player.flipX ? -1 : 1
      const hitX   = this.player.x + dir * 60
      const hitY   = this.player.y

      this.enemiesGroup.getChildren().forEach(e => {
        if (!e.isAlive) return
        const dist = Phaser.Math.Distance.Between(hitX, hitY, e.x, e.y)
        if (dist < 120) {
          // Aplica dano ao inimigo
          this.onFireballHitEnemy(e, null)
          // Knockback
          e.setVelocityX(dir * 250)
          this.time.delayedCall(200, () => { if (e.active) e.setVelocityX(0) })
        }
      })

      // Flash visual no jogador para indicar o soco
      this.player.setTint(0xffaa00)
      this.time.delayedCall(100, () => { if (this.player.active) this.player.clearTint() })
    })
  }

  // ── SPAWN DA ONDA ────────────────────────────────────────────────────────────
  spawnWave(waveIndex) {
    EventBus.emit('wave-change', { label: WAVES[waveIndex].label })
    WAVES[waveIndex].enemies.forEach(cfg => this.spawnEnemy(cfg.type, cfg.x))
  }

  spawnEnemy(type, x) {
    const isLM = type === 'lightning'
    const e = this.physics.add.sprite(x, 420, isLM ? 'lm_idle' : 'w_idle')
    e.setBounce(0.1).setCollideWorldBounds(true)
    e.body.setSize(40, 60).setOffset(44, 68)
    e.setFlipX(true)
    e.isAlive = true; e.isAttacking = false; e.eType = type
    e.hp             = isLM ? 60  : 50
    e.speed          = isLM ? 110 : 90
    e.attackCooldown = isLM ? 2800 : 3200
    e.meleeCooldown  = isLM ? 1800 : 99999  // Wanderer não tem melee
    e.meleeRange     = isLM ? 130  : 0      // px — só Lightning Mage
    e.lastAttack     = 0
    e.lastMelee      = 0
    e.idleAnim       = isLM ? 'lm_idle_anim'   : 'w_idle_anim'
    e.runAnim        = isLM ? 'lm_run_anim'    : 'w_run_anim'
    e.hurtAnim       = isLM ? 'lm_hurt_anim'   : 'w_hurt_anim'
    e.deadAnim       = isLM ? 'lm_dead_anim'   : 'w_dead_anim'
    e.attackAnim     = isLM ? 'lm_ball_anim'   : 'w_attack_anim'  // LM usa Light_ball como animação de lançamento
    e.projAnim       = isLM ? 'lm_charge_anim' : 'w_sphere_anim'  // LM usa o seu Charge.png, Wanderer usa Magic_sphere
    e.projKey        = isLM ? 'lm_charge'       : 'w_sphere'
    e.projDamage     = isLM ? 20 : 15
    e.projSpeed      = isLM ? 320 : 240
    e.anims.play(e.idleAnim, true)
    this.enemiesGroup.add(e)
  }

  // ── PROJÉTIL INIMIGO ─────────────────────────────────────────────────────────
  // Mesma lógica do player: sprite do inimigo faz a animação de ataque,
  // depois um sprite SEPARADO voa com a textura do feitiço.
  launchEnemyProjectile(e) {
    const dir    = this.player.x < e.x ? -1 : 1
    const spawnX = e.x + dir * 50
    const spawnY = e.y - 15

    // Chaves de textura e animação baseadas no tipo — explícitas para evitar bugs
    const isLM    = e.eType === 'lightning'
    // LM: projétil = Lightning Mage/Charge.png (640x64, 5 frames) — não o Charge do Fire Wizard!
    // Wanderer: projétil = Magic_sphere.png
    const texKey  = isLM ? 'lm_charge'      : 'w_sphere'
    const animKey = isLM ? 'lm_charge_anim' : 'w_sphere_anim'
    const scale   = isLM ? 1.0 : 0.55

    // Cria o sprite do projétil (mesmo padrão do player)
    const proj = this.physics.add.sprite(spawnX, spawnY, texKey)
    this.enemyProjectiles.add(proj)            // adiciona ao grupo DEPOIS de criar

    // Propriedades físicas e visuais DEPOIS de adicionar ao grupo
    proj.body.setAllowGravity(false)
    proj.body.setSize(50, 50)
    proj.setScale(scale)
    proj.setFlipX(dir < 0)
    proj.anims.play(animKey, true)
    proj.setVelocityX(dir * e.projSpeed)       // velocidade no final (como no player)
    proj.damage = e.projDamage

    this.time.delayedCall(2200, () => { if (proj?.active) proj.destroy() })
  }


  // ── HIT: fireball → inimigo ──────────────────────────────────────────────────
  onFireballHitEnemy(enemy, fb) {
    if (fb) fb.destroy()
    if (!enemy.isAlive) return

    const dmg = fb ? (fb.damage || 30) : 40 // melee = 40
    enemy.hp -= dmg
    this.score += 10
    EventBus.emit('score-change', this.score)

    enemy.setTint(0xff4444)
    enemy.anims.play(enemy.hurtAnim, true)
    enemy.once('animationcomplete-' + enemy.hurtAnim, () => {
      if (enemy.isAlive) { enemy.clearTint(); enemy.anims.play(enemy.idleAnim, true) }
    })

    if (enemy.hp <= 0) {
      enemy.isAlive = false; enemy.isAttacking = false
      enemy.setTint(0xffffff); enemy.setVelocityX(0)
      enemy.anims.play(enemy.deadAnim, true)
      enemy.body.enable = false
      this.score += 50
      EventBus.emit('score-change', this.score)
    }
  }

  // ── HIT: projétil inimigo → jogador ─────────────────────────────────────────
  onProjectileHitPlayer(player, proj) {
    // Escudo ativo: absorve o projétil sem dano
    if (this.shieldActive) {
      proj.destroy()
      // Efeito visual de absorção
      player.setTint(0xffffff)
      this.time.delayedCall(80, () => { if (player.active) player.setTint(0xffd700) })
      return
    }
    proj.destroy()
    if (!this.player.isAlive) return
    this.playerHealth = Math.max(0, this.playerHealth - (proj.damage || 15))
    this.isHurt = true
    EventBus.emit('player-hp', this.playerHealth)
    player.setTint(0xff4444)
    player.anims.play('fw_hurt_anim', true)
    const recoil = player.flipX ? 1 : -1
    player.setVelocityX(recoil * 180)
    this.time.delayedCall(320, () => { if (player.active) player.clearTint() })
    if (this.playerHealth <= 0) {
      this.player.isAlive = false
      player.anims.play('fw_dead_anim', true)
      player.body.enable = false
      this.time.delayedCall(800, () => this.endGame(false))
    }
  }

  // ── TRANSIÇÃO DE ONDA ────────────────────────────────────────────────────────
  showWaveTransition(nextWave) {
    this.gameState = 'transition'
    EventBus.emit('wave-transition', { prevLabel: WAVES[nextWave - 1].label })
    this.time.delayedCall(3000, () => {
      this.gameState = 'playing'
      this.spawnWave(nextWave)
    })
  }

  // ── FIM DO JOGO ──────────────────────────────────────────────────────────────
  endGame(victory) {
    this.gameState = victory ? 'victory' : 'gameover'
    this.enemiesGroup.getChildren().forEach(e => e.setVelocityX(0))
    EventBus.emit('game-over', { victory, score: this.score })
  }
}
