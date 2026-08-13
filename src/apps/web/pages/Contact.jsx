import { motion, useReducedMotion } from "motion/react"
import { pageVariants, pageTransition } from "@src/assets/_pageVariants.js";
import { trackDataLayerEvent } from "@src/utils/analytics.js";

export default function Contact({ onEntered }) {
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
                <p>ご連絡はこちらまでお願い致します。</p>
                <p>hatarakibachi88act★gmail.com</p>
                <p>
                    <a
                        href="mailto:hatarakibachi88act@gmail.com"
                        onClick={() => trackDataLayerEvent("contact_email_click", {
                            contact_channel: "email",
                            source_location: "contact",
                        })}
                        data-gtm-category="social"
                        data-gtm-action="click"
                        data-gtm-label="email"
                        data-gtm-location="contact"
                        data-gtm-type="mailto_link"
                    >
                        Mail
                    </a>
                </p>
            </section>
            {/* <section aria-labelledby="sns-links">
                <h2 id="about-title">SNS LINK</h2>
                <p>各種SNSでも情報発信中！</p>
                <p>instagram</p>
            </section> */}
        </motion.section>
    );
}
