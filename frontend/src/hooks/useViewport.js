import { useEffect, useState } from "react";

const readViewport = () => {
  if (typeof window === "undefined") {
    return {
      width: 1280,
      height: 800,
      kind: "desktop",
      isMobile: false,
      isTablet: false,
      isDesktop: true
    };
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const kind = width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";
  return {
    width,
    height,
    kind,
    isMobile: kind === "mobile",
    isTablet: kind === "tablet",
    isDesktop: kind === "desktop"
  };
};

export function useViewport() {
  const [viewport, setViewport] = useState(readViewport);
  useEffect(() => {
    const update = () => setViewport(readViewport());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);
  return viewport;
}
