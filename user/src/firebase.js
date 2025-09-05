// user/src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

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
