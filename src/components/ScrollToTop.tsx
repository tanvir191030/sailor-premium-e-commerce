import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

let pendingScrollRestore: number | null = null;

/** Called by PageTransition after entrance animation completes */
export const flushPendingScroll = () => {
  if (pendingScrollRestore !== null) {
    window.scrollTo({ top: pendingScrollRestore, behavior: "instant" });
    pendingScrollRestore = null;
  }
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Continuously save scroll position (debounced)
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        sessionStorage.setItem(`scroll:${pathname}`, window.scrollY.toString());
      }, 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      // Save final position on unmount
      sessionStorage.setItem(`scroll:${pathname}`, window.scrollY.toString());
    };
  }, [pathname]);

  // On route change, decide scroll behavior
  useEffect(() => {
    if (navType === "POP") {
      const saved = sessionStorage.getItem(`scroll:${pathname}`);
      // Queue restore — PageTransition will flush after animation
      pendingScrollRestore = saved !== null ? parseInt(saved, 10) : 0;
    } else {
      pendingScrollRestore = null;
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname, navType]);

  return null;
};

export default ScrollToTop;
