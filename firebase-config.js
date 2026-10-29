// ============================================================
// Brodshoes – Firebase configuratie
// ============================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyCyUsr49L2MOouvbbwLl1AArVnY6LzbimI",
  authDomain: "brodshoes-bestellen.firebaseapp.com",
  projectId: "brodshoes-bestellen",
  storageBucket: "brodshoes-bestellen.firebasestorage.app",
  messagingSenderId: "39294366674",
  appId: "1:39294366674:web:bfd8259cba703d80158e0b"
};

const app = initializeApp(firebaseConfig);

export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);
