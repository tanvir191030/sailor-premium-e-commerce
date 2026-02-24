import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ShoppingCart, Zap, Heart, Share2, Facebook,
  MessageCircle, ZoomIn, ChevronLeft, ChevronRight, Ruler,
  Package, Tag, CheckCircle, XCircle, Plus, Minus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ProductCard from "@/components/ProductCard";
import SizeChartModal from "@/components/SizeChartModal";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { formatPrice } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";

const SIZES = ["S", "M", "L", "XL", "XXL"];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id!);
  const { data: allProducts = [] } = useProducts();
  const { addItem, setIsOpen, setIsBuyNowOpen } = useCart();
  const { toggle, isWishlisted } = useWishlist();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const { toast } = useToast();

  // Touch swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | SAILOR`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", product.description || product.name);
    }
    return () => { document.title = "SAILOR"; };
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const fetchImages = async () => {
      const { data } = await supabase
        .from("product_images")
        .select("image_url, sort_order, is_primary")
        .eq("product_id", product.id)
        .order("sort_order", { ascending: true });

      const imgs: string[] = [];
      if (product.image_url) imgs.push(product.image_url);
      if (data) {
        data.forEach((r) => {
          if (r.image_url && !imgs.includes(r.image_url)) imgs.push(r.image_url);
        });
      }
      setGalleryImages(imgs.length ? imgs : ["/placeholder.svg"]);
    };
    fetchImages();
  }, [product]);

  const related = allProducts
    .filter((p) => p.id !== id && p.category === product?.category)
    .slice(0, 6);

  const cartPayload = product
    ? {
      id: product.id,
      name: product.name,
      price: product.price,
      image: galleryImages[0] || "/placeholder.svg",
      category: product.category || undefined,
      size: selectedSize || undefined,
    }
    : null;

  const handleAddToCart = () => {
    if (!cartPayload) return;

    // Check mandatory size selection
    if (!selectedSize) {
      setSizeError(true);
      toast({
        title: "সাইজ প্রয়োজন",
        description: "অনুগ্রহ করে একটি সাইজ সিলেক্ট করুন",
        variant: "destructive",
      });
      return;
    }

    addItem(cartPayload, quantity);
    setIsOpen(true);
    toast({ title: "✓ কার্টে যোগ হয়েছে", description: `${product!.name} × ${quantity}` });
  };

  const handleBuyNow = () => {
    if (!cartPayload) return;

    // Check mandatory size selection
    if (!selectedSize) {
      setSizeError(true);
      toast({
        title: "সাইজ প্রয়োজন",
        description: "অনুগ্রহ করে একটি সাইজ সিলেক্ট করুন",
        variant: "destructive",
      });
      return;
    }

    addItem(cartPayload, quantity);
    setIsOpen(false);
    navigate("/checkout");
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  // Touch handlers for swipeable gallery
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        setActiveIndex((i) => (i + 1) % galleryImages.length);
      } else {
        setActiveIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
      }
    }
  }, [galleryImages.length]);

  const shareUrl = window.location.href;
  const shareText = product ? `চেক আউট করুন: ${product.name}` : "";

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
  };

  const prevImage = () => setActiveIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  const nextImage = () => setActiveIndex((i) => (i + 1) % galleryImages.length);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">পণ্যটি পাওয়া যায়নি।</p>
              <Link to="/shop" className="text-primary hover:underline">শপে ফিরে যান</Link>
            </div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  const isInStock = product.stock > 0;
  const wishlisted = isWishlisted(product.id);
  const currentImage = galleryImages[activeIndex] || "/placeholder.svg";

  return (
    <PageTransition>
      <SizeChartModal open={sizeChartOpen} onClose={() => setSizeChartOpen(false)} />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pb-20 lg:pb-0">
          {/* Breadcrumb */}
          <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">হোম</Link>
              <span>/</span>
              <Link to="/shop" className="hover:text-foreground transition-colors">শপ</Link>
              {product.category && (
                <>
                  <span>/</span>
                  <Link to={`/category/${product.category.toLowerCase()}`} className="hover:text-foreground transition-colors capitalize">
                    {product.category}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-foreground truncate max-w-[120px]">{product.name}</span>
            </nav>
          </div>

          {/* Main product section */}
          <section className="container mx-auto px-4 md:px-6 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 xl:gap-16">

              {/* LEFT — Image Gallery */}
              <div className="space-y-3 md:space-y-4">
                {/* Main image — touch swipeable on mobile */}
                <div
                  ref={sliderRef}
                  className="relative overflow-hidden bg-secondary aspect-[4/5] group touch-pan-y"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    className={`relative w-full h-full lg:cursor-zoom-in ${zoomed ? "lg:cursor-zoom-out" : ""}`}
                    onMouseEnter={() => setZoomed(true)}
                    onMouseLeave={() => setZoomed(false)}
                    onMouseMove={handleMouseMove}
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentImage}
                        src={currentImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={
                          zoomed
                            ? {
                              transform: "scale(2)",
                              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                              transition: "transform-origin 0.1s ease",
                            }
                            : {}
                        }
                      />
                    </AnimatePresence>

                    {/* Zoom hint — desktop only */}
                    {!zoomed && (
                      <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block">
                        <ZoomIn size={16} className="text-foreground" />
                      </div>
                    )}

                    {/* Nav arrows */}
                    {galleryImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 bg-background/80 backdrop-blur-sm hover:bg-background transition-colors lg:opacity-0 lg:group-hover:opacity-100"
                          aria-label="Previous image"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-background/80 backdrop-blur-sm hover:bg-background transition-colors lg:opacity-0 lg:group-hover:opacity-100"
                          aria-label="Next image"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </>
                    )}

                    {/* Image count badge */}
                    {galleryImages.length > 1 && (
                      <span className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-[10px] px-2 py-1 text-foreground">
                        {activeIndex + 1} / {galleryImages.length}
                      </span>
                    )}
                  </div>

                  {/* Dot indicators for mobile */}
                  {galleryImages.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
                      {galleryImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveIndex(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${i === activeIndex ? "bg-foreground" : "bg-foreground/30"}`}
                          aria-label={`Image ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Thumbnails — desktop only */}
                {galleryImages.length > 1 && (
                  <div className="hidden lg:flex gap-2 overflow-x-auto pb-1">
                    {galleryImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`flex-shrink-0 w-16 h-20 overflow-hidden border-2 transition-colors ${i === activeIndex ? "border-primary" : "border-transparent hover:border-muted-foreground"
                          }`}
                      >
                        <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT — Product Info */}
              <div className="flex flex-col gap-4 md:gap-5">
                {/* Title & Wishlist */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {product.category && (
                      <Link
                        to={`/category/${product.category.toLowerCase()}`}
                        className="text-label text-muted-foreground hover:text-primary transition-colors mb-1 block"
                      >
                        {product.category}
                      </Link>
                    )}
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-medium tracking-tight leading-tight">{product.name}</h1>
                  </div>
                  <button
                    onClick={() => toggle(product.id)}
                    className="p-2.5 border border-border hover:border-primary transition-colors flex-shrink-0 mt-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart size={20} className={wishlisted ? "fill-destructive text-destructive" : ""} />
                  </button>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl md:text-3xl font-bold tracking-tight">{formatPrice(product.price)}</span>
                </div>

                {/* Stock & Meta chips */}
                <div className="flex flex-wrap gap-2">
                  {isInStock ? (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                      <CheckCircle size={12} /> স্টকে আছে ({product.stock} টি)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/20">
                      <XCircle size={12} /> স্টক নেই
                    </span>
                  )}
                  {product.brand && (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-secondary text-foreground border border-border">
                      <Tag size={12} /> {product.brand}
                    </span>
                  )}
                </div>

                {/* Size Selection */}
                <div className={`transition-all duration-300 ${sizeError ? "animate-[shake_0.5s_ease-in-out] rounded-xl p-3 -mx-3 border border-destructive/50 bg-destructive/5" : ""}`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-sm font-medium">
                      সাইজ বেছে নিন
                      {sizeError && <span className="text-destructive text-xs ml-2 font-normal animate-pulse">অনুগ্রহ করে একটি সাইজ সিলেক্ট করুন</span>}
                    </span>
                    <button
                      onClick={() => setSizeChartOpen(true)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors min-h-[44px] px-2"
                    >
                      <Ruler size={12} /> সাইজ গাইড
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setSelectedSize(size === selectedSize ? null : size);
                          setSizeError(false);
                        }}
                        className={`min-w-[44px] min-h-[44px] px-3 text-sm font-medium border transition-colors ${selectedSize === size
                            ? "bg-primary text-primary-foreground border-primary"
                            : sizeError
                              ? "bg-background text-destructive border-destructive hover:border-destructive/80"
                              : "bg-background text-foreground border-border hover:border-primary"
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity Selector + CTA Buttons */}
                <div className="space-y-3 pt-1">
                  {/* Quantity */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">পরিমাণ</span>
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"
                        disabled={!isInStock}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-12 h-10 flex items-center justify-center text-sm font-medium border-x border-border">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"
                        disabled={!isInStock}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={!isInStock}
                      className="flex-1 bg-primary text-primary-foreground py-3.5 text-xs uppercase tracking-[0.12em] font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart size={15} /> {isInStock ? "কার্টে যোগ করুন" : "স্টক নেই"}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={!isInStock}
                      className="flex-1 bg-background text-foreground border border-primary py-3.5 text-xs uppercase tracking-[0.12em] font-semibold hover:bg-secondary transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Zap size={15} /> {isInStock ? "এখনই কিনুন" : "স্টক নেই"}
                    </button>
                  </div>
                </div>
                {product.description && (
                  <div className="border-t border-border pt-4 md:pt-5">
                    <h3 className="text-sm font-semibold uppercase tracking-wide mb-2.5">পণ্যের বিবরণ</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
                  </div>
                )}

                {/* Product Info Table */}
                <div className="border-t border-border pt-4 md:pt-5 grid grid-cols-2 gap-3">
                  {product.category && (
                    <div className="flex items-start gap-2">
                      <Package size={13} className="mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">ক্যাটাগরি</p>
                        <p className="text-sm font-medium capitalize">{product.category}</p>
                      </div>
                    </div>
                  )}
                  {product.brand && (
                    <div className="flex items-start gap-2">
                      <Tag size={13} className="mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">ব্র্যান্ড</p>
                        <p className="text-sm font-medium">{product.brand}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Share */}
                <div className="border-t border-border pt-4 md:pt-5 flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">শেয়ার করুন</span>
                  <button
                    onClick={handleFacebookShare}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-primary text-primary-foreground text-xs hover:bg-primary/90 transition-colors min-h-[44px]"
                  >
                    <Facebook size={13} /> Facebook
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-accent text-accent-foreground border border-border text-xs hover:bg-accent/80 transition-colors min-h-[44px]"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Related Products */}
          {related.length > 0 && (
            <section className="border-t border-border py-10 md:py-16">
              <div className="container mx-auto px-4 md:px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="text-center mb-6 md:mb-8"
                >
                  <span className="text-label mb-3 block">একই ক্যাটাগরি</span>
                  <h2 className="heading-section">আপনি পছন্দ করতে পারেন</h2>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-5">
                  {related.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.06 }}
                    >
                      <ProductCard
                        id={p.id}
                        name={p.name}
                        price={p.price}
                        image={p.image_url || "/placeholder.svg"}
                        category={p.category || undefined}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Sticky CTA Bar — mobile only, above bottom nav */}
        <div className="fixed bottom-[52px] left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border px-3 py-2 md:hidden safe-bottom">
          <div className="flex items-center gap-2">
            {/* Mini quantity selector */}
            <div className="flex items-center border border-border flex-shrink-0">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-8 h-9 flex items-center justify-center" disabled={!isInStock}>
                <Minus size={12} />
              </button>
              <span className="w-8 h-9 flex items-center justify-center text-xs font-medium border-x border-border">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="w-8 h-9 flex items-center justify-center" disabled={!isInStock}>
                <Plus size={12} />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!isInStock}
              className="flex-1 bg-primary text-primary-foreground py-2.5 text-[11px] uppercase tracking-[0.1em] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
            >
              <ShoppingCart size={14} /> {isInStock ? "কার্ট" : "স্টক নেই"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!isInStock}
              className="flex-1 bg-background text-foreground border border-primary py-2.5 text-[11px] uppercase tracking-[0.1em] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
            >
              <Zap size={14} /> {isInStock ? "কিনুন" : "স্টক নেই"}
            </button>
          </div>
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default ProductDetail;
