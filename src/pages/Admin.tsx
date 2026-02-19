import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Megaphone,
  Settings,
  ArrowLeft,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminCustomers from "@/components/admin/AdminCustomers";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminMarketing from "@/components/admin/AdminMarketing";
import AdminSettings from "@/components/admin/AdminSettings";

const sections = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "customers", label: "Customers", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "settings", label: "Settings", icon: Settings },
];

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
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
      case "orders": return <AdminOrders />;
      case "customers": return <AdminCustomers />;
      case "payments": return <AdminPayments />;
      case "marketing": return <AdminMarketing />;
      case "settings": return <AdminSettings />;
      default: return <AdminDashboard />;
    }
  };

  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,95%)] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-[hsl(0,0%,90%)] z-50 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="p-5 border-b border-[hsl(0,0%,90%)] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-70 transition-opacity">
            <ArrowLeft size={16} />
            <span className="font-serif text-lg tracking-[0.1em]">SAILOR</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-[hsl(0,0%,96%)] rounded">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === s.id
                  ? "bg-[hsl(160,84%,20%)] text-white"
                  : "text-[hsl(0,0%,40%)] hover:bg-[hsl(0,0%,96%)] hover:text-foreground"
              }`}
            >
              <s.icon size={18} />
              {s.label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[hsl(0,0%,90%)]">
          <p className="text-xs text-[hsl(0,0%,50%)] truncate mb-2">{user?.email}</p>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-[hsl(0,0%,50%)] hover:text-foreground transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-[hsl(0,0%,90%)] px-4 md:px-6 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-[hsl(0,0%,96%)] rounded-lg">
            <Menu size={20} />
          </button>
          <h1 className="font-serif text-lg tracking-wide">{currentSection?.label}</h1>
        </header>

        {/* Content */}
        <main className="p-4 md:p-6 max-w-7xl">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default Admin;
