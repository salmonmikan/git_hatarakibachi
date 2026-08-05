import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react"
import { pageVariants, pageTransition } from "@src/assets/_pageVariants.js";
import { trackDataLayerEvent } from "@src/utils/analytics.js";

import supabase from '@src/utils/supabase.ts'

export default function Stage({ onEntered }) {
    const reduce = useReducedMotion();
    const [stages, setStages] = useState([]);

    useEffect(() => {
        async function getStageEntries() {
            const { data, error } = await supabase.from('archive_urls').select('*').order('id', { ascending: true });
            // console.log('supabase select ->', { data, error });
            setStages(data);
        }

        getStageEntries()
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
                <h2 id="about-title">Stage</h2>
                {stages?.length ?
                    stages.map((stage) => (
                        <div key={stage.id}>
                            <a
                                href={stage.url}
                                onClick={() => trackDataLayerEvent("stage_external_click", {
                                    stage_id: stage.id != null ? String(stage.id) : undefined,
                                    source_location: "stage",
                                    destination_type: "external_stage",
                                })}
                                data-gtm-category="content"
                                data-gtm-action="click"
                                data-gtm-label="stage_link"
                                data-gtm-location="stage"
                                data-gtm-type="external_stage"
                            >
                                {stage.title}
                            </a>
                        </div>
                    )) :
                    <p>公演情報はありません</p>
                }
            </section>
        </motion.section>
    );
}
