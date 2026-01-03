import { useOutletContext } from "react-router-dom";

// ラッパー。
export function useAdminCtx() {
    return useOutletContext();
}
