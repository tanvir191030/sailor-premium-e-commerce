import { useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const scrollPositions = new Map<string, number>();
let pendingRestore: number | null = null;
let currentNavType: "PUSH" | "POP" | "REPLACE" = "PUSH";

/** Call from PageTransition onAnimationComplete to restore scroll after animation */
export const restoreScrollAfterTransition = (pathname: string) => {
  if (currentNavType === "POP" && pendingRestore !== null) {
    window.scrollTo(0, pendingRestore);
    pendingRestore = null;
  }
};

export const useScrollRestore = () => {
  const { pathname } = useLocation();

  return useCallback(() => {
    restoreScrollAfterTransition(pathname);
  }, [pathname]);
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const prevPath = useRef(pathname);

  // Update module-level nav type
  currentNavType = navType;

  // Save scroll position when leaving a page
  useEffect(() => {
    return () => {
      scrollPositions.set(prevPath.current, window.scrollY);
      prevPath.current = pathname;
    };
  }, [pathname]);

  useEffect(() => {
    if (navType === "POP") {
      const saved = scrollPositions.get(pathname);
      pendingRestore = saved ?? 0;
      // Don't scroll here — PageTransition will call restoreScrollAfterTransition
    } else {
      pendingRestore = null;
      window.scrollTo(0, 0);
    }
  }, [pathname, navType]);

  return null;
};

export default ScrollToTop;
