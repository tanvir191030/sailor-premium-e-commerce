import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
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

// Preload images to prevent white flash
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
};

const HeroSlider = ({ slides }: HeroSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const preloadedRef = useRef<Set<string>>(new Set());

  // Preload all images on mount
  useEffect(() => {
    const loadImages = async () => {
      await Promise.all(slides.map((slide) => preloadImage(slide.image)));
      setImagesLoaded(true);
    };
    if (slides.length > 0) {
      loadImages();
    }
  }, [slides]);

  // Preload adjacent images when index changes
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const nextIndex = (currentIndex + 1) % slides.length;
    const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
    
    [nextIndex, prevIndex].forEach((idx) => {
      const src = slides[idx].image;
      if (!preloadedRef.current.has(src)) {
        preloadImage(src);
        preloadedRef.current.add(src);
      }
    });
  }, [currentIndex, slides]);

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

  // Show loading state until images are ready
  if (!imagesLoaded) {
    return (
      <div className="w-full aspect-video bg-secondary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const contentVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 0.3,
        staggerChildren: 0.15,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-secondary">
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

      {/* Gradient Overlay - Always visible */}
      <div className="absolute inset-0 gradient-overlay-left" />

      {/* Content Layer - Animated separately */}
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
            <motion.span variants={itemVariants} className="text-label text-white/80 mb-4 block">
              {slides[currentIndex].label}
            </motion.span>

            <motion.h2 variants={itemVariants} className="heading-display text-white mb-6">
              {slides[currentIndex].title}
            </motion.h2>

            <motion.p variants={itemVariants} className="text-lg md:text-xl font-light leading-relaxed mb-8 text-white/90">
              {slides[currentIndex].description}
            </motion.p>

            <motion.div variants={itemVariants}>
              <AnimatedCtaButton
                to={slides[currentIndex].ctaLink}
                className="bg-white text-black px-8 py-4 text-sm uppercase tracking-[0.15em] font-medium hover:bg-white/90"
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
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 transition-all duration-300 ${
                index === currentIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/70"
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