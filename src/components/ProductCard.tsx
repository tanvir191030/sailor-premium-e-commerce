import { useState } from "react";
import { Heart, ShoppingCart, Zap, Ruler } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/currency";
import { toast } from "sonner";
import SizeChartModal from "@/components/SizeChartModal";

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

  const handleSizeChart = (e: React.MouseEvent) => {
    e.stopPropagation();
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
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Badges */}
          {isNew && (
            <span className="absolute top-2 left-2 md:top-3 md:left-3 bg-primary text-primary-foreground px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-[10px] uppercase tracking-[0.1em]">
              New
            </span>
          )}

          {originalPrice && originalPrice > price && (
            <span className="absolute top-2 left-2 md:top-3 md:left-3 bg-destructive text-destructive-foreground px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-[10px] uppercase tracking-[0.1em]">
              Sale
            </span>
          )}

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

          {/* Hover Buttons — unified for mobile and desktop */}
          <div className="absolute inset-x-0 bottom-0 p-0 lg:p-3 flex justify-between items-end z-[2] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none lg:pointer-events-none">
            {/* Desktop variant: flex row, Mobile variant: absolute cart + full width bottom glass buy now */}
            <div className="flex w-full pointer-events-auto flex-col lg:flex-row gap-0 lg:gap-2 lg:justify-end">

              {/* Add to Cart - Top right on mobile, alongside Buy Now on desktop */}
              <button
                onClick={handleAddToCart}
                className="absolute top-12 right-2 md:top-14 md:right-3 lg:relative lg:top-auto lg:right-auto bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors p-2.5 rounded shadow-sm flex items-center justify-center w-11 h-11 lg:w-9 lg:h-9"
                aria-label="Add to cart"
                title="Add to Cart"
              >
                <ShoppingCart size={18} className="lg:w-4 lg:h-4" />
              </button>

              {/* Buy Now - Full width bottom on mobile, alongside Add to Cart on desktop */}
              <button
                onClick={handleBuyNow}
                className="w-full lg:w-auto bg-background/60 lg:bg-primary/90 backdrop-blur-md lg:backdrop-blur-sm text-foreground lg:text-primary-foreground border-t border-white/20 lg:border-none hover:bg-background/80 lg:hover:bg-primary transition-colors px-3 py-3 lg:px-4 lg:py-2.5 lg:rounded shadow-sm flex items-center justify-center min-h-[44px] lg:min-h-[36px] text-sm lg:text-xs font-medium gap-1.5"
                title="Buy Now"
              >
                <Zap size={16} className="lg:w-3.5 lg:h-3.5 text-primary lg:text-current" />
                <span>Buy Now</span>
              </button>
            </div>
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
          </div>
        </div>
      </motion.div>

      <SizeChartModal open={sizeChartOpen} onClose={() => setSizeChartOpen(false)} />
    </>
  );
};

export default ProductCard;
