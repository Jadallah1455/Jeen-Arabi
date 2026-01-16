import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { SEO } from '../components/SEO';
import { User, Mail, Lock, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RegisterProps {
    lang: Language;
}

export const Register: React.FC<RegisterProps> = ({ lang }) => {
    const t = TRANSLATIONS[lang].register;
    const { login: authLogin } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        // Password complexity validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            toast.error(lang === 'ar'
                ? 'يجب أن تكون كلمة المرور 8 أحرف على الأقل، وتحتوي على حرف كبير، حرف صغير، رقم، ورمز خاص'
                : 'Password must be at least 8 characters, with upper, lower, number, and special character');
            setIsSubmitting(false); // Ensure submitting state is reset if validation fails
            return;
        }

        try {
            const res = await api.post('/auth/register', { username, email, password });
            authLogin(res.data.token, res.data);
            toast.success(t.success);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error creating account');
            toast.error(lang === 'ar' ? 'حدث خطأ أثناء التسجيل' : 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8">
            <SEO
                title={t.title}
                description={t.subtitle}
                lang={lang}
            />

            <div className="max-w-md w-full space-y-8 bg-white dark:bg-dark-card p-10 rounded-[32px] shadow-2xl border border-gray-100 dark:border-gray-800 animate-slide-up relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>

                <div className="text-center relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
                        <UserPlus className="text-white" size={40} />
                    </div>
                    <h2 className={`text-3xl font-black text-gray-900 dark:text-white`}>
                        {t.title}
                    </h2>
                    <p className="mt-3 text-gray-500 dark:text-gray-400 font-medium">
                        {t.subtitle}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    <div className="space-y-1">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                            {t.username}
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder={lang === 'ar' ? 'مثال: محمد' : 'e.g. jameel'}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                            {t.email}
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="email@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                            {t.password}
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-12 pr-12 py-3.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm font-bold text-center bg-red-50 dark:bg-red-900/20 py-3 rounded-xl border border-red-100 dark:border-red-900/30">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-xl text-lg font-black text-white bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 focus:ring-4 focus:ring-primary/20 transition-all transform hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0"
                    >
                        {isSubmitting ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <UserPlus size={20} />
                                {t.btn}
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-800 pt-6 relative z-10">
                    <p className="text-gray-500 dark:text-gray-400 font-medium tracking-tight">
                        {t.alreadyHave}
                        <Link
                            to="/login"
                            className="ml-2 rtl:mr-2 text-primary font-bold hover:underline"
                        >
                            {t.login}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
