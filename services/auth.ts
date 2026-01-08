import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Admin data interface
export interface AdminData {
    uid: string;
    email: string;
    storeId: string;
    storeName: string;
    isSuperAdmin?: boolean;
    createdAt: string;
}

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<User> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
};

// Sign out
export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
};

// Get admin data from Firestore
export const getAdminData = async (uid: string): Promise<AdminData | null> => {
    try {
        const docRef = doc(db, 'admins', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as AdminData;
        }
        return null;
    } catch (error) {
        console.error('Error getting admin data:', error);
        return null;
    }
};

// Create new admin (for super admin only)
export const createAdmin = async (
    email: string,
    password: string,
    storeName: string
): Promise<AdminData> => {
    // Create auth user
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const uid = result.user.uid;

    // Generate unique store ID
    const storeId = `store_${uid}`;

    // Create admin document
    const adminData: AdminData = {
        uid,
        email,
        storeId,
        storeName,
        isSuperAdmin: false,
        createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'admins', uid), adminData);

    // Initialize empty store data
    const { INITIAL_STORE_DATA } = await import('./storage');
    await setDoc(doc(db, 'stores', storeId, 'data', 'main'), INITIAL_STORE_DATA);

    console.log('✅ Admin created:', email, 'Store:', storeId);
    return adminData;
};

// Get all admins (for super admin panel)
export const getAllAdmins = async (): Promise<AdminData[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'admins'));
        const admins: AdminData[] = [];
        querySnapshot.forEach((doc) => {
            admins.push(doc.data() as AdminData);
        });
        return admins;
    } catch (error) {
        console.error('Error getting all admins:', error);
        return [];
    }
};

// Delete admin (for super admin only)
export const deleteAdmin = async (uid: string): Promise<void> => {
    // Note: This only deletes the admin document, not the auth user
    // Firebase Admin SDK is needed to delete auth users
    await deleteDoc(doc(db, 'admins', uid));
};

// Subscribe to auth state changes
export const subscribeToAuth = (callback: (user: User | null) => void): (() => void) => {
    return onAuthStateChanged(auth, callback);
};
