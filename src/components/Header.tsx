import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, Menu, X, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  const navLinks = [
    { name: "New In", href: "/" },
    { name: "Women", href: "/" },
    { name: "Men", href: "/" },
    { name: "Kids", href: "/" },
    { name: "Sale", href: "/" },
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

              <button className="p-2 hover:opacity-70 transition-opacity" aria-label="Search">
                <Search size={20} />
              </button>

              {user ? (
                <>
                  <Link to="/admin" className="p-2 hover:opacity-70 transition-opacity" aria-label="Admin">
                    <User size={20} />
                  </Link>
                  <button onClick={handleLogout} className="p-2 hover:opacity-70 transition-opacity" aria-label="Logout">
                    <LogOut size={20} />
                  </button>
                </>
              ) : (
                <Link to="/login" className="p-2 hover:opacity-70 transition-opacity" aria-label="Login">
                  <User size={20} />
                </Link>
              )}

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
    </>
  );
};

export default Header;