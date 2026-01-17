'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LogOut,
  TrendingUp,
  Lock,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  organization: string;
  avatar?: string;
}

interface UserPreferences {
  timezone: string;
  dateFormat: string;
  numberFormat: string;
}

interface SettingsProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || '',
    email: user?.email || '',
    fullName: user?.fullName || '',
    organization: user?.organization || '',
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: '1,234.56',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const API_URL = 'http://localhost:8080/api';

  useEffect(() => {
    if (!user?.id) {
      console.warn('No user ID available');
      setError('User not authenticated');
      return;
    }
    fetchUserData();
  }, [user?.id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      console.log('Fetching user data for ID:', user?.id);
      const profileResponse = await axios.get(`${API_URL}/users/${user?.id}`);
      console.log('Profile response:', profileResponse.data);
      setProfile({
        id: profileResponse.data.id || user?.id || '',
        email: profileResponse.data.email || user?.email || '',
        fullName: profileResponse.data.fullName || '',
        organization: profileResponse.data.organization || '',
      });

      const prefsResponse = await axios.get(`${API_URL}/users/${user?.id}/preferences`);
      console.log('Preferences response:', prefsResponse.data);
      setPreferences({
        timezone: prefsResponse.data.timezone || 'UTC',
        dateFormat: prefsResponse.data.dateFormat || 'MM/DD/YYYY',
        numberFormat: prefsResponse.data.numberFormat || '1,234.56',
      });
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setError('Failed to load user data. Check browser console.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const profileData = {
        fullName: profile.fullName,
        organization: profile.organization,
        email: profile.email || user?.email,
      };
      console.log('Updating profile with data:', profileData);
      const response = await axios.put(`${API_URL}/users/${user?.id}`, profileData);
      console.log('Update response:', response.data);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Check browser console.');
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      setError(null);
      console.log('Updating preferences with data:', preferences);
      const response = await axios.put(`${API_URL}/users/${user?.id}/preferences`, preferences);
      console.log('Preferences update response:', response.data);
      setSuccess('Preferences saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError('Failed to save preferences. Check browser console.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError(null);
      await axios.post(`${API_URL}/users/${user?.id}/change-password`, {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new,
      });
      setSuccess('Password changed successfully');
      setPasswordForm({ current: '', new: '', confirm: '' });
      setShowPasswordModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to change password');
      console.error(err);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users/${user?.id}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `migration-data-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
      setSuccess('Data exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to export data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${API_URL}/users/${user?.id}`);
      await signOut();
      navigate('/');
    } catch (err) {
      setError('Failed to delete account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 relative font-sans selection:bg-orange-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(white 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'linear-gradient(to bottom, black 20%, transparent 90%)',
          }}
        ></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl h-16">
        <div className="px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center transform -rotate-12">
              <TrendingUp className="text-white h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-slate-400 hover:text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="Close settings"
            >
              <X className="h-5 w-5 text-slate-400 hover:text-white" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-8 relative z-10 w-full px-4">
        <motion.div
          className="max-w-2xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">Settings</h2>
            <p className="text-slate-400">Manage your account preferences</p>
            <div className="h-px bg-gradient-to-r from-orange-500/50 to-transparent mt-6"></div>
          </motion.div>

          {/* Alerts */}
          {error && (
            <motion.div
              variants={itemVariants}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{error}</p>
                <p className="text-xs mt-1 text-red-500/70">Check browser DevTools Console (F12) for details</p>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              variants={itemVariants}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-green-400"
            >
              <Check className="h-5 w-5 flex-shrink-0" />
              {success}
            </motion.div>
          )}

          {/* Section 1: User Information Card */}
          <motion.div
            variants={itemVariants}
            className="mb-8 bg-[#0a0a0a] backdrop-blur-md rounded-xl border border-white/5 p-8 shadow-lg"
          >
            <h3 className="text-2xl font-semibold text-white mb-6">Profile Information</h3>

            {/* Form Fields */}
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-base"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white disabled:opacity-75 disabled:cursor-not-allowed text-base placeholder-slate-600"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Organization <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={profile.organization}
                  onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-base"
                  placeholder="Your organization name"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto ml-auto block px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-500 hover:to-red-500 hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                Update Profile
              </button>
            </form>
          </motion.div>

          {/* Section 2: Preferences Card */}
          <motion.div
            variants={itemVariants}
            className="mb-8 bg-[#0a0a0a] backdrop-blur-md rounded-xl border border-white/5 p-8 shadow-lg"
          >
            <h3 className="text-2xl font-semibold text-white mb-6">Preferences</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Timezone</label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-base"
                >
                  <option>UTC</option>
                  <option>America/New_York</option>
                  <option>America/Chicago</option>
                  <option>America/Denver</option>
                  <option>America/Los_Angeles</option>
                  <option>Europe/London</option>
                  <option>Europe/Paris</option>
                  <option>Asia/Dubai</option>
                  <option>Asia/Dhaka</option>
                  <option>Asia/Tokyo</option>
                  <option>Australia/Sydney</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Date Format</label>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-base"
                >
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
                <p className="text-xs text-slate-600 mt-2">Example: 01/11/2026</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Number Format</label>
                <select
                  value={preferences.numberFormat}
                  onChange={(e) => setPreferences({ ...preferences, numberFormat: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-base"
                >
                  <option value="1,234.56">1,234.56 (US)</option>
                  <option value="1.234,56">1.234,56 (EU)</option>
                  <option value="1 234,56">1 234,56 (Space)</option>
                </select>
                <p className="text-xs text-slate-600 mt-2">Example: 1,234.56</p>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-slate-600 mb-4">Preferences are saved automatically</p>
                <button
                  onClick={handlePreferencesUpdate}
                  disabled={loading}
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Save Preferences
                </button>
              </div>
            </div>
          </motion.div>

          {/* Section 3: Account Actions Card */}
          <motion.div
            variants={itemVariants}
            className="bg-[#0a0a0a] backdrop-blur-md rounded-xl border border-white/5 p-8 shadow-lg"
          >
            <h3 className="text-2xl font-semibold text-white mb-2">Account Actions</h3>
            <p className="text-sm text-slate-500 mb-6">Manage your account security and data</p>

            <div className="space-y-4">
              {/* Change Password Button */}
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center gap-3 px-6 py-3 border border-white/10 text-slate-300 rounded-lg hover:bg-white/5 transition-colors text-left"
              >
                <Lock className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">Change Password</span>
              </button>

              {/* Export Data Button */}
              <button
                onClick={handleExportData}
                disabled={loading}
                className="w-full flex items-center gap-3 px-6 py-3 border border-white/10 text-slate-300 rounded-lg hover:bg-white/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <span className="font-medium block">Export My Data</span>
                  <span className="text-xs text-slate-600">Download all your migration history</span>
                </div>
              </button>

              {/* Delete Account Button */}
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full flex items-center gap-3 px-6 py-3 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-left"
                >
                  <Trash2 className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left">
                    <span className="font-medium block">Delete Account</span>
                    <span className="text-xs text-red-600">This action cannot be undone</span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a0a] border border-white/5 rounded-xl p-8 max-w-md w-full mx-4"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Change Password</h3>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 pr-10 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 pr-10 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 pr-10 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-4 py-2 border border-white/10 text-slate-300 rounded-lg hover:bg-white/5 font-medium transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a0a] border-2 border-red-500/30 rounded-xl p-8 max-w-md w-full mx-4"
            >
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>

              <h3 className="text-2xl font-bold text-white text-center mb-2">Delete Your Account?</h3>
              <p className="text-slate-400 text-center mb-6">
                This will permanently delete your account and all data. This action cannot be undone.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Type <span className="font-bold text-red-500">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full bg-black/40 border border-red-500/20 rounded-lg px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm"
                  placeholder="Type DELETE"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-white/10 text-slate-300 rounded-lg hover:bg-white/5 font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE' || loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Delete Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
