import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail("");
    }
  };

  const shopLinks = [
    { name: "New In", href: "/" },
    { name: "Women", href: "/" },
    { name: "Men", href: "/" },
    { name: "Kids", href: "/" },
    { name: "Sale", href: "/" },
  ];

  const helpLinks = [
    { name: "Track Order", href: "/track-order" },
    { name: "Shipping & Returns", href: "/" },
    { name: "Size Guide", href: "/" },
    { name: "Contact Us", href: "/" },
    { name: "FAQ", href: "/" },
  ];

  const aboutLinks = [
    { name: "Our Story", href: "/" },
    { name: "Sustainability", href: "/" },
    { name: "Careers", href: "/" },
    { name: "Press", href: "/" },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Newsletter Section */}
      <div className="border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="font-serif text-2xl md:text-3xl mb-4">Join Our Newsletter</h3>
            <p className="text-primary-foreground/70 mb-6">
              Subscribe to receive updates on new arrivals, exclusive offers, and style inspiration.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-transparent border border-primary-foreground/30 px-4 py-3 text-sm placeholder:text-primary-foreground/50 focus:outline-none focus:border-primary-foreground"
                required
              />
              <button
                type="submit"
                className="bg-primary-foreground text-primary px-6 py-3 text-sm uppercase tracking-[0.1em] font-medium hover:bg-primary-foreground/90 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <h2 className="font-serif text-2xl tracking-[0.1em]">SAILOR</h2>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Premium fashion for the modern individual. Crafted with care, designed to last.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-primary-foreground/10 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-primary-foreground/10 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-primary-foreground/10 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-sm uppercase tracking-[0.15em] font-medium mb-6">Shop</h4>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h4 className="text-sm uppercase tracking-[0.15em] font-medium mb-6">Help</h4>
            <ul className="space-y-3">
              {helpLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h4 className="text-sm uppercase tracking-[0.15em] font-medium mb-6">About</h4>
            <ul className="space-y-3">
              {aboutLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-primary-foreground/50 text-xs">
              © {new Date().getFullYear()} SAILOR. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/" className="text-primary-foreground/50 hover:text-primary-foreground text-xs transition-colors">
                Privacy Policy
              </Link>
              <Link to="/" className="text-primary-foreground/50 hover:text-primary-foreground text-xs transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;