import React, { useState } from 'react';
import { User, Lock, Store, LogOut, Save, Check, AlertCircle, Loader2 } from 'lucide-react';
import { AdminData, updateAdminStoreName, updateUserPassword, reauthenticateUser } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

interface SettingsProps {
    adminData: AdminData | null;
    onUpdateProfile: (newName: string) => Promise<void>;
    onLogout: () => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ adminData, onUpdateProfile, onLogout }) => {
    const { user } = useAuth();

    // Profile State
    const [storeName, setStoreName] = useState(adminData?.storeName || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [profileError, setProfileError] = useState('');

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !storeName.trim()) return;

        try {
            setIsUpdatingProfile(true);
            setProfileError('');
            setProfileSuccess(false);

            await onUpdateProfile(storeName);

            setProfileSuccess(true);
            setTimeout(() => setProfileSuccess(false), 3000);
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setProfileError('Do\'kon nomini yangilashda xatolik yuz berdi');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!currentPassword) {
            setPasswordError('Iltimos, eski parolni kiriting');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Yangi parollar mos kelmadi');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
            return;
        }

        try {
            setIsUpdatingPassword(true);
            setPasswordError('');
            setPasswordSuccess(false);

            // Re-authenticate first
            await reauthenticateUser(user, currentPassword);

            // Then update password
            await updateUserPassword(user, newPassword);

            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (err: any) {
            console.error('Error updating password:', err);
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setPasswordError('Eski parol noto\'g\'ri');
            } else if (err.code === 'auth/requires-recent-login') {
                setPasswordError('Xavfsizlik uchun qaytadan tizimga kiring va urinib ko\'ring');
            } else {
                setPasswordError('Parolni yangilashda xatolik: ' + err.message);
            }
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800">Sozlamalar</h2>

            {/* Account Profile Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Store className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Do'kon Ma'lumotlari</h3>
                            <p className="text-sm text-slate-500">Do'kon nomi va hisob ma'lumotlari</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Email
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={adminData?.email || ''}
                                    disabled
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                                />
                                <User className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Email manzilini o'zgartirib bo'lmaydi</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Do'kon Nomi
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Do'kon nomini kiriting"
                                />
                                <Store className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                            </div>
                        </div>

                        {profileError && (
                            <div className="text-red-600 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {profileError}
                            </div>
                        )}

                        {profileSuccess && (
                            <div className="text-emerald-600 text-sm flex items-center gap-2">
                                <Check className="w-4 h-4" /> Muvaffaqiyatli saqlandi
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isUpdatingProfile || storeName === adminData?.storeName}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Saqlash
                        </button>
                    </form>
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Xavfsizlik</h3>
                            <p className="text-sm text-slate-500">Parolni o'zgartirish</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Eski Parol
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Eski parolni kiriting"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Yangi Parol
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Yangi parolni kiriting"
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Parolni Tasdiqlash
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Yangi parolni qayta kiriting"
                                minLength={6}
                            />
                        </div>

                        {passwordError && (
                            <div className="text-red-600 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {passwordError}
                            </div>
                        )}

                        {passwordSuccess && (
                            <div className="text-emerald-600 text-sm flex items-center gap-2">
                                <Check className="w-4 h-4" /> Parol muvaffaqiyatli yangilandi
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                            Parolni Yangilash
                        </button>
                    </form>
                </div>
            </div>

            {/* Logout Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-red-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-700">Tizimdan Chiqish</h3>
                            <p className="text-sm text-red-500">Sessiyani yakunlash</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <p className="text-slate-600 mb-4">
                        Tizimdan chiqmoqchimisiz? Saqlanmagan ma'lumotlar yo'qolishi mumkin.
                    </p>
                    <button
                        onClick={onLogout}
                        className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Tizimdan Chiqish
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
