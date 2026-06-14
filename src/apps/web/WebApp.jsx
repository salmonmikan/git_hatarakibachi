import { useState, useRef, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import About from "./pages/Aboutus.jsx";
import Stage from "./pages/Stage.jsx";
import Contact from "./pages/Contact.jsx";
import Home from "./pages/Home.jsx";
import Member from "./pages/Member.jsx";
import Scenario from "./pages/Scenario.jsx";
import PostDetail from "./pages/PostDetail.jsx";
import PerformanceDetail from "./pages/PerformanceDetail.jsx";
import NewsDetail from "./pages/NewsDetail.jsx";
import TicketReservation from "./pages/TicketReservation.jsx";
import ScrollToTop from "@src/components/ScrollToTop.jsx";
import FloatingLinks from "@src/components/FloatingLinks.jsx";
import { AnimatePresence } from "framer-motion";
import './WebApp.scss'
import BackToTop from '@src/components/BackToTop.jsx';
import NotFound from '@src/components/NotFound.jsx';
import VisualEditing from '@src/components/VisualEditing.jsx';
import { trackPageView } from '@src/utils/analytics.js';
// import supabase from './utils/supabase.ts'

function WebApp() {
  const location = useLocation();
  const mainRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const [navHidden, setNavHidden] = useState(false);

  useEffect(() => {
    function onScroll() {
      const currentY = window.scrollY;
      const isScrollingDown = currentY > lastScrollYRef.current;

      if (currentY <= 24) {
        setNavHidden(false);
      } else if (isScrollingDown && currentY - lastScrollYRef.current > 8) {
        setNavHidden(true);
      } else if (!isScrollingDown && lastScrollYRef.current - currentY > 8) {
        setNavHidden(false);
      }

      lastScrollYRef.current = currentY;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    trackPageView({
      pathname: location.pathname,
      title: document.title,
    });
  }, [location.pathname]);

  return (
    <div className="web-shell">
      <ScrollToTop />
      <VisualEditing />
      <header className={navHidden ? "is-nav-hidden" : ""}>
        <nav className="main-nav">
          <div className="nav-left">
            <img
              src="/hatarakibachi_logo.jpg"
              srcSet="/hatarakibachi_logo-64.jpg 1x, /hatarakibachi_logo-128.jpg 2x"
              className="logo"
              width={64}
              height={64}
              alt="Hatarakibachi Logo"
            />
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
            <li><NavLink to="/about" className={({ isActive }) => isActive ? "active" : ""} data-gtm-category="navigation" data-gtm-action="click" data-gtm-label="about" data-gtm-location="global_nav" data-gtm-type="internal_link">About</NavLink></li>
            <li><NavLink to="/member" className={({ isActive }) => isActive ? "active" : ""} data-gtm-category="navigation" data-gtm-action="click" data-gtm-label="member" data-gtm-location="global_nav" data-gtm-type="internal_link">Member</NavLink></li>
            <li><NavLink to="/stage" className={({ isActive }) => isActive ? "active" : ""} data-gtm-category="navigation" data-gtm-action="click" data-gtm-label="stage" data-gtm-location="global_nav" data-gtm-type="internal_link">Stage</NavLink></li>
            <li><NavLink to="/scenario" className={({ isActive }) => isActive ? "active" : ""} data-gtm-category="navigation" data-gtm-action="click" data-gtm-label="scenario" data-gtm-location="global_nav" data-gtm-type="internal_link">Scenario</NavLink></li>
            <li><NavLink to="/contact" className={({ isActive }) => isActive ? "active" : ""} data-gtm-category="navigation" data-gtm-action="click" data-gtm-label="contact" data-gtm-location="global_nav" data-gtm-type="internal_link">Contact</NavLink></li>
          </ul>
        </nav>
      </header>
      <FloatingLinks behavior="fixed" /> {/* fixed or "sticky" */}
      <main className="content" id="main-content" ref={mainRef}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home onEntered={() => mainRef.current?.focus()} />} />
            <Route path="about" element={<About onEntered={() => mainRef.current?.focus()} />} />
            <Route path="member" element={<Member onEntered={() => mainRef.current?.focus()} />} />
            <Route path="stage" element={<Stage onEntered={() => mainRef.current?.focus()} />} />
            <Route path="scenario" element={<Scenario onEntered={() => mainRef.current?.focus()} />} />
            <Route path="contact" element={<Contact onEntered={() => mainRef.current?.focus()} />} />
            <Route path="post/:slug" element={<PostDetail onEntered={() => mainRef.current?.focus()} />} />
            <Route path="performance/:slug" element={<PerformanceDetail onEntered={() => mainRef.current?.focus()} />} />
            <Route path="news/:slug" element={<NewsDetail onEntered={() => mainRef.current?.focus()} />} />
            <Route path="tickets/:slug" element={<TicketReservation onEntered={() => mainRef.current?.focus()} />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      {/* <pre>{JSON.stringify(todos, null, 2)}</pre> */}
      <p className="read-the-docs">
        {`©2025-2026 hatarakibachi All rights reserved. \n Built with Cloudflare Pages.`}
      </p>
      <BackToTop />
    </div>
  )
}

export default WebApp
