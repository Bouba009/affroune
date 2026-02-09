import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, FileText, Bell, Settings, LogOut, Menu, Plus, Trash2, 
  Edit, Eye, EyeOff, Star, Flag, Image, MessageSquare, TrendingUp,
  Search, Save, RefreshCw, X,
  CheckCircle, XCircle, Activity,
  Shield, Lock, Unlock, Ban, Send, Layers, Globe, Code, ChevronLeft
} from 'lucide-react';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAaXp-gUOQ_G2s-kM8JhaqW8TJcJ4Nqcuo",
  authDomain: "comondi-fae4b.firebaseapp.com",
  projectId: "comondi-fae4b",
  storageBucket: "comondi-fae4b.firebasestorage.app",
  messagingSenderId: "932777870241",
  appId: "1:932777870241:web:78b0cf3a3cf14046be01e0",
  measurementId: "G-M09RX0V18S"
};

let app;
let db: ReturnType<typeof getFirestore>;

try {
  app = initializeApp(firebaseConfig, 'admin-app');
  db = getFirestore(app);
} catch (error) {
  // App already initialized, use existing
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

// Types
interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  city: string;
  phone: string;
  image: string;
  userId: string;
  userName: string;
  createdAt: any;
  isActive: boolean;
  isFeatured: boolean;
  views: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: any;
  isActive: boolean;
  isBanned: boolean;
  adsCount: number;
}

interface Report {
  id: string;
  type: string;
  adId?: string;
  adTitle?: string;
  reason: string;
  reporterId: string;
  reporterName: string;
  createdAt: any;
  status: 'pending' | 'resolved' | 'rejected';
}

interface Slider {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  isActive: boolean;
  order: number;
  createdAt: any;
}

interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
  position: 'top' | 'sidebar' | 'bottom';
  isActive: boolean;
  createdAt: any;
}

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  facebookUrl: string;
  instagramUrl: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  allowAds: boolean;
  maxImageSize: number;
  featuredPrice: number;
}

const Admin: React.FC = () => {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState<string | null>(null);

  // Data State
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalAds: 0,
    activeAds: 0,
    featuredAds: 0,
    pendingReports: 0,
    todayVisits: 0,
    monthVisits: 0,
    totalMessages: 0,
    todayAds: 0
  });

  // Settings
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'العفرون أونلاين',
    siteDescription: 'منصة الإعلانات المبوبة',
    contactEmail: 'contact@elaffroun.com',
    contactPhone: '0555123456',
    facebookUrl: '',
    instagramUrl: '',
    maintenanceMode: false,
    allowRegistration: true,
    allowAds: true,
    maxImageSize: 5,
    featuredPrice: 500
  });

  // Form States
  const [sliderForm, setSliderForm] = useState({ title: '', description: '', image: '', link: '', isActive: true });
  const [bannerForm, setBannerForm] = useState({ title: '', image: '', link: '', position: 'top' as 'top' | 'sidebar' | 'bottom', isActive: true });
  const [notificationForm, setNotificationForm] = useState({ title: '', message: '', type: 'all' as 'all' | 'specific', targetUserId: '' });
  const [htmlAdForm, setHtmlAdForm] = useState({ title: '', htmlCode: '', position: 'sidebar', isActive: true });
  const [htmlAds, setHtmlAds] = useState<any[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Edit States
  const [editingAd, setEditingAd] = useState<Ad | null>(null);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    setTimeout(() => {
      if (username === 'admin' && password === 'abobob123') {
        setIsLoggedIn(true);
        localStorage.setItem('adminLoggedIn', 'true');
        showToast('تم تسجيل الدخول بنجاح', 'success');
      } else {
        setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
      setIsLoading(false);
    }, 500);
  };

  // Logout Handler
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('adminLoggedIn');
    setUsername('');
    setPassword('');
    // Go back to main site
    window.location.hash = '';
    window.location.reload();
  };

  // Check if already logged in
  useEffect(() => {
    const loggedIn = localStorage.getItem('adminLoggedIn');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  // Load Data
  useEffect(() => {
    if (isLoggedIn) {
      loadAllData();
    }
  }, [isLoggedIn]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadAds(),
        loadUsers(),
        loadReports(),
        loadSliders(),
        loadBanners(),
        loadMessages(),
        loadHtmlAds()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('خطأ في تحميل البيانات', 'error');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn) {
      calculateStats();
    }
  }, [ads, users, reports, messages, sliders, isLoggedIn]);

  const loadAds = async () => {
    try {
      const q = query(collection(db, 'ads'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const adsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ad[];
      setAds(adsData);
    } catch (error) {
      console.error('Error loading ads:', error);
      // Use empty array if error
      setAds([]);
    }
  };

  const loadUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadReports = async () => {
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Report[];
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([]);
    }
  };

  const loadSliders = async () => {
    try {
      const q = query(collection(db, 'sliders'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const slidersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Slider[];
      setSliders(slidersData);
    } catch (error) {
      console.error('Error loading sliders:', error);
      setSliders([]);
    }
  };

  const loadBanners = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'banners'));
      const bannersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Banner[];
      setBanners(bannersData);
    } catch (error) {
      console.error('Error loading banners:', error);
      setBanners([]);
    }
  };

  const loadMessages = async () => {
    try {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const loadHtmlAds = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'htmlAds'));
      const htmlAdsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHtmlAds(htmlAdsData);
    } catch (error) {
      console.error('Error loading HTML ads:', error);
      setHtmlAds([]);
    }
  };

  const calculateStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeAds = ads.filter(ad => ad.isActive !== false);
    const featuredAds = ads.filter(ad => ad.isFeatured);
    const pendingReports = reports.filter(r => r.status === 'pending');
    const todayAds = ads.filter(ad => {
      if (ad.createdAt?.toDate) {
        return ad.createdAt.toDate() >= today;
      }
      return false;
    });

    const visits = JSON.parse(localStorage.getItem('siteVisits') || '{}');
    const todayKey = today.toISOString().split('T')[0];
    const monthKey = today.toISOString().slice(0, 7);

    setStats({
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive !== false && !u.isBanned).length,
      totalAds: ads.length,
      activeAds: activeAds.length,
      featuredAds: featuredAds.length,
      pendingReports: pendingReports.length,
      todayVisits: visits[todayKey] || 0,
      monthVisits: Object.keys(visits).filter(k => k.startsWith(monthKey)).reduce((sum, k) => sum + visits[k], 0),
      totalMessages: messages.length,
      todayAds: todayAds.length
    });
  };

  // Ad Actions
  const toggleAdStatus = async (adId: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { isActive: !isActive });
      setAds(ads.map(ad => ad.id === adId ? { ...ad, isActive: !isActive } : ad));
      showToast(isActive ? 'تم تعطيل الإعلان' : 'تم تفعيل الإعلان', 'success');
    } catch (error) {
      showToast('حدث خطأ', 'error');
    }
  };

  const toggleAdFeatured = async (adId: string, isFeatured: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', adId), { isFeatured: !isFeatured });
      setAds(ads.map(ad => ad.id === adId ? { ...ad, isFeatured: !isFeatured } : ad));
      showToast(isFeatured ? 'تم إلغاء التمييز' : 'تم تمييز الإعلان', 'success');
    } catch (error) {
      showToast('حدث خطأ', 'error');
    }
  };

  const deleteAd = async (adId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
      await deleteDoc(doc(db, 'ads', adId));
      setAds(ads.filter(ad => ad.id !== adId));
      showToast('تم حذف الإعلان', 'success');
    } catch (error) {
      showToast('حدث خطأ في الحذف', 'error');
    }
  };

  const updateAd = async () => {
    if (!editingAd) return;
    try {
      await updateDoc(doc(db, 'ads', editingAd.id), {
        title: editingAd.title,
        description: editingAd.description,
        price: editingAd.price,
        category: editingAd.category,
        city: editingAd.city,
        phone: editingAd.phone
      });
      setAds(ads.map(ad => ad.id === editingAd.id ? editingAd : ad));
      setEditingAd(null);
      setShowModal(null);
      showToast('تم تحديث الإعلان', 'success');
    } catch (error) {
      showToast('حدث خطأ في التحديث', 'error');
    }
  };

  // User Actions
  const toggleUserBan = async (userId: string, isBanned: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isBanned: !isBanned });
      setUsers(users.map(user => user.id === userId ? { ...user, isBanned: !isBanned } : user));
      showToast(isBanned ? 'تم إلغاء الحظر' : 'تم حظر المستخدم', 'success');
    } catch (error) {
      showToast('حدث خطأ', 'error');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(user => user.id !== userId));
      showToast('تم حذف المستخدم', 'success');
    } catch (error) {
      showToast('حدث خطأ في الحذف', 'error');
    }
  };

  // Report Actions
  const updateReportStatus = async (reportId: string, status: 'resolved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
      setReports(reports.map(report => report.id === reportId ? { ...report, status } : report));
      showToast('تم تحديث حالة البلاغ', 'success');
    } catch (error) {
      showToast('حدث خطأ', 'error');
    }
  };

  // Slider Actions
  const addSlider = async () => {
    if (!sliderForm.title || !sliderForm.image) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'sliders'), {
        ...sliderForm,
        order: sliders.length,
        createdAt: Timestamp.now()
      });
      setSliders([...sliders, { id: docRef.id, ...sliderForm, order: sliders.length, createdAt: Timestamp.now() }]);
      setSliderForm({ title: '', description: '', image: '', link: '', isActive: true });
      setShowModal(null);
      showToast('تم إضافة السلايدر', 'success');
    } catch (error) {
      showToast('حدث خطأ', 'error');
    }
  };

  const deleteSlider = async (sliderId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السلايدر؟')) return;
    try {
      await deleteDoc(doc(db, 'sliders', sliderId));
      setSliders(sliders.filter(s => s.id !== sliderId));
      showToast('تم حذف السلايدر', 'success');
    } catch (error) {
      showToast('حدث خطأ', 'error');
    }
  };

  // Banner Actions
  const addBanner = async () => {
    if (!bannerForm.title || !bannerForm.image) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'banners'), {
        ...bannerForm,
        createdAt: Timestamp.now()
      });
      setBanners([...banners, { id: docRef.id, ...bannerForm, createdAt: Timestamp.now() }]);
      setBannerForm({ title: '', image: '', link: '', position: 'top', isActive: true });
      setShowModal(null);
      showToast('تم إضافة البانر', 'success');
    } catch (error) {
      showToast('حدث خطأ', 'error');
    }
  };

  const deleteBanner = async (bannerId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا البانر؟')) return;
    try {
      await deleteDoc(doc(db, 'banners', bannerId));
      setBanners(banners.filter(b => b.id !== bannerId));
      showToast('تم حذف البانر', 'success');
    } catch (error) {
      showToast('حدث خطأ', 'error');
    }
  };

  // Notification Actions
  const sendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      showToast('يرجى ملء جميع الحقول', 'error');
      return;
    }
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notificationForm,
        createdAt: Timestamp.now(),
        isRead: false
      });
      setNotificationForm({ title: '', message: '', type: 'all', targetUserId: '' });
      setShowModal(null);
      showToast('تم إرسال الإشعار', 'success');
    } catch (error) {
      showToast('حدث خطأ', 'error');
    }
  };

  // HTML Ad Actions
  const addHtmlAd = async () => {
    if (!htmlAdForm.title || !htmlAdForm.htmlCode) {
      showToast('يرجى ملء جميع الحقول', 'error');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'htmlAds'), {
        ...htmlAdForm,
        createdAt: Timestamp.now()
      });
      setHtmlAds([...htmlAds, { id: docRef.id, ...htmlAdForm }]);
      setHtmlAdForm({ title: '', htmlCode: '', position: 'sidebar', isActive: true });
      setShowModal(null);
      showToast('تم إضافة إعلان HTML', 'success');
    } catch (error) {
      showToast('حدث خطأ', 'error');
    }
  };

  const deleteHtmlAd = async (adId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
      await deleteDoc(doc(db, 'htmlAds', adId));
      setHtmlAds(htmlAds.filter(a => a.id !== adId));
      showToast('تم حذف الإعلان', 'success');
    } catch (error) {
      showToast('حدث خطأ', 'error');
    }
  };

  // Settings Actions
  const saveSettings = async () => {
    try {
      localStorage.setItem('siteSettings', JSON.stringify(settings));
      showToast('تم حفظ الإعدادات', 'success');
    } catch (error) {
      showToast('حدث خطأ', 'error');
    }
  };

  // Filter Ads
  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || ad.category === filterCategory;
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && ad.isActive) ||
                         (filterStatus === 'inactive' && !ad.isActive) ||
                         (filterStatus === 'featured' && ad.isFeatured);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['سيارات ومركبات', 'عقارات', 'هواتف وإلكترونيات', 'فرص عمل', 'خدمات', 'أجهزة كهرومنزلية', 'ألبسة وموضة', 'معدات مهنية', 'حلويات', 'خياطة', 'تجميل وعناية', 'أخرى'];

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setImage: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Login Page
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4" dir="rtl">
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          .float-animation {
            animation: float 6s ease-in-out infinite;
          }
        `}</style>
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl float-animation"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl float-animation" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl float-animation" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">لوحة تحكم الأدمن</h1>
            <p className="text-blue-200">العفرون أونلاين - El Affroun Online</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-white/80 mb-2 text-sm">اسم المستخدم</label>
              <div className="relative">
                <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-12 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="أدخل اسم المستخدم"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 mb-2 text-sm">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-12 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="أدخل كلمة المرور"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {loginError && (
              <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl flex items-center gap-2 animate-pulse">
                <XCircle className="w-5 h-5" />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { window.location.hash = ''; window.location.reload(); }}
              className="text-blue-300 hover:text-white transition-colors flex items-center gap-2 mx-auto"
            >
              <ChevronLeft className="w-4 h-4" />
              العودة للموقع الرئيسي
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <style>{`
        * { scrollbar-width: none; -ms-overflow-style: none; }
        *::-webkit-scrollbar { display: none; }
      `}</style>
      
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 transform transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5" />}
          {toast.type === 'info' && <Bell className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            {sidebarOpen && (
              <div>
                <h2 className="font-bold">لوحة التحكم</h2>
                <p className="text-xs text-blue-200">الأدمن</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
            { id: 'ads', icon: FileText, label: 'الإعلانات' },
            { id: 'users', icon: Users, label: 'المستخدمين' },
            { id: 'reports', icon: Flag, label: 'البلاغات' },
            { id: 'sliders', icon: Layers, label: 'السلايدر' },
            { id: 'banners', icon: Image, label: 'البانرات' },
            { id: 'htmlAds', icon: Code, label: 'إعلانات HTML' },
            { id: 'notifications', icon: Bell, label: 'الإشعارات' },
            { id: 'messages', icon: MessageSquare, label: 'الرسائل' },
            { id: 'settings', icon: Settings, label: 'الإعدادات' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-white text-blue-900 shadow-lg' 
                  : 'hover:bg-white/10'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
              {item.id === 'reports' && stats.pendingReports > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full mr-auto">
                  {stats.pendingReports}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 right-0 left-0 p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-300 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'mr-64' : 'mr-20'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">
                {activeTab === 'dashboard' && 'لوحة التحكم'}
                {activeTab === 'ads' && 'إدارة الإعلانات'}
                {activeTab === 'users' && 'إدارة المستخدمين'}
                {activeTab === 'reports' && 'إدارة البلاغات'}
                {activeTab === 'sliders' && 'إدارة السلايدر'}
                {activeTab === 'banners' && 'إدارة البانرات'}
                {activeTab === 'htmlAds' && 'إعلانات HTML'}
                {activeTab === 'notifications' && 'الإشعارات'}
                {activeTab === 'messages' && 'الرسائل'}
                {activeTab === 'settings' && 'الإعدادات'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={loadAllData}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
              </button>
              <button
                onClick={() => { window.location.hash = ''; window.location.reload(); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Globe className="w-4 h-4" />
                عرض الموقع
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 opacity-80" />
                    <span className="text-3xl font-bold">{stats.totalUsers}</span>
                  </div>
                  <p className="text-blue-100">إجمالي المستخدمين</p>
                  <p className="text-sm text-blue-200 mt-1">{stats.activeUsers} نشط</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <FileText className="w-8 h-8 opacity-80" />
                    <span className="text-3xl font-bold">{stats.totalAds}</span>
                  </div>
                  <p className="text-green-100">إجمالي الإعلانات</p>
                  <p className="text-sm text-green-200 mt-1">{stats.todayAds} اليوم</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-8 h-8 opacity-80" />
                    <span className="text-3xl font-bold">{stats.todayVisits}</span>
                  </div>
                  <p className="text-orange-100">زيارات اليوم</p>
                  <p className="text-sm text-orange-200 mt-1">{stats.monthVisits} هذا الشهر</p>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <Flag className="w-8 h-8 opacity-80" />
                    <span className="text-3xl font-bold">{stats.pendingReports}</span>
                  </div>
                  <p className="text-red-100">بلاغات معلقة</p>
                  <p className="text-sm text-red-200 mt-1">{reports.length} إجمالي</p>
                </div>
              </div>

              {/* More Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">إعلانات مميزة</p>
                      <p className="text-2xl font-bold">{stats.featuredAds}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">إجمالي الرسائل</p>
                      <p className="text-2xl font-bold">{stats.totalMessages}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Layers className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">السلايدر النشط</p>
                      <p className="text-2xl font-bold">{sliders.filter(s => s.isActive).length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    أحدث الإعلانات
                  </h3>
                  <div className="space-y-3">
                    {ads.slice(0, 5).map(ad => (
                      <div key={ad.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <img src={ad.image || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ad.title}</p>
                          <p className="text-sm text-gray-500">{ad.price} دج</p>
                        </div>
                        {ad.isFeatured && <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />}
                      </div>
                    ))}
                    {ads.length === 0 && (
                      <p className="text-center text-gray-500 py-8">لا توجد إعلانات</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-500" />
                    أحدث البلاغات
                  </h3>
                  <div className="space-y-3">
                    {reports.slice(0, 5).map(report => (
                      <div key={report.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          report.status === 'pending' ? 'bg-yellow-500' :
                          report.status === 'resolved' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{report.reason}</p>
                          <p className="text-sm text-gray-500">بواسطة {report.reporterName}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                          report.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {report.status === 'pending' ? 'معلق' : report.status === 'resolved' ? 'تم الحل' : 'مرفوض'}
                        </span>
                      </div>
                    ))}
                    {reports.length === 0 && (
                      <p className="text-center text-gray-500 py-8">لا توجد بلاغات</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ads Management */}
          {activeTab === 'ads' && (
            <div className="space-y-6">
              {/* Search & Filter */}
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="بحث في الإعلانات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">جميع الفئات</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">جميع الحالات</option>
                    <option value="active">نشط</option>
                    <option value="inactive">معطل</option>
                    <option value="featured">مميز</option>
                  </select>
                </div>
              </div>

              {/* Ads Table */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-right font-medium text-gray-500">الإعلان</th>
                        <th className="px-6 py-4 text-right font-medium text-gray-500">الفئة</th>
                        <th className="px-6 py-4 text-right font-medium text-gray-500">السعر</th>
                        <th className="px-6 py-4 text-right font-medium text-gray-500">الحالة</th>
                        <th className="px-6 py-4 text-right font-medium text-gray-500">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredAds.map(ad => (
                        <tr key={ad.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={ad.image || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-lg object-cover" />
                              <div>
                                <p className="font-medium">{ad.title}</p>
                                <p className="text-sm text-gray-500">{ad.userName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{ad.category}</td>
                          <td className="px-6 py-4 font-medium">{ad.price} دج</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {ad.isActive !== false ? (
                                <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">نشط</span>
                              ) : (
                                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">معطل</span>
                              )}
                              {ad.isFeatured && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setEditingAd(ad); setShowModal('editAd'); }}
                                className="p-2 hover:bg-blue-100 rounded-lg text-blue-500"
                                title="تعديل"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleAdFeatured(ad.id, ad.isFeatured)}
                                className={`p-2 rounded-lg ${ad.isFeatured ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-gray-100 text-gray-400'}`}
                                title={ad.isFeatured ? 'إلغاء التمييز' : 'تمييز'}
                              >
                                <Star className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleAdStatus(ad.id, ad.isActive !== false)}
                                className={`p-2 rounded-lg ${ad.isActive !== false ? 'hover:bg-red-100 text-red-500' : 'hover:bg-green-100 text-green-500'}`}
                                title={ad.isActive !== false ? 'تعطيل' : 'تفعيل'}
                              >
                                {ad.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => deleteAd(ad.id)}
                                className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredAds.length === 0 && (
                  <p className="text-center text-gray-500 py-12">لا توجد إعلانات</p>
                )}
              </div>
            </div>
          )}

          {/* Users Management */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-right font-medium text-gray-500">المستخدم</th>
                      <th className="px-6 py-4 text-right font-medium text-gray-500">البريد</th>
                      <th className="px-6 py-4 text-right font-medium text-gray-500">الهاتف</th>
                      <th className="px-6 py-4 text-right font-medium text-gray-500">الحالة</th>
                      <th className="px-6 py-4 text-right font-medium text-gray-500">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold">{user.name?.charAt(0) || 'U'}</span>
                            </div>
                            <span className="font-medium">{user.name || 'مستخدم'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-gray-600">{user.phone || '-'}</td>
                        <td className="px-6 py-4">
                          {user.isBanned ? (
                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">محظور</span>
                          ) : (
                            <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">نشط</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleUserBan(user.id, user.isBanned)}
                              className={`p-2 rounded-lg ${user.isBanned ? 'hover:bg-green-100 text-green-500' : 'hover:bg-red-100 text-red-500'}`}
                              title={user.isBanned ? 'إلغاء الحظر' : 'حظر'}
                            >
                              {user.isBanned ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length === 0 && (
                <p className="text-center text-gray-500 py-12">لا يوجد مستخدمين</p>
              )}
            </div>
          )}

          {/* Reports Management */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-right font-medium text-gray-500">السبب</th>
                      <th className="px-6 py-4 text-right font-medium text-gray-500">الإعلان</th>
                      <th className="px-6 py-4 text-right font-medium text-gray-500">المُبلغ</th>
                      <th className="px-6 py-4 text-right font-medium text-gray-500">الحالة</th>
                      <th className="px-6 py-4 text-right font-medium text-gray-500">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reports.map(report => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{report.reason}</td>
                        <td className="px-6 py-4 text-gray-600">{report.adTitle || 'بلاغ عام'}</td>
                        <td className="px-6 py-4 text-gray-600">{report.reporterName}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            report.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                            report.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {report.status === 'pending' ? 'معلق' : report.status === 'resolved' ? 'تم الحل' : 'مرفوض'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {report.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateReportStatus(report.id, 'resolved')}
                                className="p-2 hover:bg-green-100 rounded-lg text-green-500"
                                title="تم الحل"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateReportStatus(report.id, 'rejected')}
                                className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                                title="رفض"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reports.length === 0 && (
                <p className="text-center text-gray-500 py-12">لا توجد بلاغات</p>
              )}
            </div>
          )}

          {/* Sliders Management */}
          {activeTab === 'sliders' && (
            <div className="space-y-6">
              <button
                onClick={() => setShowModal('addSlider')}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                إضافة سلايدر جديد
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sliders.map(slider => (
                  <div key={slider.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <img src={slider.image} className="w-full h-48 object-cover" />
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{slider.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{slider.description}</p>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs ${slider.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {slider.isActive ? 'نشط' : 'معطل'}
                        </span>
                        <button
                          onClick={() => deleteSlider(slider.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {sliders.length === 0 && (
                <p className="text-center text-gray-500 py-12 bg-white rounded-2xl">لا توجد سلايدرات</p>
              )}
            </div>
          )}

          {/* Banners Management */}
          {activeTab === 'banners' && (
            <div className="space-y-6">
              <button
                onClick={() => setShowModal('addBanner')}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" />
                إضافة بانر جديد
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {banners.map(banner => (
                  <div key={banner.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <img src={banner.image} className="w-full h-32 object-cover" />
                    <div className="p-4">
                      <h3 className="font-bold mb-2">{banner.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">الموضع: {banner.position === 'top' ? 'أعلى' : banner.position === 'sidebar' ? 'جانبي' : 'أسفل'}</span>
                        <button
                          onClick={() => deleteBanner(banner.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {banners.length === 0 && (
                <p className="text-center text-gray-500 py-12 bg-white rounded-2xl">لا توجد بانرات</p>
              )}
            </div>
          )}

          {/* HTML Ads Management */}
          {activeTab === 'htmlAds' && (
            <div className="space-y-6">
              <button
                onClick={() => setShowModal('addHtmlAd')}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" />
                إضافة إعلان HTML
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {htmlAds.map(ad => (
                  <div key={ad.id} className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="font-bold mb-2">{ad.title}</h3>
                    <div className="bg-gray-100 p-4 rounded-xl mb-4 overflow-auto max-h-40">
                      <code className="text-sm text-gray-700">{ad.htmlCode}</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">الموضع: {ad.position}</span>
                      <button
                        onClick={() => deleteHtmlAd(ad.id)}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {htmlAds.length === 0 && (
                <p className="text-center text-gray-500 py-12 bg-white rounded-2xl">لا توجد إعلانات HTML</p>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <button
                onClick={() => setShowModal('sendNotification')}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
              >
                <Send className="w-5 h-5" />
                إرسال إشعار
              </button>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-lg mb-4">الإشعارات المُرسلة</h3>
                <p className="text-gray-500">سيتم عرض الإشعارات المرسلة هنا</p>
              </div>
            </div>
          )}

          {/* Messages */}
          {activeTab === 'messages' && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="font-bold text-lg mb-4">جميع الرسائل</h3>
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className="border rounded-xl p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{msg.senderName || 'مستخدم'}</span>
                        <span className="text-sm text-gray-500">
                          {msg.createdAt?.toDate?.()?.toLocaleDateString('ar-DZ') || ''}
                        </span>
                      </div>
                      <p className="text-gray-600">{msg.message}</p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <p className="text-center text-gray-500 py-8">لا توجد رسائل</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-xl mb-6">إعدادات الموقع</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">اسم الموقع</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">وصف الموقع</label>
                  <input
                    type="text"
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="text"
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">رابط فيسبوك</label>
                  <input
                    type="url"
                    value={settings.facebookUrl}
                    onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">رابط إنستغرام</label>
                  <input
                    type="url"
                    value={settings.instagramUrl}
                    onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">سعر التمييز (دج)</label>
                  <input
                    type="number"
                    value={settings.featuredPrice}
                    onChange={(e) => setSettings({ ...settings, featuredPrice: Number(e.target.value) })}
                    className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">الحد الأقصى لحجم الصورة (MB)</label>
                  <input
                    type="number"
                    value={settings.maxImageSize}
                    onChange={(e) => setSettings({ ...settings, maxImageSize: Number(e.target.value) })}
                    className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="w-5 h-5 rounded text-blue-600"
                  />
                  <span>وضع الصيانة</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowRegistration}
                    onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                    className="w-5 h-5 rounded text-blue-600"
                  />
                  <span>السماح بالتسجيل</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowAds}
                    onChange={(e) => setSettings({ ...settings, allowAds: e.target.checked })}
                    className="w-5 h-5 rounded text-blue-600"
                  />
                  <span>السماح بنشر الإعلانات</span>
                </label>
              </div>

              <button
                onClick={saveSettings}
                className="mt-6 flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Save className="w-5 h-5" />
                حفظ الإعدادات
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              {/* Close Button */}
              <button
                onClick={() => setShowModal(null)}
                className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Add Slider Modal */}
              {showModal === 'addSlider' && (
                <>
                  <h3 className="text-xl font-bold mb-6">إضافة سلايدر جديد</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">العنوان *</label>
                      <input
                        type="text"
                        value={sliderForm.title}
                        onChange={(e) => setSliderForm({ ...sliderForm, title: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3"
                        placeholder="أدخل عنوان السلايدر"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">الوصف</label>
                      <textarea
                        value={sliderForm.description}
                        onChange={(e) => setSliderForm({ ...sliderForm, description: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3 h-24 resize-none"
                        placeholder="أدخل وصف السلايدر"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">الصورة *</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, (url) => setSliderForm({ ...sliderForm, image: url }))}
                        className="w-full border rounded-xl px-4 py-3"
                      />
                      {sliderForm.image && (
                        <img src={sliderForm.image} className="mt-2 h-32 rounded-xl object-cover" />
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">الرابط</label>
                      <input
                        type="url"
                        value={sliderForm.link}
                        onChange={(e) => setSliderForm({ ...sliderForm, link: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={addSlider}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 font-medium"
                      >
                        إضافة
                      </button>
                      <button
                        onClick={() => setShowModal(null)}
                        className="flex-1 bg-gray-200 py-3 rounded-xl hover:bg-gray-300 font-medium"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Add Banner Modal */}
              {showModal === 'addBanner' && (
                <>
                  <h3 className="text-xl font-bold mb-6">إضافة بانر جديد</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">العنوان *</label>
                      <input
                        type="text"
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">الصورة *</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, (url) => setBannerForm({ ...bannerForm, image: url }))}
                        className="w-full border rounded-xl px-4 py-3"
                      />
                      {bannerForm.image && (
                        <img src={bannerForm.image} className="mt-2 h-32 rounded-xl object-cover" />
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">الموضع</label>
                      <select
                        value={bannerForm.position}
                        onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value as any })}
                        className="w-full border rounded-xl px-4 py-3"
                      >
                        <option value="top">أعلى</option>
                        <option value="sidebar">جانبي</option>
                        <option value="bottom">أسفل</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">الرابط</label>
                      <input
                        type="url"
                        value={bannerForm.link}
                        onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3"
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={addBanner}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
                      >
                        إضافة
                      </button>
                      <button
                        onClick={() => setShowModal(null)}
                        className="flex-1 bg-gray-200 py-3 rounded-xl hover:bg-gray-300"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Add HTML Ad Modal */}
              {showModal === 'addHtmlAd' && (
                <>
                  <h3 className="text-xl font-bold mb-6">إضافة إعلان HTML</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">العنوان *</label>
                      <input
                        type="text"
                        value={htmlAdForm.title}
                        onChange={(e) => setHtmlAdForm({ ...htmlAdForm, title: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">كود HTML *</label>
                      <textarea
                        value={htmlAdForm.htmlCode}
                        onChange={(e) => setHtmlAdForm({ ...htmlAdForm, htmlCode: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3 h-32 font-mono text-sm resize-none"
                        placeholder="<script>...</script>"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">الموضع</label>
                      <select
                        value={htmlAdForm.position}
                        onChange={(e) => setHtmlAdForm({ ...htmlAdForm, position: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3"
                      >
                        <option value="header">الهيدر</option>
                        <option value="sidebar">الشريط الجانبي</option>
                        <option value="footer">الفوتر</option>
                        <option value="between-ads">بين الإعلانات</option>
                      </select>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={addHtmlAd}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
                      >
                        إضافة
                      </button>
                      <button
                        onClick={() => setShowModal(null)}
                        className="flex-1 bg-gray-200 py-3 rounded-xl hover:bg-gray-300"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Send Notification Modal */}
              {showModal === 'sendNotification' && (
                <>
                  <h3 className="text-xl font-bold mb-6">إرسال إشعار</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">العنوان *</label>
                      <input
                        type="text"
                        value={notificationForm.title}
                        onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">الرسالة *</label>
                      <textarea
                        value={notificationForm.message}
                        onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3 h-24 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">إرسال إلى</label>
                      <select
                        value={notificationForm.type}
                        onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value as any })}
                        className="w-full border rounded-xl px-4 py-3"
                      >
                        <option value="all">جميع المستخدمين</option>
                        <option value="specific">مستخدم محدد</option>
                      </select>
                    </div>
                    {notificationForm.type === 'specific' && (
                      <div>
                        <label className="block text-gray-700 mb-2">اختر المستخدم</label>
                        <select
                          value={notificationForm.targetUserId}
                          onChange={(e) => setNotificationForm({ ...notificationForm, targetUserId: e.target.value })}
                          className="w-full border rounded-xl px-4 py-3"
                        >
                          <option value="">اختر مستخدم</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name} - {user.email}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={sendNotification}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
                      >
                        إرسال
                      </button>
                      <button
                        onClick={() => setShowModal(null)}
                        className="flex-1 bg-gray-200 py-3 rounded-xl hover:bg-gray-300"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Edit Ad Modal */}
              {showModal === 'editAd' && editingAd && (
                <>
                  <h3 className="text-xl font-bold mb-6">تعديل الإعلان</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">العنوان</label>
                      <input
                        type="text"
                        value={editingAd.title}
                        onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">الوصف</label>
                      <textarea
                        value={editingAd.description}
                        onChange={(e) => setEditingAd({ ...editingAd, description: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3 h-24 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">السعر</label>
                      <input
                        type="number"
                        value={editingAd.price}
                        onChange={(e) => setEditingAd({ ...editingAd, price: Number(e.target.value) })}
                        className="w-full border rounded-xl px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">الفئة</label>
                      <select
                        value={editingAd.category}
                        onChange={(e) => setEditingAd({ ...editingAd, category: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">الهاتف</label>
                      <input
                        type="text"
                        value={editingAd.phone}
                        onChange={(e) => setEditingAd({ ...editingAd, phone: e.target.value })}
                        className="w-full border rounded-xl px-4 py-3"
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={updateAd}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
                      >
                        حفظ التعديلات
                      </button>
                      <button
                        onClick={() => { setShowModal(null); setEditingAd(null); }}
                        className="flex-1 bg-gray-200 py-3 rounded-xl hover:bg-gray-300"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
