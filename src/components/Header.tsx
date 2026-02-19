import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, Menu, X, Moon, Sun, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/hooks/useProducts";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const { count: wishlistCount } = useWishlist();
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 200);
    } else {
      setSearchQuery("");
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isSearchOpen]);

  const filteredProducts = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
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
      <div className="bg-primary text-primary-foreground text-center py-2 text-xs tracking-[0.15em] uppercase">
        Free Shipping on Orders Over ৳5,000
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? "glass shadow-sm" : "bg-background"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-3 items-center h-16 md:h-20">
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.slice(0, 3).map((link) => (
                <Link key={link.name} to={link.href} className="nav-link">
                  {link.name}
                </Link>
              ))}
            </nav>

            <button
              className="md:hidden p-2 -ml-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link to="/" className="flex justify-center">
              <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-[0.1em]">
                SAILOR
              </h1>
            </Link>

            <div className="flex items-center justify-end gap-4" ref={searchContainerRef}>
              <AnimatePresence>
                {!isSearchOpen && (
                  <motion.nav
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="hidden md:flex items-center gap-6 mr-4"
                  >
                    {navLinks.slice(3).map((link) => (
                      <Link key={link.name} to={link.href} className="nav-link">
                        {link.name}
                      </Link>
                    ))}
                  </motion.nav>
                )}
              </AnimatePresence>

              <div className="relative flex items-center">
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 220, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden mr-1"
                    >
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-b border-foreground/30 py-1 text-sm focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  className="p-2 hover:opacity-70 transition-opacity flex-shrink-0"
                  aria-label={isSearchOpen ? "Close search" : "Search"}
                  onClick={() => setIsSearchOpen((prev) => !prev)}
                >
                  {isSearchOpen ? <X size={18} /> : <Search size={20} />}
                </button>

                <AnimatePresence>
                  {isSearchOpen && searchQuery.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-72 bg-background border border-border shadow-lg z-50 max-h-80 overflow-y-auto"
                    >
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              if (product.category) {
                                navigate(`/category/${product.category.toLowerCase()}`);
                              }
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-secondary transition-colors text-left"
                          >
                            <div className="w-10 h-10 bg-secondary overflow-hidden flex-shrink-0">
                              <img
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-xs truncate">{product.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                {product.category || "Uncategorized"} · ৳{product.price.toLocaleString()}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center text-xs py-6">
                          No results for "{searchQuery}"
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                className="p-2 hover:opacity-70 transition-opacity"
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                </motion.div>
              </button>

              <Link to="/track-order" className="p-2 hover:opacity-70 transition-opacity hidden md:block" aria-label="Track Order">
                <MapPin size={20} />
              </Link>

              <button
                className="p-2 hover:opacity-70 transition-opacity relative"
                aria-label="Wishlist"
                onClick={() => navigate("/wishlist")}
              >
                <Heart size={20} className={wishlistCount > 0 ? "fill-destructive text-destructive" : ""} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] w-4 h-4 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                className="p-2 hover:opacity-70 transition-opacity relative"
                aria-label="Cart"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag size={20} />
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 flex items-center justify-center">
                  {totalItems}
                </span>
              </button>
            </div>
          </div>
        </div>

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
                <Link to="/track-order" className="text-sm uppercase tracking-[0.1em] font-medium py-2 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <MapPin size={16} /> Track Order
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Header;
