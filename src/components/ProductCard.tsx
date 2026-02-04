import { useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

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
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="product-card"
    >
      {/* Image Container */}
      <div className="product-image relative">
        {/* Skeleton loader */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-secondary animate-pulse" />
        )}

        <img
          src={image}
          alt={name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Badges */}
        {isNew && (
          <span className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 text-[10px] uppercase tracking-[0.1em]">
            New
          </span>
        )}

        {originalPrice && originalPrice > price && (
          <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-3 py-1 text-[10px] uppercase tracking-[0.1em]">
            Sale
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={18}
            className={isWishlisted ? "fill-destructive text-destructive" : ""}
          />
        </button>

        {/* Quick Add Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button className="w-full bg-primary text-primary-foreground py-3 text-xs uppercase tracking-[0.15em] font-medium hover:bg-charcoal transition-colors">
            Quick Add
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="pt-4 space-y-2">
        {category && (
          <span className="text-label text-muted-foreground">{category}</span>
        )}

        <h3 className="font-medium text-sm tracking-wide">{name}</h3>

        <div className="flex items-center gap-2">
          <span className="font-medium">{formatPrice(price)}</span>
          {originalPrice && originalPrice > price && (
            <span className="text-muted-foreground line-through text-sm">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;