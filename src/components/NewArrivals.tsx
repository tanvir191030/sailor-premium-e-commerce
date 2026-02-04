import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  created_at: string | null;
}

interface NewArrivalsProps {
  products: Product[];
}

const NewArrivals = ({ products }: NewArrivalsProps) => {
  // Get the 8 most recent products
  const newProducts = products
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 8);

  if (newProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-label mb-4 block">Just Landed</span>
          <h2 className="heading-section">New Arrivals</h2>
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {newProducts.map((product, index) => (
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

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-12"
        >
          <Link to="/shop" className="btn-outline">
            View All New Arrivals
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default NewArrivals;