import { useState, useCallback } from "react";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLocation } from "react-router-dom";

const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const MessengerIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z" />
  </svg>
);

const itemVariants = {
  open: { opacity: 1, y: 0, scale: 1 },
  closed: { opacity: 0, y: 16, scale: 0.85 },
};

const FloatingChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useSiteSettings();
  const location = useLocation();

  const handleMouseLeave = useCallback(() => {
    if (window.innerWidth >= 768) setIsOpen(false);
  }, []);

  if (location.pathname.startsWith("/admin")) return null;

  const whatsappNumber = settings.whatsapp_number || settings.phone_number || settings.contact_phone;
  const messengerId = settings.messenger_id;

  const hasWhatsApp = !!whatsappNumber;
  const hasMessenger = !!messengerId;

  // Show widget even with no config — it just won't have sub-icons
  const defaultMessage = encodeURIComponent("Hello Modest Mart, I want to know more about your products.");
  const whatsappLink = hasWhatsApp
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${defaultMessage}`
    : "";
  const messengerLink = hasMessenger
    ? (messengerId.startsWith("http") ? messengerId : `https://m.me/${messengerId}`)
    : "";

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[60] flex flex-col items-end gap-2"
      onMouseLeave={handleMouseLeave}
    >
      {/* Sub-icons */}
      <AnimatePresence>
        {isOpen && (hasWhatsApp || hasMessenger) && (
          <motion.div
            className="flex flex-col items-end gap-2.5 mb-1"
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open: { transition: { staggerChildren: 0.08, staggerDirection: -1 } },
              closed: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {hasWhatsApp && (
              <motion.a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#25D366] text-white pl-4 pr-3.5 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-shadow min-h-[44px]"
                variants={itemVariants}
                transition={{ type: "spring", stiffness: 380, damping: 20 }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
              >
                <span className="text-sm font-medium whitespace-nowrap">WhatsApp</span>
                <WhatsAppIcon size={20} />
              </motion.a>
            )}
            {hasMessenger && (
              <motion.a
                href={messengerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#0084FF] text-white pl-4 pr-3.5 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-shadow min-h-[44px]"
                variants={itemVariants}
                transition={{ type: "spring", stiffness: 380, damping: 20 }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
              >
                <span className="text-sm font-medium whitespace-nowrap">Messenger</span>
                <MessengerIcon size={20} />
              </motion.a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen((p) => !p)}
        onMouseEnter={() => {
          if (window.innerWidth >= 768) setIsOpen(true);
        }}
        className="relative flex items-center gap-2.5 bg-primary text-primary-foreground pl-4 pr-5 py-3 rounded-full shadow-xl hover:shadow-2xl transition-shadow min-h-[48px]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Pulse ring */}
        {!isOpen && (
          <span
            className="absolute inset-0 rounded-full bg-primary/25 pointer-events-none"
            style={{
              animation: "ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite",
            }}
          />
        )}
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
        </motion.div>
        <span className="text-xs font-semibold whitespace-nowrap tracking-wide">
          {isOpen ? "বন্ধ করুন" : "চ্যাট করুন"}
        </span>
      </motion.button>
    </div>
  );
};

export default FloatingChatWidget;
