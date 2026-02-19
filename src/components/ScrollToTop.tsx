import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

let pendingScrollRestore: number | null = null;

/** Called by PageTransition after entrance animation completes */
export const flushPendingScroll = () => {
  if (pendingScrollRestore !== null) {
    const target = pendingScrollRestore;
    pendingScrollRestore = null;

    // Try immediately, then retry after a short delay to handle async content
    const attempt = (retries: number) => {
      window.scrollTo({ top: target, behavior: "instant" });
      if (retries > 0 && Math.abs(window.scrollY - target) > 10) {
        requestAnimationFrame(() => attempt(retries - 1));
      }
    };
    // First attempt after a microtask to let React render
    requestAnimationFrame(() => attempt(5));
  }
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathRef = useRef(pathname);

  // Continuously save scroll position (debounced)
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        sessionStorage.setItem(`scroll:${pathname}`, window.scrollY.toString());
      }, 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [pathname]);

  // Save position immediately before path changes
  useEffect(() => {
    return () => {
      sessionStorage.setItem(`scroll:${prevPathRef.current}`, window.scrollY.toString());
      prevPathRef.current = pathname;
    };
  }, [pathname]);

  // On route change, decide scroll behavior
  useEffect(() => {
    if (navType === "POP") {
      const saved = sessionStorage.getItem(`scroll:${pathname}`);
      pendingScrollRestore = saved !== null ? parseInt(saved, 10) : 0;
    } else {
      pendingScrollRestore = null;
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname, navType]);

  return null;
};

export default ScrollToTop;
