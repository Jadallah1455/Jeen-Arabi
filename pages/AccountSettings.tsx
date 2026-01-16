import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { SEO } from '../components/SEO';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Trash2, ArrowLeft, Save, Smile } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AvatarPicker } from '../components/AvatarPicker';
import { getAvatarData } from '../constants/avatars';

interface SettingsProps {
    lang: Language;
}

export const AccountSettings: React.FC<SettingsProps> = ({ lang }) => {
    const t = TRANSLATIONS[lang].settings;
    const { user, updateUser } = useAuth();
    const isRTL = lang === 'ar';

    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'avatar-1');

    const [loading, setLoading] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/auth/profile', { username, email, avatar: selectedAvatar });
            updateUser(res.data);
            toast.success(t.successProfile);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error(t.errorMatch);
            return;
        }
        setLoading(true);
        try {
            await api.put('/auth/password', { oldPassword, newPassword });
            toast.success(t.successPassword);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error updating password');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            await api.delete('/auth/me');
            toast.success(isRTL ? 'تم حذف الحساب بنجاح' : 'Account deleted successfully');
            updateUser(null);
            window.location.href = '/';
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error deleting account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-dark-bg transition-colors duration-500 pb-20">
            <SEO title={t.title} lang={lang} />

            <div className="max-w-4xl mx-auto px-4 pt-32">
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-8 font-bold">
                    <ArrowLeft size={20} className={isRTL ? 'rotate-180' : ''} />
                    {isRTL ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
                </Link>

                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-12">{t.title}</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Profile Section */}
                    <div className="bg-white dark:bg-dark-card p-8 rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><User size={20} /></div>
                            <h2 className="text-xl font-bold dark:text-white">{t.personalInfo}</h2>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-500 block">{t.username}</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary/30 dark:text-white transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-500 block">{t.email}</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary/30 dark:text-white transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                {t.updateBtn}
                            </button>
                        </form>
                    </div>

                    {/* Password Section */}
                    <div className="bg-white dark:bg-dark-card p-8 rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><Lock size={20} /></div>
                            <h2 className="text-xl font-bold dark:text-white">{t.changePassword}</h2>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-500 block">{t.oldPassword}</label>
                                <input
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary/30 dark:text-white transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-500 block">{t.newPassword}</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary/30 dark:text-white transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-500 block">{t.confirmPassword}</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary/30 dark:text-white transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Lock size={18} />
                                {t.passwordBtn}
                            </button>
                        </form>
                    </div>

                </div>

                {/* Avatar Selection Section */}
                <div className="mt-8 bg-white dark:bg-dark-card p-8 rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-lg"><Smile size={20} /></div>
                        <h2 className="text-xl font-bold dark:text-white">{isRTL ? 'صورتك الشخصية' : 'Your Avatar'}</h2>
                    </div>

                    <div className="mb-6 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {isRTL ? 'الصورة الحالية' : 'Current Avatar'}
                        </p>
                        <div 
                            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl shadow-lg"
                            style={{ backgroundColor: getAvatarData(selectedAvatar).color }}
                        >
                            {getAvatarData(selectedAvatar).emoji}
                        </div>
                    </div>

                    <AvatarPicker 
                        selected={selectedAvatar} 
                        onSelect={setSelectedAvatar} 
                        lang={lang}
                    />

                    <p className="text-xs text-gray-400 text-center mt-4">
                        {isRTL ? 'اضغط "حفظ التغييرات" أعلاه لتطبيق التغييرات' : 'Click "Save Changes" above to apply changes'}
                    </p>
                </div>

                {/* Danger Zone */}
                <div className="mt-12 bg-red-50 dark:bg-red-900/10 p-8 rounded-[32px] border border-red-100 dark:border-red-900/20">
                    <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">
                        <Trash2 size={20} />
                        {t.dangerZone}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{t.deleteWarning}</p>
                    <button
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className="px-6 py-3 bg-white dark:bg-gray-900 text-red-600 border border-red-200 dark:border-red-900/30 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                    >
                        {t.deleteAccount}
                    </button>
                </div>

            </div>
        </div>
    );
};
