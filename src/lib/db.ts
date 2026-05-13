import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export const getUserId = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("edu_user_id") || "anonymous";
  }
  return "anonymous";
};

export const saveData = async (key: string, data: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
  }
  if (db) {
    try {
      const uid = getUserId();
      await setDoc(doc(db, "users", uid), { [key]: data }, { merge: true });
    } catch (error) {
      console.error(`Firebase save error for ${key}:`, error);
    }
  }
};

export const loadData = async (key: string) => {
  if (db) {
    try {
      const uid = getUserId();
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists() && docSnap.data()[key] !== undefined) {
        const firestoreData = docSnap.data()[key];
        if (typeof window !== "undefined") {
          localStorage.setItem(key, typeof firestoreData === 'string' ? firestoreData : JSON.stringify(firestoreData));
        }
        return firestoreData;
      }
    } catch (error) {
      console.error(`Firebase load error for ${key}:`, error);
    }
  }

  if (typeof window !== "undefined") {
    const local = localStorage.getItem(key);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        return local;
      }
    }
  }
  return null;
};

export const removeData = async (key: string) => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(key);
  }
};
