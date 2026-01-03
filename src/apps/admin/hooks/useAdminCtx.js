import { useOutletContext } from "react-router-dom";

// ラッパー。
// from AdminLayout.jsx
export function useAdminCtx() {
    return useOutletContext();
}
