import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminLayout from "./components/AdminLayout.jsx";
import Dashboard from "./pages/DashBoard.jsx";
import AdminMembers from "./pages/AdminMembers.jsx";
import MemberEditModal from "./components/Modal/MemberEditModal.jsx";
import AdminCredits from "./pages/AdminCredits.jsx";
import CreditEditModal from "./components/Modal/CreditEditModal.jsx";

import RequireAuth from "./components/RequireAuth";
import NotFound from '@src/components/NotFound.jsx';

export default function AdminApp() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        {/* AdminLayoutは管理画面の共通レイアウトコンポーネント */}
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<AdminMembers />}>
            <Route path=":id" element={<MemberEditModal />} />
          </Route>
          <Route path="credits" element={<AdminCredits />}>
            <Route path=":id" element={<CreditEditModal />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}