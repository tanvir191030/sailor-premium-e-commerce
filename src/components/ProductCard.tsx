import { useState } from "react";
import { Heart, ShoppingCart, Zap, Ruler, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/currency";
import { toast } from "sonner";
import SizeChartModal from "@/components/SizeChartModal";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category?: string;
  isNew?: boolean;
}

const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  image,
  category,
  isNew = false,
}: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const { toggle, isWishlisted } = useWishlist();
  const { addItem, setIsBuyNowOpen, setIsOpen } = useCart();
  const { settings } = useSiteSettings();
  const isFreeDelivery = settings.free_delivery === "true";
  const wishlisted = isWishlisted(id);
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addItem({ id, name, price, image, category });
    toast.success("Added to cart successfully");
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addItem({ id, name, price, image, category });
    setIsOpen(false);
    navigate("/checkout");
  };

  const handleSizeChart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setSizeChartAnchor({ x: e.clientX, y: e.clientY });
    setSizeChartOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="product-card group"
      >
        {/* Image Container */}
        <div className="product-image relative">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-secondary animate-pulse" />
          )}

          <Link to={`/product/${id}`} className="block w-full h-full absolute inset-0 z-[1]" aria-label={name} />
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Badges */}
          {originalPrice && originalPrice > price ? (
            <span className="absolute top-2 left-2 md:top-3 md:left-3 bg-destructive text-destructive-foreground px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-[10px] font-bold tracking-[0.05em] z-[1]">
              -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
            </span>
          ) : isNew ? (
            <span className="absolute top-2 left-2 md:top-3 md:left-3 bg-primary text-primary-foreground px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-[10px] uppercase tracking-[0.1em] z-[1]">
              New
            </span>
          ) : null}

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(id);
            }}
            className="absolute top-2 right-2 md:top-3 md:right-3 p-2 bg-background/80 backdrop-blur-sm hover:bg-background transition-colors z-[2] min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              size={16}
              className={wishlisted ? "fill-destructive text-destructive" : ""}
            />
          </button>

          {/* Size Chart button — visible on hover (desktop only) */}
          <button
            onClick={handleSizeChart}
            className="absolute top-2 right-11 md:top-3 md:right-12 p-2 bg-background/80 backdrop-blur-sm hover:bg-background transition-colors opacity-0 group-hover:opacity-100 z-[2] hidden md:flex items-center justify-center"
            aria-label="Size chart"
            title="সাইজ চার্ট"
          >
            <Ruler size={14} />
          </button>

          {/* Hover Buttons — desktop only */}
          <div className="absolute inset-x-0 bottom-0 p-2 md:p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 gap-1.5 md:gap-2 z-[2] hidden lg:flex">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-primary text-primary-foreground py-2 md:py-2.5 text-[9px] md:text-[10px] uppercase tracking-[0.12em] font-medium hover:bg-primary/80 transition-colors flex items-center justify-center gap-1 md:gap-1.5"
            >
              <ShoppingCart size={12} />
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-background text-foreground border border-primary py-2 md:py-2.5 text-[9px] md:text-[10px] uppercase tracking-[0.12em] font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-1 md:gap-1.5"
            >
              <Zap size={12} />
              Buy Now
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="pt-3 md:pt-4 space-y-1 md:space-y-2">
          {category && (
            <span className="text-label text-muted-foreground text-[10px] md:text-xs">{category}</span>
          )}

          <Link to={`/product/${id}`}>
            <h3 className="font-medium text-xs md:text-sm tracking-wide hover:text-primary transition-colors line-clamp-2">{name}</h3>
          </Link>

          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm md:text-base">{formatPrice(price)}</span>
              {originalPrice && originalPrice > price && (
                <span className="text-muted-foreground line-through text-xs">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
            {isFreeDelivery && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Truck size={10} /> Free Delivery
              </span>
            )}
          </div>

          {/* Mobile Action Buttons - Below Image */}
          <div className="flex lg:hidden items-center gap-2 pt-2">
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-primary text-primary-foreground py-2 md:py-2.5 text-xs md:text-sm font-medium rounded shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-1 min-h-[40px] md:min-h-[44px]"
            >
              <Zap size={14} />
              Buy Now
            </button>
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-background text-foreground border border-primary py-2 md:py-2.5 text-xs md:text-sm font-medium rounded shadow-sm hover:bg-secondary transition-colors flex items-center justify-center gap-1 min-h-[40px] md:min-h-[44px]"
              aria-label="Add to cart"
            >
              <ShoppingCart size={14} />
              Add to Cart
            </button>
          </div>
        </div>
      </motion.div>

      <SizeChartModal
        open={sizeChartOpen}
        onClose={() => {
          setSizeChartOpen(false);
          setSizeChartAnchor(null);
        }}
        anchorPoint={sizeChartAnchor}
      />
    </>
  );
};

export default ProductCard;
