import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AnimatedCtaButton from "./AnimatedCtaButton";
import { useTranslation } from "react-i18next";

const CategorySection = () => {
  const { t } = useTranslation();

  const categories = [
    {
      key: "men",
      name: t("home.men"),
      image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&h=800&fit=crop",
      href: "/category/men",
    },
    {
      key: "women",
      name: t("home.women"),
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=800&fit=crop",
      href: "/category/women",
    },
    {
      key: "kids",
      name: t("home.kids"),
      image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&h=800&fit=crop",
      href: "/category/kids",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-label mb-4 block">{t("home.curatedCollections")}</span>
          <h2 className="heading-section">{t("home.shopByCategory")}</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={category.href} className="group block relative aspect-square overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-8">
                  <h3 className="font-serif text-2xl md:text-3xl text-primary-foreground mb-2">
                    {category.name}
                  </h3>
                  <span className="text-sm uppercase tracking-[0.15em] text-primary-foreground/80 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 border-b border-primary-foreground/50">
                    {t("home.explore")}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
