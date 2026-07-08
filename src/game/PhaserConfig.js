import Phaser from 'phaser'
import { MainScene } from './scenes/MainScene.js'

export function getPhaserConfig(parent) {
  return {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent,
    backgroundColor: '#0a0a0f',
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 650 }, debug: false }
    },
    scene: [MainScene]
  }
}
