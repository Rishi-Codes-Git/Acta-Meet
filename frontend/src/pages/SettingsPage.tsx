import React, { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { useAuthStore } from '@/store/authStore';
import { Upload, Moon, Sun, Lock, Shield, Eye, EyeOff, UserCircle2, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

type SettingsTab = 'profile' | 'display' | 'security';

const tabs: Array<{ key: SettingsTab; label: string; icon: React.ElementType }> = [
  { key: 'profile', label: 'Profile', icon: UserCircle2 },
  { key: 'display', label: 'Display', icon: Palette },
  { key: 'security', label: 'Security', icon: Shield },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const initials =
    user?.name
      ?.split(' ')
      .filter(Boolean)
      .map((namePart) => namePart[0])
      .join('')
      .toUpperCase() || 'U';

  const inputClassName =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#42A090] focus:border-transparent transition-all';

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSave = () => {
    if (!profileData.name || !profileData.email) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Profile updated successfully');
  };

  const handlePasswordSave = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    toast.success('Password updated successfully');
    setShowPasswordChange(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar must be less than 5MB');
        return;
      }
      toast.success('Avatar uploaded successfully');
    }
  };

  const handleEnableTwoFactor = () => {
    setShowTwoFactorSetup(true);
  };

  const handleConfirmTwoFactor = () => {
    toast.success('Two-factor authentication enabled');
    setTwoFactorEnabled(true);
    setShowTwoFactorSetup(false);
  };

  const handleDisableTwoFactor = () => {
    toast.success('Two-factor authentication disabled');
    setTwoFactorEnabled(false);
  };

  return (
    <MainLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-[#42A090] text-white shadow-md shadow-[#42A090]/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-display font-bold text-slate-900 mb-5">Profile Photo</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-[#42A090]/10 text-[#42A090] flex items-center justify-center font-bold text-2xl">
                  {initials}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#42A090] hover:bg-[#358070] text-white font-semibold cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-display font-bold text-slate-900">Personal Information</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className={inputClassName}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className={inputClassName}
                  placeholder="your@email.com"
                />
              </div>
              <button
                type="button"
                onClick={handleProfileSave}
                className="inline-flex items-center justify-center bg-[#42A090] hover:bg-[#358070] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Save Changes
              </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[#42A090]" />
                    Change Password
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">Update your password to keep your account secure.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="px-4 py-2 text-sm font-medium text-[#42A090] hover:bg-teal-50 rounded-xl transition-colors"
                >
                  {showPasswordChange ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {showPasswordChange && (
                <div className="mt-6 space-y-4 pt-6 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`${inputClassName} pr-11`}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                      >
                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={`${inputClassName} pr-11`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`${inputClassName} pr-11`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePasswordSave}
                    className="inline-flex items-center justify-center bg-[#42A090] hover:bg-[#358070] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Update Password
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'display' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                    {isDarkMode ? <Moon className="w-5 h-5 text-[#42A090]" /> : <Sun className="w-5 h-5 text-[#42A090]" />}
                    Dark Mode
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    {isDarkMode ? 'Dark mode is currently enabled' : 'Light mode is currently enabled'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    isDarkMode ? 'bg-[#42A090]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#42A090]" />
                    Two-Factor Authentication
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    {twoFactorEnabled
                      ? 'Your account is protected with two-factor authentication.'
                      : 'Add an extra layer of security to your account.'}
                  </p>
                </div>
                {twoFactorEnabled ? (
                  <button
                    type="button"
                    onClick={handleDisableTwoFactor}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Disable
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnableTwoFactor}
                    className="px-4 py-2 bg-[#42A090] hover:bg-[#358070] text-white font-semibold rounded-xl transition-colors"
                  >
                    Enable
                  </button>
                )}
              </div>

              {showTwoFactorSetup && !twoFactorEnabled && (
                <div className="mt-6 space-y-4 pt-6 border-t border-slate-100">
                  <p className="text-slate-600 text-sm">
                    Scan this QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, etc.).
                  </p>
                  <div className="flex justify-center p-5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-40 h-40 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                      <span className="text-slate-500 text-sm">QR Code Placeholder</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Enter verification code from your app
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      className={`${inputClassName} text-center text-xl tracking-widest`}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowTwoFactorSetup(false)}
                      className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmTwoFactor}
                      className="flex-1 px-4 py-2.5 bg-[#42A090] hover:bg-[#358070] text-white font-semibold rounded-xl transition-colors"
                    >
                      Verify & Enable
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
