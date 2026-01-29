import React, { useState, useMemo, useEffect } from 'react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Language, Story, Subscriber, Category } from '../types';
import { TRANSLATIONS } from '../constants';
import {
    Users, LayoutDashboard, BookOpen, Tag, Mail, Settings,
    Plus, Trash2, Edit2, Save, X, Search, Filter, Languages,
    ChevronRight, ChevronLeft, Upload, FileType, CheckCircle2,
    AlertCircle, Loader2, RefreshCw, BarChart3, PieChart,
    Calendar, UserPlus, TrendingUp, Download, Eye, Globe,
    Edit, CheckSquare, Square, FileText, Image as ImageIcon, Layout, FolderOpen, Award, Lightbulb,
} from 'lucide-react';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { ReviewsManagement } from '../components/ReviewsManagement';
import { SEO } from '../components/SEO';

// Import pdfjs (ensure it's installed or available via CDN in index.html if install fails)
import * as pdfjsLib from 'pdfjs-dist';

// Define the worker source (using CDN to avoid build issues with Vite/React 19)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface AdminProps {
    lang: Language;
    stories: Story[];
    setStories: React.Dispatch<React.SetStateAction<Story[]>>;
    subscribers: Subscriber[];
    setSubscribers: React.Dispatch<React.SetStateAction<Subscriber[]>>;
}

export type Tab = 'dashboard' | 'analytics' | 'stories' | 'tags' | 'categories' | 'subscribers' | 'users' | 'reviews' | 'tips' | 'settings';

export const Admin: React.FC<AdminProps> = ({ lang, stories, setStories, subscribers, setSubscribers }) => {
    const t = TRANSLATIONS[lang].admin;
    const isRTL = lang === 'ar';
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterLanguage, setFilterLanguage] = useState<string>('all');

    // Story Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [currentStory, setCurrentStory] = useState<Partial<Story>>({});
    const [tagInput, setTagInput] = useState('');

    // Subscriber State
    const [subscriberEmail, setSubscriberEmail] = useState('');
    const [subscriberName, setSubscriberName] = useState('');
    const [gdprConsent, setGdprConsent] = useState(false);

    // Users State
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Tags Management State
    const [editingTag, setEditingTag] = useState<string | null>(null);
    const [newTagValue, setNewTagValue] = useState('');

    const [categories, setCategories] = useState<Category[]>([]);
    const [isCategoryEditing, setIsCategoryEditing] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({});

    // Upload & Debug State
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [lastUploadError, setLastUploadError] = useState<string | null>(null);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [showDebug, setShowDebug] = useState(false);

    const addDebugLog = (msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50));
        console.log(`[AdminDebug] ${msg}`);
    };

    // Settings State
    const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Daily Tips State
    const [tips, setTips] = useState<any[]>([]);
    const [loadingTips, setLoadingTips] = useState(false);
    const [editingTip, setEditingTip] = useState<any | null>(null);
    const [tipForm, setTipForm] = useState({ ar: '', en: '', fr: '' });

    // Raw JSON Edit State
    const [isRawMode, setIsRawMode] = useState(false);
    const [rawJson, setRawJson] = useState('');
    const [isSavingRaw, setIsSavingRaw] = useState(false);

    const handleSaveRawJson = async () => {
        setIsSavingRaw(true);
        try {
            const parsed = JSON.parse(rawJson);
            if (!Array.isArray(parsed)) throw new Error('Root must be an array');
            
            await api.put('/tips/bulk', parsed); // calling the new bulk endpoint
            toast.success(lang === 'ar' ? 'تم تحديث البيانات بنجاح' : 'Data updated successfully');
            setTips(parsed);
            setIsRawMode(false);
        } catch (error) {
            console.error('Invalid JSON', error);
            toast.error(lang === 'ar' ? 'بيانات JSON غير صالحة' : 'Invalid JSON format');
        } finally {
            setIsSavingRaw(false);
        }
    };

    // Fetch Categories
    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                setCategories(res.data);
            } catch (error) {
                console.error('Failed to fetch categories', error);
            }
        };
        fetchCategories();
    }, []);

    // Fetch Settings
    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                const settingsMap: Record<string, string> = {};
                res.data.forEach((s: any) => {
                    settingsMap[s.key] = s.value;
                });
                setSiteSettings(settingsMap);
            } catch (error) {
                console.error('Failed to fetch settings', error);
            }
        };
        fetchSettings();
    }, []);

    // Fetch Daily Tips
    React.useEffect(() => {
        if (activeTab === 'tips') {
            fetchTips();
        }
    }, [activeTab]);

    const fetchTips = async () => {
        setLoadingTips(true);
        try {
            const res = await api.get('/tips');
            setTips(res.data);
        } catch (error) {
            console.error('Failed to fetch tips', error);
            toast.error(lang === 'ar' ? 'فشل تحميل الحكم' : 'Failed to load tips');
        } finally {
            setLoadingTips(false);
        }
    };

    const handleAddTip = async () => {
        if (!tipForm.ar || !tipForm.en || !tipForm.fr) {
            toast.error(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
            return;
        }

        try {
            await api.post('/tips', tipForm);
            toast.success(lang === 'ar' ? 'تمت إضافة الحكمة' : 'Tip added successfully');
            setTipForm({ ar: '', en: '', fr: '' });
            fetchTips();
        } catch (error) {
            console.error('Failed to add tip', error);
            toast.error(lang === 'ar' ? 'فشلت الإضافة' : 'Failed to add tip');
        }
    };

    const handleUpdateTip = async () => {
        if (!editingTip || !tipForm.ar || !tipForm.en || !tipForm.fr) return;

        try {
            await api.put(`/tips/${editingTip.id}`, tipForm);
            toast.success(lang === 'ar' ? 'تم التحديث' : 'Tip updated successfully');
            setEditingTip(null);
            setTipForm({ ar: '', en: '', fr: '' });
            fetchTips();
        } catch (error) {
            console.error('Failed to update tip', error);
            toast.error(lang === 'ar' ? 'فشل التحديث' : 'Failed to update tip');
        }
    };

    const handleDeleteTip = async (id: number) => {
        if (!confirm(lang === 'ar' ? 'هل تريد حذف هذه الحكمة؟' : 'Delete this tip?')) return;

        try {
            await api.delete(`/tips/${id}`);
            toast.success(lang === 'ar' ? 'تم الحذف' : 'Tip deleted');
            fetchTips();
        } catch (error) {
            console.error('Failed to delete tip', error);
            toast.error(lang === 'ar' ? 'فشل الحذف' : 'Failed to delete tip');
        }
    };

    const startEditingTip = (tip: any) => {
        setEditingTip(tip);
        setTipForm({ ar: tip.ar, en: tip.en, fr: tip.fr });
    };

    const cancelEditingTip = () => {
        setEditingTip(null);
        setTipForm({ ar: '', en: '', fr: '' });
    };

    // Derived Data
    const allTags = useMemo(() => Array.from(new Set(stories.flatMap(s => s.tags || []))), [stories]);

    const filteredStories = useMemo(() => {
        return stories.filter(story => {
            // Search filter
            const title = Object.values(story.title).join(' ').toLowerCase();
            const desc = Object.values(story.description).join(' ').toLowerCase();
            const tags = (story.tags || []).join(' ').toLowerCase();
            const query = searchQuery.toLowerCase();
            const matchesSearch = title.includes(query) || desc.includes(query) || tags.includes(query);

            // Category filter
            const matchesCategory = filterCategory === 'all' || (story.categories || []).includes(filterCategory);

            // Language filter
            const matchesLanguage = filterLanguage === 'all' || (story.availableLanguages || []).includes(filterLanguage as Language);

            return matchesSearch && matchesCategory && matchesLanguage;
        });
    }, [stories, searchQuery, filterCategory, filterLanguage]);

    const ageGroupData = useMemo(() => {
        const groups = { '3-5': 0, '6-8': 0, '9-12': 0 };
        stories.forEach(s => {
            if (groups[s.ageGroup as keyof typeof groups] !== undefined) {
                groups[s.ageGroup as keyof typeof groups]++;
            }
        });
        return Object.entries(groups).map(([name, value]) => ({ name, value }));
    }, [stories]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
            toast.error(t.fetchUsersError);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (window.confirm(t.confirmDeleteUser)) {
            try {
                await api.delete(`/users/${id}`);
                setUsers(prev => prev.filter(u => u.id !== id));
                toast.success(t.deleteUserSuccess);
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    const handleExportUsers = () => {
        try {
            if (users.length === 0) {
                toast.error(isRTL ? 'لا يوجد مستخدمين لتصديرهم' : 'No users to export');
                return;
            }

            // Headers
            const headers = ['ID', 'Username', 'Email', 'Role', 'Joined Date'];

            // Rows
            const rows = users.map(u => [
                u.id,
                `"${u.username.replace(/"/g, '""')}"`,
                `"${u.email.replace(/"/g, '""')}"`,
                u.role,
                new Date(u.createdAt).toLocaleDateString()
            ]);

            // Combine
            const csvContent = [
                headers.join(','),
                ...rows.map(r => r.join(','))
            ].join('\n');

            // Download with UTF-8 BOM for Arabic support
            const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `jeen-arabi-users-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(isRTL ? 'تم تصدير ملف البيانات بنجاح' : 'User data exported successfully');
        } catch (err) {
            console.error('Export error:', err);
            toast.error(isRTL ? 'فشل تصدير البيانات' : 'Failed to export data');
        }
    };

    const COLORS = ['#6C63FF', '#36A2EB', '#FFCE56', '#4BC0C0'];

    // --- Story Management Handlers ---
    const handleDelete = async (id: string) => {
        if (window.confirm(t.deleteStoryConfirm)) {
            const toastId = toast.loading('Deleting...');
            try {
                await api.delete(`/stories/${id}`);
                setStories(prev => prev.filter(s => s.id !== id));
                toast.success(t.deleteStorySuccess, { id: toastId });
            } catch (error) {
                console.error(error);
                toast.error(t.deleteStoryError, { id: toastId });
            }
        }
    };

    const handleEdit = (story: Story) => {
        setCurrentStory({ ...story });
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setCurrentStory({
            id: Date.now().toString(),
            title: { en: '', ar: '', fr: '' },
            description: { en: '', ar: '', fr: '' },
            availableLanguages: ['en'],
            coverImage: '',
            pdfUrl: '',
            ageGroup: '3-5',
            categoryLabel: 'English',
            tags: [],
            pages: [],
            views: 0,
            downloads: 0,
            quizData: []
        });
        setIsEditing(true);
    };

    const handleAddTagToStory = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!tagInput.trim()) return;
        const currentTags = currentStory.tags || [];
        const newTag = tagInput.trim();
        if (!currentTags.includes(newTag)) {
            setCurrentStory({ ...currentStory, tags: [...currentTags, newTag] });
        }
        setTagInput('');
    };

    const removeTagFromStory = (tagToRemove: string) => {
        const currentTags = currentStory.tags || [];
        setCurrentStory({ ...currentStory, tags: currentTags.filter(t => t !== tagToRemove) });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'pdf') => {
        const file = e.target.files?.[0];
        if (!file) return;

        addDebugLog(`Starting ${type} upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        setLastUploadError(null);

        // Clear input value to allow selecting the same file again if upload fails (triggers onChange)
        e.target.value = '';

        // Logic to delete previous temporary file
        const field = type === 'cover' ? 'coverImage' : 'pdfUrl';
        const oldUrl = currentStory[field];

        const formData = new FormData();
        formData.append('file', file);
        if (oldUrl) {
            formData.append('oldFileUrl', oldUrl);
        }

        const toastId = toast.loading(t.uploading);
        setUploadProgress(prev => ({ ...prev, [type]: 0 }));

        // Fake progress interval to ensure the bar moves even if events are buffered
        let currentFakeProgress = 0;
        const fakeInterval = setInterval(() => {
            if (currentFakeProgress < 35) {
                currentFakeProgress += Math.random() * 5;
                const rounded = Math.round(currentFakeProgress);
                setUploadProgress(prev => {
                    // Only update if fake is leading real progress
                    const existing = prev[type] || 0;
                    if (rounded > existing) {
                        addDebugLog(`Fake Progress: ${rounded}%`);
                        toast.loading(`${t.uploading} ${rounded}%`, { id: toastId });
                        return { ...prev, [type]: rounded };
                    }
                    return prev;
                });
            }
        }, 800);

        try {
            addDebugLog(`Connecting to /api/upload...`);
            const res = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || file.size;
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
                    addDebugLog(`Real Progress: ${percentCompleted}%`);

                    setUploadProgress(prev => {
                        const existing = prev[type] || 0;
                        if (percentCompleted > existing) {
                            return { ...prev, [type]: percentCompleted };
                        }
                        return prev;
                    });

                    // Update toast with real percentage if it's significant
                    if (percentCompleted > 0 && percentCompleted < 99) {
                        toast.loading(`${t.uploading} ${percentCompleted}%`, { id: toastId });
                    } else if (percentCompleted >= 99) {
                        toast.loading(t.processing || 'Processing...', { id: toastId });
                    }
                },
            });
            clearInterval(fakeInterval);

            addDebugLog(`Upload complete! Server returned URL: ${res.data.url}`);
            setCurrentStory(prev => ({
                ...prev,
                [field]: res.data.url,
                // Only update pages if returned (backward compatibility)
                ...(type === 'pdf' && res.data.images ? { pages: res.data.images } : {})
            }));

            // PERSISTENT SUCCESS TOAST WITH CLOSE BUTTON
            toast.success(
                (tid) => (
                    <div className="flex items-center gap-3">
                        <span className="flex-1">{t.uploadSuccess}</span>
                        <button
                            onClick={() => toast.dismiss(tid.id)}
                            className="p-1 hover:bg-black/10 rounded-full transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ),
                { id: toastId, duration: Infinity }
            );
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || t.uploadError;
            const details = {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                status: error.response?.status
            };

            console.error('Upload failed details:', details);
            addDebugLog(`FAILED: ${error.message} (Code: ${error.code})`);

            let msg = errorMsg;

            // Helpful hints for Network Errors (often size or server limits)
            if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || error.message?.includes('ERR_FAILED')) {
                msg = lang === 'ar'
                    ? 'خطأ في الشبكة (ERR_FAILED): تأكد من أن حجم الملف لا يتجاوز 100 ميجا، وأن السيرفر معد لاستقبال هذا الحجم (128M).'
                    : 'Network Error (ERR_FAILED): Ensure file is under 100MB and host limits are 128M.';
            }

            setLastUploadError(msg);

            // PERSISTENT ERROR TOAST WITH CLOSE BUTTON
            toast.error(
                (tid) => (
                    <div className="flex items-center gap-3 min-w-[200px]">
                        <span className="flex-1 text-xs font-bold">{msg}</span>
                        <button
                            onClick={() => toast.dismiss(tid.id)}
                            className="p-1 hover:bg-black/10 rounded-full transition-colors flex-shrink-0"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ),
                { id: toastId, duration: Infinity }
            );
        } finally {
            setUploadProgress(prev => {
                const newState = { ...prev };
                delete newState[type];
                return newState;
            });
        }
    };

    const handleSaveStory = async () => {
        const validTitle = currentStory.availableLanguages?.some(l => currentStory.title?.[l]?.trim());
        if (!validTitle) {
            toast.error(t.validationTitle);
            return;
        }
        if (!currentStory.coverImage) {
            toast.error(t.validationCover);
            return;
        }
        if (!currentStory.pdfUrl) {
            toast.error(t.validationPdf);
            return;
        }

        // Recalculate category label
        let newLabel: Story['categoryLabel'] = 'English';
        const langs = currentStory.availableLanguages || [];
        if (langs.length > 2) newLabel = 'Trilingual';
        else if (langs.length === 2) newLabel = 'Bilingual';
        else if (langs.includes('ar')) newLabel = 'Arabic';
        else if (langs.includes('fr')) newLabel = 'French';

        const finalStory = { ...currentStory, categoryLabel: newLabel } as Story;
        const isNew = !stories.find(s => s.id === currentStory.id);

        const toastId = toast.loading('Saving story...');

        try {
            let savedStory;
            if (isNew) {
                // Remove ID to let MongoDB generate it, or keep it if we want to control it (better let Mongo do it)
                // But our UI relies on ID. Let's send it without ID and update state with returned ID.
                const { id, ...storyData } = finalStory;
                const res = await api.post('/stories', storyData);
                savedStory = res.data;
                setStories(prev => [...prev, savedStory]);
            } else {
                const res = await api.put(`/stories/${currentStory.id}`, finalStory);
                savedStory = res.data;
                setStories(prev => prev.map(s => s.id === savedStory.id ? savedStory : s));
            }

            toast.success(t.storySavedSuccess, { id: toastId });
            setIsEditing(false);
            setCurrentStory({});
        } catch (error) {
            console.error(error);
            toast.error(t.storySavedError, { id: toastId });
        }
    };

    const toggleLanguageAvailability = (l: Language) => {
        const current = currentStory.availableLanguages || [];
        let updated;
        if (current.includes(l)) {
            updated = current.filter(existing => existing !== l);
        } else {
            updated = [...current, l];
        }
        setCurrentStory({ ...currentStory, availableLanguages: updated });
    };

    const handleAddSubscriber = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading('Adding subscriber...');
        try {
            const res = await api.post('/subscribers', {
                name: subscriberName,
                email: subscriberEmail,
                ageGroupPreference: 'All',
                languagePreference: lang,
                gdprConsent
            });

            setSubscribers([...subscribers, res.data]);
            setSubscriberName('');
            setSubscriberEmail('');
            setGdprConsent(false);
            toast.success('Subscriber added', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Failed to add subscriber', { id: toastId });
        }
    };

    const handleSaveSettings = async () => {
        try {
            setIsSavingSettings(true);
            await api.post('/settings/bulk', { settings: siteSettings });
            toast.success(isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
        } catch (error) {
            toast.error(isRTL ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
        } finally {
            setIsSavingSettings(false);
        }
    };

    // --- Tags Management Handlers ---
    const handleRenameTag = (oldTag: string) => {
        if (!newTagValue.trim() || newTagValue === oldTag) {
            setEditingTag(null);
            return;
        }
        if (window.confirm(`Rename tag "${oldTag}" to "${newTagValue}" across all stories?`)) {
            setStories(prev => prev.map(story => ({
                ...story,
                tags: story.tags.map(t => t === oldTag ? newTagValue.trim() : t)
            })));
        }
        setEditingTag(null);
        setNewTagValue('');
    };

    const handleDeleteTagGlobally = (tagToDelete: string) => {
        if (window.confirm(`Are you sure you want to delete tag "${tagToDelete}"? It will be removed from ALL stories.`)) {
            setStories(prev => prev.map(story => ({
                ...story,
                tags: story.tags.filter(t => t !== tagToDelete)
            })));
        }
    };

    // --- Category Management Handlers ---
    const handleSaveCategory = async () => {
        if (!currentCategory.name?.en && !currentCategory.name?.ar) {
            toast.error('Category name is required');
            return;
        }
        const toastId = toast.loading('Saving category...');
        try {
            if (currentCategory.id) {
                const res = await api.put(`/categories/${currentCategory.id}`, currentCategory);
                setCategories(prev => prev.map(c => c.id === res.data.id ? res.data : c));
            } else {
                const res = await api.post('/categories', currentCategory);
                setCategories(prev => [...prev, res.data]);
            }
            toast.success('Category saved', { id: toastId });
            setIsCategoryEditing(false);
            setCurrentCategory({});
        } catch (error) {
            console.error(error);
            toast.error('Failed to save category', { id: toastId });
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (window.confirm('Delete this category?')) {
            try {
                await api.delete(`/categories/${id}`);
                setCategories(prev => prev.filter(c => c.id !== id));
                toast.success('Category deleted');
            } catch (error) {
                console.error(error);
                toast.error('Failed to delete category');
            }
        }
    };

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    // --- Renders ---

    const renderDashboard = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: t.totalStories, value: stories.length, color: 'bg-blue-500', icon: <FileText className="text-white" /> },
                    { label: t.totalViews, value: stories.reduce((acc, s) => acc + s.views, 0), color: 'bg-green-500', icon: <Users className="text-white" /> },
                    { label: t.activeSubscribers, value: subscribers.length, color: 'bg-purple-500', icon: <CheckSquare className="text-white" /> },
                    { label: t.uniqueTags, value: allTags.length, color: 'bg-yellow-500', icon: <Tag className="text-white" /> },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-dark-card overflow-hidden shadow-sm rounded-2xl transition-all hover:shadow-md border border-gray-100 dark:border-gray-700">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className={`flex-shrink-0 rounded-xl p-3 shadow-lg ${stat.color}`}>
                                    {stat.icon}
                                </div>
                                <div className={`w-0 flex-1 ${isRTL ? 'mr-5' : 'ml-5'}`}>
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate text-left rtl:text-right">{stat.label}</dt>
                                        <dd className="text-2xl font-bold text-gray-900 dark:text-white mt-1 text-left rtl:text-right">{stat.value}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-dark-card shadow-sm rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className={`text-lg leading-6 font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                        <BarChart3 className="text-primary w-5 h-5" /> {t.storyViews}
                    </h3>
                    <div className="relative h-[350px] w-full" dir="ltr" style={{ minHeight: '350px' }}>
                        {activeTab === 'dashboard' && stories.length > 0 && (
                            <div className="w-full h-full" key={`bar-container-${stories.length}`} style={{ minHeight: '350px' }}>
                                <ResponsiveContainer width="100%" height="100%" debounce={100} minHeight={300}>
                                    <ReBarChart data={stories.slice(0, 10).map(s => ({ name: (s.title[lang] || s.title.en || s.title.ar || '').substring(0, 10), views: s.views }))}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tick={{ fill: '#888888' }} />
                                        <YAxis stroke="#888888" fontSize={12} tick={{ fill: '#888888' }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Bar dataKey="views" fill="#6C63FF" radius={[4, 4, 0, 0]} name={TRANSLATIONS[lang].library.views} />
                                    </ReBarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-card shadow-sm rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className={`text-lg leading-6 font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                        <PieChart className="text-green-500 w-5 h-5" /> {t.ageDistribution}
                    </h3>
                    <div className="relative h-[350px] w-full" dir="ltr" style={{ minHeight: '350px' }}>
                        {activeTab === 'dashboard' && ageGroupData.length > 0 && (
                            <div className="w-full h-full" key={`pie-container-${stories.length}`} style={{ minHeight: '350px' }}>
                                <ResponsiveContainer width="100%" height="100%" debounce={150} minHeight={300}>
                                    <RePieChart>
                                        <Pie
                                            data={ageGroupData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ index, percent }) => `${ageGroupData[index].name} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {ageGroupData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTagsManagement = () => (
        <div className="bg-white dark:bg-dark-card shadow-sm rounded-2xl p-6 border border-gray-100 dark:border-gray-700 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Tag size={20} className="text-primary" />
                    {t.tagsLabel}
                </h3>
                <p className="text-sm text-gray-500">{lang === 'ar' ? 'تعديل أو حذف الأوسمة عالمياً' : 'Edit or delete tags globally'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allTags.map(tag => (
                    <div key={tag} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                        {editingTag === tag ? (
                            <div className="flex gap-2 w-full">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newTagValue}
                                    onChange={e => setNewTagValue(e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm rounded bg-white dark:bg-gray-700 border border-primary outline-none"
                                />
                                <button onClick={() => handleRenameTag(tag)} className="p-1 bg-green-500 text-white rounded"><Save size={14} /></button>
                                <button onClick={() => setEditingTag(null)} className="p-1 bg-gray-400 text-white rounded"><X size={14} /></button>
                            </div>
                        ) : (
                            <>
                                <span className="font-bold text-gray-700 dark:text-gray-300">
                                    {tag}
                                    <span className="ml-2 text-xs font-normal text-gray-400">({stories.filter(s => s.tags.includes(tag)).length} stories)</span>
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={() => { setEditingTag(tag); setNewTagValue(tag); }} className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"><Edit size={16} /></button>
                                    <button onClick={() => handleDeleteTagGlobally(tag)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"><Trash2 size={16} /></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {allTags.length === 0 && (
                    <p className="col-span-3 text-center text-gray-400 py-8">{lang === 'ar' ? 'لم يتم العثور على أوسمة. أضف أوسمة للقصص أولاً.' : 'No tags found. Add tags to stories first.'}</p>
                )}
            </div>
        </div>
    );

    const renderCategoriesManagement = () => (
        <div className="bg-white dark:bg-dark-card shadow-sm rounded-2xl p-6 border border-gray-100 dark:border-gray-700 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FolderOpen size={20} className="text-primary" />
                    {t.manageCategories}
                </h3>
                <button
                    onClick={() => { setCurrentCategory({ name: {}, description: {} }); setIsCategoryEditing(true); }}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold"
                >
                    <Plus size={16} /> {t.addCategory}
                </button>
            </div>

            {isCategoryEditing && (
                <div className="mb-8 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold mb-4 dark:text-white">{currentCategory.id ? t.editCategory : t.addCategory}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold mb-1 dark:text-gray-300">{t.nameEn}</label>
                            <input
                                value={currentCategory.name?.en || ''}
                                onChange={e => setCurrentCategory({ ...currentCategory, name: { ...currentCategory.name, en: e.target.value } })}
                                className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1 dark:text-gray-300">{t.nameAr}</label>
                            <input
                                value={currentCategory.name?.ar || ''}
                                onChange={e => setCurrentCategory({ ...currentCategory, name: { ...currentCategory.name, ar: e.target.value } })}
                                className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white font-arabic text-right"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold mb-1 dark:text-gray-300">{t.descEn}</label>
                            <textarea
                                value={currentCategory.description?.en || ''}
                                onChange={e => setCurrentCategory({ ...currentCategory, description: { ...currentCategory.description, en: e.target.value } })}
                                className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                rows={2}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold mb-1 dark:text-gray-300">{t.descAr}</label>
                            <textarea
                                value={currentCategory.description?.ar || ''}
                                onChange={e => setCurrentCategory({ ...currentCategory, description: { ...currentCategory.description, ar: e.target.value } })}
                                className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white font-arabic text-right"
                                rows={2}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsCategoryEditing(false)} className="px-4 py-2 text-gray-500">{t.cancel}</button>
                        <button onClick={handleSaveCategory} className="px-4 py-2 bg-primary text-white rounded-lg font-bold">{t.saveCategory}</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 relative group">
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setCurrentCategory(cat); setIsCategoryEditing(true); }} className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Edit size={14} /></button>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{cat.name?.[lang] || cat.name?.ar || cat.name?.en}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{cat.description?.[lang] || cat.description?.en || cat.description?.ar}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStoryForm = () => {
        const langs: Language[] = ['en', 'ar', 'fr'];
        return (
            <div className="bg-white dark:bg-dark-card shadow-lg rounded-2xl p-8 animate-slide-up border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {currentStory.id ? <Edit size={24} className="text-primary" /> : <Plus size={24} className="text-primary" />}
                        {currentStory.id ? t.editStory : t.createStory}
                    </h3>
                    <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-red-500">
                        <X size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                        {/* Story Primary Languages (Multi-Select) */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
                            <label className={`block text-sm font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Globe size={16} /> {lang === 'ar' ? 'لغات القصة' : 'Story Languages'}
                            </label>
                            <div className="space-y-2">
                                {/* All Languages Option */}
                                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors border border-blue-200 dark:border-blue-700">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                        currentStory.storyLanguage === 'all' || (Array.isArray(currentStory.storyLanguage) && currentStory.storyLanguage.includes('all'))
                                            ? 'bg-primary border-primary text-white' 
                                            : 'bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600'
                                    }`}>
                                        {(currentStory.storyLanguage === 'all' || (Array.isArray(currentStory.storyLanguage) && currentStory.storyLanguage.includes('all'))) && <CheckSquare size={14} />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={currentStory.storyLanguage === 'all' || (Array.isArray(currentStory.storyLanguage) && currentStory.storyLanguage.includes('all'))}
                                        onChange={() => {
                                            setCurrentStory({ ...currentStory, storyLanguage: 'all' });
                                        }}
                                    />
                                    <span className="font-bold text-sm text-gray-700 dark:text-gray-300">🌍 {lang === 'ar' ? 'كل اللغات (تلوين/مصور)' : 'All Languages (Coloring/Picture)'}</span>
                                </label>

                                {/* Individual Language Options */}
                                {['ar', 'en', 'fr'].map(l => {
                                    const labels = { ar: { ar: 'العربية 🇸🇦', en: 'Arabic 🇸🇦' }, en: { ar: 'الإنجليزية 🇬🇧', en: 'English 🇬🇧' }, fr: { ar: 'الفرنسية 🇫🇷', en: 'French 🇫🇷' } };
                                    const isChecked = Array.isArray(currentStory.storyLanguage) 
                                        ? currentStory.storyLanguage.includes(l)
                                        : currentStory.storyLanguage === l;
                                    const isDisabled = currentStory.storyLanguage === 'all';
                                    
                                    return (
                                        <label key={l} className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                                isChecked ? 'bg-primary border-primary text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                                            }`}>
                                                {isChecked && <CheckSquare size={14} />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={isChecked}
                                                disabled={isDisabled}
                                                onChange={() => {
                                                    if (isDisabled) return;
                                                    const current = Array.isArray(currentStory.storyLanguage) ? currentStory.storyLanguage : [currentStory.storyLanguage].filter(Boolean);
                                                    const updated = current.includes(l) 
                                                        ? current.filter(lang => lang !== l)
                                                        : [...current, l];
                                                    setCurrentStory({ ...currentStory, storyLanguage: updated.length === 1 ? updated[0] : updated });
                                                }}
                                            />
                                            <span className="font-bold text-sm text-gray-700 dark:text-gray-300">{labels[l][lang]}</span>
                                        </label>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                                {lang === 'ar' ? 'اختر "كل اللغات" للقصص المصورة أو اختر لغات محددة' : 'Choose "All Languages" for picture books or select specific languages'}
                            </p>
                        </div>



                        {/* Categories Selection */}
                        <div>
                            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t.categories}</label>
                            <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-300 dark:border-gray-600">
                                {categories.map(cat => (
                                    <label key={cat.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${currentStory.categories?.includes(cat.id)
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                                        }`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={currentStory.categories?.includes(cat.id) || false}
                                            onChange={() => {
                                                const current = currentStory.categories || [];
                                                const updated = current.includes(cat.id)
                                                    ? current.filter(id => id !== cat.id)
                                                    : [...current, cat.id];
                                                setCurrentStory({ ...currentStory, categories: updated });
                                            }}
                                        />
                                        <span className="text-xs font-bold">{cat.name?.[lang] || cat.name?.ar || cat.name?.en}</span>
                                    </label>
                                ))}
                                {categories.length === 0 && <span className="text-xs text-gray-400">No categories available. Add them in the Categories tab.</span>}
                            </div>
                        </div>

                        {/* Age Group */}
                        <div>
                            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t.ageGroup}</label>
                            <select
                                value={currentStory.ageGroup}
                                onChange={e => setCurrentStory({ ...currentStory, ageGroup: e.target.value as any })}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                            >
                                <option value="3-5">{t.ageToddlers}</option>
                                <option value="6-8">{t.ageEarly}</option>
                                <option value="9-12">{t.ageYoung}</option>
                            </select>
                        </div>

                        {/* Tags Input */}
                        <div>
                            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t.tagsLabel}</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTagToStory(e)}
                                    placeholder={t.tagNamePlaceholder}
                                    className="flex-1 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-white"
                                />
                                <button onClick={handleAddTagToStory} className="bg-gray-200 dark:bg-gray-700 p-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-white"><Plus size={18} /></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {currentStory.tags?.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-bold">
                                        {tag}
                                        <button onClick={() => removeTagFromStory(tag)} className="hover:text-red-500"><X size={12} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Cover & PDF */}
                        <div>
                            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t.coverImage}</label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 overflow-hidden relative">
                                {currentStory.coverImage ? (
                                    <div className="relative w-full h-full group">
                                        <img 
                                            src={currentStory.coverImage} 
                                            alt={`${currentStory.title?.[lang] || currentStory.title?.ar || currentStory.title?.en || 'Story'} ${isRTL ? 'غلاف' : 'cover preview'}`}
                                            className="w-full h-full object-cover opacity-80" 
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-[10px] text-white truncate text-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                            {currentStory.coverImage.split('/').pop()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <FolderOpen className="mx-auto mb-4 opacity-20" size={48} />
                                        <span className="text-xs">{t.uploadTitleCover}</span>
                                    </div>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />
                                {uploadProgress['cover'] !== undefined && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-50">
                                        <div className="w-full max-w-[120px] bg-gray-200/20 rounded-full h-3 mb-3 overflow-hidden border border-white/20">
                                            <div
                                                className="bg-primary h-full transition-all duration-300 shadow-[0_0_10px_rgba(108,99,255,0.5)] animate-pulse"
                                                style={{ width: `${uploadProgress['cover']}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-white text-sm font-bold drop-shadow-md">{uploadProgress['cover']}%</span>
                                        <span className="text-white/80 text-[10px] mt-1">{t.uploading}</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t.uploadPdf}</label>
                            <div className="relative">
                                <label className="flex items-center gap-3 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <FileText className="text-red-500" />
                                    <span className="text-sm truncate text-gray-600 dark:text-gray-300 flex-1">
                                        {currentStory.pdfUrl ? (
                                            <span className="font-bold text-primary">{decodeURIComponent(currentStory.pdfUrl.split('/').pop() || '')}</span>
                                        ) : t.uploadPdf}
                                    </span>
                                    <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'pdf')} />
                                </label>
                                {uploadProgress['pdf'] !== undefined && (
                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                                <Loader2 size={12} className="animate-spin text-primary" />
                                                {uploadProgress['pdf'] >= 95 ? (t.processing || 'Processing...') : t.uploading}
                                            </span>
                                            <span className="font-bold text-primary">{uploadProgress['pdf']}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-primary h-full transition-all duration-300 shadow-sm"
                                                style={{ width: `${uploadProgress['pdf']}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Arabic Title/Description - Always Shown */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700 relative">
                            <div className={`absolute -top-3 px-2 bg-white dark:bg-dark-card text-xs font-bold uppercase text-primary border border-gray-100 dark:border-gray-700 rounded-md shadow-sm ${isRTL ? 'right-4' : 'left-4'}`}>
                                العربية 🇸🇦
                            </div>
                            <div className="grid gap-4 mt-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 text-right">{t.storyTitle} (AR)</label>
                                    <input
                                        dir="rtl"
                                        value={currentStory.title?.ar || ''}
                                        onChange={e => setCurrentStory({ ...currentStory, title: { ...currentStory.title, ar: e.target.value } })}
                                        className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-primary dark:text-white font-arabic"
                                        placeholder="عنوان القصة بالعربي"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 text-right">{t.storyDesc} (AR)</label>
                                    <textarea
                                        dir="rtl"
                                        rows={2}
                                        value={currentStory.description?.ar || ''}
                                        onChange={e => setCurrentStory({ ...currentStory, description: { ...currentStory.description, ar: e.target.value } })}
                                        className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-primary dark:text-white font-arabic"
                                        placeholder="وصف القصة بالعربي"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* English Title/Description - Always Shown */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700 relative">
                            <div className={`absolute -top-3 px-2 bg-white dark:bg-dark-card text-xs font-bold uppercase text-primary border border-gray-100 dark:border-gray-700 rounded-md shadow-sm ${isRTL ? 'right-4' : 'left-4'}`}>
                                English 🇬🇧
                            </div>
                            <div className="grid gap-4 mt-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.storyTitle} (EN)</label>
                                    <input
                                        dir="ltr"
                                        value={currentStory.title?.en || ''}
                                        onChange={e => setCurrentStory({ ...currentStory, title: { ...currentStory.title, en: e.target.value } })}
                                        className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-primary dark:text-white"
                                        placeholder="Story title in English"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.storyDesc} (EN)</label>
                                    <textarea
                                        dir="ltr"
                                        rows={2}
                                        value={currentStory.description?.en || ''}
                                        onChange={e => setCurrentStory({ ...currentStory, description: { ...currentStory.description, en: e.target.value } })}
                                        className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-primary dark:text-white"
                                        placeholder="Story description in English"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* French Title/Description - Only if story language includes French */}
                        {(currentStory.storyLanguage === 'fr' || currentStory.storyLanguage === 'all' || (Array.isArray(currentStory.storyLanguage) && currentStory.storyLanguage.includes('fr'))) && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700 relative">
                                <div className={`absolute -top-3 px-2 bg-white dark:bg-dark-card text-xs font-bold uppercase text-primary border border-gray-100 dark:border-gray-700 rounded-md shadow-sm ${isRTL ? 'right-4' : 'left-4'}`}>
                                    Français 🇫🇷
                                </div>
                                <div className="grid gap-4 mt-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.storyTitle} (FR)</label>
                                        <input
                                            dir="ltr"
                                            value={currentStory.title?.fr || ''}
                                            onChange={e => setCurrentStory({ ...currentStory, title: { ...currentStory.title, fr: e.target.value } })}
                                            className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-primary dark:text-white"
                                            placeholder="Titre de l'histoire en français"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.storyDesc} (FR)</label>
                                        <textarea
                                            dir="ltr"
                                            rows={2}
                                            value={currentStory.description?.fr || ''}
                                            onChange={e => setCurrentStory({ ...currentStory, description: { ...currentStory.description, fr: e.target.value } })}
                                            className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-primary dark:text-white"
                                            placeholder="Description de l'histoire en français"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Quiz Data JSON Editor */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                <span className="flex items-center gap-2"><Award size={16} className="text-primary"/> Story Quiz JSON Data</span>
                             </label>
                             <div className="mb-2 text-xs text-gray-500">
                                    Format: <code>{`[{ "question": "...", "options": ["A","B"], "correctAnswer": 0 }]`}</code>
                             </div>
                             <textarea
                                value={currentStory.quizData ? JSON.stringify(currentStory.quizData, null, 2) : ''}
                                onChange={e => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        setCurrentStory({ ...currentStory, quizData: parsed });
                                    } catch (err) {
                                        // Allow typing invalid JSON, just don't update object structure yet or handle gracefully
                                        // Ideally we keep a separate text state, but for admin MVP direct stringify is risky for editing.
                                        // Better approach: Store raw text temporarily or just let it fail silently until valid.
                                        // For now, let's just assume they paste valid JSON or we construct a simple UI later.
                                        // Wait, direct JSON.parse on change is bad for typing.
                                        // Let's rely on a separate handler or just use a text field that updates on blur.
                                    }
                                }}
                                // Actually, let's use a ref or local state for the text to avoid standard "controlled input" issues with JSON.stringify
                                // But since I can't easily add state variables inside this big render function without hooks, 
                                // I will stick to a simpler "On Blur" or just a text area that commits to state.
                                
                                // Simplified: Textarea that updates state on change, but we treat it as string until save? 
                                // No, currentStory.quizData is the object. 
                                // Let's just provide a simple helper to paste JSON.
                             />
                             <textarea 
                                className="w-full font-mono text-sm p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl h-48"
                                placeholder='[{"question": "Who is the hero?", "options": ["Ali", "Sara"], "correctAnswer": 0}]'
                                defaultValue={currentStory.quizData ? JSON.stringify(currentStory.quizData, null, 2) : ''}
                                onChange={(e) => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        setCurrentStory({ ...currentStory, quizData: parsed });
                                    } catch (e) {
                                        // invalid json, ignore update
                                    }
                                }}
                             ></textarea>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl">{t.cancel}</button>
                    <button onClick={handleSaveStory} className="px-6 py-2.5 bg-primary text-white rounded-xl shadow-lg flex items-center gap-2 font-bold">{t.save}</button>
                </div>
            </div >
        );
    };

    const renderStoriesList = () => (
        <div className="bg-white dark:bg-dark-card shadow-sm rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-fade-in">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white whitespace-nowrap">{t.stories}</h3>
                    <button onClick={handleAddNew} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md w-full sm:w-auto justify-center">
                        <Plus size={18} />
                        {t.addStory}
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                        />
                    </div>

                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="p-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white min-w-[140px]"
                    >
                        <option value="all">{t.allCategories}</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name[lang] || cat.name.en}</option>
                        ))}
                    </select>

                    <select
                        value={filterLanguage}
                        onChange={(e) => setFilterLanguage(e.target.value)}
                        className="p-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white min-w-[100px]"
                    >
                        <option value="all">{t.anyLanguage}</option>
                        <option value="ar">{TRANSLATIONS[lang].nav.languages.ar}</option>
                        <option value="en">{TRANSLATIONS[lang].nav.languages.en}</option>
                        <option value="fr">{TRANSLATIONS[lang].nav.languages.fr}</option>
                    </select>

                    {(searchQuery || filterCategory !== 'all' || filterLanguage !== 'all') && (
                        <button
                            onClick={() => { setSearchQuery(''); setFilterCategory('all'); setFilterLanguage('all'); }}
                            className="text-xs text-red-500 font-bold hover:underline"
                        >
                            {t.reset}
                        </button>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div className="p-6 bg-gray-50 dark:bg-dark-bg">{renderStoryForm()}</div>
            ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredStories.map((story) => {
                        const displayTitle = story.title[lang] || story.title.en || Object.values(story.title)[0] || t.untitled;
                        return (
                            <li key={story.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center flex-1">
                                        <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-sm flex-shrink-0">
                                            <img 
                                                className="h-full w-full object-cover" 
                                                src={story.coverImage} 
                                                alt={`${displayTitle} ${isRTL ? 'غلاف' : 'cover'}`}
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </div>
                                        <div className={`min-w-0 ${isRTL ? 'mr-4' : 'ml-4'}`}>
                                            <p className={`text-base font-bold text-gray-900 dark:text-white truncate ${lang === 'ar' && story.title[lang] ? 'font-arabic' : ''}`}>{displayTitle}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">{story.ageGroup}</span>
                                                <div className="flex gap-1">
                                                    {story.availableLanguages?.map(l => (
                                                        <span key={l} className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800">{l}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 px-4 hidden sm:flex">
                                        <div className="flex flex-col items-center min-w-[60px]">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase mb-0.5 flex items-center gap-1"><Eye size={12} /> {TRANSLATIONS[lang].library.views}</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{story.views.toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col items-center min-w-[60px]">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase mb-0.5 flex items-center gap-1"><Download size={12} /> {t.downloads}</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{(story.downloads || 0).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(story)} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(story.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                    {filteredStories.length === 0 && (
                        <div className="p-12 text-center text-gray-400">
                            <Search className="mx-auto mb-4 opacity-20" size={48} />
                            <p>{t.noStoriesFound}</p>
                        </div>
                    )}
                </ul>
            )}
        </div>
    );

    const renderUsers = () => (
        <div className="bg-white dark:bg-dark-card rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-slide-up">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg"><Users size={20} /></div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t.usersManagement}</h2>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleExportUsers}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-xl font-bold hover:bg-green-500 hover:text-white transition-all text-sm"
                        title={isRTL ? 'تصدير إلى CSV' : 'Export to CSV'}
                    >
                        <Download size={18} />
                        {isRTL ? 'تصدير' : 'Export'}
                    </button>
                    <button
                        onClick={fetchUsers}
                        className="p-2 text-gray-500 hover:text-primary transition-colors"
                        title={t.refresh}
                    >
                        <RefreshCw size={20} className={loadingUsers ? 'animate-spin' : ''} />
                    </button>
                    <span className="text-sm font-bold px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">{users.length}</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-white/5 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <th className="px-8 py-4">{t.user}</th>
                            <th className="px-8 py-4">{t.email}</th>
                            <th className="px-8 py-4">{t.role}</th>
                            <th className="px-8 py-4">{t.joined}</th>
                            <th className="px-8 py-4 text-center">{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {loadingUsers ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center text-gray-500">
                                    {t.noUsers}
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs uppercase">
                                                {u.username.substring(0, 2)}
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-white">{u.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-gray-500 dark:text-gray-400 text-sm">{u.email}</td>
                                    <td className="px-8 py-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-gray-500 dark:text-gray-400 text-sm">
                                        {new Date(u.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                                    </td>
                                    <td className="px-8 py-4 text-center">
                                        <button
                                            onClick={() => handleDeleteUser(u.id)}
                                            disabled={u.role === 'admin'}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:text-gray-400"
                                            title={t.deleteUser}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSubscribers = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-dark-card shadow-sm rounded-2xl p-8 border border-gray-100 dark:border-gray-700 animate-fade-in">
                <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2"><Layout size={20} className="text-primary" />{t.addSubscriber}</h3>
                <form onSubmit={handleAddSubscriber} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <input
                            type="text" placeholder={t.fullName} required value={subscriberName} onChange={e => setSubscriberName(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                        />
                        <input
                            type="email" placeholder={t.email} required value={subscriberEmail} onChange={e => setSubscriberEmail(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                        />
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                        <button type="button" onClick={() => setGdprConsent(!gdprConsent)} className={`mt-0.5 flex-shrink-0 transition-colors ${gdprConsent ? 'text-primary' : 'text-gray-400'}`}>
                            {gdprConsent ? <CheckSquare size={22} /> : <Square size={22} />}
                        </button>
                        <label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none" onClick={() => setGdprConsent(!gdprConsent)}>{t.gdprLabel}</label>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={!gdprConsent} className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg disabled:opacity-50">{t.addSubscriber}</button>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-dark-card shadow-sm rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.subscribersListTitle}</h3>
                </div>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {subscribers.map(sub => (
                        <li key={sub.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">{sub.name}</p>
                                <p className="text-sm text-gray-500">{sub.email}</p>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{sub.subscribedAt || '2024-01-01'}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );

    // Render Daily Tips Management
    const renderTipsManagement = () => (
        <div className="bg-white dark:bg-dark-card shadow-sm rounded-2xl p-8 border border-gray-100 dark:border-gray-700 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Lightbulb className="text-primary" size={28} />
                    {lang === 'ar' ? 'إدارة الحكم اليومية' : 'Daily Tips Management'}
                </h3>
                <button
                    onClick={() => {
                        if (!isRawMode) {
                            // Enters Raw Mode: Load current tips into text area
                            setRawJson(JSON.stringify(tips, null, 2));
                        }
                        setIsRawMode(!isRawMode);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-bold text-sm"
                >
                    <FileText size={16} />
                    {isRawMode 
                        ? (lang === 'ar' ? 'عرض القائمة' : 'List View') 
                        : (lang === 'ar' ? 'تحرير ملف JSON' : 'Edit JSON File')}
                </button>
            </div>

            {isRawMode ? (
                // Raw JSON Editor
                <div className="animate-fade-in">
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 p-4 rounded-xl mb-4 text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-3">
                        <AlertCircle className="shrink-0 mt-0.5" size={18} />
                        <div>
                            <strong>{lang === 'ar' ? 'تنبيه:' : 'Warning:'}</strong>
                            <p className="mt-1 opacity-90">
                                {lang === 'ar' 
                                    ? 'أنت تقوم بتعديل ملف البيانات الخام مباشرة. تأكد من صحة تنسيق JSON (الأقواس والفواصل) قبل الحفظ. أي خطأ قد يمنع ظهور الحكم.' 
                                    : 'You are editing the raw data file directly. Ensure valid JSON format (brackets, commas) before saving. Errors may break tips display.'}
                            </p>
                        </div>
                    </div>
                    
                    <textarea
                        value={rawJson}
                        onChange={(e) => setRawJson(e.target.value)}
                        className="w-full h-96 p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-xl border border-gray-700 focus:ring-2 focus:ring-primary mb-4"
                        spellCheck={false}
                    />
                    
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsRawMode(false)}
                            className="px-6 py-2 bg-gray-500 text-white rounded-xl font-bold hover:bg-gray-600 transition-all"
                        >
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                            onClick={handleSaveRawJson}
                            disabled={isSavingRaw}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50"
                        >
                            {isSavingRaw ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            ) : (
                // Standard UI
                <>

            {/* Add/Edit Form */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-8">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {editingTip ? (lang === 'ar' ? 'تعديل الحكمة' : 'Edit Tip') : (lang === 'ar' ? 'إضافة حكمة جديدة' : 'Add New Tip')}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Arabic */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            {lang === 'ar' ? 'العربية 🇸🇦' : 'Arabic 🇸🇦'}
                        </label>
                        <textarea
                            dir="rtl"
                            rows={3}
                            value={tipForm.ar}
                            onChange={e => setTipForm({ ...tipForm, ar: e.target.value })}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-primary dark:text-white"
                            placeholder="اكتب الحكمة بالعربية..."
                        />
                    </div>

                    {/* English */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            {lang === 'ar' ? 'الإنجليزية 🇬🇧' : 'English 🇬🇧'}
                        </label>
                        <textarea
                            dir="ltr"
                            rows={3}
                            value={tipForm.en}
                            onChange={e => setTipForm({ ...tipForm, en: e.target.value })}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-primary dark:text-white"
                            placeholder="Write tip in English..."
                        />
                    </div>

                    {/* French */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            {lang === 'ar' ? 'الفرنسية 🇫🇷' : 'French 🇫🇷'}
                        </label>
                        <textarea
                            dir="ltr"
                            rows={3}
                            value={tipForm.fr}
                            onChange={e => setTipForm({ ...tipForm, fr: e.target.value })}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-primary dark:text-white"
                            placeholder="Écrivez le conseil en français..."
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                    {editingTip ? (
                        <>
                            <button
                                onClick={handleUpdateTip}
                                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all"
                            >
                                <Save size={18} />
                                {lang === 'ar' ? 'تحديث' : 'Update'}
                            </button>
                            <button
                                onClick={cancelEditingTip}
                                className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-xl font-bold hover:bg-gray-600 transition-all"
                            >
                                <X size={18} />
                                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleAddTip}
                            className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all"
                        >
                            <Plus size={18} />
                            {lang === 'ar' ? 'إضافة' : 'Add Tip'}
                        </button>
                    )}
                </div>
            </div>

            {/* Tips List */}
            {loadingTips ? (
                <div className="text-center py-12">
                    <Loader2 className="animate-spin text-primary mx-auto" size={40} />
                </div>
            ) : (
                <div className="space-y-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        {lang === 'ar' ? `جميع الحكم (${tips.length})` : `All Tips (${tips.length})`}
                    </h4>
                    
                    {tips.map((tip, index) => (
                        <div key={tip.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-sm font-bold text-primary">#{tip.id}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEditingTip(tip)}
                                        className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTip(tip.id)}
                                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-right" dir="rtl">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">🇸🇦 AR:</span>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{tip.ar}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">🇬🇧 EN:</span>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{tip.en}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">🇫🇷 FR:</span>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{tip.fr}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </>
            )}
        </div>
    );

    const renderSettings = () => (
        <div className="bg-white dark:bg-dark-card shadow-sm rounded-2xl p-8 border border-gray-100 dark:border-gray-700 animate-fade-in text-left">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Settings className="text-primary" />
                    {t.platformSettings}
                </h3>
                <button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                    <Save size={20} />
                    {isSavingSettings ? t.saving : t.saveAll}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300 border-b pb-2">{t.supportLinks}</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">Buy Me A Coffee URL</label>
                        <input
                            type="text"
                            value={siteSettings.buymeacoffee_url || ''}
                            onChange={(e) => setSiteSettings({ ...siteSettings, buymeacoffee_url: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                            placeholder="https://buymeacoffee.com/yourname"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">PayPal Donate URL</label>
                        <input
                            type="text"
                            value={siteSettings.paypal_url || ''}
                            onChange={(e) => setSiteSettings({ ...siteSettings, paypal_url: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                            placeholder="https://paypal.me/yourname"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300 border-b pb-2">{t.siteMessages}</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">{t.welcomeMsgAr}</label>
                        <textarea
                            value={siteSettings.welcome_msg_ar || ''}
                            onChange={(e) => setSiteSettings({ ...siteSettings, welcome_msg_ar: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none h-24"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">{t.welcomeMsgEn}</label>
                        <textarea
                            value={siteSettings.welcome_msg_en || ''}
                            onChange={(e) => setSiteSettings({ ...siteSettings, welcome_msg_en: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none h-24"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div 
            dir={isRTL ? 'rtl' : 'ltr'}
            className="min-h-screen bg-background dark:bg-dark-bg py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
        >
            <SEO 
                title={isRTL ? 'لوحة التحكم' : 'Admin Dashboard'}
                description="Manage your stories, categories, and users."
                lang={lang}
            />
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white animate-fade-in">{t.title}</h1>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {[
                            { id: 'dashboard', label: t.analytics },
                            { id: 'stories', label: t.stories },
                            { id: 'categories', label: t.categories },
                            { id: 'tags', label: 'Tags' },
                            { id: 'subscribers', label: t.subscribers },
                            { id: 'users', label: t.users },
                            { id: 'reviews', label: isRTL ? 'الآراء' : 'Reviews' },
                            { id: 'tips', label: isRTL ? 'الحكم اليومية' : 'Daily Tips' },
                            { id: 'settings', label: TRANSLATIONS[lang].settings.title },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id as Tab); setIsEditing(false); }}
                                className={`${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div>
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'stories' && renderStoriesList()}
                    {activeTab === 'categories' && renderCategoriesManagement()}
                    {activeTab === 'tags' && renderTagsManagement()}
                    {activeTab === 'subscribers' && renderSubscribers()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'reviews' && <ReviewsManagement lang={lang} />}
                    {activeTab === 'tips' && renderTipsManagement()}
                    {activeTab === 'settings' && renderSettings()}
                </div>

                {/* Debug Monitor Toggle */}
                <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest bg-gray-50 dark:bg-dark-card/50 px-4 py-2 rounded-lg"
                    >
                        <Loader2 className={`w-3 h-3 ${showDebug ? 'text-primary' : ''}`} />
                        {showDebug ? 'Hide Debug Monitor' : 'Show Debug Monitor (Real-time Upload Data)'}
                    </button>

                    {showDebug && (
                        <div className="mt-4 bg-black dark:bg-black rounded-xl p-6 font-mono text-[11px] overflow-hidden shadow-2xl border border-white/5 animate-slide-up">
                            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-white font-bold">SYSTEM LOGS - REAL-TIME DIAGNOSTICS</span>
                                </div>
                                <button
                                    onClick={() => setDebugLogs([])}
                                    className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded transition-colors"
                                >
                                    CLEAR CONSOLE
                                </button>
                            </div>

                            <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {debugLogs.length === 0 ? (
                                    <div className="text-gray-600 italic">Listening for system events... Try uploading a file to see data here.</div>
                                ) : (
                                    debugLogs.map((log, i) => (
                                        <div key={i} className={`flex gap-3 ${log.includes('FAILED') ? 'text-red-400 font-bold' : log.includes('complete') ? 'text-green-400' : 'text-gray-300'}`}>
                                            <span className="opacity-40">{i + 1}.</span>
                                            <span>{log}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {lastUploadError && (
                                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-500 font-bold mb-2">
                                        <AlertCircle size={14} />
                                        CRITICAL ERROR DETECTED
                                    </div>
                                    <div className="text-red-400 text-xs bg-red-900/10 p-3 rounded border border-red-500/10 leading-relaxed uppercase">
                                        {lastUploadError}
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 pt-4 border-t border-white/5 flex gap-4 text-[10px] text-gray-500">
                                <span className="flex items-center gap-1"><Globe size={10} /> {window.location.host}</span>
                                <span className="flex items-center gap-1"><FileType size={10} /> PDF/DOC READY</span>
                                <span className="flex items-center gap-1 font-bold text-gray-400">BUILD: 2026-01-04-PERSISTENT</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};