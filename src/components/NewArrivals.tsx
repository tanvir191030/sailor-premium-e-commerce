import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import AnimatedCtaButton from "./AnimatedCtaButton";
import { useTranslation } from "react-i18next";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url: string | null;
  category: string | null;
  created_at: string | null;
}

interface NewArrivalsProps {
  products: Product[];
}

const NewArrivals = ({ products }: NewArrivalsProps) => {
  const { t } = useTranslation();

  const newProducts = products
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 8);

  if (newProducts.length === 0) return null;

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-10"
        >
          <span className="text-label mb-4 block">{t("home.justLanded")}</span>
          <h2 className="heading-section">{t("home.newArrivals")}</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {newProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <ProductCard
                id={product.id}
                name={product.name}
                price={product.price}
                originalPrice={product.original_price ?? undefined}
                image={product.image_url || "/placeholder.svg"}
                category={product.category || undefined}
                sub_category={(product as any).sub_category || undefined}
                isNew={index < 4}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-12"
        >
          <AnimatedCtaButton to="/shop" className="btn-outline">
            {t("home.viewAll")}
          </AnimatedCtaButton>
        </motion.div>
      </div>
    </section>
  );
};

export default NewArrivals;
