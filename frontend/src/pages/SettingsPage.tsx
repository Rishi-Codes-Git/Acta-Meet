import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout';
import { useAuthStore } from '@/store/authStore';
import { Upload, Lock, Shield, Eye, EyeOff, UserCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi, twoFaApi } from '@/services/api';

type SettingsTab = 'profile' | 'security';

const tabs: Array<{ key: SettingsTab; label: string; icon: React.ElementType }> = [
  { key: 'profile', label: 'Profile', icon: UserCircle2 },
  { key: 'security', label: 'Security', icon: Shield },
];

const toAbsoluteAssetUrl = (assetPath: string) => {
  if (!assetPath) return '';
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }
  return assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
};

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled || false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [tfaVerifyCode, setTfaVerifyCode] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingTfa, setIsSavingTfa] = useState(false);

  useEffect(() => {
    setTwoFactorEnabled(user?.two_factor_enabled || false);
  }, [user?.two_factor_enabled]);

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

  const handleProfileSave = async () => {
    if (!profileData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!profileData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!user?.id) {
      toast.error('Unable to identify current user');
      return;
    }

    const trimmedName = profileData.name.trim();
    const trimmedEmail = profileData.email.trim();
    
    if (trimmedName === user.name && trimmedEmail === user.email) {
      toast.success('No changes to save');
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await usersApi.updateProfile(user.id, { name: trimmedName, email: trimmedEmail });
      const updatedUser = {
        ...user,
        name: response.data?.name || trimmedName,
        email: response.data?.email || trimmedEmail,
      };
      updateUser(updatedUser);
      setProfileData((prev) => ({ ...prev, name: updatedUser.name, email: updatedUser.email }));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar must be less than 5MB');
        return;
      }
      if (!user?.id) {
        toast.error('Unable to identify current user');
        return;
      }

      setIsUploadingAvatar(true);
      try {
        const response = await usersApi.uploadAvatar(user.id, file);
        const updatedUser = {
          ...user,
          avatar_url: response.data?.avatar_url,
        };
        updateUser(updatedUser);
        toast.success('Avatar uploaded successfully');
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to upload avatar');
      } finally {
        setIsUploadingAvatar(false);
        e.target.value = '';
      }
    }
  };

  const handleEnableTwoFactor = async () => {
    if (!user?.id) {
      toast.error('Unable to identify current user');
      return;
    }
    
    setIsSavingTfa(true);
    try {
      await twoFaApi.enableOtp();
      toast.success('Check your email for the verification code');
      setShowTwoFactorSetup(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsSavingTfa(false);
    }
  };

  const handleConfirmTwoFactor = async () => {
    if (!tfaVerifyCode.trim()) {
      toast.error('Please enter the verification code from your email');
      return;
    }

    setIsSavingTfa(true);
    try {
      await twoFaApi.verifyOtp(tfaVerifyCode);
      setTwoFactorEnabled(true);
      if (user) {
        updateUser({ ...user, two_factor_enabled: true });
      }
      setShowTwoFactorSetup(false);
      setTfaVerifyCode('');
      toast.success('Two-factor authentication enabled!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid or expired code');
    } finally {
      setIsSavingTfa(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!user?.id) {
      toast.error('Unable to identify current user');
      return;
    }

    setIsSavingTfa(true);
    try {
      await twoFaApi.disable();
      setTwoFactorEnabled(false);
      if (user) {
        updateUser({ ...user, two_factor_enabled: false });
      }
      toast.success('Two-factor authentication disabled');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to disable TFA');
    } finally {
      setIsSavingTfa(false);
    }
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
                {user?.avatar_url ? (
                  <img
                    src={toAbsoluteAssetUrl(user.avatar_url)}
                    alt="Profile avatar"
                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#42A090]/10 text-[#42A090] flex items-center justify-center font-bold text-2xl">
                    {initials}
                  </div>
                )}
                <label
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold transition-colors ${
                    isUploadingAvatar
                      ? 'bg-[#7cb9ae] cursor-not-allowed'
                      : 'bg-[#42A090] hover:bg-[#358070] cursor-pointer'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => void handleAvatarUpload(e)}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
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
                onClick={() => void handleProfileSave()}
                disabled={isSavingProfile}
                className="inline-flex items-center justify-center bg-[#42A090] hover:bg-[#358070] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
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
                    disabled={isSavingTfa}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
                  >
                    {isSavingTfa ? 'Disabling...' : 'Disable'}
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
                  <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                    <p className="text-sm font-medium text-teal-900 mb-2">📧 Check your email</p>
                    <p className="text-sm text-teal-700">We sent a 6-digit verification code to your email. Please enter it below.</p>
                    <p className="text-xs text-teal-600 mt-2">Code expires in 10 minutes.</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Enter the code from your email
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={tfaVerifyCode}
                      onChange={(e) => setTfaVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className={`${inputClassName} text-center text-xl tracking-widest`}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTwoFactorSetup(false);
                        setTfaVerifyCode('');
                      }}
                      className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmTwoFactor}
                      disabled={isSavingTfa || tfaVerifyCode.length !== 6}
                      className="flex-1 px-4 py-2.5 bg-[#42A090] hover:bg-[#358070] text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
                    >
                      {isSavingTfa ? 'Verifying...' : 'Verify & Enable'}
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
