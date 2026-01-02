import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/DashBoard.jsx";
import RequireAuth from "@src/components/RequireAuth";
import NotFound from '@src/components/NotFound.jsx';

export default function AdminApp() {
  return (
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
  );
}