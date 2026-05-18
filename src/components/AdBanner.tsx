import React, { useEffect, useRef, useState } from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: 'true' | 'false';
  style?: React.CSSProperties;
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  slot, 
  format = 'auto', 
  responsive = 'true',
  style = { display: 'block' }
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only initialize if we haven't already and the element is available
    if (!initialized && adRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
           // Only push when the width is > 0 and the element doesn't have an ad already
           if (entry.contentRect.width > 0 && adRef.current && adRef.current.innerHTML === "") {
             try {
               // @ts-ignore
               (window.adsbygoogle = window.adsbygoogle || []).push({});
               setInitialized(true);
               observer.disconnect(); // Stop observing after successful push
             } catch (e) {
               console.error('Adsbygoogle error:', e);
             }
           }
        }
      });

      observer.observe(adRef.current);
      return () => observer.disconnect();
    }
  }, [initialized]);

  const clientId = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID || "ca-pub-0000000000000000";

  return (
    <div className="ad-container my-4 overflow-hidden rounded-xl bg-white/5 border border-white/5 flex flex-col items-center w-full min-h-[50px]">
      <span className="text-[10px] text-gray-600 uppercase tracking-widest p-1">Advertisement</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={style}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};
