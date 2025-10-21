import { useState, useRef, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import About from "./pages/Aboutus.jsx";
import Archive from "./pages/Archive.jsx";
import Contact from "./pages/Contact.jsx";
import Home from "./pages/Home.jsx";
import Member from "./pages/Member.jsx";
import Scenario from "./pages/Scenario.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import FloatingLinks from "./components/FloatingLinks.jsx";
import { AnimatePresence } from "framer-motion";
import './App.scss'
import BackToTop from './components/BackToTop.jsx';
// import supabase from './utils/supabase.ts'

function App() {
  const location = useLocation();
  const mainRef = useRef(null);

  return (
    <>
      <ScrollToTop />
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
          </div>
        </nav>
        <nav className="sub-nav">
          <ul className="nav-list">
            {/* <li><NavLink to="/" end className={({isActive}) => isActive ? "active" : ""}>Home</NavLink></li> */}
            <li><NavLink to="/about" className={({ isActive }) => isActive ? "active" : ""}>About</NavLink></li>
            <li><NavLink to="/member" className={({ isActive }) => isActive ? "active" : ""}>Member</NavLink></li>
            <li><NavLink to="/archive" className={({ isActive }) => isActive ? "active" : ""}>Archive</NavLink></li>
            <li><NavLink to="/scenario" className={({ isActive }) => isActive ? "active" : ""}>Scenario</NavLink></li>
            <li><NavLink to="/contact" className={({ isActive }) => isActive ? "active" : ""}>Contact</NavLink></li>
          </ul>
        </nav>
      </header>
      <FloatingLinks behavior="fixed" /> {/* fixed or "sticky" */}
      <main className="content" id="main-content" ref={mainRef} tabIndex={-1}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home onEntered={() => mainRef.current?.focus()} />} />
            <Route path="about" element={<About onEntered={() => mainRef.current?.focus()} />} />
            <Route path="member" element={<Member onEntered={() => mainRef.current?.focus()} />} />
            <Route path="archive" element={<Archive onEntered={() => mainRef.current?.focus()} />} />
            <Route path="scenario" element={<Scenario onEntered={() => mainRef.current?.focus()} />} />
            <Route path="contact" element={<Contact onEntered={() => mainRef.current?.focus()} />} />
          </Routes>
        </AnimatePresence>
      </main>
      {/* <pre>{JSON.stringify(todos, null, 2)}</pre> */}
      <p className="read-the-docs">
        hatarakibachi All rights reserved.
      </p>
      <BackToTop />
    </>
  )
}

export default App
