
// admin/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCDGo_P0fJ1j1HrZ1hpi9Uyd3nWnIBk6Bw",
  authDomain: "live-tracking-gps-technoweb.firebaseapp.com",
  databaseURL: "https://live-tracking-gps-technoweb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "live-tracking-gps-technoweb",
  storageBucket: "live-tracking-gps-technoweb.appspot.com",
  messagingSenderId: "26999020261",
  appId: "1:26999020261:web:5295385342531fbe70520c"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);

// ✅ Ici on exporte bien ADMIN_EMAIL
export const ADMIN_EMAIL = "davidkaziama1@gmail.com";




