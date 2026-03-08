import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AnimatedCtaButton from "./AnimatedCtaButton";

interface HeroSlide {
  id: string;
  image: string;
  label: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
}

const HeroSlider = ({ slides }: HeroSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);
  const preloadedRef = useRef<Set<string>>(new Set());

  // Only wait for the FIRST image to load (LCP optimization)
  useEffect(() => {
    if (slides.length === 0) return;
    const img = new Image();
    img.onload = () => setFirstImageLoaded(true);
    img.onerror = () => setFirstImageLoaded(true);
    img.src = slides[0].image;
    // Preload remaining images in background (non-blocking)
    slides.slice(1).forEach((slide) => {
      const bgImg = new Image();
      bgImg.src = slide.image;
      preloadedRef.current.add(slide.image);
    });
  }, [slides]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="w-full aspect-video bg-secondary flex items-center justify-center">
        <p className="text-muted-foreground">No featured products</p>
      </div>
    );
  }

  const contentVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: 0.3, staggerChildren: 0.15 },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-secondary">
      {/* First image rendered as <img> with fetchpriority="high" for LCP */}
      {!firstImageLoaded && (
        <img
          src={slides[0].image}
          alt={slides[0].title}
          fetchPriority="high"
          decoding="sync"
          className="absolute inset-0 w-full h-full object-cover"
          onLoad={() => setFirstImageLoaded(true)}
        />
      )}

      {/* Background Images Layer - Crossfade */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <motion.div
            key={slide.id}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.image})` }}
            initial={false}
            animate={{
              opacity: index === currentIndex ? 1 : 0,
              scale: index === currentIndex ? 1 : 1.05,
            }}
            transition={{
              opacity: { duration: 1, ease: "easeInOut" },
              scale: { duration: 6, ease: "linear" },
            }}
          />
        ))}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 gradient-overlay-left" />

      {/* Content Layer */}
      <div className="relative h-full container mx-auto px-4 md:px-6 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-xl text-white"
          >
            <motion.span variants={itemVariants} className="text-label text-white/80 mb-2 md:mb-4 block text-[10px] md:text-xs">
              {slides[currentIndex].label}
            </motion.span>
            <motion.h2 variants={itemVariants} className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-2 md:mb-6 leading-tight">
              {slides[currentIndex].title}
            </motion.h2>
            <motion.p variants={itemVariants} className="text-xs sm:text-sm md:text-xl font-light leading-relaxed mb-3 md:mb-8 text-white/90 line-clamp-2 md:line-clamp-none">
              {slides[currentIndex].description}
            </motion.p>
            <motion.div variants={itemVariants}>
              <AnimatedCtaButton
                to={slides[currentIndex].ctaLink}
                className="bg-white text-black px-4 py-2 md:px-8 md:py-4 text-[10px] md:text-sm uppercase tracking-[0.15em] font-medium hover:bg-white/90"
              >
                {slides[currentIndex].ctaText}
              </AnimatedCtaButton>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-1.5 md:p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors" aria-label="Previous slide">
            <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
          </button>
          <button onClick={nextSlide} className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-1.5 md:p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors" aria-label="Next slide">
            <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-white w-5 md:w-8" : "w-1.5 md:w-2 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;
