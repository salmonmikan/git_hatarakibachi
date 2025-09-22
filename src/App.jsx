import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.scss'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <header>
          {/* 右にハンバーガーメニュー、左にロゴ、中央に劇団名 */}
          <nav className="nav">
            <div className="nav-left">
              <img src="/hatarakibachi_logo.jpg" className="logo" alt="Hatarakibachi Logo" />
            </div>
            <div className="nav-center">
              <h1>劇団 はたらきばち</h1>
            </div>
            <div className="nav-right">
              <button className="menu-button" aria-label="Menu">
                &#9776;
              </button>
            </div>
          </nav>
            
        </header>
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          develop by React + Vite
        </p>
      </div>
      <p className="read-the-docs">
        hatarakibachi
      </p>
    </>
  )
}

export default App
