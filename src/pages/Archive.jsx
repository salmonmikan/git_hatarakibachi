import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react"
import { pageVariants, pageTransition } from "../assets/_pageVariants.js";

import supabase from '../utils/supabase.ts'

export default function Archive() {
    const reduce = useReducedMotion();
    const [archives, setArchives] = useState([]);

    useEffect(() => {
        async function getArchiveURLs() {
            const { data, error } = await supabase.from('archive_urls').select('*').order('id', { ascending: true });
            // console.log('supabase select ->', { data, error });
            setArchives(data);
        }

        getArchiveURLs()
    }, [])

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
                <h2 id="about-title">Archive</h2>
                {archives?.length ?
                    archives.map((archive) => (
                        <div key={archive.id}>
                            <a href={archive.url}>
                                {archive.title}
                            </a>
                        </div>
                    )) :
                    <p>アーカイブはありません</p>
                }
            </section>
        </motion.section>
    );
}