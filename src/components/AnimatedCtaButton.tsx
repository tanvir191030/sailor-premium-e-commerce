import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useRef, ReactNode } from "react";

interface AnimatedCtaButtonProps {
  to: string;
  children: ReactNode;
  className?: string;
}

const AnimatedCtaButton = ({ to, children, className = "" }: AnimatedCtaButtonProps) => {
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setTimeout(() => setRipple(null), 500);
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="inline-block"
    >
      <Link
        ref={btnRef}
        to={to}
        onClick={handleClick}
        className={`relative overflow-hidden inline-block transition-shadow duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] ${className}`}
      >
        {children}

        {/* Ripple */}
        {ripple && (
          <motion.span
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute rounded-full bg-primary-foreground/30 w-10 h-10 pointer-events-none"
            style={{ left: ripple.x - 20, top: ripple.y - 20 }}
          />
        )}
      </Link>
    </motion.div>
  );
};

export default AnimatedCtaButton;
