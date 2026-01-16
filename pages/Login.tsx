import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { SEO } from '../components/SEO';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

interface LoginProps {
  lang: Language;
}

export const Login: React.FC<LoginProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang].admin;
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email: username, password });
      authLogin(res.data.token, res.data);

      if (res.data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }

      toast.success(lang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
      toast.error(lang === 'ar' ? 'فشل تسجيل الدخول' : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8">
      <SEO
        title={t.loginTitle}
        description={TRANSLATIONS[lang].seo.login.description}
        keywords={TRANSLATIONS[lang].seo.login.keywords}
        lang={lang}
      />
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-dark-card p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Lock className="text-primary dark:text-primary-dark" size={40} />
          </div>
          <h2 className={`text-3xl font-black text-gray-900 dark:text-white`}>
            {lang === 'ar' ? 'تسجيل الدخول' : (lang === 'fr' ? 'Connexion' : 'Sign In')}
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {lang === 'ar' ? 'أهلاً بك مجدداً في جين عربي' : 'Welcome back to Jeen Arabi'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
              {lang === 'ar' ? 'اسم المستخدم أو البريد' : 'Username or Email'}
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
                className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-gray-400"
                placeholder={lang === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
              {lang === 'ar' ? 'كلمة المرور' : 'Password'}
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
                className="block w-full pl-12 pr-12 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-gray-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
                title={showPassword ? "Hide" : "Show"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 dark:text-red-400 text-sm font-bold text-center bg-red-50 dark:bg-red-900/20 py-3 rounded-xl border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-lg font-black text-white bg-primary hover:bg-primary-dark focus:ring-4 focus:ring-primary/20 transition-all transform hover:-translate-y-1 active:scale-[0.98]"
          >
            {lang === 'ar' ? 'دخول' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-800 pt-6">
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {lang === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}
            <button
              onClick={() => navigate('/register')}
              className="ml-2 text-primary font-bold hover:underline"
            >
              {lang === 'ar' ? 'سجل الآن' : 'Register Now'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};