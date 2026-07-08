import { useEffect, useState, useRef } from 'react'
import { EventBus } from '../game/EventBus.js'

const ABILITY_DEFS = [
  { id: 'shield',   key: 'SPACE', name: 'Escudo',    maxCd: 3000, color: '#ffd700', glow: '#ffee44' },
  { id: 'flamejet', key: 'W',     name: 'Flame Jet', maxCd: 700,  color: '#ff6622', glow: '#ff4400' },
  { id: 'fireball', key: 'Q',     name: 'Fireball',  maxCd: 1400, color: '#ff2200', glow: '#ff0000' },
  { id: 'melee',    key: 'E',     name: 'Melee',     maxCd: 800,  color: '#ffaa00', glow: '#ffcc00' },
]

export default function HUD() {
  const [hp,       setHp]       = useState(100)
  const [mp,       setMp]       = useState(100)
  const [score,    setScore]    = useState(0)
  const [wave,     setWave]     = useState('Onda 1')
  const [endGame,  setEndGame]  = useState(null)
  const [waveMsg,  setWaveMsg]  = useState(null)
  const [cooldowns, setCooldowns] = useState({ flamejet: 0, fireball: 0, melee: 0 })

  useEffect(() => {
    const onHp    = v => setHp(Math.max(0, v))
    const onMp    = v => setMp(Math.max(0, v))
    const onScore = v => setScore(v)
    const onWave  = ({ label }) => setWave(label)
    const onEnd   = data => setEndGame(data)
    const onTrans = ({ prevLabel }) => {
      setWaveMsg(`✓ ${prevLabel} Completa!`)
      setTimeout(() => setWaveMsg(null), 3000)
    }
    const onCooldowns = cd => setCooldowns(cd)

    EventBus.on('player-hp',       onHp)
    EventBus.on('player-mana',     onMp)
    EventBus.on('score-change',    onScore)
    EventBus.on('wave-change',     onWave)
    EventBus.on('game-over',       onEnd)
    EventBus.on('wave-transition', onTrans)
    EventBus.on('cooldowns',       onCooldowns)

    return () => {
      EventBus.off('player-hp',       onHp)
      EventBus.off('player-mana',     onMp)
      EventBus.off('score-change',    onScore)
      EventBus.off('wave-change',     onWave)
      EventBus.off('game-over',       onEnd)
      EventBus.off('wave-transition', onTrans)
      EventBus.off('cooldowns',       onCooldowns)
    }
  }, [])

  return (
    <>
      {/* Barras HP / MP */}
      <div className="hud">
        <div className="bar-row">
          <span>HP</span>
          <div className="bar-bg">
            <div className="bar-fill hp" style={{ width: `${hp}%` }} />
          </div>
          <span className="bar-val">{Math.round(hp)}</span>
        </div>
        <div className="bar-row">
          <span>MP</span>
          <div className="bar-bg">
            <div className="bar-fill mp" style={{ width: `${mp}%` }} />
          </div>
          <span className="bar-val">{Math.round(mp)}</span>
        </div>
      </div>

      {/* Ecrã de fim */}
      {endGame && (
        <div className="end-screen">
          <h1 className={endGame.victory ? 'victory' : 'gameover'}>
            {endGame.victory ? '🏆 VITÓRIA!' : '💀 GAME OVER'}
          </h1>
          <p>Score Final: {endGame.score}</p>
          <button onClick={() => window.location.reload()}>Jogar Novamente</button>
        </div>
      )}
    </>
  )
}
