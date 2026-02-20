import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({ title: "Subscribed!", description: "Thank you for subscribing to our newsletter." });
      setEmail("");
    }
  };

  const shopLinks = [
    { name: t("footer.newIn"), href: "/category/new" },
    { name: t("footer.women"), href: "/category/women" },
    { name: t("footer.men"), href: "/category/men" },
    { name: t("footer.kids"), href: "/category/kids" },
    { name: t("footer.sale"), href: "/category/sale" },
  ];

  const helpLinks = [
    { name: t("footer.trackOrder"), href: "/track-order" },
    { name: t("footer.shipping"), href: "/" },
    { name: t("footer.sizeGuide"), href: "/" },
    { name: t("footer.contact"), href: "/" },
    { name: t("footer.faq"), href: "/" },
  ];

  const aboutLinks = [
    { name: t("footer.ourStory"), href: "/" },
    { name: t("footer.sustainability"), href: "/" },
    { name: t("footer.careers"), href: "/" },
    { name: t("footer.press"), href: "/" },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="font-serif text-2xl md:text-3xl mb-4">{t("footer.newsletter")}</h3>
            <p className="text-primary-foreground/70 mb-6">{t("footer.newsletterDesc")}</p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("footer.emailPlaceholder")}
                className="flex-1 bg-transparent border border-primary-foreground/30 px-4 py-3 text-sm placeholder:text-primary-foreground/50 focus:outline-none focus:border-primary-foreground"
                required
              />
              <button
                type="submit"
                className="bg-primary-foreground text-primary px-6 py-3 text-sm uppercase tracking-[0.1em] font-medium hover:bg-primary-foreground/90 transition-colors"
              >
                {t("footer.subscribe")}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="space-y-6">
            <h2 className="font-serif text-2xl tracking-[0.1em]">SAILOR</h2>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">{t("footer.tagline")}</p>
            <div className="flex gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-primary-foreground/10 transition-colors" aria-label="Instagram"><Instagram size={20} /></a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-primary-foreground/10 transition-colors" aria-label="Facebook"><Facebook size={20} /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-primary-foreground/10 transition-colors" aria-label="Twitter"><Twitter size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-[0.15em] font-medium mb-6">{t("footer.shop")}</h4>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.name}><Link to={link.href} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">{link.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-[0.15em] font-medium mb-6">{t("footer.help")}</h4>
            <ul className="space-y-3">
              {helpLinks.map((link) => (
                <li key={link.name}><Link to={link.href} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">{link.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-[0.15em] font-medium mb-6">{t("footer.about")}</h4>
            <ul className="space-y-3">
              {aboutLinks.map((link) => (
                <li key={link.name}><Link to={link.href} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">{link.name}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-primary-foreground/50 text-xs">© {new Date().getFullYear()} SAILOR. {t("footer.rights")}</p>
            <div className="flex gap-6">
              <Link to="/" className="text-primary-foreground/50 hover:text-primary-foreground text-xs transition-colors">{t("footer.privacy")}</Link>
              <Link to="/" className="text-primary-foreground/50 hover:text-primary-foreground text-xs transition-colors">{t("footer.terms")}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
