import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Dynamically updates <title> and <link rel="icon"> from site_settings.
 * Renders nothing — mount once inside App.
 */
const SiteMetaUpdater = () => {
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (settings.site_title) {
      document.title = settings.site_title;
    }
  }, [settings.site_title]);

  useEffect(() => {
    if (!settings.favicon_url) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = settings.favicon_url;
  }, [settings.favicon_url]);

  return null;
};

export default SiteMetaUpdater;
