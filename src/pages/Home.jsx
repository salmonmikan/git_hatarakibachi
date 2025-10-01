import { motion, useReducedMotion } from "motion/react"
import { pageVariants, pageTransition } from "../assets/_pageVariants.js";
import NewsList from "../components/NewsList.jsx";

export default function Home() {
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
                <h3 id="about-title">最新情報</h3>
                {/* <p>最新情報</p> */}
                {/* ニュース一覧の画面 */}
                <NewsList />
            </section>
        </motion.section>
    );
}