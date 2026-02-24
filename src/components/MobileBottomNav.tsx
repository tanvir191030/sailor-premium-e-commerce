import { Link, useLocation } from "react-router-dom";
import { Home, Store, ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const MobileBottomNav = () => {
  const location = useLocation();
  const { totalItems, setIsOpen } = useCart();

  const isActive = (path: string) => location.pathname === path;

  // Hide on admin pages
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom">
      <div className="bg-background/80 backdrop-blur-xl border-t border-border">
        <div className="flex items-stretch">
          {/* Home */}
          <Link
            to="/"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] transition-colors ${
              isActive("/") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home size={20} strokeWidth={isActive("/") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">হোম</span>
          </Link>

          {/* Shop */}
          <Link
            to="/shop"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] transition-colors ${
              isActive("/shop") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Store size={20} strokeWidth={isActive("/shop") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">শপ</span>
          </Link>

          {/* Cart */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] text-muted-foreground transition-colors relative"
          >
            <div className="relative">
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-primary text-primary-foreground text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">কার্ট</span>
          </button>

          {/* Contact / WhatsApp */}
          <Link
            to="/contact"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] transition-colors ${
              isActive("/contact") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <MessageCircle size={20} strokeWidth={isActive("/contact") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">যোগাযোগ</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
