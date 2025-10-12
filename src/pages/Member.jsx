import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react"
import { pageVariants, pageTransition } from "../assets/_pageVariants.js";
import MemberCard from "../components/MemberCard.jsx";
import MemberModal from "../components/MemberModal.jsx";
import './Member.scss'


export default function Member() {
    const reduce = useReducedMotion();
    const [selected, setSelected] = useState(null);

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
                {/* <p>メンバー紹介準備中...</p> */}
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
                <p>And More...</p>
            </section>
        </motion.section>
    );
}

// id, name, photoUrl, role:役割, bio:一言, age, height:身長, birthplace:出身地, join:入団年, hobbie:趣味, skill:特技
// 将来的にDBへ移行
const members = [
    {
        id: "1",
        name: "たちばな",
        photoUrl: "img/member/tachibana_body.jpg",
        photoUrl_2: "img/member/tachibana_face.jpg",
        role: "演出・脚本・役者・広報",
        bio: "演劇が大好きで、舞台が大好きで、演じるのが大好きです。舞台上で生き続けたい。",
        age: 23,
        height: 153,
        birthplace: "秋田県",
        join: "2025(立ち上げメンバー)",
        hobbie: "観劇/演劇/物語を書くこと",
        skill: "タイピング/文字起こし"
    },
    {
        id: "2",
        name: "ゆうき",
        photoUrl: "img/member/yuki_body.jpg",
        photoUrl_2: "img/member/yuki_face.jpg",
        role: "役者・広報",
        bio: "",
        age: 24,
        height: 174,
        birthplace: "埼玉県",
        join: "2025(立ち上げメンバー)",
        hobbie: "観劇/イラスト",
        skill: "プログラミング"
    },
    {
        id: "3",
        name: "くりた",
        photoUrl: "",
        photoUrl_2: "img/member/tachibana_face.jpg",
        role: "役者",
        bio: "",
        age: null,
        height: null,
        birthplace: "",
        join: "2025(立ち上げメンバー)",
        hobbie: "",
        skill: ""
    }
];