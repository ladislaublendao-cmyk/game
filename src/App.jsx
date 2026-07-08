import GameCanvas from './components/GameCanvas.jsx'
import HUD from './components/HUD.jsx'

export default function App() {
  return (
    <div className="game-wrapper">
      <GameCanvas />
      <HUD />
    </div>
  )
}
