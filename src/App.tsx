import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { AdBanner } from './components/AdBanner';

// Types
type HalalStatus = 'HALAL' | 'HARAM' | 'MASHBOOH' | 'UNKNOWN';
type Language = 'ar' | 'en' | 'fr' | 'es';
type AppTab = 'scanner' | 'online';

interface ScanResult {
  status: HalalStatus;
  productName?: string;
  ingredients: string[];
  haramIngredients: string[];
  reasoning: string;
  advice: string;
}

// Translations
const translations = {
  ar: {
    title: "Simple Halal Check",
    subtitle: "حلال سكان",
    scanIngredients: "وجه الكاميرا نحو المكونات أو اختر ملفاً",
    loading: "جاري التحليل الذكي...",
    loadingSub: "نحن نتحقق من المكونات بدقة",
    cameraError: "فشل الوصول للكاميرا. يرجى التأكد من الأذونات عبر الضغط على أيقونة القفل (Lock) بجانب شريط العنوان وتفعيل الكاميرا، أو جرب خيار 'تحميل ملف'، أو افتح التطبيق في متصفح خارجي.",
    cameraNotReady: "الكاميرا ليست جاهزة بعد. يرجى الانتظار ثانية.",
    openInNewTab: "فتح في متصفح خارجي",
    uploadFile: "تحميل صورة",
    error: "حدث خطأ أثناء تحليل الصورة. يرجى التأكد من وضوح النص والمحاولة مرة أخرى.",
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
    buyOnline: "تسوق أونلاين",
    onlineSites: "مواقع بيع الطعام",
    scanner: "الماسح",
    unlimitedTitle: "مسح غير محدود",
    watchToActivate: "شاهد إعلانات لتفعيل المسح اللانهائي",
    option15m: "3 إعلانات = 15 دقيقة",
    option60m: "5 إعلانات = 60 دقيقة",
    active: "نشط الآن",
    remainingAds: "إعلانات متبقية: ",
    unlimitedActive: "المسح اللانهائي مفعل",
    minsLeft: "دقائق متبقية: ",
    noTime: "انتهى وقت المسح المجاني",
    boost: "شحن وقت"
  },
  en: {
    title: "Simple Halal Check",
    subtitle: "AI Component Analysis",
    scanIngredients: "Point camera at ingredients or upload photo",
    loading: "Intelligent Analysis...",
    loadingSub: "Verifying ingredients precisely",
    cameraError: "Camera access failed. Please grant permission by clicking the lock icon (🔒) in your browser's address bar and enabling the camera. Alternatively, use 'Upload Photo' or open in a new tab.",
    cameraNotReady: "Camera is not ready yet. Please wait a second.",
    openInNewTab: "Fix Permissions (New Tab)",
    uploadFile: "Upload Photo",
    error: "Error analyzing image. Please ensure the text is clear and try again.",
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
    buyOnline: "Buy Online",
    onlineSites: "Online Grocery",
    scanner: "Scanner",
    unlimitedTitle: "Unlimited Scans",
    watchToActivate: "Watch ads to activate infinite scanning",
    option15m: "3 Ads = 15 Mins",
    option60m: "5 Ads = 60 Mins",
    active: "Active Now",
    remainingAds: "Ads remaining: ",
    unlimitedActive: "Unlimited Active",
    minsLeft: "Mins left: ",
    noTime: "Free scan time expired",
    boost: "Boost Time"
  },
  fr: {
    title: "Simple Halal Check",
    subtitle: "Analyse par IA",
    scanIngredients: "Pointer la caméra vers les ingrédients",
    loading: "Analyse Intelligente...",
    loadingSub: "Vérification précise des ingrédients",
    cameraError: "Droit d'accès à la caméra refusé. Veuillez accorder la permission en cliquant sur le cadenas (🔒) dans la barre d'adresse, ou utilisez 'Charger Photo' ou ouvrez dans un nouvel onglet.",
    cameraNotReady: "La caméra n'est pas encore prête. Veuillez patienter.",
    openInNewTab: "Gérer Permissions (Nouvel Onglet)",
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
    buyOnline: "Achat en ligne",
    onlineSites: "Épicerie en ligne",
    scanner: "Scanner"
  },
  es: {
    title: "Simple Halal Check",
    subtitle: "Análisis por IA",
    scanIngredients: "Apunte la cámara a los ingredientes",
    loading: "Análisis Inteligente...",
    loadingSub: "Verificando ingredientes con precisión",
    cameraError: "Permiso de cámara denegado. Por favor, concede el permiso haciendo clic en el candado (🔒) en la barra de direcciones y activando la cámara. O usa 'Subir Foto'.",
    cameraNotReady: "La cámara no está lista. Espere un momento.",
    openInNewTab: "Arreglar Permisos (Nueva Pestaña)",
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
    buyOnline: "Compra online",
    onlineSites: "Comestibles online",
    scanner: "Escáner"
  }
};

const ONLINE_STORES = [
  { name: "MyHalalShop", url: "https://myhalalshop.com", desc: "Premium Halal Groceries", icon: "🌐" },
  { name: "Amazon Grocery", url: "https://amazon.com", desc: "Wide selection of Halal products", icon: "📦" },
  { name: "Carrefour", url: "https://carrefour.com", desc: "International food selection", icon: "🛒" },
  { name: "Halal Cart", url: "https://halalcart.com", desc: "Fresh Halal meat delivery", icon: "🥩" },
  { name: "Uber Eats", url: "https://ubereats.com", desc: "Order from local Halal restaurants", icon: "🍔" }
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('halalscan_logged_in') === 'true');
  const [unlimitedUntil, setUnlimitedUntil] = useState<number>(() => Number(localStorage.getItem('halalscan_unlimited_until')) || 0);
  const [adsWatched, setAdsWatched] = useState(0);
  const [targetAds, setTargetAds] = useState<number | null>(null);
  const [showAdPortal, setShowAdPortal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState(() => localStorage.getItem('halalscan_email') || "");
  const [phone, setPhone] = useState(() => localStorage.getItem('halalscan_phone') || "");
  const [lang, setLang] = useState<Language>('ar');
  const [activeTab, setActiveTab] = useState<AppTab>('scanner');
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
      logout: "تسجيل الخروج",
      googleLogin: "تسجيل الدخول عبر Google",
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
      logout: "Logout",
      googleLogin: "Login with Google",
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
      logout: "Déconnexion",
      googleLogin: "Se connecter avec Google",
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
      logout: "Cerrar sesión",
      googleLogin: "Iniciar sesión con Google",
    }
  };

  const lt = loginTranslations[lang];

  const isUnlimited = timeLeft > 0;

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((unlimitedUntil - now) / 1000));
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [unlimitedUntil]);

  const handleWatchAd = () => {
    if (!targetAds) return;
    
    // Simulate watching an ad
    if (adsWatched + 1 >= targetAds) {
      const duration = targetAds === 3 ? 15 * 60 * 1000 : 60 * 60 * 1000;
      const newUntil = (unlimitedUntil > Date.now() ? unlimitedUntil : Date.now()) + duration;
      setUnlimitedUntil(newUntil);
      localStorage.setItem('halalscan_unlimited_until', newUntil.toString());
      setAdsWatched(0);
      setTargetAds(null);
      setShowAdPortal(false);
      alert(lang === 'ar' ? 'تم تفعيل المسح اللانهائي بنجاح!' : 'Unlimited scans activated!');
    } else {
      setAdsWatched(prev => prev + 1);
    }
  };

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

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('halalscan_logged_in');
    localStorage.removeItem('halalscan_email');
    localStorage.removeItem('halalscan_phone');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // Initialize Camera
  const startCamera = async () => {
    if (!isLoggedIn || activeTab !== 'scanner') return;
    
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API not supported");
      }

      // Try with environment facing mode first
      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
      } catch (e) {
        console.warn("Failed with facingMode: environment, trying basic video", e);
        // Fallback to basic video if ideal environment fails
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err: any) {
      console.error("Camera Error details:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('Permission denied')) {
        setError(t.cameraError);
      } else if (err.name === 'NotFoundError') {
        setError(lang === 'ar' ? 'لم يتم العثور على كاميرا.' : 'No camera found.');
      } else {
        setError(lang === 'ar' ? `خطأ الكاميرا: ${err.message || 'غير معروف'}` : `Camera error: ${err.message || 'unknown'}`);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'scanner') {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  }, [lang, isLoggedIn, activeTab]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      if (!response.ok) throw new Error('Failed to fetch auth URL');
      const { url } = await response.json();
      
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      window.open(
        url,
        'google_login',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (err) {
      console.error("Google Login Error:", err);
      setError(lang === 'ar' ? "فشل تسجيل الدخول عبر Google" : "Google Login failed");
    }
  };

  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      // Basic origin check for local/production consistency
      if (!event.origin.includes('run.app') && !event.origin.includes('localhost')) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const userData = event.data.user;
        console.log("Logged in user:", userData);
        localStorage.setItem('halalscan_logged_in', 'true');
        localStorage.setItem('halalscan_user_email', userData.email || '');
        setIsLoggedIn(true);
        if (userData.email) setEmail(userData.email);
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  const langNames = {
    ar: 'Arabic',
    en: 'English',
    fr: 'French',
    es: 'Spanish'
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    if (!isUnlimited) {
      setShowAdPortal(true);
      return;
    }

    setIsScanning(true);
    setResult(null);
    setError(null);

    try {
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError(t.cameraNotReady);
        setIsScanning(false);
        return;
      }
      const base64Image = await resizeAndCompressImage(video);
      await performAIAnalysis(base64Image);
    } catch (err) {
      console.error("Capture Error:", err);
      setError(t.error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isUnlimited) {
      setShowAdPortal(true);
      return;
    }

    setIsScanning(true);
    setResult(null);
    setError(null);

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      const base64Image = await new Promise<string>((resolve, reject) => {
        img.onload = async () => {
          try {
            const base64 = await resizeAndCompressImage(img);
            URL.revokeObjectURL(objectUrl);
            resolve(base64);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error("Failed to load image file"));
        img.src = objectUrl;
      });

      await performAIAnalysis(base64Image);
    } catch (err) {
      console.error("File Upload Error:", err);
      setError(t.error);
    } finally {
      setIsScanning(false);
    }
  };

  const resizeAndCompressImage = (source: HTMLVideoElement | HTMLImageElement): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const maxDimension = 800; // Reduced for better stability
      let width, height;

      if (source instanceof HTMLVideoElement) {
        width = source.videoWidth;
        height = source.videoHeight;
      } else {
        width = source.width;
        height = source.height;
      }

      // Check if dimensions are valid to prevent 400 errors
      if (!width || !height) {
        reject(new Error(lang === 'ar' ? "أبعاد الصورة غير صالحة" : "Invalid image dimensions"));
        return;
      }

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
      if (!ctx) {
        reject(new Error("Canvas context failed"));
        return;
      }

      ctx.drawImage(source, 0, 0, width, height);
      // Use lower quality (0.6) and ensure it's not too huge for the model
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      resolve(dataUrl.split(',')[1]);
    });
  };

  const performAIAnalysis = async (base64Image: string) => {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, lang })
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle specific 400 errors from Gemini
        if (response.status === 400) {
          throw new Error(lang === 'ar' ? 'الصورة غير واضحة أو كبيرة جداً. يرجى المحاولة بصورة أصغر أو أوضح.' : 'Image unclear or too large. Please try a smaller or clearer photo.');
        }
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json() as ScanResult;
      setResult(data);
    } catch (err: any) {
      console.error("AI Analysis Fetch Error:", err);
      // Fallback message if it's a generic failure
      const msg = err.message || (lang === 'ar' ? 'فشل التحليل' : 'Analysis failed');
      setError(msg);
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

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
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

                <div className="mt-4 flex flex-col gap-3">
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">{lang === 'ar' ? 'أو' : 'OR'}</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  <button 
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-gray-100 active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>{lt.googleLogin}</span>
                  </button>
                </div>

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
          {isUnlimited ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 px-3 rounded-xl border border-emerald-500/20">
              <Star className="w-3 h-3 text-emerald-500 fill-current animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-emerald-500">
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>
          ) : (
            <button 
              onClick={() => setShowAdPortal(true)}
              className="p-2 hover:bg-emerald-500/10 rounded-full transition-all flex items-center gap-2 border border-emerald-500/20 px-3 bg-emerald-500/5 text-emerald-500"
            >
              <Star className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.boost}</span>
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
                  <div className="absolute bottom-4 left-4 right-4 bg-rose-500/90 backdrop-blur-md p-4 rounded-2xl flex flex-col gap-3 border border-rose-400/20 z-40">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                        <p className="text-sm font-bold">{t.alert}</p>
                        <p className="text-xs opacity-90 leading-tight">{error}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                       <button 
                         onClick={startCamera} 
                         className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-colors flex items-center justify-center gap-1"
                       >
                         <RefreshCw className="w-3 h-3" />
                         {t.retry}
                       </button>
                       {error === t.cameraError && (
                         <button 
                           onClick={openInNewTab} 
                           className="flex-1 bg-white text-rose-500 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-colors flex items-center justify-center gap-1"
                         >
                           <ExternalLink className="w-3 h-3" />
                           {t.openInNewTab}
                         </button>
                       )}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full max-w-lg p-6 flex flex-col items-center gap-6">
                <div className="flex items-center gap-6">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    id="file-upload" 
                    onChange={handleFileUpload}
                  />
                  <label 
                    htmlFor="file-upload"
                    className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <BookOpen className="w-6 h-6 text-gray-400" />
                  </label>

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

                  <button 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <ShoppingBag className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
                
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  {lang === 'ar' ? 'أو استخدم الصور المحفوظة' : 'Or use a saved photo'}
                </p>
                
                <AdBanner slot="scanner_top" />
              </div>
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
                
                <AdBanner slot="online_stores_bottom" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Switcher - Bottom Navigation */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-center z-50">
           <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-3xl flex gap-2 shadow-2xl">
              {[
                { id: 'scanner', icon: Scan, label: t.scanner },
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
                  <div className="mt-4">
                    <AdBanner slot="results_middle" format="rectangle" />
                  </div>
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
                  {result.haramIngredients && result.haramIngredients.length > 0 && (
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
                      {result.ingredients?.map((ing, i) => (
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

      {/* Footer Branding */}
      <footer className="p-4 text-center text-gray-600 font-mono text-[10px] uppercase tracking-[4px]">
        Protected by Simple Halal Check AI © 2026 {isUnlimited && `• UNLIMITED`}
      </footer>

      {/* Ad Reward Portal */}
      <AnimatePresence>
        {showAdPortal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!targetAds) setShowAdPortal(false);
              }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-[#16171A] border border-white/10 rounded-[40px] z-[110] p-8 overflow-hidden"
            >
              <button 
                onClick={() => {
                  setShowAdPortal(false);
                  setTargetAds(null);
                  setAdsWatched(0);
                }}
                className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                dir="ltr"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              <div className="text-center mt-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-6">
                  <Star className="w-8 h-8 text-white fill-current" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t.unlimitedTitle}</h2>
                <p className="text-sm text-gray-500 mb-8">{t.watchToActivate}</p>

                {!targetAds ? (
                  <div className="space-y-4">
                    <button 
                      onClick={() => setTargetAds(3)}
                      className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-between group hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all font-bold"
                    >
                      <span className="text-sm">{t.option15m}</span>
                      <ArrowLeft className={cn("w-4 h-4", lang === 'en' && 'rotate-180')} />
                    </button>
                    <button 
                      onClick={() => setTargetAds(5)}
                      className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-between group hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all font-bold"
                    >
                      <span className="text-sm">{t.option60m}</span>
                      <ArrowLeft className={cn("w-4 h-4", lang === 'en' && 'rotate-180')} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-6 py-4">
                    <div className="space-y-2">
                       <p className="text-emerald-500 font-bold uppercase tracking-widest text-xs">{t.remainingAds}</p>
                       <p className="text-6xl font-black text-white">{targetAds - adsWatched}</p>
                    </div>
                    
                    <button 
                      onClick={handleWatchAd}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black text-xl shadow-2xl shadow-emerald-500/20 transition-all animate-pulse active:scale-95"
                    >
                      {lang === 'ar' ? 'مشاهدة إعلان' : 'Watch Ad'}
                    </button>
                    
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest leading-relaxed">
                      {lang === 'ar' ? 'بمجرد انتهاء الإعلانات سيتم تفعيل الوقت تلقائياً' : 'Time will activate automatically after all ads'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
