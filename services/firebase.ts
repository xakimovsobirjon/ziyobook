import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyABaMf0AKXauwcnLirZTbHAo7t-CvGjdc0",
    authDomain: "ziyobook-1.firebaseapp.com",
    projectId: "ziyobook-1",
    storageBucket: "ziyobook-1.firebasestorage.app",
    messagingSenderId: "723537438886",
    appId: "1:723537438886:web:8c9204f9d8cbd817feec67",
    measurementId: "G-2V6GY8BLL4"
};

console.log('🔥 Firebase Config loaded for project:', firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('✅ Firebase app initialized');

// Initialize Firestore
export const db = getFirestore(app);
console.log('✅ Firestore initialized');

// Initialize Storage
export const storage = getStorage(app);
console.log('✅ Storage initialized');

export default app;
