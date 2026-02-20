import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Users, CreditCard,
  Megaphone, Settings, ArrowLeft, Menu, X, LogOut, Moon, Sun, Tag, Award,
} from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminCustomers from "@/components/admin/AdminCustomers";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminMarketing from "@/components/admin/AdminMarketing";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminBrands from "@/components/admin/AdminBrands";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/index";

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const sections = [
    { id: "dashboard", label: t("admin.dashboard"), icon: LayoutDashboard },
    { id: "products", label: t("admin.products"), icon: Package },
    { id: "categories", label: t("admin.categories"), icon: Tag },
    { id: "brands", label: t("admin.brands"), icon: Award },
    { id: "orders", label: t("admin.orders"), icon: ShoppingCart },
    { id: "customers", label: t("admin.customers"), icon: Users },
    { id: "payments", label: t("admin.payments"), icon: CreditCard },
    { id: "marketing", label: t("admin.marketing"), icon: Megaphone },
    { id: "settings", label: t("admin.settings"), icon: Settings },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); } else { setUser(session.user); }
      setLoading(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { navigate("/login"); } else { setUser(session.user); }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard": return <AdminDashboard />;
      case "products": return <AdminProducts />;
      case "categories": return <AdminCategories />;
      case "brands": return <AdminBrands />;
      case "orders": return <AdminOrders />;
      case "customers": return <AdminCustomers />;
      case "payments": return <AdminPayments />;
      case "marketing": return <AdminMarketing />;
      case "settings": return <AdminSettings />;
      default: return <AdminDashboard />;
    }
  };

  const currentSection = sections.find((s) => s.id === activeSection);
  const isEn = i18n.language === "en";

  const toggleLang = () => {
    const next = isEn ? "bn" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("sailor-language", next);
  };

  return (
    <div className="min-h-screen bg-secondary flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-card border-r border-border z-50 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-70 transition-opacity">
            <ArrowLeft size={16} />
            <span className="font-serif text-lg tracking-[0.1em]">SAILOR</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-secondary rounded">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === s.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <s.icon size={18} />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <span className="text-base">🌐</span>
            <span className="flex items-center gap-1">
              <span className={isEn ? "font-bold text-foreground" : ""}>EN</span>
              <span className="text-foreground/30 mx-1">|</span>
              <span className={!isEn ? "font-bold text-foreground" : ""}>বাং</span>
            </span>
          </button>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <motion.div key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </motion.div>
            {theme === "dark" ? t("admin.lightMode") : t("admin.darkMode")}
          </button>

          <div>
            <p className="text-xs text-muted-foreground truncate mb-1">{user?.email}</p>
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <LogOut size={14} /> {t("admin.logout")}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 md:px-6 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-secondary rounded-lg">
            <Menu size={20} />
          </button>
          <h1 className="font-serif text-lg tracking-wide text-foreground">{currentSection?.label}</h1>
        </header>

        <main className="p-4 md:p-6 max-w-7xl">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default Admin;
