import { useState } from 'react'
import { Routes, Route, NavLink } from "react-router-dom";
import About from "./pages/Aboutus.jsx";
import Archive from "./pages/Archive.jsx";
import Contact from "./pages/Contact.jsx";
import Home from "./pages/home.jsx";
import './App.scss'

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
        <header>
          <nav className="main-nav">
            <div className="nav-left">
              <img src="/hatarakibachi_logo.jpg" className="logo" alt="Hatarakibachi Logo" />
            </div>
            <div className="nav-center">
              <NavLink to="/" end className="site-title" aria-label="ホームに戻る">
                劇団 はたらきばち
              </NavLink>
            </div>
            <div className="nav-right">
              {/* <button className="menu-button" aria-label="Menu">
                &#9776;
              </button> */}
            </div>
          </nav>
          {/* 3つのリンクを追加（テキストだけのシンプルなもの） */}
          <nav className="sub-nav">
            <ul className="nav-list">
              {/* <li><NavLink to="/" end className={({isActive}) => isActive ? "active" : ""}>Home</NavLink></li> */}
              <li><NavLink to="/about" className={({isActive}) => isActive ? "active" : ""}>About</NavLink></li>
              <li><NavLink to="/archive" className={({isActive}) => isActive ? "active" : ""}>Archive</NavLink></li>
              <li><NavLink to="/contact" className={({isActive}) => isActive ? "active" : ""}>Contact</NavLink></li>
            </ul>
          </nav>
        </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="archive" element={<Archive />} />
          <Route path="contact" element={<Contact />} />
        </Routes>
      </main>
      <div className="card">
        {/* <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button> */}
        {/* <p>
          develop by React + Vite
        </p> */}
      </div>
      <p className="read-the-docs">
        hatarakibachi
      </p>
    </>
  )
}

export default App
