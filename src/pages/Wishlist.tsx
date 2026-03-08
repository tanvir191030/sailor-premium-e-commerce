import { Link } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/contexts/WishlistContext";
import { useProducts } from "@/hooks/useProducts";

const Wishlist = () => {
  const { items } = useWishlist();
  const { data: allProducts = [] } = useProducts();
  const wishlistedProducts = allProducts.filter((p) => items.includes(p.id));

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pb-20 lg:pb-0">
          {/* Breadcrumb */}
          <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">হোম</Link>
              <span>/</span>
              <span className="text-foreground">উইশলিস্ট</span>
            </nav>
          </div>

          <section className="container mx-auto px-4 md:px-6 pb-12">
            <h1 className="heading-section mb-6 md:mb-8">
              উইশলিস্ট
              {wishlistedProducts.length > 0 && (
                <span className="text-muted-foreground text-base md:text-lg font-normal ml-2">
                  ({wishlistedProducts.length})
                </span>
              )}
            </h1>

            {wishlistedProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 flex items-center justify-center bg-secondary mb-6">
                  <Heart size={32} className="text-muted-foreground" />
                </div>
                <h2 className="text-lg font-serif font-medium mb-2">আপনার উইশলিস্টটি খালি</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  আপনার পছন্দের পণ্যগুলিতে হার্ট আইকনে ক্লিক করে এখানে সেভ করুন।
                </p>
                <Link
                  to="/shop"
                  className="bg-primary text-primary-foreground px-8 py-3 text-xs uppercase tracking-[0.15em] font-bold hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                >
                  <ArrowLeft size={14} />
                  শপে ফিরে যান
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {wishlistedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image_url || "/placeholder.svg"}
                    category={product.category || undefined}
                    sub_category={(product as any).sub_category || undefined}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Wishlist;
