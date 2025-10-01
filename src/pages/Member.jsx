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
                    onClose={() => setSelected(null)}
                />
            </section>
        </motion.section>
    );
}

const members = [
    { id: 1, name: 'たちばな', role: '演出・脚本・役者・制作', bio: '', photoUrl: '' },
    { id: 2, name: 'ゆうき', role: '役者・制作', bio: '' },
    // ...
];