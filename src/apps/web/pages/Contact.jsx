import { motion, useReducedMotion } from "motion/react"
import { pageVariants, pageTransition } from "@src/assets/_pageVariants.js";

export default function Contact() {
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
                <h2 id="about-title">Contact</h2>
                <p>ご連絡はこちらまでお願いいたします</p>
                <p>hatarakibachi88act★gmail.com</p>
            </section>
            {/* <section aria-labelledby="sns-links">
                <h2 id="about-title">SNS LINK</h2>
                <p>各種SNSでも情報発信中！</p>
                <p>instagram</p>
            </section> */}
        </motion.section>
    );
}