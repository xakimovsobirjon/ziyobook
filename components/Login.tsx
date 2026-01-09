import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Loader2, Mail, Lock, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
    const { login, loading, error } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');

        if (!email || !password) {
            setLocalError('Email va parolni kiriting');
            return;
        }

        await login(email, password);
    };

    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [resetMessage, setResetMessage] = useState('');

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetEmail) return;

        setResetStatus('loading');
        setResetMessage('');

        try {
            const { resetUserPassword } = await import('../services/auth');
            await resetUserPassword(resetEmail);
            setResetStatus('success');
            setResetMessage('Parolni tiklash havolasi emailingizga yuborildi. Iltimos pochta qutingizni tekshiring (Spam papkasini ham).');
            setResetEmail('');
        } catch (err: any) {
            console.error('Reset password error:', err);
            setResetStatus('error');
            if (err.code === 'auth/user-not-found') {
                setResetMessage('Bunday email manzil ro\'yxatdan o\'tmagan');
            } else if (err.code === 'auth/invalid-email') {
                setResetMessage('Email manzil noto\'g\'ri formatda');
            } else {
                setResetMessage('Xatolik yuz berdi: ' + err.message);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <BookOpen className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">ZiyoBook</h1>
                    <p className="text-slate-500 text-sm mt-1">Kitob Do'koni Tizimi</p>
                </div>

                {/* Error Message */}
                {(error || localError) && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-red-700 text-sm">{error || localError}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                placeholder="admin@example.com"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-slate-700">
                                Parol
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowResetModal(true)}
                                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Parolni unutdingizmi?
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Yuklanmoqda...
                            </>
                        ) : (
                            'Kirish'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-slate-400 text-xs mt-8">
                    © 2026 ZiyoBook. Barcha huquqlar himoyalangan.
                </p>

                {/* Reset Password Modal */}
                {showResetModal && (
                    <div className="absolute inset-0 z-20 bg-white rounded-2xl p-8 flex flex-col animate-in fade-in duration-200">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Parolni tiklash</h2>
                            <p className="text-slate-500 text-sm mt-1">Email manzilingizni kiriting</p>
                        </div>

                        {resetStatus === 'success' ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-4">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                    <Mail className="w-8 h-8 text-emerald-600" />
                                </div>
                                <p className="text-emerald-700 text-center mb-6 text-sm">{resetMessage}</p>
                                <button
                                    onClick={() => { setShowResetModal(false); setResetStatus('idle'); }}
                                    className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-all"
                                >
                                    Login sahifasiga qaytish
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                {resetStatus === 'error' && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                                        {resetMessage}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="admin@example.com"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={resetStatus === 'loading'}
                                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center"
                                >
                                    {resetStatus === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yuborish'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowResetModal(false)}
                                    className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-medium hover:bg-slate-200 transition-all"
                                >
                                    Bekor qilish
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
