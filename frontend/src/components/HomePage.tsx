import { useEffect, useState, useRef } from 'react';
import { Crown, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
const logoImage = new URL('../assets/image.png', import.meta.url).toString();
const videoAds = new URL('../assets/video/ads.mp4', import.meta.url).toString();
import { vipThemes, VipTheme, VipThemeKey, normalizeVipId } from '../constants/vipThemes';
import api from '../services/api';

const bannerImages = [
  'https://i.ibb.co/84zLyNTL/istockphoto-1135934992-612x612.jpg',
  'https://i.ibb.co/Cs4817KP/omega-vs-rolex-khi-cuu-hoang-thach-thuc-tan-vuong.jpg',
  'https://i.ibb.co/7JD8hGg3/omega-vs-rolex-khi-cuu-hoang-thach-thuc-tan-vuong-1.jpg'
];

interface VIPLevel {
  id: VipThemeKey;
  name: string;
  subtitle: string;
  amountRequired: string;
  commission: string;
  orders: number;
  theme: VipTheme;
}

interface HomePageProps {
  bannerImage?: string;
}

export function HomePage({ }: HomePageProps) {
  const { t } = useTranslation(['common', 'home', 'my']);
  const [vipLevels, setVipLevels] = useState<VIPLevel[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Force video to play
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Video autoplay failed:', err);
      });
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.vipLevels();
        const levels = (res?.data?.levels || [])
          .filter((lvl: any) => String(lvl.id || lvl.name).toLowerCase() !== 'vip-0' && String(lvl.id || lvl.name).toLowerCase() !== 'vip0')
          .map((lvl: any) => {
            const key = normalizeVipId(lvl.id || lvl.name);
            const theme = vipThemes[key];
            return {
              id: key,
              name: theme.label,
              subtitle: key, // Store the key for translation lookup
              amountRequired: `$${Number(lvl.amountRequired || 0).toLocaleString()}`,
              commission: `${(Number(lvl.commissionRate || 0) * 100).toFixed(1)}%`,
              orders: Number(lvl.numberOfOrders || 0),
              theme,
            } as VIPLevel;
          });
        // Keep display order high -> low
        levels.sort((a: any, b: any) => b.orders - a.orders);
        setVipLevels(levels);
      } catch {
        // Fallback minimal when API fails (avoid blank screen)
        const fallbackKeys: VipThemeKey[] = ['royal', 'svip', 'vip7', 'vip6', 'vip5', 'vip4', 'vip3', 'vip2', 'vip1'];
        setVipLevels(fallbackKeys.map((id) => ({
          id,
          name: vipThemes[id].label,
          subtitle: id, // Store the key for translation lookup
          amountRequired: '-',
          commission: '-',
          orders: 0,
          theme: vipThemes[id],
        })));
      }
    })();
  }, []);

  return (
    <div className="bottom-nav-safe-pad">
      {/* Logo */}
      <div className="bg-gray-100 py-4 px-6 text-center">
        <img src={logoImage} alt="Overstock" className="inline-block h-10 object-contain" />
      </div>

      {/* Video Advertisement */}
      <div className="px-4 pt-4">
        <div className="overflow-hidden shadow-lg bg-gray-200">
          <video
            ref={videoRef}
            src={videoAds}
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect fill='%23f3f4f6' width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%239ca3af'%3ELoading video...%3C/text%3E%3C/svg%3E"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            className="w-full h-48 object-cover"
            style={{ pointerEvents: 'none' }}
            onLoadedData={() => {
              videoRef.current?.play();
            }}
          />
        </div>
      </div>

      {/* Banner Images - Vertical Stack */}
      <div className="px-4 pt-4 space-y-3">
        {bannerImages.map((img, index) => (
          <div key={index} className="overflow-hidden shadow-lg">
            <img
              src={img}
              alt={`Banner ${index + 1}`}
              className="w-full h-40 object-cover"
            />
          </div>
        ))}
      </div>

      {/* Membership Levels */}
      <div className="px-4 pt-5">
        <h2 className="text-gray-900 mb-4 text-center text-xl font-extrabold tracking-wider uppercase" style={{ letterSpacing: '0.15em' }}>
          {t('home:membershipLevel')}
        </h2>

        <div className="space-y-3" style={{ marginBottom: '230px' }}>
          {vipLevels.map((level, index) => {
            const theme = level.theme;
            const hasBadge = Boolean(theme.badgeImage);

            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative overflow-hidden rounded-2xl ${theme.gradient} p-4 ${theme.textColorClass || 'text-white'} shadow-lg`}
                style={{
                  backgroundColor: theme.bgColor || undefined,
                  backgroundImage: theme.backgroundPattern || undefined,
                  backgroundSize: theme.backgroundPattern ? '20px 20px' : undefined,
                }}
              >
                {/* VIP Background Image - Watermark */}
                {hasBadge && (
                  <div className={`absolute right-4 top-1/2 -translate-y-1/2 ${theme.watermarkOpacity || 'opacity-60'} pointer-events-none`}>
                    <img
                      src={theme.badgeImage!}
                      alt={`${level.name} Background`}
                      className="w-36 h-36 object-contain brightness-125 contrast-110 rounded-2xl"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Lock Icon */}
                <div className="absolute top-3 right-3 p-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                  <Lock className="w-4 h-4" />
                </div>

                {/* VIP Icon or Badge */}
                <div className="relative z-10 mb-2">
                  {hasBadge ? (
                    <div className="inline-flex items-center">
                      <div className={`${theme.badgeSize || 'w-12 h-14'} flex items-center justify-center`}>
                        <img
                          src={theme.badgeImage!}
                          alt={`${level.name} Badge`}
                          className="w-full h-full object-contain drop-shadow-2xl rounded-xl"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="inline-flex p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Crown className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* VIP Title */}
                <div className="relative z-10">
                  <h3 className={`text-lg mb-0.5 ${theme.titleClass}`}>
                    {level.name}
                  </h3>
                  <p className={`text-xs mb-3 ${theme.subtitleClass}`}>
                    {t(`my:vip.subtitles.${level.subtitle}`)}
                  </p>
                </div>

                {/* Details */}
                <div className={`relative z-10 space-y-1.5 text-xs ${theme.detailContainerClass}`}>
                  <div className="flex gap-2">
                    <span className={theme.detailLabelClass}>{t('home:amountRequired')}:</span>
                    <span className={theme.detailValueClass}>{level.amountRequired}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className={theme.detailLabelClass}>{t('home:commissionPerOrder')}:</span>
                    <span className={theme.detailValueClass}>{level.commission}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className={theme.detailLabelClass}>{t('home:numberOfOrders')}:</span>
                    <span className={theme.detailValueClass}>{level.orders}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Partner brands data - Mixed sources for best compatibility
const partnerBrands = [
  { name: 'Starbucks', logo: 'https://cdn.simpleicons.org/starbucks/00704A' },
  { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
  { name: 'Target', logo: 'https://cdn.simpleicons.org/target/CC0000' },
  { name: 'Apple', logo: 'https://cdn.simpleicons.org/apple/000000' },
  { name: 'Best Buy', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Best_Buy_Logo.svg' },
  { name: 'Nike', logo: 'https://cdn.simpleicons.org/nike/000000' },
  { name: 'Adidas', logo: 'https://cdn.simpleicons.org/adidas/000000' },
  { name: 'Puma', logo: 'https://cdn.simpleicons.org/puma/000000' },
  { name: 'Under Armour', logo: 'https://cdn.simpleicons.org/underarmour/1D1D1D' },
  { name: 'Reebok', logo: 'https://cdn.simpleicons.org/reebok/000000' },
  { name: 'New Balance', logo: 'https://cdn.simpleicons.org/newbalance/CC0000' },
  { name: 'Converse', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Converse_logo.svg' },
  { name: 'Gucci', logo: 'https://cdn.simpleicons.org/gucci/000000' },
  { name: 'H&M', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg' },
  { name: 'Zara', logo: 'https://cdn.simpleicons.org/zara/000000' },
  { name: 'Uniqlo', logo: 'https://cdn.simpleicons.org/uniqlo/ED1C24' },
  { name: 'Gap', logo: 'https://cdn.simpleicons.org/gap/003087' },
  { name: 'Lululemon', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Lululemon_Athletica_logo.svg' },
  { name: 'Sephora', logo: 'https://cdn.simpleicons.org/sephora/000000' },
  { name: 'eBay', logo: 'https://cdn.simpleicons.org/ebay/E53238' },
  { name: 'Etsy', logo: 'https://cdn.simpleicons.org/etsy/F16521' },
  { name: 'Shopify', logo: 'https://cdn.simpleicons.org/shopify/7AB55C' },
  { name: 'Alibaba', logo: 'https://cdn.simpleicons.org/alibabadotcom/FF6A00' },
  { name: 'AliExpress', logo: 'https://cdn.simpleicons.org/aliexpress/FF4747' },
  { name: 'Ikea', logo: 'https://cdn.simpleicons.org/ikea/0058A3' },
  { name: 'Costco', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Costco_Wholesale_logo_2010-10-26.svg' },
  { name: 'Samsung', logo: 'https://cdn.simpleicons.org/samsung/1428A0' },
  { name: 'Sony', logo: 'https://cdn.simpleicons.org/sony/000000' },
  { name: 'LG', logo: 'https://cdn.simpleicons.org/lg/A50034' },
  { name: 'Dell', logo: 'https://cdn.simpleicons.org/dell/007DB8' },
  { name: 'HP', logo: 'https://cdn.simpleicons.org/hp/0096D6' },
  { name: 'Lenovo', logo: 'https://cdn.simpleicons.org/lenovo/E2231A' },
  { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg' },
  { name: 'Google', logo: 'https://cdn.simpleicons.org/google/4285F4' },
];
