import { motion, useReducedMotion } from "motion/react"
import { pageVariants, pageTransition } from "@src/assets/_pageVariants.js";

export default function About() {
    const reduce = useReducedMotion();

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
                <h2 id="about-title">About Us</h2>
                <p>東京･千葉を拠点に活動する、<br />「ずっと演劇をしていたい」<br />人たちの社会人劇団。</p>
                <p>現在活動のため準備中……</p>
            </section>
        </motion.section>
    );
}