import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import PageTransition from "@/components/PageTransition";
import { useProducts } from "@/hooks/useProducts";

const Shop = () => {
  const { data: products = [], isLoading } = useProducts();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen">
        <Header />
        <main>
          <section className="bg-secondary py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-label mb-4 block">All Products</span>
                <h1 className="heading-display mb-4">Shop</h1>
                <p className="text-body max-w-lg mx-auto">
                  Browse our entire collection of premium fashion pieces.
                </p>
              </motion.div>
            </div>
          </section>

          <section className="py-10 md:py-14">
            <div className="container mx-auto px-4 md:px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                  >
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.image_url || "/placeholder.svg"}
                      category={product.category || undefined}
                      isNew={index < 4}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Shop;
