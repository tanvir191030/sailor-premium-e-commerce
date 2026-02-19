import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const scrollPositions = new Map<string, number>();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const prevPath = useRef(pathname);

  // Save scroll position before leaving
  useEffect(() => {
    const save = () => {
      scrollPositions.set(prevPath.current, window.scrollY);
    };
    window.addEventListener("beforeunload", save);
    return () => {
      save();
      window.removeEventListener("beforeunload", save);
      prevPath.current = pathname;
    };
  }, [pathname]);

  useEffect(() => {
    if (navType === "POP") {
      // Back/forward — restore saved position
      const saved = scrollPositions.get(pathname);
      if (saved !== undefined) {
        requestAnimationFrame(() => window.scrollTo(0, saved));
      }
    } else {
      // New navigation — scroll to top
      window.scrollTo(0, 0);
    }
  }, [pathname, navType]);

  return null;
};

export default ScrollToTop;
