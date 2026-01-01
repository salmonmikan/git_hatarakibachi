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
                <h2 id="about-title"></h2>
                <p>はたらきばち準備中...</p>
                <p>最新の情報は各種SNSをご覧ください</p>
                {/* ニュース一覧の画面 */}
                <NewsList />
            </section>
        </motion.section>
    );
}