import { useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { useProducts } from "@/hooks/useProducts";

const ShoeCollection = () => {
  const { data: products = [] } = useProducts();
  const [gender, setGender] = useState<"all" | "men" | "women">("all");

  const shoes = products.filter((p) => {
    const sub = (p.sub_category || "").toLowerCase();
    const cat = (p.category || "").toLowerCase();
    const isShoe = sub.includes("shoe") || sub.includes("জুতা");
    if (!isShoe) return false;
    if (gender === "all") return true;
    return cat.includes(gender);
  });

  if (shoes.length === 0) return null;

  const tabs = [
    { key: "all", label: "সব জুতা" },
    { key: "men", label: "পুরুষ" },
    { key: "women", label: "মহিলা" },
  ] as const;

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span className="text-label mb-3 block">👟 Shoe Collection</span>
          <h2 className="heading-section">জুতা কালেকশন</h2>
          <div className="flex justify-center gap-2 mt-5">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setGender(t.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  gender === t.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {shoes.slice(0, 8).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <ProductCard
                id={product.id}
                name={product.name}
                price={product.price}
                originalPrice={(product as any).original_price ?? undefined}
                image={product.image_url || "/placeholder.svg"}
                category={product.category || undefined}
                sub_category={(product as any).sub_category || undefined}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShoeCollection;
