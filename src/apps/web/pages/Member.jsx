import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react"
import { pageVariants, pageTransition } from "@src/assets/_pageVariants.js";
import MemberCard from "@src/components/MemberCard.jsx";
import MemberModal from "@src/components/MemberModal.jsx";
import './Member.scss'

import supabase from '@src/utils/supabase.ts'


export default function Member() {
    const reduce = useReducedMotion();
    const [selected, setSelected] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // supabaseから情報を取得、ページ読み込み時に一度だけ実行
    useEffect(() => {
        function groupByYear(credits = []) {
            const byYear = credits.reduce((acc, c) => {
                const y = c.credit_date?.slice(0, 4) ?? 'unknown';
                (acc[y] ??= []).push(c);
                return acc;
            }, {});

            // 年の中は新しい順（文字列でも YYYY-MM-DD なら比較できる）
            for (const y of Object.keys(byYear)) {
                byYear[y].sort((a, b) => (b.credit_date ?? '').localeCompare(a.credit_date ?? ''));
            }

            return byYear;
        }

        async function getMembers() {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('members')
                .select(`
                    *,
                    credits:credits (
                        id,
                        credit_title,
                        credit_role,
                        credit_date,
                        deleted_at
                    )
                `)
                .is("credits.deleted_at", null)
                .order('id', { ascending: true });

            if (error) {
                console.error('supabase select error ->', error);
                setMembers([]);
                setError(error.message ?? '読み込みに失敗しました');
            } else {
                setMembers((data ?? []).map(m => ({
                    ...m,
                    creditsByYear: groupByYear(m.credits ?? []),
                })));
            }
            setLoading(false);
        }

        getMembers()
    }, [])


    return (
        <motion.section
            className="page"
            initial={reduce ? false : "initial"}
            animate="enter"
            exit="exit"
            variants={pageVariants}
            transition={reduce ? { duration: 0 } : pageTransition}
            onAnimationComplete={() => {
                if (typeof onEntered === "function") onEntered();
            }}
        >
            <section aria-labelledby="about-title">
                <h2 id="about-title">Member</h2>
                {!loading && <p>各劇団員の画像から、詳細をご覧いただけます。</p>}

                {/* DB接続中・エラー時表示 */}
                {loading && <p>読み込み中...</p>}
                {error && <p className="error">{error}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((m) => (
                        <MemberCard
                            key={m.id || m.name}
                            {...m}
                            onOpen={() => setSelected(m)}   // モーダル開く
                        />
                    ))}
                </div>
                <MemberModal
                    open={!!selected}
                    member={selected}
                    photoUrl={selected?.photoUrl_2 || selected?.photoUrl}
                    onClose={() => setSelected(null)}
                />
                {!loading && <p>And More...</p>}
            </section>
        </motion.section>
    );
}

// id, name, photoUrl, role:役割, bio:一言, age, height:身長, birthplace:出身地, join:入団年, hobbie:趣味, skill:特技
// 将来的にDBへ移行→ supabaseに移行済み