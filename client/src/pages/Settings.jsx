import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineOfficeBuilding, HiOutlineSun, HiOutlineMoon, HiOutlineGlobe } from 'react-icons/hi';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [form, setForm] = useState({
    name: user?.name || '',
    shopName: user?.shopName || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    try {
      await API.put('/auth/password', passwordForm);
      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleLanguageChange = async (lang) => {
    changeLanguage(lang);
    try {
      await API.put('/auth/profile', { language: lang });
    } catch (error) {}
    toast.success(lang === 'en' ? 'Language changed to English' : 'भाषा हिन्दी में बदली गई');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('settings')}</h1>
        <p className="mt-1" style={{ color: 'var(--text-tertiary)' }}>Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="card animate-slide-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <HiOutlineUser className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Profile</h3>
        </div>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('name')}</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('shopName')}</label>
            <div className="relative">
              <HiOutlineOfficeBuilding className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
              <input type="text" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                className="input-field pl-11" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('email')}</label>
            <input type="email" value={user?.email} className="input-field opacity-60" disabled />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : t('save')}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <span className="text-white font-bold">🔒</span>
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Change Password</h3>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Current Password</label>
            <input type="password" value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Password</label>
            <input type="password" value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="input-field" required minLength={6} />
          </div>
          <button type="submit" disabled={pwLoading} className="btn-primary">
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            {darkMode ? <HiOutlineSun className="w-5 h-5 text-white" /> : <HiOutlineMoon className="w-5 h-5 text-white" />}
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Appearance</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {darkMode ? t('darkMode') : t('lightMode')}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Switch between light and dark themes
            </p>
          </div>
          <button onClick={toggleDarkMode}
            className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-primary-500' : 'bg-gray-300'}`}>
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Language */}
      <div className="card animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <HiOutlineGlobe className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('language')}</h3>
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleLanguageChange('en')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${language === 'en'
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
              : 'border hover:opacity-80'}`}
            style={language !== 'en' ? { borderColor: 'var(--border-color)', color: 'var(--text-primary)' } : {}}>
            English
          </button>
          <button onClick={() => handleLanguageChange('hi')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${language === 'hi'
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
              : 'border hover:opacity-80'}`}
            style={language !== 'hi' ? { borderColor: 'var(--border-color)', color: 'var(--text-primary)' } : {}}>
            हिन्दी
          </button>
        </div>
      </div>
    </div>
  );
}
