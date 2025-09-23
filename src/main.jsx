import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById('root')).render(
  <StrictMode> {/* StrictMode is a tool for highlighting potential problems in an application. It activates additional checks and warnings for its descendants. Note that StrictMode does not render any visible UI. It only activates checks and warnings for its descendants. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
