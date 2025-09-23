import { motion, useReducedMotion } from "motion/react"
import { pageVariants, pageTransition } from "../assets/_pageVariants.js";

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
            <p>準備中の劇団です</p>
        </section>
        </motion.section>
    );
}