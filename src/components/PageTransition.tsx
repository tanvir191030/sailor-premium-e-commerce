import { motion, type Easing } from "framer-motion";
import { ReactNode } from "react";

const ease: Easing = [0.25, 0.1, 0.25, 1];

const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.4, ease }}
  >
    {children}
  </motion.div>
);

export default PageTransition;
