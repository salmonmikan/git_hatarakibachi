import { useNavigate } from "react-router-dom";
import supabase from '@src/utils/supabase.ts'

export default function LogoutButton() {
    const nav = useNavigate();

    return (
        <button
            onClick={async () => {
                await supabase.auth.signOut();
                nav("/login", { replace: true });
            }}
        >
            Logout
        </button>
    );
}
