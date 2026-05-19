import { motion, useReducedMotion } from "motion/react";
import "./AppLoading.scss";

const riseTransition = {
    duration: 2,
    ease: [0.22, 1, 0.36, 1],
};

const waveBackTransition = {
    duration: 2.8,
    ease: "easeInOut",
    repeat: Infinity,
    repeatType: "mirror",
};

const waveFrontTransition = {
    duration: 2.1,
    ease: "easeInOut",
    repeat: Infinity,
    repeatType: "mirror",
};

function Wave({ className, pathClassName }) {
    return (
        <svg
            className={className}
            viewBox="0 0 1440 160"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <path
                className={pathClassName}
                d="M0,96L48,90.7C96,85,192,75,288,74.7C384,75,480,85,576,90.7C672,96,768,96,864,88C960,80,1056,64,1152,64C1248,64,1344,80,1392,88L1440,96L1440,160L1392,160C1344,160,1248,160,1152,160C1056,160,960,160,864,160C768,160,672,160,576,160C480,160,384,160,288,160C192,160,96,160,48,160L0,160Z"
            />
        </svg>
    );
}

export default function AppLoading({ label = "Loading...", className = "" }) {
    const reduce = useReducedMotion();
    const rootClassName = className ? `app-loading ${className}` : "app-loading";

    return (
        <div className={rootClassName} role="status" aria-live="polite" aria-busy="true">
            <div className="app-loading__backdrop" />

            <motion.div
                className="app-loading__fill"
                initial={{ height: reduce ? "100%" : "0%" }}
                animate={{ height: "100%" }}
                transition={reduce ? { duration: 0 } : riseTransition}
            >
                <div className="app-loading__surface">
                    <motion.div
                        className="app-loading__wave-wrap app-loading__wave-wrap--back"
                        animate={reduce ? undefined : { x: ["0%", "-7%", "0%"] }}
                        transition={reduce ? undefined : waveBackTransition}
                    >
                        <Wave className="app-loading__wave" pathClassName="app-loading__wave-path app-loading__wave-path--back" />
                    </motion.div>

                    <motion.div
                        className="app-loading__wave-wrap app-loading__wave-wrap--front"
                        animate={reduce ? undefined : { x: ["0%", "6%", "0%"] }}
                        transition={reduce ? undefined : waveFrontTransition}
                    >
                        <Wave className="app-loading__wave" pathClassName="app-loading__wave-path app-loading__wave-path--front" />
                    </motion.div>

                    <div className="app-loading__glow" />
                </div>
            </motion.div>

            <div className="app-loading__content">
                <span className="app-loading__brand">劇団はたらきばち</span>
                <strong className="app-loading__label">{label}</strong>
            </div>
        </div>
    );
}
