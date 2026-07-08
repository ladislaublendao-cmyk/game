import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { getPhaserConfig } from '../game/PhaserConfig.js'

let gameInstance = null

export default function GameCanvas() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (gameInstance) return

    const config = getPhaserConfig(containerRef.current)
    gameInstance = new Phaser.Game(config)

    return () => {
      if (gameInstance) {
        gameInstance.destroy(true)
        gameInstance = null
      }
    }
  }, [])

  return <div ref={containerRef} id="game-container" />
}
