import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
const firebaseConfig = {
    apiKey: "AIzaSyDabEoYFj360pxiS9dQznYi67CtjITEilQ",
    authDomain: "student-expense-tracker-d2b81.firebaseapp.com",
    projectId: "student-expense-tracker-d2b81",
    storageBucket: "student-expense-tracker-d2b81.firebasestorage.app",
    messagingSenderId: "580640921296",
    appId: "1:580640921296:web:25946bb03ff13c48b530d5"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
