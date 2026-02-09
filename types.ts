// Types and Interfaces - الأنواع والواجهات

// User type - نوع المستخدم
export interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  createdAt: Date;
}

// Ad/Listing type - نوع الإعلان
export interface Ad {
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
  isAdminAd: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
}

// Admin Banner Ad type - نوع إعلان البانر
export interface AdminAd {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
  position: 'top' | 'sidebar';
  createdAt: Date;
}

// Message type - نوع الرسالة
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  adId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

// Chat type - نوع الدردشة
export interface Chat {
  id: string;
  participants: string[];
  adId: string;
  adTitle: string;
  lastMessage: string;
  lastMessageAt: Date;
}

// Categories - الفئات
export const CATEGORIES = [
  { id: 'cars', name: 'سيارات و مركبات', nameFr: 'Voitures et véhicules' },
  { id: 'real-estate', name: 'عقارات', nameFr: 'Immobilier' },
  { id: 'electronics', name: 'هواتف و إلكترونيات', nameFr: 'Téléphones et électronique' },
  { id: 'jobs', name: 'وظائف', nameFr: 'Emplois' },
  { id: 'services', name: 'خدمات', nameFr: 'Services' },
  { id: 'appliances', name: 'أجهزة كهرومنزلية', nameFr: 'Électroménager' },
  { id: 'fashion', name: 'ألبسة و موضة', nameFr: 'Vêtements et mode' },
  { id: 'equipment', name: 'معدات مهنية', nameFr: 'Équipement professionnel' },
  { id: 'other', name: 'أخرى', nameFr: 'Autres' }
];

// Cities - المدن
export const CITIES = [
  { id: 'el-affroun', name: 'العفرون', nameFr: 'El Affroun' },
  { id: 'mouzaia', name: 'موزاية', nameFr: 'Mouzaïa' },
  { id: 'chiffa', name: 'شفة', nameFr: 'Chiffa' },
  { id: 'oued-jer', name: 'واد جر', nameFr: 'Oued Djer' },
  { id: 'ahmer-el-ain', name: 'أحمر العين', nameFr: 'Ahmer El Aïn' },
  { id: 'hattatba', name: 'حطاطبة', nameFr: 'Hattatba' }
];

// Language type - نوع اللغة
export type Language = 'ar' | 'fr';
