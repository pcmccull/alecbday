import Phaser from 'phaser';
import { SETTINGS } from './settings';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.player = null;
    this.cursors = null;
    this.background = null;
    this.breathingTween = null;
    this.platforms = null;
    this.presents = null;
    this.score = 0;
    this.powerBar = null;
    this.powerBarFill = null;
    this.powerBarText = null;
    this.powerBarTween = null;
    this.projectiles = null;
    this.enemies = null;
  }

  preload() {
    // For a real game, you would use proper assets.
    // These are just placeholders.
    // To create these images, you can use any image editor to create small png files.
    this.load.image('background', 'assets/workout_background.png'); // e.g., a 800x600 blue png
    this.load.image('ground', 'assets/ground.png'); 
    this.load.image('instructions', 'assets/instructions.png'); 
    this.load.image('playbutton', 'assets/playbutton.png'); 
     this.load.image('progressbar', 'assets/progressbar.png'); 

    
    this.load.image('star', 'assets/present.png'); // Placeholder for presents
    this.load.image('enemy', 'assets/workout_enemy.png'); // Placeholder for enemy sprite
    
    this.load.audio('win_song', 'assets/win_song.m4a');
    this.load.audio('win_song2', 'assets/win_song2.m4a');
    this.load.audio('collectpresent', 'assets/collectpresent.mp3');
    this.load.audio('smashenemy', 'assets/smashenemy.mp3');
    this.load.audio('stolenpresent', 'assets/stolenpresent.mp3');
    this.load.audio('gameover_lost', 'assets/gameover_lost.m4a');
    this.load.audio('game_music', 'assets/game_music.m4a');
    this.load.image('gameover_win', 'assets/game_overwin.png');
    this.load.image('gameover_lost', 'assets/gameover_lose.png');
    this.load.spritesheet('player', 'assets/workout_run2.png', { frameWidth: SETTINGS.CHARACTER.WIDTH, frameHeight: SETTINGS.CHARACTER.HEIGHT });
    this.load.spritesheet('player_jump', 'assets/workout_jump2.png', { frameWidth: SETTINGS.CHARACTER.WIDTH, frameHeight: SETTINGS.CHARACTER.HEIGHT });
  }

  create() {
    // --- BACKGROUND ---
    const { width, height } = this.scale;
    // Create a TileSprite, which allows the background to repeat.
    // We set its size to match the game's width and height.
    this.background = this.add.tileSprite(width / 2, height / 2, width, height, 'background');

    
    // The original image is 1032x640. We scale the texture inside the TileSprite to make
    // its height fit the game's height, maintaining the aspect ratio.
    const scale = this.scale.height / this.textures.get('background').getSourceImage().height;
    this.background.setTileScale(scale);

    // --- PLAYER (Initial Display) ---
    // We create the player sprite here so it's visible before the game starts.
    // It won't have physics enabled until startGame() is called.
    // Position the player to be standing on the eventual ground.
    this.player = this.add.sprite(150, height - 170, 'player').setOrigin(0.5, 0.8);

    // --- PLAYER ANIMATIONS ---
    // It's better to define animations once when the scene is created.
    this.anims.create({
      key: 'turn',
      frames: [ { key: 'player', frame: 0 } ], // Use the first frame for idle
      frameRate: SETTINGS.ANIMATIONS.IDLE_FRAMERATE
    });

    this.anims.create({
      key: 'jump',
      frames: this.anims.generateFrameNumbers('player_jump', { start: 1, end: 15 }),
      frameRate: SETTINGS.ANIMATIONS.JUMP_FRAMERATE,
      repeat: 0 // Play the jump animation once
    });

    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('player', { start: 1, end: 12 }), // Use frames 1-12 for running
      frameRate: SETTINGS.ANIMATIONS.RUN_FRAMERATE,
      repeat: -1 // Loop the running animation
    });

    // --- BREATHING TWEEN ---
    // Create a tween for the idle breathing animation, but start it paused.
    this.breathingTween = this.tweens.add({
      targets: this.player,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: true
    });

    this.player.anims.play('turn');

    // --- PLAY BUTTON ---
    const playButton = this.add.sprite(width / 2, height / 2, 'playbutton').setOrigin(0.5);

    
    const instructions = this.add.sprite(width - 170, 120, 'instructions');

    playButton.setInteractive({ useHandCursor: true });
 
    playButton.on('pointerup', () => {
      if (this.scale.fullscreen.available) {
        try {
          this.scale.startFullscreen();
        } catch (e) {
          console.warn('Fullscreen request failed:', e);
        }
      }
      playButton.destroy();
      instructions.destroy();
      this.startGame();
    });
    this.breathingTween.resume();

    


  }

  startGame() {
    this.score = 0;
    this.sound.stopAll();
    this.sound.play('game_music', { loop: true, volume: 0.4 })
    // Now that the game is starting, resume the idle animation
    this.breathingTween.resume();

    // --- PLATFORMS ---
    const { width, height } = this.scale;
    this.platforms = this.physics.add.staticGroup();

    // Create a floor that spans the entire width of the game.
    // We scale the ground asset to fit the width and place it at the bottom.
    this.platforms.create(width / 2, height - 16, 'ground').setScale(width / 20, 1).setAlpha(0).refreshBody();

    //this.platforms.create(600, 400, 'ground');
   // this.platforms.create(50, 250, 'ground');
    //this.platforms.create(750, 220, 'ground');

    // --- PRESENTS (COLLECTIBLES) ---
    this.presents = this.physics.add.group({
      defaultKey: 'star',
      maxSize: 5 // Max number of presents on screen at once
    });

    // Create a timed event to spawn presents
    this.time.addEvent({ delay: SETTINGS.COLLECTIBLES.SPAWN_INTERVAL, callback: this.spawnPresent, callbackScope: this, loop: true });

    // --- ENEMIES ---
    this.enemies = this.physics.add.group();
    this.time.addEvent({ delay: SETTINGS.ENEMIES.SPAWN_INTERVAL, callback: this.spawnEnemy, callbackScope: this, loop: true });

    // --- POWER BAR ---
    const barWidth = 284;
    const barHeight = 20;
    const barX = this.scale.width / 2 - barWidth / 2 + 38;
    const barY = -2;

    // Bar Background
     const powerBarBackground =  this.add.sprite(width / 2, 30, 'progressbar').setScale(0.2).setOrigin(0.5);
    // this.powerBar = this.add.graphics();
    // this.powerBar.fillStyle(0x000000, 0.5); // Black, 50% alpha
    // this.powerBar.fillRect(barX, barY + 20, barWidth, barHeight);
    // this.powerBar.setScrollFactor(0);

    // Bar Fill
    this.powerBarFill = this.add.graphics();
    this.powerBarFill.setScrollFactor(0);
    

    // --- PROJECTILES ---
    this.projectiles = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 10, // Max number of projectiles on screen at once
    });

    // Set a collider for projectiles to interact with things later (e.g., enemies)
    // this.physics.add.collider(this.projectiles, this.platforms, (projectile) => {
    //   projectile.setActive(false);
    //   projectile.setVisible(false);
    // });


    // --- ENABLE PLAYER PHYSICS ---
    // Now that the game is starting, enable physics on the existing player sprite.
    this.physics.world.enable(this.player);
    this.player.body.setBounce(SETTINGS.PLAYER.BOUNCE);
    this.player.body.setCollideWorldBounds(true);

    // Adjust the physics body to be smaller than the sprite frame.
    // setSize(width, height) defines the new, smaller bounding box.
    // setOffset(x, y) positions this new box within the original sprite frame.
    this.player.body.setSize(
      SETTINGS.PLAYER.COLLIDER.WIDTH,
      SETTINGS.PLAYER.COLLIDER.HEIGHT
    ).setOffset(SETTINGS.PLAYER.COLLIDER.OFFSET_X, SETTINGS.PLAYER.COLLIDER.OFFSET_Y);

    // --- PHYSICS ---
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.presents, this.collectPresent, null, this);
    this.physics.add.collider(this.player, this.enemies, this.playerHitEnemy, null, this);
    this.physics.add.collider(this.projectiles, this.enemies, this.projectileHitEnemy, null, this);

    // --- CONTROLS ---
    this.cursors = this.input.keyboard.createCursorKeys();
    // Create separate key objects for WASD
    this.wasd = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };

    this.spawnPresent();
    if (this.sys.game.device.input.touch) {
      // Allow for multiple touch inputs (e.g., for moving and jumping at the same time)
      this.input.addPointer(2);
      this.createMobileControls();
    }
  }

 
  spawnPresent() {
    const { width, height } = this.scale;
    const present = this.presents.get();

    if (present) {
      // Calculate a random final position on the screen
      const targetX = Phaser.Math.Between(50, width - 50);
      const targetY = Phaser.Math.Between(50, 200);

      // Start the present above the screen
      present.enableBody(true, targetX, -50, true, true);
      present.body.setAllowGravity(false); // Make the present float

      // Stop any previous bounce tween if it exists from pooling
      if (present.bounceTween) {
        present.bounceTween.stop();
        present.bounceTween = null;
      }

      // Create a tween to drop the present into place
      this.tweens.add({
        targets: present,
        y: targetY,
        duration: 800, // Duration of the drop
        ease: 'Bounce.easeOut', // A nice bouncy ease
        onComplete: () => {
          // Once the drop is complete, start the regular bouncing animation
          present.bounceTween = this.tweens.add({
            targets: present,
            y: targetY - 10, // Bounce up by 10 pixels from its final position
            duration: 1000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
          });
        }
      });
    }
  }

  spawnEnemy() {
    const { width } = this.scale;
    const spawnOnLeft = Phaser.Math.Between(0, 1) === 0;
    const x = spawnOnLeft ? -50 : this.player.x + width;
    const y = 390; // Spawn above the ground

    const enemy = this.enemies.create(x, y, 'enemy');
    if (enemy) {
      enemy.setBounce(0.2);
      enemy.setCollideWorldBounds(true); // Prevent them from falling off edges for now
      enemy.body.setSize(enemy.width * 0.4, enemy.height * 0.4 +20);
    }
  }

  playerHitEnemy(player, enemy) {
    
     // Check if the player is stomping on the enemy
    if (player.body.y < 240) {
      // Stomp successful
      enemy.destroy();
       this.sound.play('smashenemy', { loop: false })
      player.body.setVelocityY(SETTINGS.PLAYER.STOMP_BOUNCE);
    } else {
     
      if(player.isInvincible) {
        return;
      }
      
      this.sound.play('stolenpresent', { loop: false })
      //game over 
      if (this.score == 0) {
        this.scene.start('GameOverScene', { won: false });
       
      } else {
         // Enemy steals parts
        this.score = Math.max(0, this.score - 1);
        this.updatePowerBar();

        // --- Make enemy fly away with a present ---
        // Disable further collisions for this enemy
        
        enemy.isHit = true; // Custom flag to prevent AI from taking over
       
        // Create a 'stolen' present sprite
        const stolenPresent = this.add.sprite(enemy.x, enemy.y - 20, 'star');
        stolenPresent.setScale(0.5);

        // Give both a velocity to fly off-screen
        const flyDirection = (enemy.x > player.x) ? 1 : -1;
        enemy.setFlipX(flyDirection>0);
        this.physics.world.enable(stolenPresent); // Enable physics for the new sprite
        stolenPresent.body.setAllowGravity(false);
        stolenPresent.body.setVelocity(300 * flyDirection, -400);
        enemy.body.setVelocity(300 * flyDirection, -400);

        // Clean them up after they fly off-screen
        this.time.delayedCall(1500, () => {
          enemy.destroy();
          stolenPresent.destroy();
        });

        // Grant player invincibility and visual feedback
        player.isInvincible = true;
        this.tweens.add({
          targets: player,
          alpha: 0.5,
          duration: 100,
          ease: 'Power1',
          yoyo: true,
          repeat: 5, // Creates a flashing effect
          onComplete: () => {
            player.isInvincible = false;
            player.setAlpha(1);
          }
        });
      }
     
    }
  }
  collectPresent(player, present) {
    // Stop the bouncing tween before deactivating the present
    if (present.bounceTween) {
      present.bounceTween.stop();
      present.bounceTween = null;
    }

    // Deactivate the present and return it to the pool
    this.presents.killAndHide(present);
    present.body.enable = false;
    this.sound.play('collectpresent', { loop: false })
    this.score += 1;
    this.updatePowerBar();
    if (this.score >= SETTINGS.COLLECTIBLES.TOTAL_NEEDED) {
      this.scene.start('GameOverScene', { won: true });
    }
  }
  updatePowerBar() {
    // Calculate the target fill percentage based on the current score
    const targetFill = this.score / SETTINGS.COLLECTIBLES.TOTAL_NEEDED;

    // Stop any existing tween to avoid conflicts
    if (this.powerBarTween) {
      this.powerBarTween.stop();
    }

    // Create a tween to animate the bar's fill
    this.powerBarTween = this.tweens.add({
      targets: this.powerBarFill, // Target the graphics object
      fillAlpha: 1, // A dummy property to tween on, the real work is in onUpdate
      ease: 'Power1',
      duration: 250, // Animation duration in ms
      onUpdate: (tween) => {
        // This function runs every frame of the tween
        const currentFill = Phaser.Math.Linear(this.powerBarFill.getData('currentFill') || 0, targetFill, tween.progress);
        this.powerBarFill.setData('currentFill', currentFill);

        // Redraw the bar with the new animated width
        this.powerBarFill.clear();
        this.powerBarFill.fillStyle(0xD9453C, 1); // Green
        this.powerBarFill.fillRect(this.scale.width / 2 - 284 / 2 + 38, -2 + 20, 284 * currentFill, 20);
      }
    });

    const barWidth = 284;
    const barHeight = 20;
    const barX = this.scale.width / 2 - barWidth / 2 + 38;
    const barY = -2;
  }

  update(time) {
    // Guard clause: Do not run update logic if the player's physics body hasn't been created yet.
    if (!this.cursors || !this.player || !this.player.body) {
      return;
    }

    const { width } = this.scale;
    const scrollThreshold = width * SETTINGS.SCROLL.THRESHOLD_RATIO;
    const scrollSpeed = SETTINGS.SCROLL.SPEED;

    const onGround = this.player.body.touching.down;

    // --- HORIZONTAL MOVEMENT (applies on ground and in air) ---
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      this.player.body.setVelocityX(-SETTINGS.PLAYER.SPEED);
      this.player.setFlipX(true); // Flip sprite to face left

      // If player is in the left scroll zone, push the world instead of moving the player
      if (this.player.x <= scrollThreshold) {
        this.player.x = scrollThreshold; // Lock player position
        this.background.tilePositionX -= scrollSpeed; // Scroll background
        // Scroll all platforms and presents
        this.platforms.incX(scrollSpeed);
        this.presents.incX(scrollSpeed);
        this.enemies.incX(scrollSpeed);
      }
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.player.body.setVelocityX(SETTINGS.PLAYER.SPEED);
      this.player.setFlipX(false); // Use original sprite orientation (facing right)

      // If player is in the right scroll zone, push the world
      if (this.player.x >= width - scrollThreshold) {
        this.player.x = width - scrollThreshold; // Lock player position
        this.background.tilePositionX += scrollSpeed; // Scroll background
        // Scroll all platforms and presents
        this.platforms.incX(-scrollSpeed);
        this.presents.incX(-scrollSpeed);
        this.enemies.incX(-scrollSpeed);
      }
    } else {
      // Only stop horizontal movement if on the ground
      if (onGround) {
        this.player.body.setVelocityX(0);
      }
    }

    // --- PROJECTILE MANAGEMENT ---
    // Disable projectiles that go off-screen
    this.projectiles.children.each(projectile => {
      if (projectile.active && (projectile.x < 0 || projectile.x > width)) {
        projectile.setActive(false).setVisible(false);
      }
    });

    // --- ENEMY MOVEMENT & MANAGEMENT ---
    this.enemies.children.each(enemy => {
      if (enemy.active && enemy.body.enable && !enemy.isHit) {
        //only switch direction if player is on ground
        if (this.player.body.touching.down || enemy.body.velocity.x == 0) {
          // Move enemy towards the player
          if (enemy.x > this.player.x) {
            enemy.body.setVelocityX(-SETTINGS.ENEMIES.SPEED);
            enemy.setFlipX(false); // Flip to face left
          } else {
            enemy.body.setVelocityX(SETTINGS.ENEMIES.SPEED);
            enemy.setFlipX(true); // Face right (default)
          }
        }
      }
    });

    // --- JUMPING & ANIMATION LOGIC ---
    if (onGround && (this.cursors.up.isDown || this.wasd.up.isDown)) {
      // --- JUMP ---
      this.player.body.setVelocityY(SETTINGS.PLAYER.JUMP_VELOCITY);
      this.breathingTween.pause();
      this.player.setScale(1);
      this.player.anims.play('jump');
    } else if (!onGround) {
      if (this.cursors.down.isDown || this.wasd.down.isDown) {
         this.player.body.setVelocityY(-SETTINGS.PLAYER.JUMP_VELOCITY);
      }
      // --- IN THE AIR ---
      // Ensure jump animation continues, or switch to a falling frame if you have one
      if (this.player.anims.currentAnim.key !== 'jump') {
        this.player.anims.play('jump');
      }
    } else if (this.player.body.velocity.x !== 0) {
      // --- RUNNING ON GROUND ---
      this.breathingTween.pause();
      this.player.setScale(1);
      this.player.anims.play('run', true);
    } else {
      // --- IDLE ON GROUND ---
      this.player.anims.play('turn', true);
      if (this.breathingTween.isPaused()) {
        this.breathingTween.resume();
      }
    }
    console.log(this.player.body.y)
  }
  createMobileControls() {
    const { width, height } = this.scale;

    // --- JUMP BUTTON ---
    const jumpButton = this.add.text(width - 100, height - 50, 'Jump', {
      fontSize: '32px',
      color: '#fff',
      backgroundColor: '#00000055',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive().setScrollFactor(0);

    jumpButton.on('pointerdown', () => {
      this.cursors.up.isDown = true;
      // We can add a small visual feedback for the press
      jumpButton.setAlpha(0.7);
    });
    jumpButton.on('pointerout', () => {
      this.cursors.up.isDown = false;
      jumpButton.setAlpha(1.0);
    });

    jumpButton.on('pointerup', () => {
      this.cursors.up.isDown = false;
    });

    // --- LEFT BUTTON ---
    const leftButton = this.add.text(100, height - 50, 'Left', {
      fontSize: '32px',
      color: '#fff',
      backgroundColor: '#00000055',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive().setScrollFactor(0);

    leftButton.on('pointerdown', () => {
      this.cursors.left.isDown = true;
      this.cursors.right.isDown = false; // Ensure only one is active
    });

    leftButton.on('pointerover', () => {
      // If finger is down and slides over, activate this button
      if (this.input.activePointer.isDown) {
        this.cursors.left.isDown = true;
        this.cursors.right.isDown = false;
      }
    });

    leftButton.on('pointerout', () => {
      this.cursors.left.isDown = false;
    });

    leftButton.on('pointerup', () => {
      this.cursors.left.isDown = false;
    });

    // --- RIGHT BUTTON ---
    const rightButton = this.add.text(250, height - 50, 'Right', {
      fontSize: '32px',
      color: '#fff',
      backgroundColor: '#00000055',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive().setScrollFactor(0);

    rightButton.on('pointerdown', () => {
      this.cursors.right.isDown = true;
      this.cursors.left.isDown = false; // Ensure only one is active
    });

    rightButton.on('pointerover', () => {
      if (this.input.activePointer.isDown) {
        this.cursors.right.isDown = true;
        this.cursors.left.isDown = false;
      }
    });

   rightButton.on('pointerout', () => {
      this.cursors.right.isDown = false;
    });

    rightButton.on('pointerup', () => {
      this.cursors.right.isDown = false;
    });
  }

}