import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBeyqML5BAzxtxa_ugm4aXmUl89U9re6RY",
  authDomain: "edubridge-ai-2cbeb.firebaseapp.com",
  projectId: "edubridge-ai-2cbeb",
  storageBucket: "edubridge-ai-2cbeb.firebasestorage.app",
  messagingSenderId: "526806493940",
  appId: "1:526806493940:web:1622e3377508dd466c0ca1"
};

const isConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "dummy_key";

export const app = isConfigured && getApps().length === 0 ? initializeApp(firebaseConfig) : (isConfigured ? getApps()[0] : null);
export const db = isConfigured && app ? getFirestore(app) : null;
export const auth = isConfigured && app ? getAuth(app) : null;
