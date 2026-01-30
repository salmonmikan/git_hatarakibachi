// src/admin/pages/AdminMembers.jsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAdminCtx } from "../hooks/useAdminCtx";
import "./AdminMembers.scss";

export default function AdminMembers() {
    const ctx = useAdminCtx();
    const { data, error, loading } = ctx.lists.news;

    if (loading) return <div className="admin-members">Loading...</div>;
    if (error) return <div className="admin-members">Error: {error}</div>;

    return (
        <div className="admin-members">
            <h1 className="admin-members__title">Manage News</h1>
            <Link to="new" className="admin-members__link" data-visual="button">
                追加
            </Link>

            <div className="admin-members__list">
                {data.map((d) => {
                    const newsStatus =
                        d.news_status === 1 ? "公開中" :
                        d.news_status === 5 ? "下書き" :
                        d.news_status === 8 ? "非公開" :
                        "不明";

                    const title = d.news_title ?? `member#${d.id}`;

                    return (
                        <Link
                            key={d.id}
                            to={String(d.id)}
                            className="admin-members__link"
                        >
                            <div className="admin-members__name">
                                {`${newsStatus} : ${title}`}
                            </div>
                        </Link>
                    );
                })}
            </div>


            {/* <button className="admin-members__button" type="button" onClick={back}>
                back
            </button> */}

            {/* ここにモーダル（members/:id）が重なる */}
            <Outlet context={ctx} />
        </div>
    );
}
