import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/DashBoard.jsx";
import RequireAuth from "@/components/RequireAuth";

export default function AdminApp() {
  return (
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/*"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}