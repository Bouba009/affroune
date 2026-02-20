import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// تم إصلاح مصفوفة الفئات وإضافة صور حقيقية دقيقة
const categories =;

// عناصر DOM
const loginModal = document.getElementById('login-modal');
const addAdModal = document.getElementById('add-ad-modal');
const headerLoginBtn = document.getElementById('header-login-btn');
const fabAdd = document.getElementById('fab-add');
const loginForm = document.getElementById('login-form');
const btnRegister = document.getElementById('btn-register-submit');
const addAdForm = document.getElementById('add-ad-form');

// دالة مبدئية لعرض الفئات
function renderCategories() {
    const list = document.getElementById('categories-list');
    const select = document.getElementById('ad-category');
    list.innerHTML = '';
    select.innerHTML = '<option value="">اختر الفئة...</option>';

    categories.forEach(cat => {
        list.innerHTML += `
            <div class="cat-item">
                <div class="cat-circle" style="background-image: url('${cat.img}');"></div>
                <span style="font-size:14px; font-weight:700;">${cat.nameAr}</span>
            </div>
        `;
        select.innerHTML += `<option value="${cat.id}">${cat.nameAr}</option>`;
    });
}
renderCategories();

// --- نظام الدخول والنشر المصلح (لا يوجد تحديث للصفحة) ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        headerLoginBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> خروج`;
        document.getElementById('messages-icon').style.display = 'inline-block';
    } else {
        currentUser = null;
        headerLoginBtn.innerHTML = `<i class="fas fa-user"></i> تسجيل الدخول`;
        document.getElementById('messages-icon').style.display = 'none';
    }
});

// زر الهيدر
headerLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if(currentUser) { signOut(auth); }
    else { loginModal.style.display = 'flex'; }
});

// زر النشر العائم FAB (يمنع النشر بدون دخول)
fabAdd.addEventListener('click', (e) => {
    e.preventDefault(); // منع أي تصرف افتراضي
    if (!currentUser) {
        alert("عذراً، يجب عليك تسجيل الدخول أولاً لتتمكن من نشر إعلان.");
        loginModal.style.display = 'flex';
    } else {
        addAdModal.style.display = 'flex';
    }
});

// إرسال نموذج الدخول
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // الحل الجذري لمشكلة تحديث الصفحة
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        loginModal.style.display = 'none';
        loginForm.reset();
        alert("تم تسجيل الدخول بنجاح!");
    } catch (error) {
        alert("خطأ في تسجيل الدخول. تأكد من البيانات.");
    }
});

// إرسال طلب إنشاء حساب جديد
btnRegister.addEventListener('click', async (e) => {
    e.preventDefault(); // يمنع زر الحساب الجديد من عمل Submit للـ Form
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    if(!email || !pass) return alert("يرجى إدخال البريد وكلمة المرور");
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        loginModal.style.display = 'none';
        loginForm.reset();
        alert("تم إنشاء الحساب بنجاح!");
    } catch (error) {
        alert("حدث خطأ أثناء إنشاء الحساب. قد يكون الإيميل مستخدماً أو كلمة المرور ضعيفة.");
    }
});

// إرسال الإعلان لفايربيز
addAdForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // يمنع تحديث الصفحة عند النشر
    if(!currentUser) return; // تحقق أمني إضافي

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
        alert("تم نشر الإعلان بنجاح وسيظهر للجميع فوراً!");
        addAdModal.style.display = 'none';
        addAdForm.reset();
    } catch (error) {
        console.error("Error: ", error);
        alert("حدث خطأ أثناء نشر الإعلان");
    }
});

// --- قفل الأدمن المخفي ---
const adminSecret = document.getElementById('admin-secret-login');
adminSecret.addEventListener('click', () => {
    const user = prompt("Username:");
    const pass = prompt("Password:");
    if (user === "admin" && pass === "abobob123") {
        document.getElementById('main-app').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
    } else {
        alert("Accès Refusé");
    }
});

document.getElementById('admin-logout').addEventListener('click', () => {
    document.getElementById('main-app').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
});

// إغلاق النوافذ
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});
