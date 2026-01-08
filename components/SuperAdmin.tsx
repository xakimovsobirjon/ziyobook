import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Users, Store, Loader2, AlertCircle, Check, Lock, Mail, RefreshCw } from 'lucide-react';
import { createAdmin, getAllAdmins, deleteAdmin, AdminData } from '../services/auth';

interface Props {
    onClose?: () => void;
}

const SuperAdmin: React.FC<Props> = ({ onClose }) => {
    const [admins, setAdmins] = useState<AdminData[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [storeName, setStoreName] = useState('');

    const loadAdmins = async () => {
        setLoading(true);
        try {
            const data = await getAllAdmins();
            setAdmins(data);
        } catch (err) {
            console.error('Error loading admins:', err);
            setError('Adminlarni yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAdmins();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setCreating(true);

        try {
            await createAdmin(email, password, storeName);
            setSuccess(`"${storeName}" do'koni uchun admin yaratildi!`);
            setEmail('');
            setPassword('');
            setStoreName('');
            setShowForm(false);
            await loadAdmins();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Error creating admin:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Bu email allaqachon ishlatilgan');
            } else if (err.code === 'auth/weak-password') {
                setError('Parol kamida 6 ta belgi bo\'lishi kerak');
            } else {
                setError('Admin yaratishda xatolik yuz berdi');
            }
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (admin: AdminData) => {
        if (!confirm(`"${admin.storeName}" adminini o'chirmoqchimisiz?`)) return;

        try {
            await deleteAdmin(admin.uid);
            setSuccess('Admin o\'chirildi');
            await loadAdmins();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error deleting admin:', err);
            setError('Admin o\'chirishda xatolik');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Super Admin Panel</h1>
                            <p className="text-slate-400 text-sm">Do'konlar va adminlarni boshqarish</p>
                        </div>
                    </div>
                    <button
                        onClick={loadAdmins}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Yangilash"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {/* Success Toast */}
                {success && (
                    <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                        <Check className="w-5 h-5 text-emerald-400" />
                        <p className="text-emerald-300">{success}</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <p className="text-red-300">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">✕</button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                <Store className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">{admins.length}</p>
                                <p className="text-slate-400 text-sm">Do'konlar</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">{admins.filter(a => !a.isSuperAdmin).length}</p>
                                <p className="text-slate-400 text-sm">Adminlar</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Button */}
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full mb-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Yangi Admin Qo'shish
                    </button>
                )}

                {/* Create Form */}
                {showForm && (
                    <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Yangi Admin Yaratish</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Do'kon Nomi</label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        value={storeName}
                                        onChange={e => setStoreName(e.target.value)}
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Masalan: ZiyoBook Chilonzor"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Parol</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Kamida 6 ta belgi"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setError(null); }}
                                    className="flex-1 py-3 text-slate-400 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Yaratilmoqda...
                                        </>
                                    ) : (
                                        'Yaratish'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Admins List */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700">
                        <h3 className="font-bold text-white">Ro'yxatdagi Adminlar</h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="w-8 h-8 text-slate-500 animate-spin mx-auto" />
                        </div>
                    ) : admins.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            Hozircha admin yo'q
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-700">
                            {admins.map(admin => (
                                <div key={admin.uid} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                            {admin.storeName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{admin.storeName}</p>
                                            <p className="text-sm text-slate-400">{admin.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {admin.isSuperAdmin && (
                                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg">Super</span>
                                        )}
                                        <button
                                            onClick={() => handleDelete(admin)}
                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="O'chirish"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdmin;
