import Phaser from 'phaser';
let numWins = 0;
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
    this.didWin = false;
  }

  init(data) {
    // Receive the 'won' status from the previous scene
    this.didWin = data.won;
  }

  create() {
    this.canRestart = false;
    const { width, height } = this.scale;
    this.sound.stopAll();

    let gameOverImage;

    if (this.didWin) {
      // Show the win image
      numWins++;
      if (numWins%2 ==0) {
        this.sound.play('win_song', { loop: true })
      } else {
        this.sound.play('win_song2', { loop: true })
      }
      gameOverImage = this.add.image(width / 2, -height / 2, 'gameover_win').setOrigin(0.5).setScale(0.4);
    } else {
       this.sound.play('gameover_lost', { loop: true })
      gameOverImage = this.add.image(width / 2, -height / 2, 'gameover_lost').setOrigin(0.5).setScale(0.4);
    }

    // Add a tween to drop the image into place with a bounce
    this.tweens.add({
      targets: gameOverImage,
      y: height / 2,
      duration: 1200, // A bit longer for a dramatic effect
      ease: 'Bounce.easeOut'
    });

    
    this.time.delayedCall(1400, () => {
       this.canRestart = true;
       this.add.text(width / 2, height - 100, 'Click to Play Again', {
        fontSize: '32px',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.input.once('pointerdown', () => {
        this.scene.start('GameScene');
      });
      this.input.keyboard.once('keydown', () => {
        this.scene.start('GameScene');
      });
    });
  }
}
