export const pageVariants = {
    initial: { opacity: 0, y: 16, scale: 0.995 },
    enter:   { opacity: 1, y: 0, scale: 1 },
    exit:    { opacity: 0, y: -8, scale: 0.995 },
};

export const pageTransition = {
    enter: { duration: 0.45, easing: [0.2, 0.8, 0.2, 1] },
    exit:  { duration: 0.28, easing: "ease-in" },
};
