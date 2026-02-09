// Firebase Configuration - تهيئة Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Firebase configuration object - إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAaXp-gUOQ_G2s-kM8JhaqW8TJcJ4Nqcuo",
  authDomain: "comondi-fae4b.firebaseapp.com",
  projectId: "comondi-fae4b",
  storageBucket: "comondi-fae4b.firebasestorage.app",
  messagingSenderId: "932777870241",
  appId: "1:932777870241:web:78b0cf3a3cf14046be01e0",
  measurementId: "G-M09RX0V18S"
};

// Initialize Firebase - تهيئة Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore - تهيئة قاعدة البيانات
export const db = getFirestore(app);

// Initialize Storage - تهيئة التخزين
export const storage = getStorage(app);

// Initialize Auth - تهيئة المصادقة
export const auth = getAuth(app);

export default app;
