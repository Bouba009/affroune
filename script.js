// Import Firebase using CDN for pure JS setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration (من طلبك)
const firebaseConfig = {
  apiKey: "AIzaSyDXdDA6rH50zAv5pmZKRkXnqosoFnC3GjY",
  authDomain: "filahadz-31183.firebaseapp.com",
  databaseURL: "https://filahadz-31183-default-rtdb.firebaseio.com",
  projectId: "filahadz-31183",
  storageBucket: "filahadz-31183.firebasestorage.app",
  messagingSenderId: "703541527613",
  appId: "1:703541527613:web:7d3af803ba09c894d4d654",
  measurementId: "G-BQC5Q4Q16M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- State Management ---
let currentUser = null;
let currentLang = localStorage.getItem('lang') || 'ar';

// --- Data ---
const categories =;

const dictionaries = {
    ar: {
        login: "تسجيل الدخول", logout: "خروج", home: "الرئيسية", privacy: "سياسة الخصوصية",
        about: "من نحن", contact: "اتصل بنا", report: "إبلاغ عن مشكلة", publish_ad: "نشر إعلان جديد",
        publish: "نشر", all_ads: "جميع الإعلانات", featured_ads: "إعلانات مميزة"
    },
    fr: {
        login: "Connexion", logout: "Déconnexion", home: "Accueil", privacy: "Confidentialité",
        about: "À propos", contact: "Contact", report: "Signaler un problème", publish_ad: "Publier une annonce",
        publish: "Publier", all_ads: "Toutes les annonces", featured_ads: "Annonces à la une"
    }
};

// --- DOM Elements ---
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('close-sidebar');
const langToggle = document.getElementById('lang-toggle');
const categoriesList = document.getElementById('categories-list');
const loginBtn = document.getElementById('header-login-btn');
const loginModal = document.getElementById('login-modal');
const addAdModal = document.getElementById('add-ad-modal');
const fabAdd = document.getElementById('fab-add');
const messagesIcon = document.getElementById('messages-icon');

// --- Initialization ---
function init() {
    renderCategories();
    applyLanguage(currentLang);
    fetchAds();
}

// --- UI Interactions ---
menuBtn.addEventListener('click', () => sidebar.classList.add('active'));
closeSidebar.addEventListener('click', () => sidebar.classList.remove('active'));

// إغلاق المودال
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}

// --- Language Toggle ---
langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'ar' ? 'fr' : 'ar';
    localStorage.setItem('lang', currentLang);
    applyLanguage(currentLang);
});

function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    langToggle.innerText = lang === 'ar' ? 'FR' : 'AR';
    
    document.querySelectorAll('').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionaries) {
            // Check if it has icons inside to preserve them
            if(el.querySelector('i')){
                const icon = el.querySelector('i').outerHTML;
                el.innerHTML = icon + ' ' + dictionaries;
            } else {
                el.innerText = dictionaries;
            }
        }
    });
    renderCategories(); // إعادة رسم الفئات باللغة الجديدة
}

// --- Render Categories ---
function renderCategories() {
    categoriesList.innerHTML = '';
    const selectCat = document.getElementById('ad-category');
    if(selectCat) selectCat.innerHTML = '<option value="">اختر الفئة...</option>';

    categories.forEach(cat => {
        const name = currentLang === 'ar' ? cat.nameAr : cat.nameFr;
        
        // للواجهة
        categoriesList.innerHTML += `
            <div class="cat-item">
                <div class="cat-circle" style="background-image: url('${cat.img}?auto=format&fit=crop&w=150&q=80');"></div>
                <span style="font-size:12px; font-weight:bold;">${name}</span>
            </div>
        `;
        
        // لقائمة إضافة الإعلان
        if(selectCat) selectCat.innerHTML += `<option value="${cat.id}">${name}</option>`;
    });
}

// --- Auth State ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loginBtn.innerText = dictionaries.logout;
        messagesIcon.style.display = 'inline-block';
    } else {
        currentUser = null;
        loginBtn.innerText = dictionaries.login;
        messagesIcon.style.display = 'none';
    }
});

// زر الدخول في الهيدر
loginBtn.addEventListener('click', () => {
    if(currentUser) {
        signOut(auth);
    } else {
        loginModal.style.display = 'flex';
    }
});

// --- FAB زر النشر ---
fabAdd.addEventListener('click', () => {
    if (currentUser) {
        addAdModal.style.display = 'flex';
    } else {
        alert("يرجى تسجيل الدخول أولاً لنشر إعلان.");
        loginModal.style.display = 'flex';
    }
});

// --- إضافة إعلان في Firebase ---
document.getElementById('add-ad-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('ad-title').value;
    const desc = document.getElementById('ad-desc').value;
    const price = document.getElementById('ad-price').value;
    const category = document.getElementById('ad-category').value;
    const condition = document.getElementById('ad-condition').value;
    const city = document.getElementById('ad-city').value;

    try {
        await addDoc(collection(db, "ads"), {
            title, desc, price, category, condition, city,
            userId: currentUser.uid,
            isFeatured: false,
            createdAt: new Date()
        });
        alert("تم نشر الإعلان بنجاح!");
        addAdModal.style.display = 'none';
        document.getElementById('add-ad-form').reset();
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("حدث خطأ أثناء النشر");
    }
});

// --- جلب وعرض الإعلانات (Realtime) ---
function fetchAds() {
    const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const allAdsContainer = document.getElementById('all-ads');
        const featuredAdsContainer = document.getElementById('featured-ads');
        
        allAdsContainer.innerHTML = '';
        featuredAdsContainer.innerHTML = '';

        snapshot.forEach((doc) => {
            const ad = doc.data();
            const adHtml = `
                <div class="ad-card ${ad.isFeatured ? 'featured' : ''}" onclick="openAdDetails('${doc.id}')">
                    <img src="https://via.placeholder.com/300x200?text=صورة+المنتج" alt="Product">
                    <div class="ad-info">
                        <h3>${ad.title}</h3>
                        <p class="ad-price">${ad.price} د.ج</p>
                        <p style="font-size:12px; color:#7f8c8d;"><i class="fas fa-map-marker-alt"></i> ${ad.city}</p>
                    </div>
                </div>
            `;
            
            if(ad.isFeatured) {
                featuredAdsContainer.innerHTML += adHtml;
            } else {
                allAdsContainer.innerHTML += adHtml;
            }
        });
    });
}

window.openAdDetails = (id) => {
    // في مشروع حقيقي يتم فتح نافذة جديدة أو Modal بكامل الشاشة
    // هنا سنطلب تسجيل الدخول لرؤية الرقم
    if(!currentUser) {
        alert("الرجاء تسجيل الدخول لرؤية التفاصيل ومراسلة البائع");
        loginModal.style.display = 'flex';
        return;
    }
    alert("فتح تفاصيل الإعلان ID: " + id + "\n(هنا تظهر أزرار الاتصال والرسائل)");
};


// --- نظام الأدمن السري ---
const adminSecret = document.getElementById('admin-secret-login');
adminSecret.addEventListener('click', () => {
    const user = prompt("Username:");
    const pass = prompt("Password:");
    
    if (user === "admin" && pass === "abobob123") {
        document.getElementById('main-app').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
    } else {
        alert("Wrong credentials");
    }
});

document.getElementById('admin-logout').addEventListener('click', () => {
    document.getElementById('main-app').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
});

// Run
init();
