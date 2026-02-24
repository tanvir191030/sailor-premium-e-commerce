import { Link, useLocation } from "react-router-dom";
import { Home, Store, Heart, ShoppingBag, MessageCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

const MobileBottomNav = () => {
  const location = useLocation();
  const { totalItems, setIsOpen } = useCart();
  const { count: wishlistCount } = useWishlist();

  const isActive = (path: string) => location.pathname === path;

  if (location.pathname.startsWith("/admin")) return null;

  const items = [
    { type: "link" as const, path: "/", icon: Home, label: "হোম" },
    { type: "link" as const, path: "/shop", icon: Store, label: "শপ" },
    { type: "link" as const, path: "/wishlist", icon: Heart, label: "উইশলিস্ট", badge: wishlistCount },
    { type: "button" as const, path: "/cart", icon: ShoppingBag, label: "কার্ট", badge: totalItems },
    { type: "link" as const, path: "/contact", icon: MessageCircle, label: "যোগাযোগ" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom">
      <div className="bg-background/70 backdrop-blur-2xl border-t border-border/50 shadow-[0_-2px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch">
          {items.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            const inner = (
              <>
                <div className="relative">
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={active && item.icon === Heart ? "fill-destructive text-destructive" : ""}
                  />
                  {(item.badge ?? 0) > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-destructive text-destructive-foreground text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-0.5">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none mt-0.5">{item.label}</span>
              </>
            );

            const cls = `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`;

            if (item.type === "button") {
              return (
                <button key={item.path} onClick={() => setIsOpen(true)} className={cls}>
                  {inner}
                </button>
              );
            }
            return (
              <Link key={item.path} to={item.path} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
