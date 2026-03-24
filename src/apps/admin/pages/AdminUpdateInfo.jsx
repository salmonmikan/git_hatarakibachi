import { Link, Outlet } from "react-router-dom";
import { useAdminCtx } from "../hooks/useAdminCtx";
import "./admin_view.scss";

export default function AdminUpdateInfo() {
    const ctx = useAdminCtx();
    const { data, error, loading } = ctx.lists.updates;

    if (loading) return <div className="admin-view">Loading...</div>;
    if (error) return <div className="admin-view">Error: {error}</div>;

    return (
        <div className="admin-view">
            <h1 className="admin-view__title">Manage Update Info</h1>
            <Link to="new" className="admin-view__link" data-visual="button">
                追加
            </Link>

            <div className="admin-view__list">
                {data.map((d) => {
                    const title = d.update_title || `update#${d.id}`;
                    const date = d.update_date || "no date";
                    const category = Array.isArray(d.categories) ? d.categories.join(", ") : d.categories;

                    return (
                        <Link
                            key={d.id}
                            to={String(d.id)}
                            className="admin-view__link"
                        >
                            <div className="admin-view__name">
                                {`${date} : ${title} (${category})`}
                            </div>
                        </Link>
                    );
                })}
            </div>

            <Outlet context={ctx} />
        </div>
    );
}
