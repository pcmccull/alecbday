import Phaser from 'phaser';
import GameScene from './GameScene';
import GameOverScene from './scenes/GameOverScene';

import { SETTINGS } from './settings';

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  characterFrameWidth: 768,
  characterFrameHeight: 448,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: SETTINGS.PHYSICS.GRAVITY },
      debug: false,
    },
  },
  scene: [
    GameScene,
    GameOverScene
  ],
};

const game = new Phaser.Game(config);