export const SETTINGS = {
  PLAYER: {
    SPEED: 160,
    JUMP_VELOCITY: -230,
    BOUNCE: 0.2,
    COLLIDER: {
      WIDTH: 50,
      HEIGHT: 240,
      OFFSET_X: 768/2 - 30,
      OFFSET_Y: 448/2-105,
    },
    STOMP_BOUNCE: -400
  },
  PHYSICS: {
    GRAVITY: 300,
  },
  SCROLL: {
    THRESHOLD_RATIO: 0.25, // Represents 1/4 of the screen width
    SPEED: 2.67, // This should be close to PLAYER.SPEED / 60fps to feel 1:1
  },
  CHARACTER: {
    WIDTH: 768,
    HEIGHT: 448
  },
  ANIMATIONS: {
    IDLE_FRAMERATE: 20,
    JUMP_FRAMERATE: 12,
    RUN_FRAMERATE: 10,
  },

  COLLECTIBLES: {
    PRESENT_SCORE: 1,
    TOTAL_PRESENTS: 12,
    SPAWN_INTERVAL: 5000, // Time in ms between present spawns
    TOTAL_NEEDED: 10
  },
  ENEMIES: {
    SPAWN_INTERVAL: 3000, // Time in ms between enemy spawns
    SPEED: 100,
  }
};