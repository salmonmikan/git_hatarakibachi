import { motion, useReducedMotion } from "motion/react"
import { pageVariants, pageTransition } from "@src/assets/_pageVariants.js";
import NewsList from "@src/components/NewsList.jsx";
import FeaturedArticles from "@src/components/FeaturedArticles.jsx";
import './Home.scss'

export default function Home({ onEntered }) {
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
            <section aria-labelledby="home-section">
                {/* <p>はたらきばち準備中...</p> */}
                {/* 注目情報の画面 */}
                <FeaturedArticles />
                {/* ニュース一覧の画面 */}
                <NewsList />
            </section>
        </motion.section>
    );
}