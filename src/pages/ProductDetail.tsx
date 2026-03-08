import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ShoppingCart, Zap, Heart, Share2, Facebook,
  MessageCircle, ZoomIn, ChevronLeft, ChevronRight, Ruler,
  Package, Tag, CheckCircle, XCircle, Plus, Minus,
  Star, Send, Camera, BadgeCheck, Shield, Truck, RefreshCw,
  CreditCard, ChevronDown, Sparkles, Layers, Award, HelpCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ProductCard from "@/components/ProductCard";
import SizeChartModal from "@/components/SizeChartModal";
import SEOHead, { productSchema, breadcrumbSchema } from "@/components/SEOHead";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { formatPrice } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { optimizeProductImage } from "@/lib/imageOptimizer";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const SIZES = ["S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
const HIJAB_SUBS = ["Hijab", "Orna"];
const SHOE_SUBS = ["Shoes"];
const NO_SIZE_SUBS = ["Bags", "Others"];

const ProductDetail = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id!);
  const { data: allProducts = [] } = useProducts();
  const { addItem, setIsOpen, setIsBuyNowOpen } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const queryClient = useQueryClient();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const { toast } = useToast();

  // Reviews state
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const reviewFileRef = useRef<HTMLInputElement>(null);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Only show approved reviews on frontend
      return (data || []).filter((r: any) => r.is_approved === true);
    },
    enabled: !!id,
  });

  // Check if current visitor has a delivered order containing this product (by phone match)
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [buyerPhone, setBuyerPhone] = useState("");

  const normalizePhone = (p: string) => {
    // Strip everything except digits
    let d = p.replace(/\D/g, "");
    // Remove country code +880 or 880
    if (d.startsWith("880")) d = d.substring(3);
    // Ensure it starts with 0
    if (!d.startsWith("0") && d.length === 10) d = "0" + d;
    return d; // returns 11-digit format like 01XXXXXXXXX
  };

  const isValidBDPhone = (phone: string) => {
    const d = phone.replace(/\D/g, "");
    // After stripping, must be 11 digits starting with 01[3-9]
    const normalized = normalizePhone(phone);
    return /^01[3-9]\d{8}$/.test(normalized);
  };

  const checkPurchaseEligibility = async (phone: string) => {
    if (!phone || !isValidBDPhone(phone) || !id) return;
    const normalized = normalizePhone(phone);

    const { data } = await supabase
      .from("orders")
      .select("cart_items, phone, status")
      .ilike("status", "delivered");

    if (data && data.length > 0) {
      const hasProduct = data.some((order: any) => {
        const dbPhone = normalizePhone(order.phone || "");
        if (dbPhone !== normalized) return false;

        const items = Array.isArray(order.cart_items) ? order.cart_items : [];
        return items.some((item: any) => {
          // product_id is the clean UUID; fallback to extracting UUID from composite id (e.g. "uuid-size")
          if (item.product_id && item.product_id === id) return true;
          if (item.productId && item.productId === id) return true;
          // Extract UUID (36 chars) from the start of the id field
          const rawId = String(item.id || "");
          const uuidMatch = rawId.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
          return uuidMatch ? uuidMatch[1] === id : rawId === id;
        });
      });
      setCanReview(hasProduct);
    } else {
      setCanReview(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmitReview = async () => {
    if (!reviewName.trim()) { toast({ title: "নাম দিন", variant: "destructive" }); return; }
    setSubmittingReview(true);
    try {
      let image_url = null;
      if (reviewImage) {
        const optimized = await optimizeProductImage(reviewImage);
        const path = `reviews/${crypto.randomUUID()}.webp`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, optimized, { contentType: "image/webp" });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        image_url = data.publicUrl;
      }
      const { error } = await supabase.from("reviews").insert({
        product_id: id!,
        customer_name: reviewName,
        rating: reviewRating,
        comment: reviewComment || null,
        image_url,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      setReviewName(""); setReviewComment(""); setReviewRating(5); setReviewImage(null);
      setCanReview(null); setBuyerPhone("");
      toast({ title: "✓ আপনার রিভিউ জমা হয়েছে!", description: "অ্যাডমিন অনুমোদনের পর এটি প্রদর্শিত হবে।" });
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Touch swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const { settings } = useSiteSettings();
  const baseUrl = settings.website_url || "https://modestmart.com";
  const isFreeDelivery = settings.free_delivery === "true";

  // Sticky desktop bar: show when CTA buttons scroll out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (ctaRef.current) observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [product]);

  const seoJsonLd = useMemo(() => {
    if (!product) return undefined;
    const avgRating = reviews.length > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0;
    const breadcrumbs = [
      { name: "Home", url: baseUrl },
      { name: "Shop", url: `${baseUrl}/shop` },
    ];
    if (product.category) breadcrumbs.push({ name: product.category, url: `${baseUrl}/category/${product.category.toLowerCase()}` });
    if (product.sub_category) breadcrumbs.push({ name: product.sub_category, url: `${baseUrl}/category/${(product.category || "").toLowerCase()}/${product.sub_category.toLowerCase()}` });
    breadcrumbs.push({ name: product.name, url: `${baseUrl}/product/${product.id}` });

    return [
      productSchema({
        name: product.name,
        description: product.description || undefined,
        image: product.image_url || undefined,
        price: product.price,
        url: `${baseUrl}/product/${product.id}`,
        brand: (product as any).brand || "Modest Mart",
        availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        ratingValue: avgRating,
        reviewCount: reviews.length,
      }),
      breadcrumbSchema(breadcrumbs),
    ];
  }, [product, reviews, baseUrl]);

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

  const cartPayloadBase = product
    ? {
      id: product.id,
      name: product.name,
      image: galleryImages[0] || "/placeholder.svg",
      category: product.category || undefined,
    }
    : null;

  const handleAddToCart = () => {
    if (!cartPayload) return;

    // Check mandatory size selection (skip for no-size products)
    const rawSizesCheck = product?.sizes as any;
    const subCat = rawSizesCheck?.sub_category || product?.sub_category || "";
    const isNoSize = NO_SIZE_SUBS.includes(subCat);
    if (!isNoSize && !selectedSize) {
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

    // Check mandatory size selection (skip for no-size products)
    const rawSizesCheck2 = product?.sizes as any;
    const subCat2 = rawSizesCheck2?.sub_category || product?.sub_category || "";
    const isNoSize2 = NO_SIZE_SUBS.includes(subCat2);
    if (!isNoSize2 && !selectedSize) {
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

  const rawSizes = product.sizes as any;
  const isComplexSize = rawSizes && rawSizes.variants !== undefined;
  const productSubCategory = isComplexSize ? (rawSizes.sub_category || product.sub_category) : product.sub_category;
  const sizeType = rawSizes?.type || (HIJAB_SUBS.includes(productSubCategory || "") ? "hijab" : SHOE_SUBS.includes(productSubCategory || "") ? "shoes" : NO_SIZE_SUBS.includes(productSubCategory || "") ? "none" : "clothing");
  const sizeVariants = isComplexSize ? rawSizes.variants : (rawSizes || {});
  const isNoSizeProduct = sizeType === "none" || NO_SIZE_SUBS.includes(productSubCategory || "");

  // Dynamic pricing for hijab variants
  const activePrice = (() => {
    if (sizeType === "hijab" && selectedSize && sizeVariants[selectedSize]) {
      const variantPrice = Number(sizeVariants[selectedSize]?.price);
      if (variantPrice > 0) return variantPrice;
    }
    return product.price;
  })();

  const cartPayload = cartPayloadBase
    ? { ...cartPayloadBase, price: activePrice, size: selectedSize || undefined }
    : null;

  const hasSpecificSizes = !isNoSizeProduct && sizeVariants && Object.keys(sizeVariants).length > 0;

  const displaySizes = hasSpecificSizes ? Object.keys(sizeVariants) : (sizeType === "shoes" ? SHOE_SIZES : SIZES);

  const isInStock = product.stock > 0;
  const wishlisted = isWishlisted(product.id);
  const currentImage = galleryImages[activeIndex] || "/placeholder.svg";

  return (
    <PageTransition>
      {product && (
        <SEOHead
          title={`${product.name} | Modest Mart`}
          description={product.description || `${product.name} — Modest Mart এ সেরা দামে কিনুন।`}
          canonical={`${baseUrl}/product/${product.id}`}
          image={product.image_url || undefined}
          type="product"
          jsonLd={seoJsonLd}
        />
      )}
      <SizeChartModal open={sizeChartOpen} onClose={() => setSizeChartOpen(false)} product={product} />
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
              {product.sub_category && (
                <>
                  <span>/</span>
                  <Link to={`/category/${(product.category || '').toLowerCase()}/${product.sub_category.toLowerCase()}`} className="hover:text-foreground transition-colors">
                    {product.sub_category}
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

                {/* Price — dynamic for hijab */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl md:text-3xl font-bold tracking-tight">{formatPrice(activePrice)}</span>
                  {(product as any).original_price && (product as any).original_price > activePrice && (
                    <>
                      <span className="text-base md:text-lg text-muted-foreground line-through">{formatPrice((product as any).original_price)}</span>
                      <span className="text-xs md:text-sm font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded">
                        -{Math.round((((product as any).original_price - activePrice) / (product as any).original_price) * 100)}% OFF
                      </span>
                    </>
                  )}
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

                {/* Size Selection — dynamic based on sub-category */}
                {isNoSizeProduct ? (
                  /* Bags/Others: no size selection needed */
                  <div className="p-3 bg-secondary/20 rounded-lg border border-border/50">
                    <span className="text-sm text-muted-foreground">ফ্রি সাইজ — সাইজ নির্বাচনের প্রয়োজন নেই</span>
                  </div>
                ) : sizeType === "hijab" && hasSpecificSizes ? (
                  /* Hijab/Orna: show selectable dimension buttons */
                  <div className={`transition-all duration-300 ${sizeError ? "animate-[shake_0.5s_ease-in-out] rounded-xl p-3 -mx-3 border border-destructive/50 bg-destructive/5" : ""}`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-sm font-medium">
                        সাইজ বেছে নিন
                        {sizeError && <span className="text-destructive text-xs ml-2 font-normal animate-pulse">অনুগ্রহ করে একটি সাইজ সিলেক্ট করুন</span>}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(sizeVariants).map(([sizeKey, data]: [string, any]) => {
                        const m = data?.measurements || {};
                        const stockCount = Number(data?.stock) || 0;
                        const isOutOfStock = stockCount === 0;
                        const label = m.width && m.length ? `${m.width}×${m.length}"` : sizeKey;
                        const variantPrice = Number(data?.price) || 0;

                        return (
                          <div key={sizeKey} className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => {
                                if (isOutOfStock) return;
                                setSelectedSize(sizeKey === selectedSize ? null : sizeKey);
                                setSizeError(false);
                                setQuantity(1);
                              }}
                              disabled={isOutOfStock}
                              className={`min-w-[60px] min-h-[44px] px-3 py-2 text-sm font-medium border transition-colors ${isOutOfStock
                                ? "bg-secondary text-muted-foreground border-border cursor-not-allowed opacity-50"
                                : selectedSize === sizeKey
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : sizeError
                                    ? "bg-background text-destructive border-destructive hover:border-destructive/80"
                                    : "bg-background text-foreground border-border hover:border-primary"
                                }`}
                            >
                              {label}
                            </button>
                            {variantPrice > 0 && (
                              <span className="text-[10px] font-semibold text-primary">৳{variantPrice.toLocaleString()}</span>
                            )}
                            <span className={`text-[10px] ${stockCount > 0 ? "text-muted-foreground" : "text-destructive font-medium"}`}>
                              {stockCount > 0 ? `${stockCount} pcs` : "Out"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Clothing / Shoes: show size buttons */
                  <div className={`transition-all duration-300 ${sizeError ? "animate-[shake_0.5s_ease-in-out] rounded-xl p-3 -mx-3 border border-destructive/50 bg-destructive/5" : ""}`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-sm font-medium">
                        {sizeType === "shoes" ? "সাইজ বেছে নিন (EU)" : "সাইজ বেছে নিন"}
                        {sizeError && <span className="text-destructive text-xs ml-2 font-normal animate-pulse">অনুগ্রহ করে একটি সাইজ সিলেক্ট করুন</span>}
                      </span>
                      {sizeType !== "shoes" && (
                        <button
                          onClick={() => setSizeChartOpen(true)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors min-h-[44px] px-2"
                        >
                          <Ruler size={12} /> সাইজ গাইড
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {displaySizes.map((size) => {
                        const sizeData = sizeVariants[size];
                        const stockCount = hasSpecificSizes
                          ? (typeof sizeData === 'object' && sizeData !== null ? Number(sizeData.stock) : Number(sizeData) || 0)
                          : null;
                        const isOutOfStock = hasSpecificSizes && stockCount === 0;

                        return (
                          <div key={size} className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => {
                                if (isOutOfStock) return;
                                setSelectedSize(size === selectedSize ? null : size);
                                setSizeError(false);
                                setQuantity(1);
                              }}
                              disabled={isOutOfStock}
                              className={`min-w-[44px] min-h-[44px] px-3 text-sm font-medium border transition-colors ${isOutOfStock
                                ? "bg-secondary text-muted-foreground border-border cursor-not-allowed opacity-50"
                                : selectedSize === size
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : sizeError
                                    ? "bg-background text-destructive border-destructive hover:border-destructive/80"
                                    : "bg-background text-foreground border-border hover:border-primary"
                                }`}
                            >
                              {size}
                            </button>
                            {hasSpecificSizes && stockCount !== null && (
                              <span className={`text-[10px] ${stockCount > 0 ? "text-muted-foreground" : "text-destructive font-medium"}`}>
                                {stockCount > 0 ? `${stockCount} pcs` : "Out"}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Display measurements if selected size has any */}
                    {selectedSize && hasSpecificSizes && typeof sizeVariants[selectedSize] === 'object' && sizeVariants[selectedSize].measurements && Object.keys(sizeVariants[selectedSize].measurements).length > 0 && (
                      <div className="mt-4 p-3 bg-secondary/30 rounded-lg border border-border/50 transition-all text-xs text-muted-foreground">
                        <p className="font-medium text-foreground mb-1.5 uppercase tracking-wide text-[10px]">Measurements for {selectedSize}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(sizeVariants[selectedSize].measurements).map(([key, val]) => (
                            <div key={key} className="flex flex-col">
                              <span className="capitalize text-[10px]">{key}</span>
                              <span className="font-semibold text-foreground">{String(val)}"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                        onClick={() => {
                          const sizeData = selectedSize ? sizeVariants[selectedSize] : null;
                          const selStock = sizeData ? (typeof sizeData === 'object' && sizeData !== null ? Number(sizeData.stock) : Number(sizeData) || 0) : 0;
                          const maxStock = hasSpecificSizes && selectedSize ? selStock : product.stock;
                          setQuantity((q) => Math.min(maxStock, q + 1));
                        }}
                        className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"
                        disabled={!isInStock || (() => {
                          const sizeData = selectedSize ? sizeVariants[selectedSize] : null;
                          const selStock = sizeData ? (typeof sizeData === 'object' && sizeData !== null ? Number(sizeData.stock) : Number(sizeData) || 0) : 0;
                          return hasSpecificSizes && selectedSize ? quantity >= selStock : quantity >= product.stock;
                        })()}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      onClick={handleBuyNow}
                      disabled={!isInStock}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 bg-primary text-primary-foreground h-12 text-xs uppercase tracking-[0.15em] font-bold hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Zap size={16} /> {isInStock ? "এখনই কিনুন" : "স্টক নেই"}
                    </motion.button>
                    <motion.button
                      onClick={handleAddToCart}
                      disabled={!isInStock}
                      whileHover={{ scale: 1.02, backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 bg-transparent text-foreground border-2 border-primary h-12 text-xs uppercase tracking-[0.15em] font-bold transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart size={16} /> {isInStock ? "কার্টে যোগ করুন" : "স্টক নেই"}
                    </motion.button>
                  </div>
                </div>

                {/* Description with formatting */}
                {product.description && (
                  <div className="border-t border-border pt-4 md:pt-5">
                    <h3 className="text-sm font-semibold uppercase tracking-wide mb-2.5">পণ্যের বিবরণ</h3>
                    <div className="text-sm text-muted-foreground leading-relaxed space-y-1.5">
                      {product.description.split("\n").map((line, i) => {
                        // Support bullet points: lines starting with - or •
                        const isBullet = /^\s*[-•]\s*/.test(line);
                        const cleaned = line.replace(/^\s*[-•]\s*/, "");
                        // Support **bold** text
                        const formatBold = (text: string) => {
                          const parts = text.split(/\*\*(.*?)\*\*/g);
                          return parts.map((part, j) =>
                            j % 2 === 1 ? <strong key={j} className="text-foreground font-semibold">{part}</strong> : part
                          );
                        };
                        if (isBullet) {
                          return (
                            <div key={i} className="flex items-start gap-2 pl-1">
                              <span className="text-primary mt-0.5 text-xs">•</span>
                              <span>{formatBold(cleaned)}</span>
                            </div>
                          );
                        }
                        if (!line.trim()) return <div key={i} className="h-2" />;
                        return <p key={i}>{formatBold(line)}</p>;
                      })}
                    </div>
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

          {/* Customer Reviews Section */}
          <section className="border-t border-border py-10 md:py-16">
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="heading-section text-lg md:text-xl">কাস্টমার রিভিউ</h2>
                  {avgRating && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={14} className={s <= Math.round(Number(avgRating)) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{avgRating}</span>
                      <span className="text-xs text-muted-foreground">({reviews.length} টি রিভিউ)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Form — with purchase verification */}
              <div className="bg-secondary/20 rounded-xl border border-border p-4 md:p-6 mb-8 max-w-2xl">
                {canReview === null ? (
                  /* Step 1: Ask for phone to verify purchase */
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold mb-2">রিভিউ দিতে আপনার ফোন নম্বর দিন</h3>
                    <p className="text-xs text-muted-foreground">শুধুমাত্র ডেলিভারি সম্পন্ন অর্ডারের গ্রাহকরাই রিভিউ দিতে পারবেন।</p>
                    <input
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="আপনার ফোন নম্বর (যেমন: 01XXXXXXXXX)"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={() => checkPurchaseEligibility(buyerPhone)}
                      disabled={!isValidBDPhone(buyerPhone)}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <CheckCircle size={14} /> যাচাই করুন
                    </button>
                  </div>
                ) : canReview === false ? (
                  /* Not eligible */
                  <div className="text-center py-6 space-y-2">
                    <XCircle size={32} className="mx-auto text-muted-foreground/50" />
                    <p className="text-sm font-medium text-muted-foreground">এই পণ্যটি আপনার এই নম্বরে এখনো ডেলিভারি হয়নি।</p>
                    <p className="text-xs text-muted-foreground">শুধুমাত্র ক্রয়কারী গ্রাহকরাই রিভিউ দিতে পারবেন।</p>
                    <button onClick={() => { setCanReview(null); setBuyerPhone(""); }} className="text-xs text-primary hover:underline mt-2">
                      অন্য নম্বর দিয়ে চেষ্টা করুন
                    </button>
                  </div>
                ) : (
                  /* Eligible — show review form */
                  <>
                    <h3 className="text-sm font-semibold mb-4">
                      <span className="inline-flex items-center gap-1.5">
                        <BadgeCheck size={16} className="text-emerald-500" /> আপনার মতামত দিন (ভেরিফাইড ক্রেতা)
                      </span>
                    </h3>
                    <div className="space-y-3">
                      <input
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="আপনার নাম *"
                        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">রেটিং:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button key={s} onClick={() => setReviewRating(s)} className="p-0.5">
                              <Star size={20} className={s <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-400/50"} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="আপনার অভিজ্ঞতা লিখুন..."
                        rows={3}
                        className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none placeholder:text-muted-foreground"
                      />
                      <div className="flex items-center gap-3">
                        <input ref={reviewFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setReviewImage(f); }} />
                        <button onClick={() => reviewFileRef.current?.click()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors">
                          <Camera size={13} /> {reviewImage ? reviewImage.name.slice(0, 20) : "ছবি যোগ করুন"}
                        </button>
                        <button
                          onClick={handleSubmitReview}
                          disabled={submittingReview}
                          className="ml-auto flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          <Send size={13} /> {submittingReview ? "জমা হচ্ছে..." : "জমা দিন"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-4 max-w-2xl">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="p-4 bg-card rounded-xl border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{review.customer_name}</span>
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                              <BadgeCheck size={10} /> ভেরিফাইড
                            </span>
                          </div>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={11} className={s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString("bn-BD", { day: "numeric", month: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}
                      {review.image_url && (
                        <img src={review.image_url} alt="Review" className="mt-2 w-24 h-24 object-cover rounded-lg border border-border" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন!</p>
              )}
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
                        sub_category={(p as any).sub_category || undefined}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Sticky CTA Bar — mobile only, above bottom nav */}
        <div className="fixed bottom-[52px] left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-3 py-2 md:hidden safe-bottom">
          <div className="flex items-center gap-2">
            {/* Mini quantity selector */}
            <div className="flex items-center border border-border flex-shrink-0 overflow-hidden">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-8 h-10 flex items-center justify-center hover:bg-muted active:bg-muted/80 transition-colors" disabled={!isInStock}>
                <Minus size={13} />
              </button>
              <span className="w-8 h-10 flex items-center justify-center text-xs font-semibold border-x border-border">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="w-8 h-10 flex items-center justify-center hover:bg-muted active:bg-muted/80 transition-colors" disabled={!isInStock}>
                <Plus size={13} />
              </button>
            </div>
            <motion.button
              onClick={handleBuyNow}
              disabled={!isInStock}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-primary text-primary-foreground h-10 text-[11px] font-bold uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap size={14} /> {isInStock ? "Buy Now" : "স্টক নেই"}
            </motion.button>
            <motion.button
              onClick={handleAddToCart}
              disabled={!isInStock}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-transparent text-foreground border-2 border-primary h-10 text-[11px] font-bold uppercase tracking-[0.12em] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={14} /> {isInStock ? "Add to Cart" : "স্টক নেই"}
            </motion.button>
          </div>
        </div>

        <Footer />
      </div>
    </PageTransition >
  );
};

export default ProductDetail;
