import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AnimatedCtaButton from "./AnimatedCtaButton";

interface Category {
  name: string;
  image: string;
  href: string;
}

const categories: Category[] = [
  {
    name: "Men",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&h=800&fit=crop",
    href: "/category/men",
  },
  {
    name: "Women",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=800&fit=crop",
    href: "/category/women",
  },
  {
    name: "Kids",
    image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&h=800&fit=crop",
    href: "/category/kids",
  },
];

const CategorySection = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-label mb-4 block">Curated Collections</span>
          <h2 className="heading-section">Shop by Category</h2>
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={category.href} className="group block relative aspect-square overflow-hidden">
                {/* Image */}
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-end p-8">
                  <h3 className="font-serif text-2xl md:text-3xl text-primary-foreground mb-2">
                    {category.name}
                  </h3>
                  <span className="text-sm uppercase tracking-[0.15em] text-primary-foreground/80 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 border-b border-primary-foreground/50">
                    Explore
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