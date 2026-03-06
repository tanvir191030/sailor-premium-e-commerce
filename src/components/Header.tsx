import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, Menu, X, Moon, Sun, MapPin, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/hooks/useProducts";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/index";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubCategories } from "@/hooks/useSubCategories";

const LanguageSwitcher = () => {
  const { i18n: i18nInstance } = useTranslation();
  const isEn = i18nInstance.language === "en";

  const toggle = () => {
    const next = isEn ? "bn" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("sailor-language", next);
  };

  return (
    <button
      onClick={toggle}
      className="hidden md:flex items-center gap-1 text-xs font-medium border border-foreground/20 rounded-full px-2.5 py-1 hover:border-foreground/50 transition-colors text-foreground/70 hover:text-foreground"
      aria-label="Toggle language"
    >
      <span className={isEn ? "text-foreground font-bold" : "text-foreground/40"}>EN</span>
      <span className="text-foreground/30">|</span>
      <span className={!isEn ? "text-foreground font-bold" : "text-foreground/40"}>বাং</span>
    </button>
  );
};

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileExpandedCats, setMobileExpandedCats] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const { count: wishlistCount } = useWishlist();
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { settings } = useSiteSettings();

  const storeName = settings.store_name || "Modest Mart";
  const announcementBar = settings.announcement_bar || t("nav.freeShipping");

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

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
  const { data: subCategories = [] } = useSubCategories();
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  // Build dynamic nav links from categories
  const navLinks = [
    { name: t("nav.newIn"), href: "/category/new", catId: null },
    ...categories.map((c: any) => ({
      name: c.name,
      href: `/category/${c.name.toLowerCase()}`,
      catId: c.id,
    })),
    { name: t("nav.sale"), href: "/category/sale", catId: null },
  ];

  return (
    <>
      <div className="bg-primary text-primary-foreground text-center py-2 text-xs tracking-[0.15em] uppercase">
        {announcementBar}
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? "glass shadow-sm" : "bg-background"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="relative flex items-center justify-between h-16 md:h-20">

            {/* LEFT — Nav links (desktop) */}
            <nav className="hidden md:flex items-center gap-6 flex-1">
              {navLinks.map((link) => {
                const subs = link.catId ? subCategories.filter((s: any) => s.category_id === link.catId) : [];
                return (
                  <div
                    key={link.name}
                    className="relative"
                    onMouseEnter={() => subs.length > 0 ? setHoveredCat(link.name) : undefined}
                    onMouseLeave={() => setHoveredCat(null)}
                  >
                    <Link to={link.href} className="nav-link flex items-center gap-1">
                      {link.name}
                      {subs.length > 0 && <ChevronDown size={12} className="opacity-50" />}
                    </Link>
                    {/* Dropdown */}
                    {subs.length > 0 && hoveredCat === link.name && (
                      <div className="absolute top-full left-0 pt-2 z-50">
                        <div className="bg-background border border-border shadow-lg rounded-lg py-2 min-w-[160px]">
                          <Link
                            to={link.href}
                            className="block px-4 py-2 text-sm text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors font-medium"
                            onClick={() => setHoveredCat(null)}
                          >
                            সব {link.name}
                          </Link>
                          <div className="border-t border-border/50 my-1" />
                          {subs.map((sub: any) => (
                            <Link
                              key={sub.id}
                              to={`/category/${link.name.toLowerCase()}/${sub.name.toLowerCase()}`}
                              className="block px-4 py-2 text-sm text-foreground/70 hover:bg-secondary hover:text-foreground transition-colors"
                              onClick={() => setHoveredCat(null)}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 -ml-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* CENTER — Logo (absolutely centered) */}
            <Link
              to="/"
              className="absolute left-1/2 -translate-x-1/2 flex items-center"
              aria-label="Sailor home"
            >
              {settings.logo_url ? (
                <img src={settings.logo_url} alt={storeName} className="h-8 md:h-10 object-contain" />
              ) : (
                <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-[0.1em] whitespace-nowrap">
                  {storeName}
                </h1>
              )}
            </Link>

            {/* RIGHT — Action icons */}
            <div
              className="flex items-center justify-end gap-0.5 md:gap-1 flex-1"
              ref={searchContainerRef}
            >
              <LanguageSwitcher />

              {/* Search — desktop only inline, mobile via menu */}
              <div className="relative hidden md:flex items-center">
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 190, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden mr-1"
                    >
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={t("nav.search")}
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

                {/* Search results dropdown */}
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

              {/* Mobile search button */}
              <button
                className="p-2 hover:opacity-70 transition-opacity md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label="Search"
                onClick={() => setIsSearchOpen((prev) => !prev)}
              >
                <Search size={20} />
              </button>

              {/* Theme toggle — desktop only */}
              <button
                className="p-2 hover:opacity-70 transition-opacity hidden md:flex items-center justify-center"
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

              {/* Track order — desktop only */}
              <Link
                to="/track-order"
                className="p-2 hover:opacity-70 transition-opacity hidden md:block"
                aria-label="Track Order"
              >
                <MapPin size={20} />
              </Link>

              {/* Wishlist — desktop only */}
              <button
                className="p-2 hover:opacity-70 transition-opacity relative min-w-[40px] min-h-[40px] hidden md:flex items-center justify-center"
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

              {/* Cart — desktop only */}
              <button
                className="p-2 hover:opacity-70 transition-opacity relative min-w-[40px] min-h-[40px] hidden md:flex items-center justify-center"
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

          {/* Mobile search bar — slides down */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="md:hidden overflow-hidden border-t border-border"
                ref={searchContainerRef}
              >
                <div className="px-4 py-3 relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t("nav.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                  />
                  {/* Mobile search results */}
                  {searchQuery.trim() && (
                    <div className="mt-2 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                            <div className="w-10 h-10 bg-secondary overflow-hidden flex-shrink-0 rounded">
                              <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-xs truncate">{product.name}</p>
                              <p className="text-[10px] text-muted-foreground">৳{product.price.toLocaleString()}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center text-xs py-4">কোনো ফলাফল নেই</p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile side drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 bg-black/40 z-[70] md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              {/* Drawer */}
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="fixed top-0 left-0 bottom-0 w-[280px] bg-background z-[80] flex flex-col shadow-2xl md:hidden overflow-hidden"
              >
                {/* Drawer header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <span className="font-serif text-lg tracking-[0.1em]">{storeName}</span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-secondary rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Nav links with accordion sub-categories */}
                <nav className="flex-1 overflow-y-auto overscroll-contain py-2 min-h-0 h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {navLinks.map((link, i) => {
                    const subs = link.catId ? subCategories.filter((s: any) => s.category_id === link.catId) : [];
                    const isExpanded = mobileExpandedCats.has(link.name);
                    const toggleExpand = () => {
                      setMobileExpandedCats(prev => {
                        const next = new Set(prev);
                        if (next.has(link.name)) next.delete(link.name);
                        else next.add(link.name);
                        return next;
                      });
                    };
                    return (
                      <div key={link.name} className={i < navLinks.length - 1 ? "border-b border-border/40" : ""}>
                        {subs.length > 0 ? (
                          <button
                            onClick={toggleExpand}
                            className="w-full flex items-center justify-between px-6 py-3.5 text-[13px] uppercase tracking-[0.12em] font-medium text-foreground/80 hover:bg-secondary/60 hover:text-foreground transition-colors"
                          >
                            <span>{link.name}</span>
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
                              <ChevronDown size={16} className="text-primary" />
                            </motion.div>
                          </button>
                        ) : (
                          <Link
                            to={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-6 py-3.5 text-[13px] uppercase tracking-[0.12em] font-medium text-foreground/80 hover:bg-secondary/60 hover:text-foreground transition-colors"
                          >
                            {link.name}
                          </Link>
                        )}
                        <AnimatePresence initial={false}>
                          {subs.length > 0 && isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="pl-10 pr-4 pb-2 space-y-0">
                                <Link
                                  to={link.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="block py-2 text-[12px] tracking-[0.1em] text-primary font-medium hover:text-foreground transition-colors"
                                >
                                  {link.name} All
                                </Link>
                                {subs.map((sub: any) => (
                                  <Link
                                    key={sub.id}
                                    to={`/category/${link.name.toLowerCase()}/${sub.name.toLowerCase()}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block py-2 text-[12px] tracking-[0.1em] text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  <div className="border-t border-border my-1" />

                  <Link
                    to="/track-order"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-6 py-3.5 text-[13px] uppercase tracking-[0.12em] font-medium text-foreground/80 hover:bg-secondary/60 hover:text-foreground transition-colors"
                  >
                    <MapPin size={16} /> {t("nav.trackOrder")}
                  </Link>

                  <button
                    onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-6 py-3.5 text-[13px] uppercase tracking-[0.12em] font-medium text-foreground/80 hover:bg-secondary/60 hover:text-foreground transition-colors"
                  >
                    {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </button>
                </nav>

                {/* Language switcher at bottom */}
                <div className="px-6 py-4 border-t border-border">
                  <p className="text-[11px] text-muted-foreground mb-2.5 uppercase tracking-wider">Language</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { i18n.changeLanguage("bn"); localStorage.setItem("sailor-language", "bn"); setIsMobileMenuOpen(false); }}
                      className={`text-xs font-medium px-4 py-2 rounded-full border transition-colors ${
                        i18n.language === "bn" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/30"
                      }`}
                    >
                      বাংলা
                    </button>
                    <button
                      onClick={() => { i18n.changeLanguage("en"); localStorage.setItem("sailor-language", "en"); setIsMobileMenuOpen(false); }}
                      className={`text-xs font-medium px-4 py-2 rounded-full border transition-colors ${
                        i18n.language === "en" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/30"
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Header;
