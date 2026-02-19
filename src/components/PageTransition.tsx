import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useScrollRestore } from "./ScrollToTop";

const PageTransition = ({ children }: { children: ReactNode }) => {
  const onTransitionComplete = useScrollRestore();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "opacity, transform" }}
      onAnimationComplete={(definition) => {
        if (definition === "animate") {
          onTransitionComplete();
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
