import { lazy, StrictMode, Suspense, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";

import './index.scss'
import "@src/apps/web/WebApp.scss"
import AppLoading from "@src/components/AppLoading.jsx";

const MIN_LOADING_MS = 1500;
const LOADING_FADE_MS = 250;
const isAdminHost = window.location.hostname.startsWith("admin");
const LazyApp = isAdminHost
  ? lazy(() => import('@src/apps/admin/AdminApp.jsx'))
  : lazy(() => import('@src/apps/web/WebApp.jsx'));

function RootApp() {
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);
  const [renderLoadingOverlay, setRenderLoadingOverlay] = useState(true);

  useEffect(() => {
    const fadeTimerId = window.setTimeout(() => {
      setShowLoadingOverlay(false);
    }, MIN_LOADING_MS);
    let removeTimerId = 0;

    removeTimerId = window.setTimeout(() => {
      setRenderLoadingOverlay(false);
    }, MIN_LOADING_MS + LOADING_FADE_MS);

    return () => {
      window.clearTimeout(fadeTimerId);
      window.clearTimeout(removeTimerId);
    };
  }, []);

  return (
    <>
      <Suspense fallback={<AppLoading />}>
        <LazyApp />
      </Suspense>
      {renderLoadingOverlay && <AppLoading className={showLoadingOverlay ? "" : "is-fading-out"} />}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode> {/* StrictMode is a tool for highlighting potential problems in an application. It activates additional checks and warnings for its descendants. Note that StrictMode does not render any visible UI. It only activates checks and warnings for its descendants. */}
    <BrowserRouter>
      <RootApp />
    </BrowserRouter>
  </StrictMode>
)
