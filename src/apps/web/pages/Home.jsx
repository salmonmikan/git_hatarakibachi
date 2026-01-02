import { motion, useReducedMotion } from "motion/react"
import { pageVariants, pageTransition } from "@src/assets/_pageVariants.js";
import NewsList from "@src/components/NewsList.jsx";
import './Home.scss'

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
            <section aria-labelledby="home-section">
                <p>はたらきばち準備中...</p>
                <p>最新の情報は各種SNSをご覧ください</p>
                {/* 公演情報について */}
                <h2 className="home-title">公演情報</h2>
                <p>現在、公演情報はありません</p>
                {/* ニュース一覧の画面 */}
                <h2 className="home-title">News Release</h2>
                {/* <NewsList /> */}
            </section>
        </motion.section>
    );
}