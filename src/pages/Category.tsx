import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";

const Category = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const { data: products = [], isLoading } = useProducts();

  const displayName = categoryName
    ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase()
    : "";

  const filtered = products.filter(
    (p) => p.category?.toLowerCase() === categoryName?.toLowerCase()
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Banner */}
        <section className="bg-secondary py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-label mb-4 block">Collection</span>
              <h1 className="heading-display mb-4">{displayName}</h1>
              <p className="text-body max-w-lg mx-auto">
                Explore our curated {displayName.toLowerCase()} collection.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Products */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {filtered.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image_url || "/placeholder.svg"}
                    category={product.category || undefined}
                    isNew={index < 4}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="text-body mb-8">No products found in this category.</p>
                <Link to="/" className="btn-primary inline-flex items-center gap-2">
                  <ArrowLeft size={16} />
                  Back to Home
                </Link>
              </motion.div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Category;
