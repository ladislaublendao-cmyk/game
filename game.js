// ══════════════════════════════════════════════════════════════════════
//  PHASER WIZARD GAME — Sistema de Ondas
//  Controlos: ← → Andar | ↑ Pular | ESPAÇO Atacar
// ══════════════════════════════════════════════════════════════════════
const GAME_W = 800, GAME_H = 600;

const config = {
    type: Phaser.AUTO,
    width: GAME_W,
    height: GAME_H,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 650 }, debug: false }
    },
    scene: { preload, create, update }
};
const game = new Phaser.Game(config);

// ── Dimensões dos sprites (medidas com System.Drawing) ─────────────────
// FireWizard: Idle 896x128(7f) Run 1024x128(8f) Jump 1152x128(9f)
//             Hurt 384x128(3f) Dead 768x128(6f) Flame_jet 1792x128(14f)
//             Charge 768x64/64px(12f)
// Wanderer:   Idle 1024x128(8f) Run 1024x128(8f) Hurt 512x128(4f)
//             Dead 512x128(4f)  Attack_1 896x128(7f) Magic_sphere 2048x128(16f)
// LightMage:  Idle 896x128(7f) Run 1024x128(8f) Hurt 384x128(3f)
//             Dead 640x128(5f) Attack_1 1280x128(10f) Light_ball 896x128(7f)

// ── Configuração das ondas ─────────────────────────────────────────────
const WAVES = [
    { label: 'Onda 1', enemies: [{ type: 'wanderer', x: 700 }, { type: 'wanderer', x: 780 }] },
    { label: 'Onda 2', enemies: [{ type: 'wanderer', x: 680 }, { type: 'lightning', x: 760 }] },
    { label: 'Onda 3', enemies: [{ type: 'lightning', x: 650 }, { type: 'wanderer', x: 720 }, { type: 'lightning', x: 790 }] },
    { label: 'Onda 4', enemies: [{ type: 'lightning', x: 640 }, { type: 'lightning', x: 700 }, { type: 'wanderer', x: 760 }, { type: 'wanderer', x: 790 }] },
    { label: 'Onda 5 — FINAL', enemies: [{ type: 'lightning', x: 620 }, { type: 'wanderer', x: 670 }, { type: 'lightning', x: 720 }, { type: 'wanderer', x: 770 }, { type: 'lightning', x: 800 }] },
];

// ── Variáveis globais ──────────────────────────────────────────────────
let player, platforms, cursors, spaceKey;
let fireballs, enemyProjectiles, enemiesGroup;

let playerHealth = 100, playerMana = 100;
let isAttackingFlag = false, isHurtFlag = false, lastFired = 0;

let currentWave = 0, score = 0, gameState = 'playing'; // 'playing' | 'gameover' | 'victory'

let bgLayers = [];
let hpBarBg, hpBarFill, mpBarBg, mpBarFill;
let waveText, scoreText, centerText;

// ── PRELOAD ────────────────────────────────────────────────────────────
function preload() {
    for (let i = 1; i <= 7; i++) this.load.image(`layer${i}`, `../cenario/PNG/1_game_background/layers/${i}.png`);

    // Fire Wizard
    this.load.spritesheet('idle',      '../Player/Fire Wizard/Idle.png',     { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('run',       '../Player/Fire Wizard/Run.png',      { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('jump',      '../Player/Fire Wizard/Jump.png',     { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('flame_jet', '../Player/Fire Wizard/Flame_jet.png',{ frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('charge',    '../Player/Fire Wizard/Charge.png',   { frameWidth: 64,  frameHeight: 64  });
    this.load.spritesheet('fw_hurt',   '../Player/Fire Wizard/Hurt.png',     { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('fw_dead',   '../Player/Fire Wizard/Dead.png',     { frameWidth: 128, frameHeight: 128 });

    // Wanderer Magician
    this.load.spritesheet('w_idle',   '../Player/Wanderer Magican/Idle.png',         { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('w_run',    '../Player/Wanderer Magican/Run.png',          { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('w_hurt',   '../Player/Wanderer Magican/Hurt.png',         { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('w_dead',   '../Player/Wanderer Magican/Dead.png',         { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('w_attack', '../Player/Wanderer Magican/Attack_1.png',     { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('w_sphere', '../Player/Wanderer Magican/Magic_sphere.png', { frameWidth: 128, frameHeight: 128 });

    // Lightning Mage
    this.load.spritesheet('lm_idle',   '../Player/Lightning Mage/Idle.png',     { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('lm_run',    '../Player/Lightning Mage/Run.png',      { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('lm_hurt',   '../Player/Lightning Mage/Hurt.png',     { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('lm_dead',   '../Player/Lightning Mage/Dead.png',     { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('lm_attack', '../Player/Lightning Mage/Attack_1.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('lm_ball',   '../Player/Lightning Mage/Light_ball.png',{ frameWidth: 128, frameHeight: 128 });
}

// ── CREATE ─────────────────────────────────────────────────────────────
function create() {
    // Parallax layers (1920x1080 → tileScale 600/1080)
    const tileScale = 600 / 1080;
    const speeds = [0, 0.02, 0.04, 0.07, 0.11, 0.16, 0.24, 0.38];
    bgLayers = [];
    for (let i = 1; i <= 7; i++) {
        const l = this.add.tileSprite(0, 0, GAME_W, GAME_H, `layer${i}`).setOrigin(0, 0).setTileScale(tileScale, tileScale);
        bgLayers.push({ sprite: l, speed: speeds[i] });
    }

    // Chão invisível
    platforms = this.physics.add.staticGroup();
    platforms.add(this.add.rectangle(GAME_W / 2, GAME_H - 18, GAME_W, 36, 0x000000, 0));

    // Jogador
    player = this.physics.add.sprite(120, 450, 'idle');
    player.setBounce(0.1).setCollideWorldBounds(true);
    player.body.setSize(40, 60).setOffset(44, 68);
    player.hp = 100;
    player.isAlive = true;
    this.physics.add.collider(player, platforms);

    // Grupos
    fireballs        = this.physics.add.group();
    enemyProjectiles = this.physics.add.group();
    enemiesGroup     = this.physics.add.group();

    this.physics.add.collider(enemiesGroup, platforms);
    this.physics.add.overlap(fireballs,        enemiesGroup, onFireballHitEnemy, null, this);
    this.physics.add.overlap(enemyProjectiles, player,      onProjectileHitPlayer, null, this);

    // Animações Fire Wizard
    this.anims.create({ key: 'idle_anim',    frames: this.anims.generateFrameNumbers('idle',      { start:0, end:6  }), frameRate: 8,  repeat:-1 });
    this.anims.create({ key: 'run_anim',     frames: this.anims.generateFrameNumbers('run',       { start:0, end:7  }), frameRate: 12, repeat:-1 });
    this.anims.create({ key: 'jump_anim',    frames: this.anims.generateFrameNumbers('jump',      { start:0, end:8  }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'attack_anim',  frames: this.anims.generateFrameNumbers('flame_jet', { start:0, end:13 }), frameRate: 18, repeat: 0 });
    this.anims.create({ key: 'charge_anim',  frames: this.anims.generateFrameNumbers('charge',    { start:0, end:11 }), frameRate: 12, repeat:-1 });
    this.anims.create({ key: 'fw_hurt_anim', frames: this.anims.generateFrameNumbers('fw_hurt',   { start:0, end:2  }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'fw_dead_anim', frames: this.anims.generateFrameNumbers('fw_dead',   { start:0, end:5  }), frameRate: 8,  repeat: 0 });

    // Animações Wanderer
    this.anims.create({ key: 'w_idle_anim',   frames: this.anims.generateFrameNumbers('w_idle',   { start:0, end:7  }), frameRate: 8,  repeat:-1 });
    this.anims.create({ key: 'w_run_anim',    frames: this.anims.generateFrameNumbers('w_run',    { start:0, end:7  }), frameRate: 12, repeat:-1 });
    this.anims.create({ key: 'w_hurt_anim',   frames: this.anims.generateFrameNumbers('w_hurt',   { start:0, end:3  }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'w_dead_anim',   frames: this.anims.generateFrameNumbers('w_dead',   { start:0, end:3  }), frameRate: 8,  repeat: 0 });
    this.anims.create({ key: 'w_attack_anim', frames: this.anims.generateFrameNumbers('w_attack', { start:0, end:6  }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'w_sphere_anim', frames: this.anims.generateFrameNumbers('w_sphere', { start:0, end:15 }), frameRate: 12, repeat:-1 });

    // Animações Lightning Mage
    this.anims.create({ key: 'lm_idle_anim',   frames: this.anims.generateFrameNumbers('lm_idle',   { start:0, end:6  }), frameRate: 8,  repeat:-1 });
    this.anims.create({ key: 'lm_run_anim',    frames: this.anims.generateFrameNumbers('lm_run',    { start:0, end:7  }), frameRate: 12, repeat:-1 });
    this.anims.create({ key: 'lm_hurt_anim',   frames: this.anims.generateFrameNumbers('lm_hurt',   { start:0, end:2  }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'lm_dead_anim',   frames: this.anims.generateFrameNumbers('lm_dead',   { start:0, end:4  }), frameRate: 8,  repeat: 0 });
    this.anims.create({ key: 'lm_attack_anim', frames: this.anims.generateFrameNumbers('lm_attack', { start:0, end:9  }), frameRate: 14, repeat: 0 });
    this.anims.create({ key: 'lm_ball_anim',   frames: this.anims.generateFrameNumbers('lm_ball',   { start:0, end:6  }), frameRate: 12, repeat:-1 });

    // Listeners do jogador
    player.on('animationcomplete-attack_anim',  () => { isAttackingFlag = false; });
    player.on('animationcomplete-fw_hurt_anim', () => { isHurtFlag = false; });

    // Controles
    cursors  = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard.addCapture([
        Phaser.Input.Keyboard.KeyCodes.SPACE,
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.DOWN
    ]);

    // UI
    createUI(this);
    player.anims.play('idle_anim', true);

    // Inicia a primeira onda
    spawnWave.call(this, currentWave);
}

// ── UPDATE ─────────────────────────────────────────────────────────────
function update(time) {
    if (gameState !== 'playing') return;

    // Parallax
    const vx = player.body ? player.body.velocity.x : 0;
    for (const l of bgLayers) l.sprite.tilePositionX += vx * l.speed * 0.016;

    // ── Jogador ──
    if (!player.isAlive) return;

    if (playerMana < 100) { playerMana = Math.min(100, playerMana + 0.07); updateUI(); }

    if (!isHurtFlag) {
        if (cursors.left.isDown)       { player.setVelocityX(-200); player.setFlipX(true); }
        else if (cursors.right.isDown) { player.setVelocityX(200);  player.setFlipX(false); }
        else                           { player.setVelocityX(0); }
    }

    if (!isAttackingFlag && !isHurtFlag) {
        if (!player.body.touching.down) { /* mantém jump */ }
        else if (cursors.left.isDown || cursors.right.isDown) player.anims.play('run_anim', true);
        else player.anims.play('idle_anim', true);
    }

    if (cursors.up.isDown && player.body.touching.down && !isHurtFlag) {
        player.setVelocityY(-430);
        if (!isAttackingFlag) player.anims.play('jump_anim', true);
    }

    if (Phaser.Input.Keyboard.JustDown(spaceKey) && playerMana >= 10 && time > lastFired && !isHurtFlag) {
        castFireball.call(this, time);
    }

    // ── IA dos Inimigos ──
    enemiesGroup.getChildren().forEach(e => {
        if (!e.isAlive || e.isAttacking) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
        const attackRange = e.eType === 'lightning' ? 320 : 280;
        const chaseRange  = 600;

        if (dist < attackRange) {
            // Ataca
            e.setVelocityX(0);
            e.anims.play(e.idleAnim, true);
            if (time > (e.lastAttack || 0)) {
                e.isAttacking = true;
                e.anims.play(e.attackAnim, true);
                e.once('animationcomplete-' + e.attackAnim, () => {
                    if (!e.isAlive) return;
                    launchEnemyProjectile.call(this, e);
                    e.isAttacking = false;
                    e.lastAttack  = time + e.attackCooldown;
                });
            }
        } else if (dist < chaseRange) {
            // Persegue o jogador
            const dir = player.x < e.x ? -1 : 1;
            e.setVelocityX(dir * e.speed);
            e.setFlipX(dir === -1);
            e.anims.play(e.runAnim, true);
        } else {
            // Parado (idle)
            e.setVelocityX(0);
            e.anims.play(e.idleAnim, true);
        }
    });

    // Verifica se a onda terminou
    const alive = enemiesGroup.getChildren().filter(e => e.isAlive);
    if (alive.length === 0) {
        currentWave++;
        if (currentWave >= WAVES.length) {
            endGame.call(this, true);
        } else {
            showWaveTransition.call(this, currentWave);
        }
    }
}

// ── SPAWN DA ONDA ──────────────────────────────────────────────────────
function spawnWave(waveIndex) {
    waveText.setText(WAVES[waveIndex].label);
    WAVES[waveIndex].enemies.forEach(cfg => {
        spawnEnemy.call(this, cfg.type, cfg.x);
    });
}

function spawnEnemy(type, x) {
    const isLM = type === 'lightning';
    const key  = isLM ? 'lm_idle' : 'w_idle';
    const e    = this.physics.add.sprite(x, 420, key);

    e.setBounce(0.1).setCollideWorldBounds(true);
    e.body.setSize(40, 60).setOffset(44, 68);
    e.setFlipX(true); // Começa olhando para a esquerda (para o jogador)

    // Propriedades customizadas
    e.isAlive      = true;
    e.isAttacking  = false;
    e.eType        = type;
    e.hp           = isLM ? 60 : 50;
    e.speed        = isLM ? 110 : 90;
    e.attackCooldown = isLM ? 2800 : 3200;
    e.lastAttack   = 0;
    e.idleAnim     = isLM ? 'lm_idle_anim'   : 'w_idle_anim';
    e.runAnim      = isLM ? 'lm_run_anim'    : 'w_run_anim';
    e.hurtAnim     = isLM ? 'lm_hurt_anim'   : 'w_hurt_anim';
    e.deadAnim     = isLM ? 'lm_dead_anim'   : 'w_dead_anim';
    e.attackAnim   = isLM ? 'lm_attack_anim' : 'w_attack_anim';
    e.projAnim     = isLM ? 'lm_ball_anim'   : 'w_sphere_anim';
    e.projKey      = isLM ? 'lm_ball'        : 'w_sphere';
    e.projDamage   = isLM ? 20 : 15;
    e.projSpeed    = isLM ? 320 : 240;

    e.anims.play(e.idleAnim, true);
    enemiesGroup.add(e);
}

// ── PROJÉTIL DO JOGADOR ────────────────────────────────────────────────
function castFireball(time) {
    playerMana -= 10;
    isAttackingFlag = true;
    player.anims.play('attack_anim', true);
    updateUI();

    this.time.delayedCall(1000, () => { isAttackingFlag = false; });

    this.time.delayedCall(300, () => {
        const dir  = player.flipX ? -1 : 1;
        const fb   = this.physics.add.sprite(player.x + dir * 35, player.y + 20, 'charge');
        fireballs.add(fb);
        fb.body.setAllowGravity(false).setSize(48, 48);
        fb.setFlipX(player.flipX);
        fb.anims.play('charge_anim', true);
        fb.setVelocityX(dir * 500);
        this.time.delayedCall(1600, () => { if (fb?.active) fb.destroy(); });
    });

    lastFired = time + 700;
}

// ── PROJÉTIL DO INIMIGO ────────────────────────────────────────────────
function launchEnemyProjectile(e) {
    const dir  = player.x < e.x ? -1 : 1;
    const proj = this.physics.add.sprite(e.x + dir * 40, e.y - 10, e.projKey);
    enemyProjectiles.add(proj);
    proj.body.setAllowGravity(false).setSize(40, 40);
    proj.setScale(e.eType === 'wanderer' ? 0.5 : 0.7);
    proj.setFlipX(dir === -1);
    proj.anims.play(e.projAnim, true);
    proj.setVelocityX(dir * e.projSpeed);
    proj.damage = e.projDamage;
    this.time.delayedCall(2200, () => { if (proj?.active) proj.destroy(); });
}

// ── COLISÕES ───────────────────────────────────────────────────────────
function onFireballHitEnemy(enemy, fb) {
    fb.destroy();
    if (!enemy.isAlive) return;

    enemy.hp -= 30;
    score += 10;
    scoreText.setText('Score: ' + score);

    enemy.setTint(0xff4444);
    enemy.anims.play(enemy.hurtAnim, true);
    enemy.once('animationcomplete-' + enemy.hurtAnim, () => {
        if (enemy.isAlive) { enemy.clearTint(); enemy.anims.play(enemy.idleAnim, true); }
    });

    if (enemy.hp <= 0) {
        enemy.isAlive    = false;
        enemy.isAttacking = false;
        enemy.setTint(0xffffff);
        enemy.setVelocityX(0);
        enemy.anims.play(enemy.deadAnim, true);
        enemy.body.enable = false;
        score += 50;
        scoreText.setText('Score: ' + score);
    }
}

function onProjectileHitPlayer(playerObj, proj) {
    proj.destroy();
    if (!player.isAlive) return;

    playerHealth = Math.max(0, playerHealth - (proj.damage || 15));
    isHurtFlag   = true;
    updateUI();

    playerObj.setTint(0xff4444);
    playerObj.anims.play('fw_hurt_anim', true);
    const recoilDir = playerObj.flipX ? 1 : -1;
    playerObj.setVelocityX(recoilDir * 180);
    this.time.delayedCall(320, () => { if (playerObj.active) playerObj.clearTint(); });

    if (playerHealth <= 0) {
        player.isAlive = false;
        playerObj.anims.play('fw_dead_anim', true);
        playerObj.body.enable = false;
        this.time.delayedCall(800, () => endGame.call(this, false));
    }
}

// ── TRANSIÇÃO DE ONDA ──────────────────────────────────────────────────
function showWaveTransition(nextWave) {
    gameState = 'transition';
    centerText.setText('✓ ' + WAVES[nextWave - 1].label + ' Completa!\nPróxima onda em 3...').setVisible(true);

    let count = 3;
    const timer = this.time.addEvent({
        delay: 1000, repeat: 2,
        callback: () => {
            count--;
            if (count > 0) {
                centerText.setText('✓ ' + WAVES[nextWave - 1].label + ' Completa!\nPróxima onda em ' + count + '...');
            } else {
                centerText.setVisible(false);
                gameState = 'playing';
                spawnWave.call(this, nextWave);
            }
        }
    });
}

// ── FIM DO JOGO ────────────────────────────────────────────────────────
function endGame(victory) {
    gameState = victory ? 'victory' : 'gameover';
    enemiesGroup.getChildren().forEach(e => e.setVelocityX(0));

    const msg = victory
        ? '🏆 VITÓRIA!\nTodas as ondas eliminadas!\nScore: ' + score + '\n\nF5 para jogar novamente'
        : '💀 GAME OVER\nScore: ' + score + '\n\nF5 para jogar novamente';

    centerText.setText(msg).setVisible(true).setColor(victory ? '#ffdd00' : '#ff4444');
}

// ── UI ─────────────────────────────────────────────────────────────────
function createUI(scene) {
    scene.add.text(14, 14, 'HP', { fontSize: '13px', fill: '#fff', fontStyle: 'bold' }).setDepth(10);
    scene.add.text(14, 36, 'MP', { fontSize: '13px', fill: '#fff', fontStyle: 'bold' }).setDepth(10);

    hpBarBg   = scene.add.graphics().setDepth(10);
    hpBarFill = scene.add.graphics().setDepth(10);
    mpBarBg   = scene.add.graphics().setDepth(10);
    mpBarFill = scene.add.graphics().setDepth(10);

    waveText  = scene.add.text(GAME_W / 2, 18, '', { fontSize: '16px', fill: '#ffdd55', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(10);
    scoreText = scene.add.text(GAME_W - 14, 14, 'Score: 0', { fontSize: '14px', fill: '#fff' }).setOrigin(1, 0).setDepth(10);

    centerText = scene.add.text(GAME_W / 2, GAME_H / 2, '', {
        fontSize: '22px', fill: '#fff', fontStyle: 'bold',
        backgroundColor: '#00000088', padding: { x: 24, y: 16 }, align: 'center'
    }).setOrigin(0.5, 0.5).setDepth(20).setVisible(false);

    updateUI();
}

function updateUI() {
    const BW = 120, BH = 13, BX = 38;

    hpBarBg.clear().fillStyle(0x550000).fillRect(BX, 14, BW, BH);
    hpBarFill.clear().fillStyle(0xff3333).fillRect(BX, 14, Math.max(0, (playerHealth / 100) * BW), BH);

    mpBarBg.clear().fillStyle(0x000055).fillRect(BX, 36, BW, BH);
    mpBarFill.clear().fillStyle(0x3399ff).fillRect(BX, 36, Math.max(0, (playerMana  / 100) * BW), BH);
}
