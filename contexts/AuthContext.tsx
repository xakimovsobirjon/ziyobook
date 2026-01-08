import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuth, getAdminData, signIn, signOut, AdminData } from '../services/auth';

interface AuthContextType {
    user: User | null;
    adminData: AdminData | null;
    storeId: string | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [adminData, setAdminData] = useState<AdminData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToAuth(async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Fetch admin data
                const data = await getAdminData(firebaseUser.uid);
                setAdminData(data);
            } else {
                setAdminData(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        setError(null);
        setLoading(true);

        try {
            const firebaseUser = await signIn(email, password);
            const data = await getAdminData(firebaseUser.uid);

            if (!data) {
                setError('Admin ma\'lumotlari topilmadi');
                await signOut();
                setLoading(false);
                return false;
            }

            setAdminData(data);
            setLoading(false);
            return true;
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.code === 'auth/invalid-credential') {
                setError('Email yoki parol noto\'g\'ri');
            } else if (err.code === 'auth/user-not-found') {
                setError('Bunday foydalanuvchi topilmadi');
            } else if (err.code === 'auth/wrong-password') {
                setError('Parol noto\'g\'ri');
            } else {
                setError('Tizimga kirishda xatolik yuz berdi');
            }
            setLoading(false);
            return false;
        }
    };

    const logout = async () => {
        await signOut();
        setUser(null);
        setAdminData(null);
    };

    const storeId = adminData?.storeId || null;

    return (
        <AuthContext.Provider value={{
            user,
            adminData,
            storeId,
            loading,
            error,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};
