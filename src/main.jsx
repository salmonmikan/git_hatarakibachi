import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import WebApp from '@/apps/web/WebApp.jsx'
import AdminApp from '@/apps/admin/AdminApp.jsx'
import { BrowserRouter } from "react-router-dom";

const isAdminHost = window.location.hostname.startsWith("admin");

createRoot(document.getElementById('root')).render(
  <StrictMode> {/* StrictMode is a tool for highlighting potential problems in an application. It activates additional checks and warnings for its descendants. Note that StrictMode does not render any visible UI. It only activates checks and warnings for its descendants. */}
    <BrowserRouter>
      {isAdminHost ? <AdminApp /> : <WebApp />}
    </BrowserRouter>
  </StrictMode>
)
