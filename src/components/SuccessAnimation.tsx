import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const SuccessAnimation = () => {
  return (
    <div className="relative w-24 h-24 mx-auto">
      {/* Confetti particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: ["hsl(var(--primary))", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"][i % 6],
            top: "50%",
            left: "50%",
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{
            x: Math.cos((i * 30 * Math.PI) / 180) * 60,
            y: Math.sin((i * 30 * Math.PI) / 180) * 60,
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0],
          }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        />
      ))}
      {/* Ring burst */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1.8, opacity: [0, 0.5, 0] }}
        transition={{ duration: 0.8, delay: 0.1 }}
      />
      {/* Main circle */}
      <motion.div
        className="absolute inset-0 bg-emerald-500/10 rounded-full flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 10, stiffness: 150, delay: 0.3 }}
        >
          <CheckCircle size={48} className="text-emerald-500" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SuccessAnimation;
