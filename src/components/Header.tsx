import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/hooks/useProducts";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
    }
  }, [isSearchOpen]);

  const filteredProducts = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const navLinks = [
    { name: "New In", href: "/category/new" },
    { name: "Women", href: "/category/women" },
    { name: "Men", href: "/category/men" },
    { name: "Kids", href: "/category/kids" },
    { name: "Sale", href: "/category/sale" },
  ];

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-xs tracking-[0.15em] uppercase">
        Free Shipping on Orders Over $150
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? "glass shadow-sm" : "bg-background"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-3 items-center h-16 md:h-20">
            {/* Left Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.slice(0, 3).map((link) => (
                <Link key={link.name} to={link.href} className="nav-link">
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 -ml-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex justify-center">
              <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-[0.1em]">
                SAILOR
              </h1>
            </Link>

            {/* Right Navigation */}
            <div className="flex items-center justify-end gap-4">
              <nav className="hidden md:flex items-center gap-6 mr-4">
                {navLinks.slice(3).map((link) => (
                  <Link key={link.name} to={link.href} className="nav-link">
                    {link.name}
                  </Link>
                ))}
              </nav>

              <button
                className="p-2 hover:opacity-70 transition-opacity"
                aria-label="Search"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search size={20} />
              </button>

              <button className="p-2 hover:opacity-70 transition-opacity" aria-label="Wishlist">
                <Heart size={20} />
              </button>

              <button className="p-2 hover:opacity-70 transition-opacity relative" aria-label="Cart">
                <ShoppingBag size={20} />
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 flex items-center justify-center">
                  0
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden border-t border-border"
            >
              <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-sm uppercase tracking-[0.1em] font-medium py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm"
          >
            <div className="container mx-auto px-4 md:px-6 pt-8">
              {/* Close */}
              <div className="flex justify-end mb-8">
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 hover:opacity-70 transition-opacity"
                  aria-label="Close search"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Search Input */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="max-w-2xl mx-auto"
              >
                <div className="relative">
                  <Search size={20} className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-b border-border py-4 pl-8 pr-4 text-xl md:text-2xl font-light focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
                  />
                </div>

                {/* Results */}
                {searchQuery.trim() && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 space-y-4"
                  >
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <button
                            onClick={() => {
                              setIsSearchOpen(false);
                              if (product.category) {
                                navigate(`/category/${product.category.toLowerCase()}`);
                              }
                            }}
                            className="w-full flex items-center gap-4 p-3 hover:bg-secondary transition-colors text-left"
                          >
                            <div className="w-14 h-14 bg-secondary overflow-hidden flex-shrink-0">
                              <img
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                {product.category || "Uncategorized"} ·{" "}
                                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.price)}
                              </p>
                            </div>
                          </button>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No products found for "{searchQuery}"
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
