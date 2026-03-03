// src/firebase/config.js
// ============================================================
// IMPORTANT: Replace ALL placeholder values below with your
// actual Firebase project credentials from:
// https://console.firebase.google.com → Project Settings → Your Apps
// ============================================================
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyBTzfgL8X8UBeKTDRzA72C6hO2mC1O-p5Q",
    authDomain: "real-time-bidding-site.firebaseapp.com",
    projectId: "real-time-bidding-site",
    storageBucket: "real-time-bidding-site.firebasestorage.app",
    messagingSenderId: "589243546973",
    appId: "1:589243546973:web:2ad42676d41669d673bcb4",
    measurementId: "G-BSR6WEPLB6"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

export default app;
