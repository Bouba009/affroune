import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Home, Search, Plus, Filter, User, LogOut, Bell, MessageCircle, 
  Flag, Star, Trash2, Eye, EyeOff, Lock, X, Check, AlertCircle,
  ChevronRight, ChevronLeft, Phone, MapPin, Calendar, Send, Menu, Settings,
  Share2, Copy, ArrowLeft, Mail, Shield, Info, HelpCircle,
  Car, Building, Smartphone, Briefcase, Wrench, Tv, Shirt, Package, MoreHorizontal,
  Image, Upload
} from 'lucide-react';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaXp-gUOQ_G2s-kM8JhaqW8TJcJ4Nqcuo",
  authDomain: "comondi-fae4b.firebaseapp.com",
  projectId: "comondi-fae4b",
  storageBucket: "comondi-fae4b.firebasestorage.app",
  messagingSenderId: "932777870241",
  appId: "1:932777870241:web:78b0cf3a3cf14046be01e0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Types
interface UserData {
  uid: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  createdAt: Date;
}

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  city: string;
  phone: string;
  imageUrl: string;
  userId: string;
  userName: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  adId: string;
  adTitle: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

interface Report {
  id: string;
  oduserId: string;
  userName: string;
  adId?: string;
  adTitle?: string;
  reason: string;
  status: string;
  createdAt: Date;
}

interface BannerAd {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
  createdAt: Date;
}

interface SliderAd {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
  createdAt: Date;
}

// Categories with real images - 12 categories (4-4-4)
const categories = [
  { id: 'cars', name: 'سيارات ومركبات', nameFr: 'Véhicules', image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200&h=200&fit=crop', icon: Car },
  { id: 'realestate', name: 'عقارات', nameFr: 'Immobilier', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=200&fit=crop', icon: Building },
  { id: 'phones', name: 'هواتف وإلكترونيات', nameFr: 'Téléphones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop', icon: Smartphone },
  { id: 'jobs', name: 'فرص عمل', nameFr: 'Emploi', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&h=200&fit=crop', icon: Briefcase },
  { id: 'services', name: 'خدمات', nameFr: 'Services', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200&h=200&fit=crop', icon: Wrench },
  { id: 'electronics', name: 'أجهزة كهرومنزلية', nameFr: 'Électroménager', image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=200&h=200&fit=crop', icon: Tv },
  { id: 'fashion', name: 'ألبسة وموضة', nameFr: 'Mode', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop', icon: Shirt },
  { id: 'equipment', name: 'معدات مهنية', nameFr: 'Équipement Pro', image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=200&h=200&fit=crop', icon: Package },
  { id: 'sweets', name: 'حلويات', nameFr: 'Pâtisseries', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&h=200&fit=crop', icon: Package },
  { id: 'sewing', name: 'خياطة', nameFr: 'Couture', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop', icon: Shirt },
  { id: 'beauty', name: 'تجميل وعناية', nameFr: 'Beauté', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop', icon: Package },
  { id: 'other', name: 'أخرى', nameFr: 'Autres', image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=200&fit=crop', icon: MoreHorizontal }
];

const cities = ['العفرون', 'موزاية', 'شفة', 'واد جر', 'أحمر العين', 'حطاطبة'];

// Default image for ads
const defaultAdImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';

// Toast Component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const configs = {
    success: { bg: 'bg-gradient-to-r from-green-500 to-green-600', icon: Check },
    error: { bg: 'bg-gradient-to-r from-red-500 to-red-600', icon: AlertCircle },
    info: { bg: 'bg-gradient-to-r from-blue-500 to-blue-600', icon: Info }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className={`fixed top-4 right-4 z-[9999] ${config.bg} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in-right`}>
      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-bounce-slow">
        <Icon size={24} />
      </div>
      <span className="font-medium text-lg">{message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded-full p-2 transition-all duration-300">
        <X size={18} />
      </button>
    </div>
  );
};

// Loading Spinner - removed, app loads directly

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Category type
interface Category {
  id: string;
  name: string;
  nameFr: string;
  image: string;
  icon: any;
}

// Categories Slider Component - 6 categories per slide, changes every 5 seconds
const CategoriesSlider = ({ categories, lang, onSelectCategory }: { 
  categories: Category[]; 
  lang: 'ar' | 'fr'; 
  onSelectCategory: (catId: string) => void;
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const catsPerSlide = 4; // 4 categories per slide for 4-4-4 layout
  const totalSlides = Math.ceil(categories.length / catsPerSlide);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  return (
    <section className="py-8 mb-8">
      <h3 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
        <Menu className="text-blue-600" />
        {lang === 'ar' ? 'الفئات' : 'Catégories'}
      </h3>
      
      <div className="relative">
        {/* Navigation Arrows */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)}
          className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-50 transition-all duration-300 hover:scale-110"
        >
          <ChevronLeft className="w-5 h-5 text-blue-600" />
        </button>
        
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % totalSlides)}
          className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-50 transition-all duration-300 hover:scale-110"
        >
          <ChevronRight className="w-5 h-5 text-blue-600" />
        </button>

        {/* Categories Grid with Slide Effect */}
        <div className="overflow-hidden mx-6">
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(${currentSlide * 100}%)` }}
          >
            {Array.from({ length: totalSlides }).map((_, slideIndex) => (
              <div key={slideIndex} className="min-w-full flex-shrink-0 grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
                {categories.slice(slideIndex * catsPerSlide, (slideIndex + 1) * catsPerSlide).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl shadow-lg hover-lift group"
                  >
                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-blue-100 group-hover:border-blue-500 transition-all shadow-lg group-hover:shadow-xl group-hover:scale-110">
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <span className="text-sm font-semibold text-center text-gray-700 group-hover:text-blue-600 transition-colors">
                      {lang === 'ar' ? cat.name : cat.nameFr}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide ? 'bg-blue-600 w-8 h-3' : 'bg-gray-300 hover:bg-blue-400 w-3 h-3'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Banner Slider Component
const BannerSlider = ({ sliders, banners, lang, onNavigate }: { 
  sliders: SliderAd[]; 
  banners: BannerAd[]; 
  lang: 'ar' | 'fr';
  onNavigate: () => void;
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Default slides + admin slides
  const defaultSlides = [
    {
      id: 'default-1',
      title: lang === 'ar' ? '🎉 عروض خاصة على الهواتف الذكية - خصم حتى 50%' : '🎉 Offres spéciales smartphones - Jusqu\'à 50% de réduction',
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
      link: '',
      bgColor: 'from-blue-600 to-purple-600'
    },
    {
      id: 'default-2',
      title: lang === 'ar' ? '🏠 عقارات للبيع والإيجار - أفضل العروض في العفرون' : '🏠 Immobilier à vendre et louer - Meilleures offres à El Affroun',
      imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200',
      link: '',
      bgColor: 'from-green-600 to-teal-600'
    },
    {
      id: 'default-3',
      title: lang === 'ar' ? '🚗 سيارات بأسعار مناسبة - جديد ومستعمل' : '🚗 Voitures à prix abordables - Neuf et occasion',
      imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200',
      link: '',
      bgColor: 'from-red-600 to-orange-600'
    },
    {
      id: 'default-4',
      title: lang === 'ar' ? '👕 موضة وأزياء - أحدث الصيحات' : '👕 Mode et vêtements - Dernières tendances',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
      link: '',
      bgColor: 'from-pink-600 to-rose-600'
    }
  ];

  // Combine admin sliders with default slides
  const adminSlides = sliders.filter(s => s.isActive).map(s => ({
    ...s,
    bgColor: 'from-indigo-600 to-blue-600'
  }));
  
  const allSlides = [...adminSlides, ...defaultSlides];

  // Auto-slide every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [allSlides.length]);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % allSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + allSlides.length) % allSlides.length);

  return (
    <section className="relative h-[350px] md:h-[450px] rounded-3xl overflow-hidden mb-10 shadow-2xl">
      {/* Slides */}
      <div className="relative h-full">
        {allSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            {/* Background Image */}
            <img 
              src={slide.imageUrl} 
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            {/* Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgColor} opacity-70`}></div>
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
              <h2 className={`text-2xl md:text-4xl lg:text-5xl font-bold mb-6 max-w-4xl transform transition-all duration-500 ${
                index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`} style={{ textShadow: '2px 2px 10px rgba(0,0,0,0.5)' }}>
                {slide.title}
              </h2>
              
              <div className={`flex gap-4 transform transition-all duration-500 delay-200 ${
                index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
                <button 
                  onClick={onNavigate}
                  className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
                >
                  {lang === 'ar' ? 'تصفح الإعلانات' : 'Parcourir les annonces'}
                </button>
                {slide.link && (
                  <a 
                    href={slide.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-gray-900 transition-all"
                  >
                    {lang === 'ar' ? 'اكتشف المزيد' : 'Découvrir'}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-sm transition-all hover:scale-110 z-10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-sm transition-all hover:scale-110 z-10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {allSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide 
                ? 'w-8 h-3 bg-white' 
                : 'w-3 h-3 bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-white"
          style={{ 
            width: `${((currentSlide + 1) / allSlides.length) * 100}%`,
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      {/* Admin Banner Ads - Show below slider */}
      {banners.filter(b => b.isActive).length > 0 && (
        <div className="absolute bottom-12 left-4 right-4 z-10">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {banners.filter(b => b.isActive).map(banner => (
              <a 
                key={banner.id}
                href={banner.link || '#'}
                target={banner.link ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="flex-shrink-0 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-medium text-gray-800 hover:bg-white transition-all shadow-lg"
              >
                📢 {banner.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

// Main App
export default function App() {
  // State
  const [lang, setLang] = useState<'ar' | 'fr'>('ar');
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<UserData | null>(null);
  const [, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [bannerAds, setBannerAds] = useState<BannerAd[]>([]);
  const [sliderAds, setSliderAds] = useState<SliderAd[]>([]);
  const [, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showSliderModal, setShowSliderModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ name: '', phone: '' });
  
  // Form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [adForm, setAdForm] = useState({ title: '', description: '', price: '', category: '', city: '', phone: '', image: null as File | null, imagePreview: '' });
  const [messageForm, setMessageForm] = useState({ content: '', receiverId: '', adId: '', adTitle: '' });
  const [reportForm, setReportForm] = useState({ reason: '', adId: '', adTitle: '' });
  const [bannerForm, setBannerForm] = useState({ title: '', link: '', image: null as File | null, imagePreview: '' });
  const [sliderForm, setSliderForm] = useState({ title: '', link: '', image: null as File | null, imagePreview: '' });
  
  // Selected items
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  
  // Floating buttons hover
  const [floatingHover, setFloatingHover] = useState(false);

  // Show toast
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('uid', '==', fbUser.uid));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data() as UserData;
            setUser(userData);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Load ads
  useEffect(() => {
    const adsRef = collection(db, 'ads');
    const q = query(adsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Ad[];
      setAds(adsData);
    }, (error) => {
      console.error('Error loading ads:', error);
    });
    
    return () => unsubscribe();
  }, []);

  // Load messages for current user
  useEffect(() => {
    if (!user?.uid) return;
    
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, where('receiverId', '==', user.uid), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Message[];
      setMessages(messagesData);
    }, (error) => {
      console.error('Error loading messages:', error);
    });
    
    return () => unsubscribe();
  }, [user?.uid]);

  // Load users, reports, banners, sliders for admin
  useEffect(() => {
    if (!user?.isAdmin) return;
    
    const usersRef = collection(db, 'users');
    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as UserData[];
      setUsers(usersData);
    });

    const reportsRef = collection(db, 'reports');
    const unsubReports = onSnapshot(reportsRef, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Report[];
      setReports(reportsData);
    });

    const bannersRef = collection(db, 'banners');
    const unsubBanners = onSnapshot(bannersRef, (snapshot) => {
      const bannersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as BannerAd[];
      setBannerAds(bannersData);
    });

    const slidersRef = collection(db, 'sliders');
    const unsubSliders = onSnapshot(slidersRef, (snapshot) => {
      const slidersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as SliderAd[];
      setSliderAds(slidersData);
    });

    return () => {
      unsubUsers();
      unsubReports();
      unsubBanners();
      unsubSliders();
    };
  }, [user?.isAdmin]);

  // Track visits
  useEffect(() => {
    const today = new Date().toDateString();
    const visits = JSON.parse(localStorage.getItem('visits') || '{}');
    visits[today] = (visits[today] || 0) + 1;
    localStorage.setItem('visits', JSON.stringify(visits));
  }, []);

  // Upload image to Firebase Storage
  const uploadImage = async (file: File, folder: string): Promise<string> => {
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const imageRef = ref(storage, `${folder}/${timestamp}_${safeName}`);
      
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      // If Firebase Storage fails, use base64 as fallback
      const base64 = await fileToBase64(file);
      return base64;
    }
  };

  // Register
  const handleRegister = async () => {
    const { name, email, phone, password, confirmPassword } = authForm;
    
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      showToast(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Veuillez remplir tous les champs', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showToast(lang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas', 'error');
      return;
    }
    
    if (password.length < 6) {
      showToast(lang === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      const userData: UserData = {
        uid: userCredential.user.uid,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        isAdmin: false,
        createdAt: new Date()
      };
      
      await addDoc(collection(db, 'users'), userData);
      
      setUser(userData);
      setShowAuthModal(false);
      setAuthForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
      showToast(lang === 'ar' ? 'تم إنشاء الحساب بنجاح! 🎉' : 'Compte créé avec succès! 🎉', 'success');
    } catch (error: any) {
      console.error('Register error:', error);
      let message = lang === 'ar' ? 'حدث خطأ' : 'Erreur';
      
      if (error.code === 'auth/email-already-in-use') {
        message = lang === 'ar' ? 'البريد الإلكتروني مستخدم بالفعل' : 'Cet email est déjà utilisé';
      } else if (error.code === 'auth/invalid-email') {
        message = lang === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Email invalide';
      } else if (error.code === 'auth/weak-password') {
        message = lang === 'ar' ? 'كلمة المرور ضعيفة جداً' : 'Mot de passe trop faible';
      }
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Login
  const handleLogin = async () => {
    const { email, password } = authForm;
    
    if (!email.trim() || !password) {
      showToast(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Veuillez remplir tous les champs', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', userCredential.user.uid));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data() as UserData;
        setUser(userData);
        setShowAuthModal(false);
        setAuthForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
        showToast(lang === 'ar' ? `مرحباً ${userData.name}! 👋` : `Bienvenue ${userData.name}! 👋`, 'success');
      } else {
        // Create user data if not exists
        const userData: UserData = {
          uid: userCredential.user.uid,
          name: email.split('@')[0],
          email: email.trim(),
          phone: '',
          isAdmin: false,
          createdAt: new Date()
        };
        await addDoc(collection(db, 'users'), userData);
        setUser(userData);
        setShowAuthModal(false);
        setAuthForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
        showToast(lang === 'ar' ? 'تم تسجيل الدخول بنجاح! 👋' : 'Connexion réussie! 👋', 'success');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let message = lang === 'ar' ? 'حدث خطأ في تسجيل الدخول' : 'Erreur de connexion';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        message = lang === 'ar' ? 'البريد أو كلمة المرور غير صحيحة' : 'Email ou mot de passe incorrect';
      } else if (error.code === 'auth/wrong-password') {
        message = lang === 'ar' ? 'كلمة المرور غير صحيحة' : 'Mot de passe incorrect';
      } else if (error.code === 'auth/too-many-requests') {
        message = lang === 'ar' ? 'محاولات كثيرة، حاول لاحقاً' : 'Trop de tentatives';
      }
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      setCurrentPage('home');
      setShowUserMenu(false);
      showToast(lang === 'ar' ? 'تم تسجيل الخروج 👋' : 'Déconnexion réussie 👋', 'info');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Add Ad - Fast version
  const handleAddAd = async () => {
    if (!user) {
      setShowAdModal(false);
      setShowAuthModal(true);
      return;
    }

    const { title, description, price, category, city, phone, imagePreview } = adForm;
    
    // Quick validation
    if (!title.trim() || !description.trim() || !price || !category || !city || !phone.trim()) {
      showToast(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Veuillez remplir tous les champs', 'error');
      return;
    }
    
    if (isNaN(Number(price)) || Number(price) <= 0) {
      showToast(lang === 'ar' ? 'يرجى إدخال سعر صحيح' : 'Veuillez entrer un prix valide', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Use image preview directly or default image - NO Firebase Storage for speed
      const imageUrl = imagePreview || defaultAdImage;
      
      await addDoc(collection(db, 'ads'), {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        city,
        phone: phone.trim(),
        imageUrl,
        userId: user.uid,
        userName: user.name,
        isFeatured: false,
        isActive: true,
        createdAt: serverTimestamp()
      });

      setShowAdModal(false);
      setAdForm({ title: '', description: '', price: '', category: '', city: '', phone: '', image: null, imagePreview: '' });
      showToast(lang === 'ar' ? 'تم نشر الإعلان بنجاح! 🎉' : 'Annonce publiée avec succès! 🎉', 'success');
    } catch (error: any) {
      console.error('Add ad error:', error);
      showToast(lang === 'ar' ? 'حدث خطأ أثناء النشر' : 'Erreur lors de la publication', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Ad
  const handleDeleteAd = async (adId: string) => {
    if (!confirm(lang === 'ar' ? 'هل تريد حذف هذا الإعلان؟' : 'Voulez-vous supprimer cette annonce?')) return;
    
    try {
      await deleteDoc(doc(db, 'ads', adId));
      showToast(lang === 'ar' ? 'تم حذف الإعلان ✓' : 'Annonce supprimée ✓', 'success');
    } catch (error) {
      console.error('Delete ad error:', error);
      showToast(lang === 'ar' ? 'حدث خطأ' : 'Erreur', 'error');
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (adId: string, isFeatured: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { isFeatured: !isFeatured });
      showToast(lang === 'ar' ? 'تم التحديث ✓' : 'Mise à jour effectuée ✓', 'success');
    } catch (error) {
      console.error('Toggle featured error:', error);
    }
  };

  // Add Banner Ad (Admin)
  const handleAddBanner = async () => {
    if (!bannerForm.title.trim() || !bannerForm.image) {
      showToast(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Veuillez remplir tous les champs', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const imageUrl = await uploadImage(bannerForm.image, 'banners');
      
      await addDoc(collection(db, 'banners'), {
        title: bannerForm.title.trim(),
        imageUrl,
        link: bannerForm.link.trim(),
        isActive: true,
        createdAt: serverTimestamp()
      });

      setShowBannerModal(false);
      setBannerForm({ title: '', link: '', image: null, imagePreview: '' });
      showToast(lang === 'ar' ? 'تم إضافة البانر! 🎉' : 'Bannière ajoutée! 🎉', 'success');
    } catch (error) {
      console.error('Add banner error:', error);
      showToast(lang === 'ar' ? 'حدث خطأ' : 'Erreur', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Slider Ad (Admin)
  const handleAddSlider = async () => {
    if (!sliderForm.title.trim() || !sliderForm.image) {
      showToast(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Veuillez remplir tous les champs', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const imageUrl = await uploadImage(sliderForm.image, 'sliders');
      
      await addDoc(collection(db, 'sliders'), {
        title: sliderForm.title.trim(),
        imageUrl,
        link: sliderForm.link.trim(),
        isActive: true,
        createdAt: serverTimestamp()
      });

      setShowSliderModal(false);
      setSliderForm({ title: '', link: '', image: null, imagePreview: '' });
      showToast(lang === 'ar' ? 'تم إضافة السلايدر! 🎉' : 'Slider ajouté! 🎉', 'success');
    } catch (error) {
      console.error('Add slider error:', error);
      showToast(lang === 'ar' ? 'حدث خطأ' : 'Erreur', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send Message
  const handleSendMessage = async () => {
    if (!user) {
      setShowMessageModal(false);
      setShowAuthModal(true);
      return;
    }

    if (!messageForm.content.trim()) {
      showToast(lang === 'ar' ? 'يرجى كتابة رسالة' : 'Veuillez écrire un message', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        senderName: user.name,
        receiverId: messageForm.receiverId,
        adId: messageForm.adId,
        adTitle: messageForm.adTitle,
        content: messageForm.content.trim(),
        isRead: false,
        createdAt: serverTimestamp()
      });

      setShowMessageModal(false);
      setMessageForm({ content: '', receiverId: '', adId: '', adTitle: '' });
      showToast(lang === 'ar' ? 'تم إرسال الرسالة! 📨' : 'Message envoyé! 📨', 'success');
    } catch (error) {
      console.error('Send message error:', error);
      showToast(lang === 'ar' ? 'حدث خطأ' : 'Erreur', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send Report
  const handleSendReport = async () => {
    if (!user) {
      setShowReportModal(false);
      setShowAuthModal(true);
      return;
    }

    if (!reportForm.reason.trim()) {
      showToast(lang === 'ar' ? 'يرجى كتابة سبب البلاغ' : 'Veuillez indiquer la raison', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'reports'), {
        userId: user.uid,
        userName: user.name,
        adId: reportForm.adId || null,
        adTitle: reportForm.adTitle || null,
        reason: reportForm.reason.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setShowReportModal(false);
      setReportForm({ reason: '', adId: '', adTitle: '' });
      showToast(lang === 'ar' ? 'تم إرسال البلاغ! 🚩' : 'Signalement envoyé! 🚩', 'success');
    } catch (error) {
      console.error('Send report error:', error);
      showToast(lang === 'ar' ? 'حدث خطأ' : 'Erreur', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark message as read
  const handleMarkAsRead = async (messageId: string) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), { isRead: true });
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  // Handle image selection for ad form
  const handleAdImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = await fileToBase64(file);
      setAdForm({ ...adForm, image: file, imagePreview: preview });
    }
  };

  // Handle image selection for banner form
  const handleBannerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = await fileToBase64(file);
      setBannerForm({ ...bannerForm, image: file, imagePreview: preview });
    }
  };

  // Handle image selection for slider form
  const handleSliderImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = await fileToBase64(file);
      setSliderForm({ ...sliderForm, image: file, imagePreview: preview });
    }
  };

  // Filter ads
  const filteredAds = ads.filter(ad => {
    if (!ad.isActive && !user?.isAdmin) return false;
    if (selectedCategory && ad.category !== selectedCategory) return false;
    if (selectedCity && ad.city !== selectedCity) return false;
    if (priceMin && ad.price < Number(priceMin)) return false;
    if (priceMax && ad.price > Number(priceMax)) return false;
    if (searchQuery && !ad.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Get user ads
  const getUserAds = (userId: string) => ads.filter(ad => ad.userId === userId);

  // Get unread messages count
  const unreadCount = messages.filter(m => !m.isRead).length;

  // Get visits stats
  const getVisitsStats = () => {
    const visits = JSON.parse(localStorage.getItem('visits') || '{}');
    const today = new Date().toDateString();
    const thisMonth = new Date().getMonth();
    
    let todayVisits = visits[today] || 0;
    let monthVisits = 0;
    
    Object.keys(visits).forEach(date => {
      if (new Date(date).getMonth() === thisMonth) {
        monthVisits += visits[date];
      }
    });
    
    return { todayVisits, monthVisits };
  };

  const visitsStats = getVisitsStats();

  // Direction based on language
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // No loading screen - app loads directly

  return (
    <div dir={dir} className="min-h-screen bg-gray-100" style={{ scrollbarWidth: 'none' }}>
      <style>{`
        * { scrollbar-width: none; -ms-overflow-style: none; }
        *::-webkit-scrollbar { display: none; }
        
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-slide-in-right { animation: slide-in-right 0.5s ease-out; }
        .animate-slide-up { animation: slide-up 0.5s ease-out; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-bounce-slow { animation: bounce-slow 2s infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        
        .hover-lift { transition: all 0.3s ease; }
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
        
        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transition: all 0.3s ease;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.4);
        }
        
        .btn-orange {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          transition: all 0.3s ease;
        }
        .btn-orange:hover {
          background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.4);
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #FFEF00 0%, #FFD700 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          {/* Top bar */}
          <div className="flex items-center justify-between py-2 text-sm border-b border-white/20">
            <span className="flex items-center gap-2">
              <Shield size={14} />
              {lang === 'ar' ? 'مرحباً بكم في العفرون أونلاين' : 'Bienvenue sur El Affroun Online'}
            </span>
            <button 
              onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')} 
              className="flex items-center gap-2 hover:bg-white/10 px-3 py-1 rounded-full transition-all duration-300"
            >
              🌐 {lang === 'ar' ? 'Français' : 'العربية'}
            </button>
          </div>
          
          {/* Main header */}
          <div className="flex items-center justify-between py-4">
            <div 
              onClick={() => { setCurrentPage('home'); setSelectedAd(null); setSelectedProfile(null); }}
              className="cursor-pointer hover:scale-105 transition-transform duration-300"
            >
              <img 
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbOPPWZ_6FVtNvqp4-S8RbzejyQt75-0jLytLFSUotGJn21nup8dvMv_qdHK8t3Aapqj6PmZwFQ2HuQtI4pt4lK-cTnKAWzwoqZAXya8dxmXJ0xpE14binYHeEMdacOXNiQkAl69t1fv4Yp6XsjLsGEIUUcrxs8JK43E1QhQRsAyf3GTWuZPZ-zYpcOBU/s320/Picsart_26-02-09_09-40-35-888.png" 
                alt="العفرون أونلاين"
                className="h-16 md:h-20 w-auto"
              />
            </div>
            
            <nav className="flex items-center gap-2 md:gap-4">
              {/* Side Menu Button - Shows menu on all devices */}
              <button 
                onClick={() => setShowSideMenu(true)} 
                className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-xl transition-all duration-300"
              >
                <Menu size={20} />
                <span className="hidden md:inline">{lang === 'ar' ? 'القائمة' : 'Menu'}</span>
              </button>
              
              {user ? (
                <div className="flex items-center gap-2">
                  {/* Notifications */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative hover:bg-white/10 p-2 rounded-xl transition-all duration-300"
                    >
                      <Bell size={22} className={unreadCount > 0 ? 'animate-bounce-slow' : ''} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    
                    {showNotifications && (
                      <div className="absolute top-full left-0 mt-2 w-80 glass-effect text-gray-800 rounded-2xl shadow-2xl animate-slide-up z-50 overflow-hidden">
                        <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold flex items-center gap-2">
                          <Bell size={18} />
                          {lang === 'ar' ? 'الإشعارات' : 'Notifications'}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {messages.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                              <MessageCircle size={40} className="mx-auto mb-2 opacity-50" />
                              <p>{lang === 'ar' ? 'لا توجد إشعارات' : 'Aucune notification'}</p>
                            </div>
                          ) : (
                            messages.slice(0, 5).map(msg => (
                              <div key={msg.id} className={`p-4 border-b hover:bg-gray-50 transition-colors ${!msg.isRead ? 'bg-blue-50' : ''}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                                    {msg.senderName[0]}
                                  </div>
                                  <p className="font-semibold">{msg.senderName}</p>
                                </div>
                                <p className="text-sm text-gray-600 truncate mr-10">{msg.content}</p>
                                <p className="text-xs text-gray-400 mt-1 mr-10">{msg.adTitle}</p>
                              </div>
                            ))
                          )}
                        </div>
                        <button 
                          onClick={() => { setCurrentPage('messages'); setShowNotifications(false); }}
                          className="w-full p-3 text-center text-blue-600 hover:bg-blue-50 font-semibold transition-colors"
                        >
                          {lang === 'ar' ? 'عرض الكل' : 'Voir tout'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* User menu */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-xl transition-all duration-300"
                    >
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <User size={18} />
                      </div>
                      <span className="hidden md:inline font-medium">{user.name}</span>
                    </button>
                    
                    {showUserMenu && (
                      <div className="absolute top-full left-0 mt-2 w-56 glass-effect text-gray-800 rounded-2xl shadow-2xl animate-slide-up z-50 overflow-hidden">
                        <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                          <p className="font-bold">{user.name}</p>
                          <p className="text-sm opacity-80">{user.email}</p>
                        </div>
                        
                        <button 
                          onClick={() => { setSelectedProfile(user.uid); setCurrentPage('profile'); setShowUserMenu(false); }} 
                          className="w-full text-right px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <User size={18} className="text-blue-600" />
                          {lang === 'ar' ? 'ملفي الشخصي' : 'Mon profil'}
                        </button>
                        
                        <button 
                          onClick={() => { setEditProfileForm({ name: user.name, phone: user.phone }); setShowEditProfileModal(true); setShowUserMenu(false); }} 
                          className="w-full text-right px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <Settings size={18} className="text-purple-600" />
                          {lang === 'ar' ? 'تعديل الملف' : 'Modifier le profil'}
                        </button>
                        
                        <button 
                          onClick={() => { setCurrentPage('messages'); setShowUserMenu(false); }} 
                          className="w-full text-right px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <MessageCircle size={18} className="text-green-600" />
                          {lang === 'ar' ? 'رسائلي' : 'Mes messages'}
                          {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
                        </button>
                        
                        {user.isAdmin && (
                          <button 
                            onClick={() => { setCurrentPage('admin'); setShowUserMenu(false); }} 
                            className="w-full text-right px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                          >
                            <Settings size={18} className="text-purple-600" />
                            {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                          </button>
                        )}
                        
                        <button 
                          onClick={handleLogout} 
                          className="w-full text-right px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-red-600 border-t transition-colors"
                        >
                          <LogOut size={18} />
                          {lang === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAuthModal(true)} 
                  className="btn-primary text-white px-5 py-2 rounded-xl font-semibold flex items-center gap-2"
                >
                  <User size={18} />
                  <span className="hidden md:inline">{lang === 'ar' ? 'تسجيل الدخول' : 'Connexion'}</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Floating Buttons */}
      <div 
        className="fixed bottom-6 left-6 z-40 flex flex-col gap-3"
        onMouseEnter={() => setFloatingHover(true)}
        onMouseLeave={() => setFloatingHover(false)}
        onTouchStart={() => setFloatingHover(true)}
      >
        <button
          onClick={() => user ? setShowAdModal(true) : setShowAuthModal(true)}
          className={`w-14 h-14 btn-orange text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 ${floatingHover ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}`}
          title={lang === 'ar' ? 'نشر إعلان' : 'Publier'}
        >
          <Plus size={28} />
        </button>
        <button
          onClick={() => setShowFilterModal(true)}
          className={`w-14 h-14 btn-primary text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 ${floatingHover ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}`}
          title={lang === 'ar' ? 'فلترة' : 'Filtrer'}
        >
          <Filter size={24} />
        </button>
        <button
          onClick={() => setShowSearchModal(true)}
          className={`w-14 h-14 bg-white text-blue-600 border-2 border-blue-600 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 ${floatingHover ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}`}
          title={lang === 'ar' ? 'بحث' : 'Rechercher'}
        >
          <Search size={24} />
        </button>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        
        {/* Home Page */}
        {currentPage === 'home' && !selectedAd && !selectedProfile && (
          <div className="animate-fade-in">
            {/* Banner Slider - إعلانات السلايدر */}
            <BannerSlider 
              sliders={sliderAds} 
              banners={bannerAds} 
              lang={lang} 
              onNavigate={() => setCurrentPage('ads')} 
            />

            {/* Categories Slider */}
            <CategoriesSlider 
              categories={categories} 
              lang={lang} 
              onSelectCategory={(catId: string) => { setSelectedCategory(catId); setCurrentPage('ads'); }} 
            />

            {/* Featured Ads */}
            {filteredAds.filter(ad => ad.isFeatured).length > 0 && (
              <>
                <h3 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
                  <Star className="text-yellow-500" />
                  {lang === 'ar' ? 'إعلانات مميزة' : 'Annonces en vedette'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {filteredAds.filter(ad => ad.isFeatured).slice(0, 4).map(ad => (
                    <div 
                      key={ad.id} 
                      onClick={() => { setSelectedAd(ad); setCurrentPage('adDetail'); }}
                      className="bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer hover-lift border-2 border-yellow-400 relative"
                    >
                      <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                        <Star size={14} fill="currentColor" />
                        {lang === 'ar' ? 'مميز' : 'Vedette'}
                      </div>
                      <div className="relative h-48">
                        <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-lg mb-2 truncate">{ad.title}</h4>
                        <p className="text-blue-600 font-bold text-xl mb-2">{ad.price.toLocaleString()} DA</p>
                        <p className="text-gray-500 text-sm flex items-center gap-1">
                          <MapPin size={14} />
                          {ad.city}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Latest Ads */}
            <h3 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
              <Calendar className="text-blue-600" />
              {lang === 'ar' ? 'أحدث الإعلانات' : 'Dernières annonces'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredAds.slice(0, 8).map(ad => (
                <div 
                  key={ad.id} 
                  onClick={() => { setSelectedAd(ad); setCurrentPage('adDetail'); }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover-lift group"
                >
                  <div className="relative h-48">
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {/* Action buttons */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setReportForm({ reason: '', adId: ad.id, adTitle: ad.title }); setShowReportModal(true); }}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all shadow-lg"
                      >
                        <Flag size={16} />
                      </button>
                    </div>
                    
                    {user && ad.userId !== user.uid && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setMessageForm({ content: '', receiverId: ad.userId, adId: ad.id, adTitle: ad.title }); 
                          setShowMessageModal(true); 
                        }}
                        className="absolute bottom-3 right-3 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all shadow-lg"
                      >
                        <MessageCircle size={18} />
                      </button>
                    )}
                    
                    {/* Owner message icon - to receive messages */}
                    {user && ad.userId === user.uid && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setCurrentPage('messages');
                        }}
                        className="absolute bottom-3 right-3 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-all shadow-lg animate-pulse"
                        title={lang === 'ar' ? 'رسائل هذا الإعلان' : 'Messages de cette annonce'}
                      >
                        <Bell size={18} />
                      </button>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-lg mb-2 truncate group-hover:text-blue-600 transition-colors">{ad.title}</h4>
                    <p className="text-blue-600 font-bold text-xl mb-3">{ad.price.toLocaleString()} DA</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {ad.city}
                      </span>
                      <span 
                        onClick={(e) => { e.stopPropagation(); setSelectedProfile(ad.userId); setCurrentPage('profile'); }}
                        className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <User size={14} />
                        {ad.userName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAds.length === 0 && (
              <div className="text-center py-20 text-gray-500 bg-white rounded-2xl shadow-lg">
                <Search size={60} className="mx-auto mb-4 opacity-30" />
                <p className="text-xl">{lang === 'ar' ? 'لا توجد إعلانات بعد' : 'Aucune annonce pour le moment'}</p>
                <button 
                  onClick={() => user ? setShowAdModal(true) : setShowAuthModal(true)}
                  className="mt-4 btn-orange text-white px-6 py-2 rounded-xl"
                >
                  {lang === 'ar' ? 'كن أول من ينشر!' : 'Soyez le premier à publier!'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ads Page */}
        {currentPage === 'ads' && !selectedAd && !selectedProfile && (
          <div className="animate-fade-in">
            {/* Active Filters */}
            {(selectedCategory || selectedCity || priceMin || priceMax || searchQuery) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {searchQuery && (
                  <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                    <Search size={16} />
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:bg-blue-200 rounded-full p-1">
                      <X size={14} />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                    {categories.find(c => c.id === selectedCategory)?.[lang === 'ar' ? 'name' : 'nameFr']}
                    <button onClick={() => setSelectedCategory('')} className="hover:bg-blue-200 rounded-full p-1">
                      <X size={14} />
                    </button>
                  </span>
                )}
                {selectedCity && (
                  <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                    <MapPin size={16} />
                    {selectedCity}
                    <button onClick={() => setSelectedCity('')} className="hover:bg-green-200 rounded-full p-1">
                      <X size={14} />
                    </button>
                  </span>
                )}
                {(priceMin || priceMax) && (
                  <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                    {priceMin || '0'} - {priceMax || '∞'} DA
                    <button onClick={() => { setPriceMin(''); setPriceMax(''); }} className="hover:bg-orange-200 rounded-full p-1">
                      <X size={14} />
                    </button>
                  </span>
                )}
                <button 
                  onClick={() => { setSelectedCategory(''); setSelectedCity(''); setPriceMin(''); setPriceMax(''); setSearchQuery(''); }} 
                  className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <X size={16} />
                  {lang === 'ar' ? 'مسح الكل' : 'Effacer tout'}
                </button>
              </div>
            )}

            {/* Results count */}
            <p className="text-gray-600 mb-4">
              {filteredAds.length} {lang === 'ar' ? 'إعلان' : 'annonces'}
            </p>

            {/* Ads Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredAds.map(ad => (
                <div 
                  key={ad.id} 
                  onClick={() => { setSelectedAd(ad); setCurrentPage('adDetail'); }}
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover-lift group ${ad.isFeatured ? 'border-2 border-yellow-400' : ''}`}
                >
                  <div className="relative h-48">
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    
                    {ad.isFeatured && (
                      <span className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                        {lang === 'ar' ? 'مميز' : 'Vedette'}
                      </span>
                    )}
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); setReportForm({ reason: '', adId: ad.id, adTitle: ad.title }); setShowReportModal(true); }}
                      className="absolute top-3 left-3 bg-red-500/90 text-white p-2 rounded-full hover:bg-red-600 transition-all"
                    >
                      <Flag size={14} />
                    </button>
                    
                    {user && ad.userId !== user.uid && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setMessageForm({ content: '', receiverId: ad.userId, adId: ad.id, adTitle: ad.title }); 
                          setShowMessageModal(true); 
                        }}
                        className="absolute bottom-3 right-3 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all shadow-lg"
                      >
                        <MessageCircle size={16} />
                      </button>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-lg mb-2 truncate group-hover:text-blue-600 transition-colors">{ad.title}</h4>
                    <p className="text-blue-600 font-bold text-xl mb-3">{ad.price.toLocaleString()} DA</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {ad.city}
                      </span>
                      <span 
                        onClick={(e) => { e.stopPropagation(); setSelectedProfile(ad.userId); setCurrentPage('profile'); }}
                        className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <User size={14} />
                        {ad.userName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAds.length === 0 && (
              <div className="text-center py-20 text-gray-500 bg-white rounded-2xl shadow-lg">
                <Search size={60} className="mx-auto mb-4 opacity-30" />
                <p className="text-xl">{lang === 'ar' ? 'لا توجد نتائج' : 'Aucun résultat'}</p>
                <button 
                  onClick={() => { setSelectedCategory(''); setSelectedCity(''); setPriceMin(''); setPriceMax(''); setSearchQuery(''); }}
                  className="mt-4 btn-primary text-white px-6 py-2 rounded-xl"
                >
                  {lang === 'ar' ? 'مسح الفلاتر' : 'Effacer les filtres'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ad Detail Page */}
        {currentPage === 'adDetail' && selectedAd && (
          <div className="animate-slide-up max-w-4xl mx-auto">
            <button 
              onClick={() => { setSelectedAd(null); setCurrentPage('ads'); }} 
              className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2 font-medium"
            >
              <ArrowLeft size={20} />
              {lang === 'ar' ? 'العودة للإعلانات' : 'Retour aux annonces'}
            </button>
            
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="relative h-[400px]">
                <img src={selectedAd.imageUrl} alt={selectedAd.title} className="w-full h-full object-cover" />
                {selectedAd.isFeatured && (
                  <span className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg">
                    <Star size={18} fill="currentColor" />
                    {lang === 'ar' ? 'إعلان مميز' : 'Annonce vedette'}
                  </span>
                )}
              </div>
              
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{selectedAd.title}</h1>
                    <p className="text-3xl text-blue-600 font-bold">{selectedAd.price.toLocaleString()} DA</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Menu size={16} />
                      {lang === 'ar' ? 'الفئة' : 'Catégorie'}
                    </div>
                    <p className="font-bold">{categories.find(c => c.id === selectedAd.category)?.[lang === 'ar' ? 'name' : 'nameFr']}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <MapPin size={16} />
                      {lang === 'ar' ? 'المدينة' : 'Ville'}
                    </div>
                    <p className="font-bold">{selectedAd.city}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <User size={16} />
                      {lang === 'ar' ? 'الناشر' : 'Publié par'}
                    </div>
                    <p 
                      onClick={() => { setSelectedProfile(selectedAd.userId); setCurrentPage('profile'); }}
                      className="font-bold text-blue-600 cursor-pointer hover:underline"
                    >
                      {selectedAd.userName}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Calendar size={16} />
                      {lang === 'ar' ? 'التاريخ' : 'Date'}
                    </div>
                    <p className="font-bold">{new Date(selectedAd.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <Info size={20} className="text-blue-600" />
                    {lang === 'ar' ? 'الوصف' : 'Description'}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{selectedAd.description}</p>
                </div>

                {/* Action Buttons - Well organized */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <button 
                    onClick={() => {
                      if (user) {
                        showToast(`📞 ${selectedAd.phone}`, 'info');
                      } else {
                        setShowAuthModal(true);
                      }
                    }}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Phone size={24} />
                    </div>
                    <span className="text-lg">{lang === 'ar' ? 'إظهار رقم الهاتف' : 'Afficher le téléphone'}</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (user) {
                        setMessageForm({ content: '', receiverId: selectedAd.userId, adId: selectedAd.id, adTitle: selectedAd.title });
                        setShowMessageModal(true);
                      } else {
                        setShowAuthModal(true);
                      }
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageCircle size={24} />
                    </div>
                    <span className="text-lg">{lang === 'ar' ? 'مراسلة البائع' : 'Contacter le vendeur'}</span>
                  </button>
                </div>
                
                {/* Report Button - Separate */}
                <div className="flex justify-center mb-8">
                  <button 
                    onClick={() => { setReportForm({ reason: '', adId: selectedAd.id, adTitle: selectedAd.title }); setShowReportModal(true); }}
                    className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 py-3 px-8 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border border-gray-200 hover:border-red-200"
                  >
                    <Flag size={18} />
                    <span>{lang === 'ar' ? 'الإبلاغ عن هذا الإعلان' : 'Signaler cette annonce'}</span>
                  </button>
                </div>

                {/* Share Link */}
                <div className="p-5 bg-gray-50 rounded-2xl">
                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                    <Share2 size={16} />
                    {lang === 'ar' ? 'رابط المشاركة:' : 'Lien de partage:'}
                  </p>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={`${window.location.origin}/ad/${selectedAd.id}`}
                      readOnly 
                      className="flex-1 p-3 border rounded-xl bg-white text-sm"
                    />
                    <button 
                      onClick={() => { 
                        navigator.clipboard.writeText(`${window.location.origin}/ad/${selectedAd.id}`); 
                        showToast(lang === 'ar' ? 'تم نسخ الرابط! 📋' : 'Lien copié! 📋', 'success'); 
                      }}
                      className="btn-primary text-white px-5 py-3 rounded-xl flex items-center gap-2"
                    >
                      <Copy size={18} />
                      {lang === 'ar' ? 'نسخ' : 'Copier'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Page */}
        {currentPage === 'profile' && selectedProfile && (
          <div className="animate-fade-in">
            <button 
              onClick={() => { setSelectedProfile(null); setCurrentPage('ads'); }} 
              className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2 font-medium"
            >
              <ArrowLeft size={20} />
              {lang === 'ar' ? 'العودة' : 'Retour'}
            </button>
            
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-4xl text-white shadow-xl">
                  <User size={40} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-1">
                    {ads.find(a => a.userId === selectedProfile)?.userName || (lang === 'ar' ? 'مستخدم' : 'Utilisateur')}
                  </h2>
                  <p className="text-gray-500 flex items-center gap-2">
                    <Menu size={16} />
                    {getUserAds(selectedProfile).length} {lang === 'ar' ? 'إعلان' : 'annonces'}
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-6">{lang === 'ar' ? 'إعلانات هذا المستخدم' : 'Annonces de cet utilisateur'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getUserAds(selectedProfile).map(ad => (
                <div 
                  key={ad.id} 
                  onClick={() => { setSelectedAd(ad); setCurrentPage('adDetail'); }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover-lift"
                >
                  <img src={ad.imageUrl} alt={ad.title} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <h4 className="font-bold text-lg mb-2 truncate">{ad.title}</h4>
                    <p className="text-blue-600 font-bold">{ad.price.toLocaleString()} DA</p>
                  </div>
                </div>
              ))}
            </div>

            {getUserAds(selectedProfile).length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
                <Menu size={40} className="mx-auto mb-2 opacity-30" />
                <p>{lang === 'ar' ? 'لا توجد إعلانات' : 'Aucune annonce'}</p>
              </div>
            )}
          </div>
        )}

        {/* Messages Page - Messenger Style */}
        {currentPage === 'messages' && user && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white flex items-center gap-3">
                <MessageCircle size={28} />
                <h2 className="text-xl font-bold">{lang === 'ar' ? 'رسائلي' : 'Mes messages'}</h2>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {messages.filter(m => !m.isRead).length} {lang === 'ar' ? 'جديدة' : 'nouvelles'}
                </span>
              </div>
              
              {/* Tabs */}
              <div className="flex border-b">
                <button 
                  onClick={() => setSelectedCategory('')}
                  className={`flex-1 py-4 font-semibold transition-colors ${!selectedCategory ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {lang === 'ar' ? 'الواردة' : 'Boîte de réception'} ({messages.filter(m => !m.isRead).length})
                </button>
                <button 
                  onClick={() => setSelectedCategory('archive')}
                  className={`flex-1 py-4 font-semibold transition-colors ${selectedCategory === 'archive' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {lang === 'ar' ? 'الأرشيف' : 'Archive'} ({messages.filter(m => m.isRead).length})
                </button>
              </div>
              
              {/* Messages List */}
              <div className="max-h-[60vh] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <Mail size={60} className="mx-auto mb-4 opacity-30" />
                    <p className="text-xl">{lang === 'ar' ? 'لا توجد رسائل' : 'Aucun message'}</p>
                  </div>
                ) : (
                  <div>
                    {messages
                      .filter(msg => selectedCategory === 'archive' ? msg.isRead : !msg.isRead)
                      .map(msg => (
                      <div 
                        key={msg.id} 
                        className={`flex items-start gap-4 p-4 border-b hover:bg-gray-50 transition-colors cursor-pointer ${!msg.isRead ? 'bg-blue-50' : ''}`}
                      >
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            {msg.senderName[0].toUpperCase()}
                          </div>
                          {!msg.isRead && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-gray-900">{msg.senderName}</h4>
                            <span className="text-xs text-gray-400">
                              {new Date(msg.createdAt).toLocaleDateString()} - {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <p className="text-sm text-blue-600 mb-2 truncate">
                            📦 {msg.adTitle}
                          </p>
                          <p className={`text-gray-600 truncate ${!msg.isRead ? 'font-medium' : ''}`}>
                            {msg.content}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          {!msg.isRead && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleMarkAsRead(msg.id); }}
                              className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                              title={lang === 'ar' ? 'تحديد كمقروء' : 'Marquer comme lu'}
                            >
                              <Check size={18} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setMessageForm({ content: '', receiverId: msg.senderId, adId: msg.adId, adTitle: msg.adTitle }); 
                              setShowMessageModal(true); 
                            }}
                            className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                            title={lang === 'ar' ? 'رد' : 'Répondre'}
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Empty state for current tab */}
                    {messages.filter(msg => selectedCategory === 'archive' ? msg.isRead : !msg.isRead).length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Mail size={40} className="mx-auto mb-2 opacity-30" />
                        <p>
                          {selectedCategory === 'archive' 
                            ? (lang === 'ar' ? 'لا توجد رسائل مؤرشفة' : 'Aucun message archivé')
                            : (lang === 'ar' ? 'لا توجد رسائل جديدة' : 'Aucun nouveau message')
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* About Page */}
        {currentPage === 'about' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Info className="text-blue-600" />
                {lang === 'ar' ? 'من نحن' : 'À propos de nous'}
              </h1>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  {lang === 'ar' 
                    ? 'العفرون أونلاين هي منصة إلكترونية محلية تهدف إلى تسهيل عملية البيع والشراء بين سكان منطقة العفرون والمناطق المجاورة.'
                    : 'El Affroun Online est une plateforme locale visant à faciliter les transactions entre les habitants d\'El Affroun et des régions voisines.'}
                </p>
                <p>
                  {lang === 'ar'
                    ? 'نسعى لتوفير تجربة آمنة وسهلة للمستخدمين، حيث يمكنهم نشر إعلاناتهم مجاناً والتواصل مع البائعين والمشترين بكل سهولة.'
                    : 'Nous nous efforçons de fournir une expérience sûre et facile pour nos utilisateurs.'}
                </p>
                <div className="bg-blue-50 p-6 rounded-2xl mt-6">
                  <h3 className="font-bold text-xl mb-3 text-blue-800">{lang === 'ar' ? 'مميزاتنا' : 'Nos avantages'}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="text-green-500" size={20} />
                      {lang === 'ar' ? 'نشر إعلانات مجاني' : 'Publication gratuite'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="text-green-500" size={20} />
                      {lang === 'ar' ? 'تواصل مباشر مع البائعين' : 'Contact direct avec les vendeurs'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="text-green-500" size={20} />
                      {lang === 'ar' ? 'واجهة سهلة الاستخدام' : 'Interface facile à utiliser'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Page */}
        {currentPage === 'privacy' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Shield className="text-blue-600" />
                {lang === 'ar' ? 'سياسة الخصوصية' : 'Politique de confidentialité'}
              </h1>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  {lang === 'ar'
                    ? 'نحن نأخذ خصوصيتك على محمل الجد. هذه السياسة توضح كيفية جمع واستخدام وحماية معلوماتك الشخصية.'
                    : 'Nous prenons votre vie privée au sérieux. Cette politique explique comment nous collectons et protégeons vos informations.'}
                </p>
                <h3 className="font-bold text-lg mt-6">{lang === 'ar' ? 'المعلومات التي نجمعها' : 'Informations collectées'}</h3>
                <ul className="list-disc mr-6 space-y-2">
                  <li>{lang === 'ar' ? 'الاسم والبريد الإلكتروني' : 'Nom et email'}</li>
                  <li>{lang === 'ar' ? 'رقم الهاتف' : 'Numéro de téléphone'}</li>
                  <li>{lang === 'ar' ? 'معلومات الإعلانات' : 'Informations des annonces'}</li>
                </ul>
                <h3 className="font-bold text-lg mt-6">{lang === 'ar' ? 'حماية البيانات' : 'Protection des données'}</h3>
                <p>
                  {lang === 'ar'
                    ? 'نستخدم تقنيات أمان متقدمة لحماية بياناتك ولن نشاركها مع أي طرف ثالث دون إذنك.'
                    : 'Nous utilisons des technologies de sécurité avancées pour protéger vos données.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Page */}
        {currentPage === 'contact' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Mail className="text-blue-600" />
                {lang === 'ar' ? 'اتصل بنا' : 'Contactez-nous'}
              </h1>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      <Mail size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                      <p className="font-bold">contact@elaffroun.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                      <Phone size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{lang === 'ar' ? 'الهاتف' : 'Téléphone'}</p>
                      <p className="font-bold">+213 XX XX XX XX</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{lang === 'ar' ? 'العنوان' : 'Adresse'}</p>
                      <p className="font-bold">{lang === 'ar' ? 'العفرون، البليدة، الجزائر' : 'El Affroun, Blida, Algérie'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-4">{lang === 'ar' ? 'أرسل لنا رسالة' : 'Envoyez-nous un message'}</h3>
                  <button 
                    onClick={() => { setReportForm({ reason: '', adId: '', adTitle: '' }); setShowReportModal(true); }}
                    className="w-full btn-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <Send size={20} />
                    {lang === 'ar' ? 'إرسال رسالة' : 'Envoyer un message'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Dashboard */}
        {currentPage === 'admin' && user?.isAdmin && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Settings className="text-blue-600" />
              {lang === 'ar' ? 'لوحة التحكم' : 'Tableau de bord'}
            </h2>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <User size={24} />
                  <span className="opacity-80">{lang === 'ar' ? 'المستخدمين' : 'Utilisateurs'}</span>
                </div>
                <p className="text-4xl font-bold">{users.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Menu size={24} />
                  <span className="opacity-80">{lang === 'ar' ? 'الإعلانات' : 'Annonces'}</span>
                </div>
                <p className="text-4xl font-bold">{ads.length}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Eye size={24} />
                  <span className="opacity-80">{lang === 'ar' ? 'زيارات اليوم' : 'Aujourd\'hui'}</span>
                </div>
                <p className="text-4xl font-bold">{visitsStats.todayVisits}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar size={24} />
                  <span className="opacity-80">{lang === 'ar' ? 'زيارات الشهر' : 'Ce mois'}</span>
                </div>
                <p className="text-4xl font-bold">{visitsStats.monthVisits}</p>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <button 
                onClick={() => setShowBannerModal(true)}
                className="bg-white p-6 rounded-2xl shadow-xl hover-lift flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center text-white">
                  <Image size={28} />
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-lg">{lang === 'ar' ? 'إضافة بانر إعلاني' : 'Ajouter une bannière'}</h3>
                  <p className="text-gray-500 text-sm">{lang === 'ar' ? 'إعلان مدفوع في أعلى الصفحة' : 'Publicité en haut de page'}</p>
                </div>
              </button>
              
              <button 
                onClick={() => setShowSliderModal(true)}
                className="bg-white p-6 rounded-2xl shadow-xl hover-lift flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white">
                  <Upload size={28} />
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-lg">{lang === 'ar' ? 'إضافة سلايدر' : 'Ajouter un slider'}</h3>
                  <p className="text-gray-500 text-sm">{lang === 'ar' ? 'إعلان متحرك في الصفحة الرئيسية' : 'Publicité animée'}</p>
                </div>
              </button>
            </div>

            {/* Reports */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Flag className="text-red-500" />
                {lang === 'ar' ? 'البلاغات' : 'Signalements'} 
                <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                  {reports.filter(r => r.status === 'pending').length}
                </span>
              </h3>
              {reports.filter(r => r.status === 'pending').length === 0 ? (
                <p className="text-gray-500 text-center py-6">{lang === 'ar' ? 'لا توجد بلاغات معلقة' : 'Aucun signalement en attente'}</p>
              ) : (
                <div className="space-y-4">
                  {reports.filter(r => r.status === 'pending').map(report => (
                    <div key={report.id} className="border p-4 rounded-xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{report.userName}</p>
                          {report.adTitle && (
                            <p className="text-sm text-blue-600">{lang === 'ar' ? 'بخصوص:' : 'Concernant:'} {report.adTitle}</p>
                          )}
                          <p className="text-gray-600 mt-2">{report.reason}</p>
                        </div>
                        <button 
                          onClick={() => updateDoc(doc(db, 'reports', report.id), { status: 'resolved' })}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-1"
                        >
                          <Check size={16} />
                          {lang === 'ar' ? 'تم' : 'Traité'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Ads Management */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Menu className="text-blue-600" />
                {lang === 'ar' ? 'جميع الإعلانات' : 'Toutes les annonces'}
              </h3>
              <div className="space-y-4">
                {ads.map(ad => (
                  <div key={ad.id} className="flex items-center gap-4 border p-4 rounded-xl">
                    <img src={ad.imageUrl} alt={ad.title} className="w-20 h-20 object-cover rounded-xl" />
                    <div className="flex-1">
                      <h4 className="font-bold">{ad.title}</h4>
                      <p className="text-blue-600 font-semibold">{ad.price.toLocaleString()} DA</p>
                      <p className="text-sm text-gray-500">{ad.userName} - {ad.city}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleToggleFeatured(ad.id, ad.isFeatured)}
                        className={`p-3 rounded-xl transition-all ${ad.isFeatured ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 hover:bg-yellow-100'}`}
                        title={lang === 'ar' ? 'تمييز' : 'Mettre en vedette'}
                      >
                        <Star size={18} fill={ad.isFeatured ? 'currentColor' : 'none'} />
                      </button>
                      <button 
                        onClick={() => updateDoc(doc(db, 'ads', ad.id), { isActive: !ad.isActive })}
                        className={`p-3 rounded-xl transition-all ${ad.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                        title={ad.isActive ? (lang === 'ar' ? 'تعطيل' : 'Désactiver') : (lang === 'ar' ? 'تفعيل' : 'Activer')}
                      >
                        {ad.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button 
                        onClick={() => handleDeleteAd(ad.id)}
                        className="p-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
                        title={lang === 'ar' ? 'حذف' : 'Supprimer'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white mt-12 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-right">
              <h3 className="text-2xl font-bold gradient-text mb-1">
                {lang === 'ar' ? 'العفرون أونلاين' : 'El Affroun Online'}
              </h3>
              <p className="text-gray-400">{lang === 'ar' ? 'منصتك الأولى للبيع والشراء' : 'Votre plateforme N°1'}</p>
            </div>
            <div className="flex gap-6 items-center">
              <button className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                <Shield size={16} />
                {lang === 'ar' ? 'الخصوصية' : 'Confidentialité'}
              </button>
              <button className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                <Info size={16} />
                {lang === 'ar' ? 'معلومات' : 'À propos'}
              </button>
              <button 
                onClick={() => { setReportForm({ reason: '', adId: '', adTitle: '' }); setShowReportModal(true); }} 
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <HelpCircle size={16} />
                {lang === 'ar' ? 'تواصل' : 'Contact'}
              </button>
            </div>
          </div>
          <p className="text-center text-gray-600 mt-8">© 2024 El Affroun Online. {lang === 'ar' ? 'جميع الحقوق محفوظة' : 'Tous droits réservés'}</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md animate-slide-up shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <User size={24} />
                  {authMode === 'login' ? (lang === 'ar' ? 'تسجيل الدخول' : 'Connexion') : (lang === 'ar' ? 'إنشاء حساب' : 'Inscription')}
                </h3>
                <button onClick={() => setShowAuthModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {authMode === 'register' && (
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Nom complet'}
                    value={authForm.name}
                    onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full p-4 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              )}
              
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  value={authForm.email}
                  onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full p-4 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              {authMode === 'register' && (
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    placeholder={lang === 'ar' ? 'رقم الهاتف' : 'Téléphone'}
                    value={authForm.phone}
                    onChange={e => setAuthForm({ ...authForm, phone: e.target.value })}
                    className="w-full p-4 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              )}
              
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  placeholder={lang === 'ar' ? 'كلمة المرور' : 'Mot de passe'}
                  value={authForm.password}
                  onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full p-4 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              {authMode === 'register' && (
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    placeholder={lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}
                    value={authForm.confirmPassword}
                    onChange={e => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                    className="w-full p-4 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              )}
              
              <button
                onClick={authMode === 'login' ? handleLogin : handleRegister}
                disabled={isSubmitting}
                className="w-full btn-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {authMode === 'login' ? <LogOut size={20} /> : <User size={20} />}
                    {authMode === 'login' ? (lang === 'ar' ? 'دخول' : 'Se connecter') : (lang === 'ar' ? 'إنشاء حساب' : 'S\'inscrire')}
                  </>
                )}
              </button>

              <p className="text-center text-gray-600">
                {authMode === 'login' ? (lang === 'ar' ? 'ليس لديك حساب؟' : 'Pas de compte?') : (lang === 'ar' ? 'لديك حساب؟' : 'Déjà inscrit?')}
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} 
                  className="text-blue-600 font-bold mr-2 hover:underline"
                >
                  {authMode === 'login' ? (lang === 'ar' ? 'إنشاء حساب' : 'S\'inscrire') : (lang === 'ar' ? 'تسجيل الدخول' : 'Se connecter')}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Ad Modal */}
      {showAdModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg my-8 animate-slide-up shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Plus size={24} />
                  {lang === 'ar' ? 'نشر إعلان جديد' : 'Publier une annonce'}
                </h3>
                <button onClick={() => setShowAdModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <select
                value={adForm.category}
                onChange={e => setAdForm({ ...adForm, category: e.target.value })}
                className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              >
                <option value="">{lang === 'ar' ? 'اختر الفئة' : 'Choisir une catégorie'}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{lang === 'ar' ? cat.name : cat.nameFr}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder={lang === 'ar' ? 'عنوان الإعلان' : 'Titre de l\'annonce'}
                value={adForm.title}
                onChange={e => setAdForm({ ...adForm, title: e.target.value })}
                className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
              
              <textarea
                placeholder={lang === 'ar' ? 'وصف الإعلان' : 'Description'}
                value={adForm.description}
                onChange={e => setAdForm({ ...adForm, description: e.target.value })}
                rows={4}
                className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
              />
              
              <input
                type="number"
                placeholder={lang === 'ar' ? 'السعر (دج)' : 'Prix (DA)'}
                value={adForm.price}
                onChange={e => setAdForm({ ...adForm, price: e.target.value })}
                className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
              
              <select
                value={adForm.city}
                onChange={e => setAdForm({ ...adForm, city: e.target.value })}
                className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              >
                <option value="">{lang === 'ar' ? 'اختر المدينة' : 'Choisir une ville'}</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              
              <input
                type="tel"
                placeholder={lang === 'ar' ? 'رقم الهاتف' : 'Téléphone'}
                value={adForm.phone}
                onChange={e => setAdForm({ ...adForm, phone: e.target.value })}
                className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
              
              <div className="border-2 border-dashed border-orange-300 rounded-xl p-6 text-center hover:border-orange-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAdImageChange}
                  className="hidden"
                  id="imageInput"
                />
                <label htmlFor="imageInput" className="cursor-pointer">
                  {adForm.imagePreview ? (
                    <div className="relative">
                      <img src={adForm.imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                      <div className="mt-2 text-green-600 flex items-center justify-center gap-2">
                        <Check size={20} />
                        <span>{lang === 'ar' ? 'تم اختيار الصورة' : 'Image sélectionnée'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <Plus size={40} className="mx-auto mb-2 text-orange-400" />
                      <p>{lang === 'ar' ? 'اضغط لرفع صورة' : 'Cliquez pour ajouter une image'}</p>
                    </div>
                  )}
                </label>
              </div>
              
              <button
                onClick={handleAddAd}
                disabled={isSubmitting}
                className="w-full btn-orange text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send size={20} />
                    {lang === 'ar' ? 'نشر الإعلان' : 'Publier l\'annonce'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md animate-slide-up shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <MessageCircle size={24} />
                  {lang === 'ar' ? 'إرسال رسالة' : 'Envoyer un message'}
                </h3>
                <button onClick={() => setShowMessageModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {messageForm.adTitle && (
                <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                  <Info size={16} />
                  {lang === 'ar' ? 'بخصوص:' : 'Concernant:'} <span className="font-medium text-blue-600">{messageForm.adTitle}</span>
                </p>
              )}
              <textarea
                placeholder={lang === 'ar' ? 'اكتب رسالتك هنا...' : 'Votre message...'}
                value={messageForm.content}
                onChange={e => setMessageForm({ ...messageForm, content: e.target.value })}
                rows={5}
                className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={isSubmitting}
                className="w-full mt-4 btn-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send size={20} />
                    {lang === 'ar' ? 'إرسال' : 'Envoyer'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md animate-slide-up shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Flag size={24} />
                  {lang === 'ar' ? 'إبلاغ' : 'Signalement'}
                </h3>
                <button onClick={() => setShowReportModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {reportForm.adTitle && (
                <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                  <Info size={16} />
                  {lang === 'ar' ? 'بخصوص:' : 'Concernant:'} <span className="font-medium text-red-600">{reportForm.adTitle}</span>
                </p>
              )}
              <textarea
                placeholder={lang === 'ar' ? 'سبب البلاغ...' : 'Raison du signalement...'}
                value={reportForm.reason}
                onChange={e => setReportForm({ ...reportForm, reason: e.target.value })}
                rows={5}
                className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none"
              />
              <button
                onClick={handleSendReport}
                disabled={isSubmitting}
                className="w-full mt-4 bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Flag size={20} />
                    {lang === 'ar' ? 'إرسال البلاغ' : 'Envoyer le signalement'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md animate-slide-up shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Filter size={24} />
                  {lang === 'ar' ? 'فلترة النتائج' : 'Filtrer les résultats'}
                </h3>
                <button onClick={() => setShowFilterModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">{lang === 'ar' ? 'جميع الفئات' : 'Toutes les catégories'}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{lang === 'ar' ? cat.name : cat.nameFr}</option>
                ))}
              </select>
              
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">{lang === 'ar' ? 'جميع المدن' : 'Toutes les villes'}</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder={lang === 'ar' ? 'السعر الأدنى' : 'Prix min'}
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                  className="flex-1 p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <input
                  type="number"
                  placeholder={lang === 'ar' ? 'السعر الأقصى' : 'Prix max'}
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  className="flex-1 p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <button
                onClick={() => { setShowFilterModal(false); setCurrentPage('ads'); }}
                className="w-full btn-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Check size={20} />
                {lang === 'ar' ? 'تطبيق الفلتر' : 'Appliquer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 pt-20 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl animate-fade-in shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'ابحث عن إعلان...' : 'Rechercher une annonce...'}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full p-4 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <button
                  onClick={() => { setShowSearchModal(false); setCurrentPage('ads'); }}
                  className="btn-primary text-white px-6 py-4 rounded-xl font-bold"
                >
                  <Search size={20} />
                </button>
              </div>
              <button 
                onClick={() => setShowSearchModal(false)} 
                className="w-full mt-4 text-gray-500 hover:text-gray-700 py-2"
              >
                {lang === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Modal (Admin) */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md animate-slide-up shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Image size={24} />
                  {lang === 'ar' ? 'إضافة بانر' : 'Ajouter une bannière'}
                </h3>
                <button onClick={() => setShowBannerModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder={lang === 'ar' ? 'عنوان البانر' : 'Titre de la bannière'}
                value={bannerForm.title}
                onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })}
                className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
              />
              
              <input
                type="url"
                placeholder={lang === 'ar' ? 'رابط (اختياري)' : 'Lien (optionnel)'}
                value={bannerForm.link}
                onChange={e => setBannerForm({ ...bannerForm, link: e.target.value })}
                className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all"
              />
              
              <div className="border-2 border-dashed border-pink-300 rounded-xl p-6 text-center hover:border-pink-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerImageChange}
                  className="hidden"
                  id="bannerImageInput"
                />
                <label htmlFor="bannerImageInput" className="cursor-pointer">
                  {bannerForm.imagePreview ? (
                    <img src={bannerForm.imagePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
                  ) : (
                    <div className="text-gray-500">
                      <Upload size={40} className="mx-auto mb-2 text-pink-400" />
                      <p>{lang === 'ar' ? 'اضغط لرفع صورة' : 'Cliquez pour ajouter'}</p>
                    </div>
                  )}
                </label>
              </div>
              
              <button
                onClick={handleAddBanner}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check size={20} />
                    {lang === 'ar' ? 'إضافة' : 'Ajouter'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slider Modal (Admin) */}
      {showSliderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md animate-slide-up shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Upload size={24} />
                  {lang === 'ar' ? 'إضافة سلايدر' : 'Ajouter un slider'}
                </h3>
                <button onClick={() => setShowSliderModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder={lang === 'ar' ? 'عنوان السلايدر' : 'Titre du slider'}
                value={sliderForm.title}
                onChange={e => setSliderForm({ ...sliderForm, title: e.target.value })}
                className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              
              <input
                type="url"
                placeholder={lang === 'ar' ? 'رابط (اختياري)' : 'Lien (optionnel)'}
                value={sliderForm.link}
                onChange={e => setSliderForm({ ...sliderForm, link: e.target.value })}
                className="w-full p-4 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              
              <div className="border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSliderImageChange}
                  className="hidden"
                  id="sliderImageInput"
                />
                <label htmlFor="sliderImageInput" className="cursor-pointer">
                  {sliderForm.imagePreview ? (
                    <img src={sliderForm.imagePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
                  ) : (
                    <div className="text-gray-500">
                      <Upload size={40} className="mx-auto mb-2 text-indigo-400" />
                      <p>{lang === 'ar' ? 'اضغط لرفع صورة' : 'Cliquez pour ajouter'}</p>
                    </div>
                  )}
                </label>
              </div>
              
              <button
                onClick={handleAddSlider}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check size={20} />
                    {lang === 'ar' ? 'إضافة' : 'Ajouter'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Menu */}
      {showSideMenu && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSideMenu(false)}></div>
          <div className="absolute top-0 right-0 w-80 h-full bg-white shadow-2xl animate-slide-in-right">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">{lang === 'ar' ? 'القائمة' : 'Menu'}</h3>
                <button onClick={() => setShowSideMenu(false)} className="hover:bg-white/20 p-2 rounded-full">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              <button 
                onClick={() => { setCurrentPage('home'); setSelectedAd(null); setSelectedProfile(null); setShowSideMenu(false); }}
                className="w-full text-right p-4 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors"
              >
                <Home size={20} className="text-blue-600" />
                {lang === 'ar' ? 'الصفحة الرئيسية' : 'Accueil'}
              </button>
              
              <button 
                onClick={() => { setCurrentPage('ads'); setShowSideMenu(false); }}
                className="w-full text-right p-4 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors"
              >
                <Menu size={20} className="text-green-600" />
                {lang === 'ar' ? 'جميع الإعلانات' : 'Toutes les annonces'}
              </button>
              
              <hr className="my-4" />
              
              <button 
                onClick={() => { setCurrentPage('about'); setShowSideMenu(false); }}
                className="w-full text-right p-4 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors"
              >
                <Info size={20} className="text-purple-600" />
                {lang === 'ar' ? 'من نحن' : 'À propos'}
              </button>
              
              <button 
                onClick={() => { setCurrentPage('privacy'); setShowSideMenu(false); }}
                className="w-full text-right p-4 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors"
              >
                <Shield size={20} className="text-indigo-600" />
                {lang === 'ar' ? 'سياسة الخصوصية' : 'Confidentialité'}
              </button>
              
              <button 
                onClick={() => { setCurrentPage('contact'); setShowSideMenu(false); }}
                className="w-full text-right p-4 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors"
              >
                <Mail size={20} className="text-orange-600" />
                {lang === 'ar' ? 'اتصل بنا' : 'Contactez-nous'}
              </button>
              
              <button 
                onClick={() => { setReportForm({ reason: '', adId: '', adTitle: '' }); setShowReportModal(true); setShowSideMenu(false); }}
                className="w-full text-right p-4 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors"
              >
                <Flag size={20} className="text-red-600" />
                {lang === 'ar' ? 'الإبلاغ عن مشكل' : 'Signaler un problème'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && user && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md animate-slide-up shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Settings size={24} />
                  {lang === 'ar' ? 'تعديل الملف الشخصي' : 'Modifier le profil'}
                </h3>
                <button onClick={() => setShowEditProfileModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'الاسم' : 'Nom'}
                  value={editProfileForm.name}
                  onChange={e => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                  className="w-full p-4 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  placeholder={lang === 'ar' ? 'رقم الهاتف' : 'Téléphone'}
                  value={editProfileForm.phone}
                  onChange={e => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                  className="w-full p-4 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <button
                onClick={async () => {
                  // Save profile changes
                  try {
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('uid', '==', user.uid));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                      const docRef = doc(db, 'users', snapshot.docs[0].id);
                      await updateDoc(docRef, { 
                        name: editProfileForm.name || user.name,
                        phone: editProfileForm.phone || user.phone 
                      });
                      setUser({ ...user, name: editProfileForm.name || user.name, phone: editProfileForm.phone || user.phone });
                      setShowEditProfileModal(false);
                      showToast(lang === 'ar' ? 'تم تحديث الملف الشخصي! ✓' : 'Profil mis à jour! ✓', 'success');
                    }
                  } catch (error) {
                    console.error('Update profile error:', error);
                    showToast(lang === 'ar' ? 'حدث خطأ' : 'Erreur', 'error');
                  }
                }}
                className="w-full btn-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Check size={20} />
                {lang === 'ar' ? 'حفظ التغييرات' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdowns on click outside */}
      {(showNotifications || showUserMenu) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => { setShowNotifications(false); setShowUserMenu(false); }}
        />
      )}
    </div>
  );
}
