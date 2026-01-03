import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";

import './index.scss'
import "@src/apps/web/WebApp.scss"

// 必要時のみ読み出し
// import WebApp from '@src/apps/web/WebApp.jsx'
const WebApp = lazy(() => import('@src/apps/web/WebApp.jsx'));
// import AdminApp from '@src/apps/admin/AdminApp.jsx'
const AdminApp = lazy(() => import('@src/apps/admin/AdminApp.jsx'));

const isAdminHost = window.location.hostname.startsWith("admin");

createRoot(document.getElementById('root')).render(
  <StrictMode> {/* StrictMode is a tool for highlighting potential problems in an application. It activates additional checks and warnings for its descendants. Note that StrictMode does not render any visible UI. It only activates checks and warnings for its descendants. */}
    <BrowserRouter>
      <Suspense fallback={<div>Loading...🍯</div>}>　{/* suspense is for lazy loading components. */}
        {isAdminHost ? <AdminApp /> : <WebApp />}
      </Suspense>
    </BrowserRouter>
  </StrictMode>
)
