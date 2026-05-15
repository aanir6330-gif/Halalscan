import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Camera, 
  Scan, 
  Info, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  History,
  BookOpen,
  Settings,
  Languages,
  ArrowRight,
  ArrowLeft,
  Star,
  MapPin,
  ShoppingBag,
  ExternalLink,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef, useMap } from '@vis.gl/react-google-maps';
import { cn } from './lib/utils';

// Types
type HalalStatus = 'HALAL' | 'HARAM' | 'MASHBOOH' | 'UNKNOWN';
type Language = 'ar' | 'en' | 'fr' | 'es';
type SubscriptionTier = 'NONE' | 'DAILY' | 'MONTHLY' | 'YEARLY';
type AppTab = 'scanner' | 'stores' | 'online';

interface ScanResult {
  status: HalalStatus;
  productName?: string;
  ingredients: string[];
  haramIngredients: string[];
  reasoning: string;
  advice: string;
}

interface Purchase {
  id: string;
  date: string;
  tier: SubscriptionTier;
  amount: string;
}

const AI_MODEL = "gemini-flash-latest";

const translations = {
  ar: {
    title: "HalalScan",
    subtitle: "حلال سكان",
    scanIngredients: "وجه الكاميرا نحو المكونات",
    loading: "جاري التحليل الذكي...",
    loadingSub: "نحن نتحقق من المكونات بدقة",
    cameraError: "فشل الوصول للكاميرا. يرجى التأكد من الأذونات أو جرب فتح التطبيق في متصفح خارجي (خارج الإطار).",
    error: "حدث خطأ أثناء تحليل الصورة. يرجى المحاولة مرة أخرى.",
    retry: "إعادة المحاولة",
    guide: "دليل المواد",
    guideSub: "تعرف على الرموز E",
    about: "عن التطبيق",
    aboutSub: "كيف نقوم بالتحليل؟",
    resultTitle: "هذا المنتج",
    halal: "حلال",
    haram: "حرام",
    mashbooh: "مشبوه (دقق أكثر)",
    unknown: "غير معروف",
    aiAnalysis: "تحليل الذكاء الاصطناعي",
    advice: "نصيحة",
    haramIngs: "مكونات مثيرة للجدل",
    allIngs: "قائمة المكونات المكتشفة",
    scanAnother: "فحص منتج آخر",
    dir: "rtl" as const,
    font: "font-sans",
    alert: "تنبيه",
    premium: "بريميوم",
    goPremium: "اشترك الآن",
    premiumFeatures: "ميزات المشتركين",
    offlineMode: "وضع بدون إنترنت",
    noAds: "بدون إعلانات",
    fastSupport: "دعم سريع",
    plans: {
      daily: "يومي",
      monthly: "شهري",
      yearly: "سنوي",
      priceDay: "1$",
      priceMonth: "5$",
      priceYear: "50$"
    },
    adSpace: "مساحة إعلانية (تختفي للمشتركين)",
    purchaseHistory: "سجل المشتريات",
    noPurchases: "لا يوجد مشتريات سابقة",
    date: "التاريخ",
    amount: "المبلغ",
    plan: "الخطة",
    nearbyStores: "متاجر قريبة",
    buyOnline: "تسوق أونلاين",
    findHalal: "ابحث عن طعام حلال",
    onlineSites: "مواقع بيع الطعام",
    shopping: "التسوق",
    scanner: "الماسح",
    noStores: "لم يتم العثور على متاجر قريبة",
    storeError: "خطأ في تحميل الخريطة",
    premiumFeature: "ميزة للمشتركين فقط",
    upgradeToUse: "اشترك في النسخة الكاملة للوصول إلى خريطة المتاجر القريبة والبحث الذكي"
  },
  en: {
    title: "HalalScan",
    subtitle: "AI Component Analysis",
    scanIngredients: "Point camera at ingredients",
    loading: "Intelligent Analysis...",
    loadingSub: "Verifying ingredients precisely",
    cameraError: "Camera access failed. Please check permissions or try opening the app in a new tab (outside the iframe).",
    error: "Error analyzing image. Please try again.",
    retry: "Retry",
    guide: "E-Numbers Guide",
    guideSub: "Learn about additive codes",
    about: "About App",
    aboutSub: "How do we analyze?",
    resultTitle: "This product is",
    halal: "Halal",
    haram: "Haram",
    mashbooh: "Mashbooh (Doubtful)",
    unknown: "Unknown",
    aiAnalysis: "AI Analysis",
    advice: "Advice",
    haramIngs: "Controversial Ingredients",
    allIngs: "Detected Ingredients",
    scanAnother: "Scan Another Product",
    dir: "ltr" as const,
    font: "font-sans",
    alert: "Alert",
    premium: "Premium",
    goPremium: "Go Premium",
    premiumFeatures: "Premium Features",
    offlineMode: "Offline Mode",
    noAds: "No Ads",
    fastSupport: "Fast Support",
    plans: {
      daily: "Daily",
      monthly: "Monthly",
      yearly: "Yearly",
      priceDay: "$1",
      priceMonth: "$5",
      priceYear: "$50"
    },
    adSpace: "Advertisement (Hidden for Pro)",
    purchaseHistory: "Purchase History",
    noPurchases: "No previous purchases",
    date: "Date",
    amount: "Amount",
    plan: "Plan",
    nearbyStores: "Nearby Stores",
    buyOnline: "Buy Online",
    findHalal: "Find Halal Stores",
    onlineSites: "Online Grocery",
    shopping: "Shopping",
    scanner: "Scanner",
    noStores: "No nearby stores found",
    storeError: "Error loading map",
    premiumFeature: "Premium Feature",
    upgradeToUse: "Upgrade to Pro to access nearby store map and intelligent location search."
  },
  fr: {
    title: "HalalScan",
    subtitle: "Analyse par IA",
    scanIngredients: "Pointer la caméra vers les ingrédients",
    loading: "Analyse Intelligente...",
    loadingSub: "Vérification précise des ingrédients",
    cameraError: "Échec de l'accès à la caméra. Vérifiez les permissions ou ouvrez l'appli dans un nouvel onglet (hors de l'iframe).",
    error: "Erreur d'analyse. Veuillez réessayer.",
    retry: "Réessayer",
    guide: "Guide des additifs",
    guideSub: "En savoir plus sur les codes E",
    about: "À propos",
    aboutSub: "Comment analysons-nous ?",
    resultTitle: "Ce produit est",
    halal: "Halal",
    haram: "Haram",
    mashbooh: "Mashbooh (Douteux)",
    unknown: "Inconnu",
    aiAnalysis: "Analyse IA",
    advice: "Conseil",
    haramIngs: "Ingrédients Controversés",
    allIngs: "Ingrédients Détectés",
    scanAnother: "Scanner un autre produit",
    dir: "ltr" as const,
    font: "font-sans",
    alert: "Alerte",
    premium: "Premium",
    goPremium: "Passer au Premium",
    premiumFeatures: "Fonctions Premium",
    offlineMode: "Mode hors ligne",
    noAds: "Sans publicités",
    fastSupport: "Support rapide",
    plans: {
      daily: "Quotidien",
      monthly: "Mensuel",
      yearly: "Annuel",
      priceDay: "1€",
      priceMonth: "5€",
      priceYear: "50€"
    },
    adSpace: "Publicité (Masquée pour Pro)",
    purchaseHistory: "Historique d'achat",
    noPurchases: "Aucun achat précédent",
    date: "Date",
    amount: "Montant",
    plan: "Plan",
    nearbyStores: "Magasins à proximité",
    buyOnline: "Achat en ligne",
    findHalal: "Trouver des magasins Halal",
    onlineSites: "Épicerie en ligne",
    shopping: "Achats",
    scanner: "Scanner",
    noStores: "Aucun magasin trouvé",
    storeError: "Erreur de chargement",
    premiumFeature: "Fonction Premium",
    upgradeToUse: "Passez au Pro pour accéder à la carte des magasins et à la recherche intelligente."
  },
  es: {
    title: "HalalScan",
    subtitle: "Análisis por IA",
    scanIngredients: "Apunte la cámara a los ingredientes",
    loading: "Análisis Inteligente...",
    loadingSub: "Verificando ingredientes con precisión",
    cameraError: "Fallo al acceder a la cámara. Verifica los permisos o abre la app en una nueva pestaña (fuera del iframe).",
    error: "Error analizando. Inténtelo de nuevo.",
    retry: "Reintentar",
    guide: "Guía de aditivos",
    guideSub: "Aprenda sobre códigos E",
    about: "Acerca de",
    aboutSub: "¿Cómo analizamos?",
    resultTitle: "Este producto es",
    halal: "Halal",
    haram: "Haram",
    mashbooh: "Mashbooh (Dudoso)",
    unknown: "Desconocido",
    aiAnalysis: "Análisis IA",
    advice: "Consejo",
    haramIngs: "Ingredientes Controvertidos",
    allIngs: "Ingredientes Detectados",
    scanAnother: "Escanear otro producto",
    dir: "ltr" as const,
    font: "font-sans",
    alert: "Alerta",
    premium: "Premium",
    goPremium: "Pasar a Premium",
    premiumFeatures: "Funciones Premium",
    offlineMode: "Modo sin conexión",
    noAds: "Sin anuncios",
    fastSupport: "Soporte rápido",
    plans: {
      daily: "Diario",
      monthly: "Mensual",
      yearly: "Anual",
      priceDay: "1$",
      priceMonth: "5$",
      priceYear: "$50"
    },
    adSpace: "Publicidad (Oculta para Pro)",
    purchaseHistory: "Historial de compras",
    noPurchases: "Sin compras previas",
    date: "Fecha",
    amount: "Monto",
    plan: "Plan",
    nearbyStores: "Tiendas cercanas",
    buyOnline: "Compra online",
    findHalal: "Buscar tiendas Halal",
    onlineSites: "Comestibles online",
    shopping: "Compras",
    scanner: "Escáner",
    noStores: "No se encontraron tiendas",
    storeError: "Error al cargar el mapa",
    premiumFeature: "Función Premium",
    upgradeToUse: "Actualiza a Pro para acceder al mapa de tiendas cercanas y búsqueda inteligente."
  }
};

const MAPS_API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || "";
const hasValidMapsKey = Boolean(MAPS_API_KEY);

const ONLINE_STORES = [
  { name: "MyHalalShop", url: "https://myhalalshop.com", desc: "Premium Halal Groceries", icon: "🌐" },
  { name: "Amazon Grocery", url: "https://amazon.com", desc: "Wide selection of Halal products", icon: "📦" },
  { name: "Carrefour", url: "https://carrefour.com", desc: "International food selection", icon: "🛒" },
  { name: "Halal Cart", url: "https://halalcart.com", desc: "Fresh Halal meat delivery", icon: "🥩" },
  { name: "Uber Eats", url: "https://ubereats.com", desc: "Order from local Halal restaurants", icon: "🍔" }
];

function StoreMarker(props: { place: any, key?: any }) {
  const { place } = props;
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdvancedMarker ref={markerRef} position={place.geometry.location} onClick={() => setOpen(true)}>
        <div className="bg-emerald-500 p-1 rounded-full border-2 border-white shadow-xl">
          <ShoppingBag className="w-4 h-4 text-white" />
        </div>
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-2 min-w-[150px] text-gray-900">
            <h4 className="font-bold text-sm">{place.name}</h4>
            <p className="text-[10px] text-gray-500 mb-2">{place.vicinity}</p>
            {place.rating && (
                <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 text-amber-500 fill-current" />
                    <span className="text-xs font-bold">{place.rating}</span>
                </div>
            )}
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.vicinity)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
            >
              <Navigation className="w-3 h-3" />
              Direction
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function StoreLocator({ lang, isSubscribed }: { lang: Language, isSubscribed: boolean }) {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState(lang === 'ar' ? 'متجر طعام حلال' : 'halal food grocery');
  const t = translations[lang];

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, (err) => {
        console.error("Geolocation error:", err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const searchStores = useCallback((map: google.maps.Map, location: { lat: number, lng: number }, query: string) => {
    setLoading(true);
    const service = new google.maps.places.PlacesService(map);
    const request = {
      location,
      radius: 5000,
      keyword: query
    };

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setStores(results);
      } else {
        setStores([]);
      }
      setLoading(false);
    });
  }, []);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    if (!userLocation) return;
    searchStores(map, userLocation, searchTerm);
  }, [userLocation, searchTerm, searchStores]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0 relative">
        <APIProvider apiKey={MAPS_API_KEY}>
          <Map
            defaultCenter={userLocation || { lat: 48.8566, lng: 2.3522 }} // Default Paris
            defaultZoom={13}
            mapId="STORE_LOCATOR_MAP"
            onIsIdle={() => {}} 
            onTilesLoaded={() => {}}
            onCenterChanged={() => {}}
            onBoundsChanged={() => {}}
            onZoomChanged={() => {}}
            style={{ width: '100%', height: '100%' }}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            {userLocation && (
              <AdvancedMarker position={userLocation}>
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
              </AdvancedMarker>
            )}
            {stores.map((store, i) => (
              <StoreMarker key={i} place={store} />
            ))}
            <MapLoader onMapEnter={handleMapLoad} />
          </Map>
        </APIProvider>
      </div>
      
      <div className="bg-[#16171A] p-4 max-h-[40vh] overflow-y-auto border-t border-white/5">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t.nearbyStores}
            </h3>
            {!isSubscribed && (
                <div className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-1 rounded-lg border border-amber-500/20">
                    SENSITIVE SEARCH (PRO)
                </div>
            )}
        </div>

        <div className="flex gap-2 mb-4">
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث عن متاجر...' : 'Search stores...'}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        // Trigger search would happen through handleMapLoad if we had a map ref
                        // For now we rely on the searchTerm state being used in the effect/callback
                    }
                }}
            />
            {/* If we had a way to trigger search manually we would add a button here */}
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center p-8">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : stores.length > 0 ? (
            stores.map((store, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex-1">
                  <p className="text-sm font-bold truncate">{store.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{store.vicinity}</p>
                </div>
                <div className="flex items-center gap-2">
                    {store.rating && (
                        <div className="flex items-center gap-0.5 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 text-amber-500 fill-current" />
                            <span className="text-[10px] font-bold text-amber-500">{store.rating}</span>
                        </div>
                    )}
                    <button 
                        onClick={() => {
                             window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name + ' ' + store.vicinity)}`, '_blank');
                        }}
                        className="p-2 bg-emerald-500/10 rounded-lg"
                    >
                        <Navigation className="w-4 h-4 text-emerald-500" />
                    </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4 text-xs">{t.noStores}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MapLoader({ onMapEnter }: { onMapEnter: (map: google.maps.Map) => void }) {
  return <MapInternals onMapReady={onMapEnter} />;
}

function MapInternals({ onMapReady }: { onMapReady: (map: google.maps.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (map) onMapReady(map);
  }, [map, onMapReady]);
  return null;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('halalscan_logged_in') === 'true');
  const [isPayPalAuthenticated, setIsPayPalAuthenticated] = useState(() => localStorage.getItem('halalscan_paypal_auth') === 'true');
  const [hasUsedTrial, setHasUsedTrial] = useState(() => localStorage.getItem('halalscan_trial_used') === 'true');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState(() => localStorage.getItem('halalscan_email') || "");
  const [phone, setPhone] = useState(() => localStorage.getItem('halalscan_phone') || "");
  const [lang, setLang] = useState<Language>('ar');
  const [activeTab, setActiveTab] = useState<AppTab>('scanner');
  const [subTier, setSubTier] = useState<SubscriptionTier>(() => (localStorage.getItem('halalscan_sub') as SubscriptionTier) || 'NONE');
  const [purchaseHistory, setPurchaseHistory] = useState<Purchase[]>(() => JSON.parse(localStorage.getItem('halalscan_purchases') || '[]'));
  const [showPricing, setShowPricing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: SubscriptionTier, price: string } | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const t = translations[lang];

  const loginTranslations = {
    ar: {
      welcome: "مرحباً بك في HalalScan",
      loginSub: "سجل دخولك للمتابعة",
      emailLabel: "البريد الإلكتروني",
      phoneLabel: "رقم الهاتف",
      loginBtn: "دخول سريع",
      noAccount: "ليس لديك حساب؟",
      createAccount: "أنشئ حساباً جديداً",
      secure: "نتائج مدعومة بالذكاء الاصطناعي",
      noCardNeeded: "لا حاجة لبطاقة بنكية - متوفر عبر الرصيد",
      payBalance: "دفع عبر رصيد PayPal",
      haveCode: "لديك كود تفعيل؟",
      enterCode: "أدخل الكود هنا",
      redeem: "تفعيل الكود",
      codeSuccess: "تم تفعيل البريميوم بنجاح!",
      logout: "تسجيل الخروج",
      linkPayPal: "يجب تسجيل الدخول بـ PayPal للاشتراك",
      payPalLoginBtn: "تسجيل الدخول عبر PayPal",
      freeTrial: "تجربة مجانية لمدة 3 أيام",
      startTrial: "ابدأ تجربتك المجانية الآن",
      trialDisclaimer: "استمتع بمزايا Pro مجاناً، لا يلزم الدفع الآن."
    },
    en: {
      welcome: "Welcome to HalalScan",
      loginSub: "Sign in to continue",
      emailLabel: "Email Address",
      phoneLabel: "Phone Number",
      loginBtn: "Quick Login",
      noAccount: "Don't have an account?",
      createAccount: "Create one",
      secure: "AI Driven Results",
      noCardNeeded: "No bank card required - Balance supported",
      payBalance: "Pay with PayPal Balance",
      haveCode: "Have a promo code?",
      enterCode: "Enter code here",
      redeem: "Redeem Code",
      codeSuccess: "Premium activated successfully!",
      logout: "Logout",
      linkPayPal: "PayPal login is required to subscribe",
      payPalLoginBtn: "Login with PayPal",
      freeTrial: "3-Day Free Trial",
      startTrial: "Start Your Free Trial",
      trialDisclaimer: "Enjoy Pro features for free, no payment needed now."
    },
    fr: {
      welcome: "Bienvenue sur HalalScan",
      loginSub: "Connectez-vous pour continuer",
      emailLabel: "E-mail",
      phoneLabel: "Téléphone",
      loginBtn: "Connexion Rapide",
      noAccount: "Pas de compte ?",
      createAccount: "Créer un compte",
      secure: "Résultats par IA",
      noCardNeeded: "Pas de carte requise",
      payBalance: "Payer avec PayPal",
      haveCode: "Code promo ?",
      enterCode: "Entrez le code",
      redeem: "Activer",
      codeSuccess: "Premium activé !",
      logout: "Déconnexion",
      linkPayPal: "Connexion PayPal requise",
      payPalLoginBtn: "Se connecter avec PayPal",
      freeTrial: "Essai gratuit de 3 jours",
      startTrial: "Commencer l'essai",
      trialDisclaimer: "Profitez gratuitement."
    },
    es: {
      welcome: "Bienvenido a HalalScan",
      loginSub: "Inicia sesión para continuar",
      emailLabel: "Correo electrónico",
      phoneLabel: "Teléfono",
      loginBtn: "Inicio Rápido",
      noAccount: "¿No tienes cuenta?",
      createAccount: "Crear una",
      secure: "Resultados por IA",
      noCardNeeded: "Sin tarjeta bancaria",
      payBalance: "Pagar con PayPal",
      haveCode: "¿Tienes un código?",
      enterCode: "Ingresa el código",
      redeem: "Canjear",
      codeSuccess: "¡Premium activado!",
      logout: "Cerrar sesión",
      linkPayPal: "Inicia sesión con PayPal",
      payPalLoginBtn: "Iniciar sesión con PayPal",
      freeTrial: "Prueba gratuita de 3 días",
      startTrial: "Iniciar prueba",
      trialDisclaimer: "Disfruta Pro gratis."
    }
  };

  const lt = loginTranslations[lang];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMethod === 'email') {
      if (email.includes("@")) {
        setIsLoggedIn(true);
        localStorage.setItem('halalscan_logged_in', 'true');
        localStorage.setItem('halalscan_email', email);
      } else {
        alert(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email');
      }
    } else {
      if (phone.length >= 8) {
        setIsLoggedIn(true);
        localStorage.setItem('halalscan_logged_in', 'true');
        localStorage.setItem('halalscan_phone', phone);
      } else {
        alert(lang === 'ar' ? 'يرجى إدخال رقم هاتف صحيح' : 'Please enter a valid phone number');
      }
    }
  };

  const handlePayPalLogin = () => {
    // Simulate PayPal OAuth
    setIsPayPalAuthenticated(true);
    localStorage.setItem('halalscan_paypal_auth', 'true');
  };
  
  const handleStartTrial = () => {
    updateSubscription('YEARLY', '$0.00 (Trial)'); 
    setHasUsedTrial(true);
    localStorage.setItem('halalscan_trial_used', 'true');
    alert(lt.codeSuccess);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsPayPalAuthenticated(false);
    setSubTier('NONE');
    localStorage.removeItem('halalscan_logged_in');
    localStorage.removeItem('halalscan_email');
    localStorage.removeItem('halalscan_phone');
    localStorage.removeItem('halalscan_sub');
    localStorage.removeItem('halalscan_paypal_auth');
    localStorage.removeItem('halalscan_purchases'); // Clear history on logout for privacy
    setPurchaseHistory([]);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleRedeem = () => {
    if (promoCode.toUpperCase() === "FREE" || promoCode.toUpperCase() === "HALAL") {
      updateSubscription('YEARLY', '$0.00 (Promo)');
      alert(lt.codeSuccess);
      setPromoCode("");
    } else {
      alert(lang === 'ar' ? 'كود غير صحيح' : 'Invalid code');
    }
  };

  const updateSubscription = (tier: SubscriptionTier, amount: string = "0.00") => {
    const localeMap = {
      ar: 'ar-EG',
      en: 'en-US',
      fr: 'fr-FR',
      es: 'es-ES'
    };

    const newPurchase: Purchase = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString(localeMap[lang], { year: 'numeric', month: 'short', day: 'numeric' }),
      tier,
      amount
    };
    
    const updatedHistory = [newPurchase, ...purchaseHistory];
    setPurchaseHistory(updatedHistory);
    localStorage.setItem('halalscan_purchases', JSON.stringify(updatedHistory));
    
    setSubTier(tier);
    localStorage.setItem('halalscan_sub', tier);
    setShowPricing(false);
    setSelectedPlan(null);
  };

  const isSubscribed = subTier !== 'NONE';

  // Initialize Camera
  const startCamera = async () => {
    if (!isLoggedIn) return;
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera Error:", err);
      setError(t.cameraError);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [lang, isLoggedIn]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const langNames = {
    ar: 'Arabic',
    en: 'English',
    fr: 'French',
    es: 'Spanish'
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    setResult(null);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Resize logic to prevent "Unable to process input image" (400) errors
      const maxDimension = 800; // Smaller dimension
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > height) {
        if (width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context failed");
      
      ctx.drawImage(video, 0, 0, width, height);
      // Use PNG for better compatibility or JPEG at lower quality
      const base64Image = canvas.toDataURL('image/png').split(',')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        Analyze the food ingredients list in this image.
        Determine if the product is:
        1. "HALAL": All ingredients are halal.
        2. "HARAM": Contains prohibited ingredients (pork-derived, non-allowed alcohol, non-slaughtered animals).
        3. "MASHBOOH": Contains doubtful ingredients (like E471 without a stated source).

        Output must be in JSON format in the language: ${langNames[lang]}.
        Schema:
        {
          "status": "HALAL" | "HARAM" | "MASHBOOH",
          "productName": "Name of the product if found",
          "ingredients": ["List of detected ingredients"],
          "haramIngredients": ["List of suspicious or prohibited ingredients"],
          "reasoning": "Detailed explanation of this classification",
          "advice": "Consumer advice regarding this product"
        }
      `;

      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/png", data: base64Image } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
              productName: { type: Type.STRING },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              haramIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              reasoning: { type: Type.STRING },
              advice: { type: Type.STRING }
            },
            required: ["status", "ingredients", "reasoning", "advice"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}') as ScanResult;
      setResult(data);
    } catch (err) {
      console.error("AI Analysis Error:", err);
      setError(t.error);
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusColor = (status: HalalStatus) => {
    switch (status) {
      case 'HALAL': return 'text-emerald-500 bg-emerald-500/10';
      case 'HARAM': return 'text-rose-500 bg-rose-500/10';
      case 'MASHBOOH': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: HalalStatus) => {
    switch (status) {
      case 'HALAL': return <CheckCircle2 className="w-8 h-8" />;
      case 'HARAM': return <XCircle className="w-8 h-8" />;
      case 'MASHBOOH': return <AlertTriangle className="w-8 h-8" />;
      default: return <Info className="w-8 h-8" />;
    }
  };

  const getStatusLabel = (status: HalalStatus) => {
    switch (status) {
      case 'HALAL': return t.halal;
      case 'HARAM': return t.haram;
      case 'MASHBOOH': return t.mashbooh;
      default: return t.unknown;
    }
  };

  return (
    <PayPalScriptProvider options={{ 
      "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb", 
      currency: "USD",
      intent: "capture"
    }}>
      <div className={cn("min-h-screen bg-[#0A0B0D] text-white flex flex-col selection:bg-emerald-500/30 overflow-hidden", t.font)} dir={t.dir}>
      
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <motion.div 
            key="login-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"
          >
            <div className="w-full max-w-sm">
              <div className="flex flex-col items-center mb-12">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[28px] flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-6">
                  <Scan className="text-white w-10 h-10" />
                </div>
                <h1 className="text-4xl font-black tracking-tight mb-2">HalalScan</h1>
                <p className="text-emerald-500 font-bold tracking-[4px] text-xs uppercase">{t.subtitle}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold">{lt.welcome}</h2>
                    {!hasUsedTrial && (
                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider bg-emerald-500/10 self-start px-2 py-0.5 rounded-full mt-1">
                        {lt.freeTrial}
                      </span>
                    )}
                  </div>
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    {(['ar', 'en', 'fr', 'es'] as Language[]).map((l) => (
                      <button 
                        key={l}
                        onClick={() => setLang(l)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all",
                          lang === l ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-gray-500 hover:text-white"
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
                  <button 
                    onClick={() => setLoginMethod('email')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                      loginMethod === 'email' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-gray-500 hover:text-white"
                    )}
                  >
                    {lt.emailLabel}
                  </button>
                  <button 
                    onClick={() => setLoginMethod('phone')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                      loginMethod === 'phone' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-gray-500 hover:text-white"
                    )}
                  >
                    {lt.phoneLabel}
                  </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-widest px-1">
                      {loginMethod === 'email' ? lt.emailLabel : lt.phoneLabel}
                    </label>
                    <div className="relative group">
                      {loginMethod === 'email' ? (
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="example@email.com"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-emerald-500/50 transition-all font-sans"
                        />
                      ) : (
                        <div className="flex gap-2">
                          <div className="bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-gray-500 font-sans">+</div>
                          <input 
                            type="tel" 
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="555-555-555"
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-emerald-500/50 transition-all font-sans"
                          />
                        </div>
                      )}
                      {loginMethod === 'email' && (
                        <div className="absolute inset-y-0 left-4 items-center flex pointer-events-none opacity-20 group-focus-within:opacity-100">
                          <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                             <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/10 group active:scale-[0.98]"
                  >
                    <span className="text-lg">{lt.loginBtn}</span>
                    <ArrowLeft className={cn("w-5 h-5 transition-transform", lang === 'en' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1')} />
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                  <p className="text-xs text-gray-500">
                    {lt.noAccount} <button className="text-emerald-500 font-bold hover:underline">{lt.createAccount}</button>
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-widest">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                    {lt.secure}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="main-app"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col"
          >
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Scan className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">{t.title}</h1>
            <p className="text-[10px] text-emerald-500 uppercase tracking-[2px] font-medium">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isSubscribed && (
            <button 
              onClick={() => setShowPricing(true)}
              className="p-2 hover:bg-emerald-500/10 rounded-full transition-all flex items-center gap-2 border border-emerald-500/20 px-3 bg-emerald-500/5 text-emerald-500"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.goPremium}</span>
            </button>
          )}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {(['ar', 'en', 'fr', 'es'] as Language[]).map((l) => (
              <button 
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                  lang === l ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-gray-500 hover:text-white hover:bg-white/5"
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowHistory(true)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors relative"
          >
            <History className="w-5 h-5 text-gray-400" />
            {purchaseHistory.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border border-[#0A0B0D]" />
            )}
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-rose-500/10 rounded-full transition-all flex items-center gap-2 border border-rose-500/20 px-3 bg-rose-500/5 group"
            title={lt.logout}
          >
            <XCircle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'scanner' && (
            <motion.div 
              key="scanner-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col items-center justify-center pt-8"
            >
              <div className="relative w-full h-[55vh] max-w-lg mx-auto bg-black overflow-hidden sm:rounded-3xl shadow-2xl overflow-hidden group">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover scale-x-[-1]" 
                />
                <canvas ref={canvasRef} className="hidden" />

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={cn("absolute top-10 w-12 h-12 border-t-4 border-emerald-500 rounded-tl-2xl opacity-80", lang === 'ar' ? 'left-10 border-l-4' : 'right-10 border-r-4')} />
                  <div className={cn("absolute top-10 w-12 h-12 border-t-4 border-emerald-500 rounded-tr-2xl opacity-80", lang === 'ar' ? 'right-10 border-r-4' : 'left-10 border-l-4')} />
                  <div className={cn("absolute bottom-10 w-12 h-12 border-b-4 border-emerald-500 rounded-bl-2xl opacity-80", lang === 'ar' ? 'left-10 border-l-4' : 'right-10 border-r-4')} />
                  <div className={cn("absolute bottom-10 w-12 h-12 border-b-4 border-emerald-500 rounded-br-2xl opacity-80", lang === 'ar' ? 'right-10 border-r-4' : 'left-10 border-l-4')} />
                  
                  {isScanning && (
                    <motion.div 
                      initial={{ top: '20%' }}
                      animate={{ top: '80%' }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-10 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.5)] z-20"
                    />
                  )}
                  
                  <div className="text-center bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 mt-[350px]">
                    <p className="text-sm text-emerald-400 font-medium">{t.scanIngredients}</p>
                  </div>
                </div>

                <AnimatePresence>
                  {isScanning && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-30"
                    >
                      <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                      <p className="text-lg font-medium text-white">{t.loading}</p>
                      <p className="text-sm text-gray-400 mt-2">{t.loadingSub}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <div className="absolute bottom-4 left-4 right-4 bg-rose-500/90 backdrop-blur-md p-4 rounded-2xl flex items-start gap-3 border border-rose-400/20 z-40">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                      <p className="text-sm font-bold">{t.alert}</p>
                      <p className="text-xs opacity-90">{error}</p>
                      <button onClick={startCamera} className="mt-2 text-[10px] underline uppercase font-bold tracking-widest">{t.retry}</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full max-w-lg p-6 flex flex-col items-center gap-6">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={captureAndAnalyze}
                  disabled={isScanning}
                  className={cn(
                    "relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
                    "before:absolute before:inset-0 before:rounded-full before:border-4 before:border-white/10",
                    isScanning ? "bg-gray-800" : "bg-emerald-600 hover:bg-emerald-500"
                  )}
                >
                  <Camera className="w-10 h-10 text-white" />
                  <div className="absolute -inset-2 rounded-full border border-emerald-500/30 animate-pulse" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === 'stores' && (
            <motion.div 
               key="stores-tab"
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.98 }}
               className="flex-1 flex flex-col"
            >
              {hasValidMapsKey ? (
                <StoreLocator lang={lang} isSubscribed={isSubscribed} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                   <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
                      <MapPin className="text-rose-500 w-10 h-10" />
                   </div>
                   <h2 className="text-xl font-bold mb-4">{t.storeError}</h2>
                   <p className="text-gray-400 text-sm">{lang === 'ar' ? 'يرجى تفعيل مفتاح خرائط جوجل في المتغيرات البيئية' : 'Please enable Google Maps API key in secrets'}</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'online' && (
            <motion.div 
              key="online-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 overflow-y-auto px-6 pt-12 pb-24"
            >
              <div className="flex flex-col items-center mb-12">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <ShoppingBag className="text-blue-500 w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold">{t.onlineSites}</h2>
                <p className="text-gray-500 text-sm mt-1">{t.buyOnline}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {ONLINE_STORES.map((site, i) => (
                  <button 
                    key={i}
                    onClick={() => window.open(site.url, '_blank')}
                    className="group bg-white/5 border border-white/5 hover:border-blue-500/30 p-6 rounded-[28px] transition-all flex items-center justify-between text-right"
                  >
                    <div className="flex items-center gap-4">
                       <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{site.icon}</span>
                       <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                          <h4 className="font-bold text-lg">{site.name}</h4>
                          <p className="text-sm text-gray-500">{site.desc}</p>
                       </div>
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Switcher - Bottom Navigation */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-center z-50">
           <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-3xl flex gap-2 shadow-2xl">
              {[
                { id: 'scanner', icon: Scan, label: t.scanner },
                { id: 'stores', icon: MapPin, label: t.shopping },
                { id: 'online', icon: ShoppingBag, label: t.buyOnline }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AppTab)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-2xl transition-all",
                    activeTab === tab.id 
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "scale-110" : "")} />
                  {activeTab === tab.id && <span className="text-xs font-bold whitespace-nowrap">{tab.label}</span>}
                </button>
              ))}
           </div>
        </div>
      </main>

      </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase History Modal */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#0A0B0D] border-t border-white/10 rounded-t-[40px] z-[101] overflow-hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/5 bg-white/2 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <History className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-bold">{t.purchaseHistory}</h2>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {purchaseHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center opacity-20">
                      <History className="w-8 h-8" />
                    </div>
                    <p className="text-gray-500 font-medium">{t.noPurchases}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 px-4 text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">
                       <span>{t.date}</span>
                       <span className="text-center">{t.plan}</span>
                       <span className="text-left">{t.amount}</span>
                    </div>
                    {purchaseHistory.map((purchase) => (
                      <div 
                        key={purchase.id}
                        className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-emerald-500/20 transition-all"
                      >
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-white mb-0.5">{purchase.date}</span>
                            <span className="text-[10px] text-gray-600 font-mono uppercase tracking-tighter">ID: {purchase.id}</span>
                         </div>
                         <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            <span className="text-xs font-bold text-emerald-500 uppercase">
                              {translations[lang].plans[purchase.tier.toLowerCase() as keyof typeof translations.ar.plans]}
                            </span>
                         </div>
                         <div className="text-right">
                            <span className="text-sm font-black text-white">{purchase.amount}</span>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Results Drawer */}
      <AnimatePresence>
        {result && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResult(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-[#16171A] border-t border-white/10 rounded-t-[40px] z-[70] max-h-[85vh] overflow-y-auto px-6 pb-12"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-6" />
              
              <div className="flex flex-col items-center text-center">
                <div className={cn("p-6 rounded-3xl mb-6 shadow-2xl", getStatusColor(result.status))}>
                   {getStatusIcon(result.status)}
                </div>
                <h2 className="text-4xl font-black mb-2 tracking-tight">{t.resultTitle} {getStatusLabel(result.status)}</h2>
                {result.productName && <p className="text-gray-400 mb-6 font-medium bg-white/5 px-4 py-1 rounded-full text-sm">{result.productName}</p>}
              </div>

              <div className="space-y-8 mt-4">
                {/* Reason Section */}
                <section className="bg-white/5 p-6 rounded-[28px] border border-white/5">
                  <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {t.aiAnalysis}
                  </h3>
                  <p className="text-lg leading-relaxed text-gray-200">
                    {result.reasoning}
                  </p>
                </section>

                {/* Advice Section */}
                <section className="bg-amber-500/10 p-6 rounded-[28px] border border-amber-500/20">
                  <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {t.advice}
                  </h3>
                  <p className="text-gray-200 leading-relaxed">
                    {result.advice}
                  </p>
                </section>

                {/* Ingredients Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result.haramIngredients.length > 0 && (
                    <section>
                      <h3 className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        {t.haramIngs}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.haramIngredients.map((ing, i) => (
                          <span key={i} className="bg-rose-500/10 text-rose-500 px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-500/20">
                            {ing}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t.allIngs}</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.ingredients.map((ing, i) => (
                        <span key={i} className="bg-white/5 text-gray-400 px-3 py-1.5 rounded-xl text-xs border border-white/5">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>

                <button 
                  onClick={() => setResult(null)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] mt-4"
                >
                  {t.scanAnother}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Ad Space (Only for non-subscribers) */}
      {!isSubscribed && (
        <div className="mx-4 mb-4 p-3 bg-white/5 border border-white/5 rounded-xl text-center group cursor-pointer hover:bg-white/10 transition-colors">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest">{t.adSpace}</p>
          <div className="h-10 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
            <span className="text-xs font-mono">AD_BANNER_728x90</span>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="p-4 text-center text-gray-600 font-mono text-[10px] uppercase tracking-[4px]">
        Protected by HalalScan AI © 2026 {isSubscribed && `• ${subTier} PRO`}
      </footer>

      {/* Pricing Modal */}
      <AnimatePresence>
        {showPricing && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPricing(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-[#16171A] border border-white/10 rounded-[40px] z-[110] p-8 overflow-hidden"
            >
              <button 
                onClick={() => setShowPricing(false)}
                className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              <div className="text-center mt-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-6">
                  <RefreshCw className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t.premiumFeatures}</h2>
                <div className="flex flex-col gap-3 mt-6">
                   <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-sm font-medium">{t.noAds}</span>
                   </div>
                   <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Languages className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">{t.offlineMode}</span>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-8">
                <AnimatePresence mode="wait">
                  {!selectedPlan ? (
                    <motion.div 
                      key="plans"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {!hasUsedTrial && (
                        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 border border-emerald-500/30 rounded-[32px] p-6 mb-6 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-3 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-tighter rounded-bl-xl shadow-lg">
                              OFFER
                           </div>
                           <div className="relative z-10 flex flex-col items-center text-center">
                              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                                 <Star className="text-white w-6 h-6 fill-current" />
                              </div>
                              <h3 className="text-xl font-bold mb-1">{lt.freeTrial}</h3>
                              <p className="text-xs text-gray-400 mb-6 max-w-[200px]">{lt.trialDisclaimer}</p>
                              <button 
                                onClick={handleStartTrial}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-2xl font-bold transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98]"
                              >
                                {lt.startTrial}
                              </button>
                           </div>
                           <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full" />
                        </div>
                      )}

                      {!isPayPalAuthenticated ? (
                        <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 text-center space-y-6">
                           <div className="w-16 h-16 bg-[#0070BA]/20 rounded-2xl flex items-center justify-center mx-auto">
                              <svg className="w-8 h-8 text-[#0070BA]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                              </svg>
                           </div>
                           <div className="space-y-2">
                             <h3 className="text-xl font-bold">{lt.linkPayPal}</h3>
                             <p className="text-sm text-gray-500">للحصول على المزايا الكاملة وتفعيل الدفع التلقائي</p>
                           </div>
                           <button 
                            onClick={handlePayPalLogin}
                            className="w-full bg-[#0070BA] hover:bg-[#005ea6] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all"
                           >
                            {lt.payPalLoginBtn}
                           </button>
                        </div>
                      ) : (
                        <>
                          {[
                            { id: 'DAILY', label: t.plans.daily, price: t.plans.priceDay, rawPrice: "1.00", color: 'border-white/10 bg-white/5' },
                            { id: 'MONTHLY', label: t.plans.monthly, price: t.plans.priceMonth, rawPrice: "5.00", color: 'border-emerald-500/30 bg-emerald-500/5' },
                            { id: 'YEARLY', label: t.plans.yearly, price: t.plans.priceYear, rawPrice: "50.00", color: 'border-white/10 bg-white/5' }
                          ].map((plan) => (
                            <button 
                              key={plan.id}
                              onClick={() => {
                                setSelectedPlan({ id: plan.id as SubscriptionTier, price: plan.rawPrice });
                              }}
                              className={cn(
                                "w-full flex items-center justify-between p-5 rounded-3xl border transition-all hover:scale-[1.02] active:scale-[0.98]",
                                plan.color
                              )}
                            >
                              <div className="text-right">
                                <p className="text-lg font-bold">{plan.label}</p>
                                <p className="text-xs text-gray-500">{lang === 'ar' ? 'فوترة تلقائية' : 'Auto-renew'}</p>
                              </div>
                              <div className="text-left font-sans text-2xl font-black text-emerald-500">
                                {plan.price}
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="paypal"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <button 
                        onClick={() => setSelectedPlan(null)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        {lang === 'ar' ? 'العودة للاختيار' : 'Back to selection'}
                      </button>
                      
                      <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 text-center mb-4">
                         <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest mb-1">{lt.noCardNeeded}</p>
                         <p className="text-sm font-medium text-white">{translations[lang].plans[selectedPlan.id.toLowerCase() as keyof typeof translations.ar.plans]}</p>
                      </div>

                      <button 
                        onClick={() => {
                          updateSubscription(selectedPlan.id, `$${selectedPlan.price}`);
                          alert(lt.codeSuccess);
                        }}
                        className="w-full bg-[#0070BA] hover:bg-[#005ea6] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
                      >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                        <span className="text-lg">{lt.payBalance}</span>
                      </button>

                      <div className="relative flex items-center gap-4 my-4">
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-[10px] text-gray-600 uppercase tracking-widest">{lang === 'ar' ? 'أو' : 'OR'}</span>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>

                      <div className="space-y-3">
                         <p className="text-xs text-gray-500 text-center font-medium">{lt.haveCode}</p>
                         <div className="flex gap-2">
                           <input 
                            type="text" 
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder={lt.enterCode}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/40"
                           />
                           <button 
                            onClick={handleRedeem}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                           >
                            {lt.redeem}
                           </button>
                         </div>
                      </div>

                      <div className="opacity-50 grayscale pointer-events-none scale-90">
                        <PayPalButtons 
                          style={{ layout: "vertical", shape: "pill", color: "blue" }}
                          disabled={true}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </PayPalScriptProvider>
  );
}
