import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Dynamically updates <title>, <link rel="icon">, and injects Facebook Pixel
 * from site_settings. Renders nothing — mount once inside App.
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

  // Facebook Pixel injection
  useEffect(() => {
    const pixelId = (settings as any).facebook_pixel_id;
    if (!pixelId) return;

    // Avoid double injection
    if (document.getElementById("fb-pixel-script")) return;

    const script = document.createElement("script");
    script.id = "fb-pixel-script";
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    // Noscript fallback
    const noscript = document.createElement("noscript");
    noscript.id = "fb-pixel-noscript";
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
    document.head.appendChild(noscript);
  }, [(settings as any).facebook_pixel_id]);

  return null;
};

export default SiteMetaUpdater;
