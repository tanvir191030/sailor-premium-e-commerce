import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, MapPin, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();
  const { settings } = useSiteSettings();

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
    { name: t("footer.shipping"), href: "/shipping-returns" },
    { name: t("footer.sizeGuide"), href: "/faq#size" },
    { name: t("footer.contact"), href: "/contact" },
    { name: t("footer.faq"), href: "/faq" },
  ];

  const aboutLinks = [
    { name: t("footer.ourStory"), href: "/about" },
    { name: t("footer.sustainability"), href: "/about" },
    { name: t("footer.careers"), href: "/contact" },
    { name: t("footer.press"), href: "/contact" },
  ];

  const storeName = settings.store_name || "SAILOR";
  const facebookUrl = settings.facebook_url || settings.facebook || "https://facebook.com";
  const instagramUrl = settings.instagram_url || settings.instagram || "https://instagram.com";
  const twitterUrl = settings.twitter_url || "https://twitter.com";
  const aboutUs = settings.about_us || t("footer.tagline");
  const officeAddress = settings.office_address;
  const supportEmail = settings.support_email || settings.contact_email;
  const phoneNumber = settings.phone_number || settings.contact_phone;

  return (
    <footer className="bg-primary text-primary-foreground pb-20 md:pb-0">
      <div className="border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="font-serif text-2xl md:text-3xl mb-4">{t("footer.newsletter")}</h3>
            <p className="text-primary-foreground/70 mb-6">{t("footer.newsletterDesc")}</p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("footer.emailPlaceholder")}
                className="flex-1 bg-transparent border border-primary-foreground/30 px-4 py-3 text-sm placeholder:text-primary-foreground/50 focus:outline-none focus:border-primary-foreground min-h-[44px]"
                required
              />
              <button
                type="submit"
                className="bg-primary-foreground text-primary px-6 py-3 text-sm uppercase tracking-[0.1em] font-medium hover:bg-primary-foreground/90 transition-colors min-h-[44px]"
              >
                {t("footer.subscribe")}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand column — full width on mobile */}
          <div className="col-span-2 md:col-span-1 space-y-5 text-center md:text-left">
            <h2 className="font-serif text-2xl tracking-[0.1em]">{storeName}</h2>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">{aboutUs}</p>

            {/* Contact info */}
            <div className="space-y-2 pt-1">
              {officeAddress && (
                <div className="flex items-start gap-2 text-primary-foreground/60 text-xs justify-center md:justify-start">
                  <MapPin size={13} className="mt-0.5 flex-shrink-0" />
                  <span>{officeAddress}</span>
                </div>
              )}
              {supportEmail && (
                <div className="flex items-center gap-2 text-primary-foreground/60 text-xs justify-center md:justify-start">
                  <Mail size={13} className="flex-shrink-0" />
                  <a href={`mailto:${supportEmail}`} className="hover:text-primary-foreground transition-colors">{supportEmail}</a>
                </div>
              )}
              {phoneNumber && (
                <div className="flex items-center gap-2 text-primary-foreground/60 text-xs justify-center md:justify-start">
                  <Phone size={13} className="flex-shrink-0" />
                  <a href={`tel:${phoneNumber}`} className="hover:text-primary-foreground transition-colors">{phoneNumber}</a>
                </div>
              )}
            </div>

            {/* Social links */}
            <div className="flex gap-3 pt-1 justify-center md:justify-start">
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-primary-foreground/10 transition-colors rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-primary-foreground/10 transition-colors rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-primary-foreground/10 transition-colors rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Twitter">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          <div className="text-center md:text-left">
            <h4 className="text-sm uppercase tracking-[0.15em] font-medium mb-4 md:mb-6">{t("footer.shop")}</h4>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h4 className="text-sm uppercase tracking-[0.15em] font-medium mb-4 md:mb-6">{t("footer.help")}</h4>
            <ul className="space-y-3">
              {helpLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h4 className="text-sm uppercase tracking-[0.15em] font-medium mb-4 md:mb-6">{t("footer.about")}</h4>
            <ul className="space-y-3">
              {aboutLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row text-center md:text-left">
            <p className="text-primary-foreground/50 text-xs">© {new Date().getFullYear()} {storeName}. {t("footer.rights")}</p>
            <div className="flex gap-6">
              <Link to="/privacy-policy" className="text-primary-foreground/50 hover:text-primary-foreground text-xs transition-colors">{t("footer.privacy")}</Link>
              <Link to="/terms" className="text-primary-foreground/50 hover:text-primary-foreground text-xs transition-colors">{t("footer.terms")}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
