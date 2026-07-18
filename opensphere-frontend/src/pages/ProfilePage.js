import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { uploadToCloudinary } from '../utils/cloudinary';
import toast from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, delay: i * 0.07, ease: 'easeOut' }
  }),
};

const tabContent = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-5 mb-10">
        <div className="w-24 h-24 rounded-full bg-gray-100" />
        <div className="space-y-2">
          <div className="h-5 w-36 bg-gray-100 rounded-lg" />
          <div className="h-3 w-24 bg-gray-100 rounded-lg" />
          <div className="h-3 w-16 bg-gray-100 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-9 w-28 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="h-10 w-full bg-gray-100 rounded-xl" />
          </div>
        ))}
        <div className="h-10 w-28 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

const inputClass = "w-full border border-gray-100 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 focus:bg-white transition-all";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ fullName: '', bio: '', profilePicture: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [posts, setPosts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    Promise.all([
      API.get('/users/me'),
      API.get(`/users/${user?.username}`)
    ]).then(([meRes, pubRes]) => {
      const u = meRes.data.data;
      setProfile({ fullName: u.fullName || '', bio: u.bio || '', profilePicture: u.profilePicture || '' });
      setPosts(pubRes.data.data?.posts || []);
    }).catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoadingProfile(false));
  }, [user]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const result = await uploadToCloudinary(file);
      setProfile(prev => ({ ...prev, profilePicture: result.url }));
      toast.success('Photo uploaded — save profile to apply');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await API.put('/users/me', {
        fullName: profile.fullName,
        bio: profile.bio,
        profilePicture: profile.profilePicture,
      });
      if (setUser) setUser(res.data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    setSavingPassword(true);
    try {
      await API.put('/users/me/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleShow = (key) => setShowPasswords(p => ({ ...p, [key]: !p[key] }));

  if (loadingProfile) return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <ProfileSkeleton />
    </div>
  );

  const tabs = [
    { key: 'profile', label: 'Edit Profile' },
    { key: 'password', label: 'Password' },
    { key: 'posts', label: `Posts (${posts.length})` },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">

      {/* Profile Header */}
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-10"
        initial="hidden" animate="visible" variants={fadeUp}
      >
        {/* Avatar */}
        <motion.div className="relative shrink-0 group" whileHover={{ scale: 1.03 }}>
          {profile.profilePicture ? (
            <img
              src={profile.profilePicture}
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-indigo-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-500 font-bold text-3xl shadow-md ring-2 ring-indigo-100">
              {profile.fullName?.[0]?.toUpperCase() || '?'}
            </div>
          )}

          {/* Upload overlay */}
          <label className="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-200">
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
          </label>

          {/* Uploading spinner */}
          {uploadingAvatar && (
            <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div variants={fadeUp} custom={1}>
          <h1 className="text-2xl font-bold text-gray-900">{profile.fullName || 'Your Name'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">@{user?.username}</p>
          {profile.bio && (
            <p className="text-sm text-gray-500 mt-1.5 max-w-xs leading-relaxed">{profile.bio}</p>
          )}
          <p className="text-xs text-gray-300 mt-2 font-medium">
            {posts.length} public {posts.length === 1 ? 'post' : 'posts'}
          </p>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide"
        initial="hidden" animate="visible" variants={fadeUp} custom={2}
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white border border-gray-100 text-gray-500 hover:text-indigo-600 hover:border-indigo-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">

        {/* Edit Profile */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            variants={tabContent}
            initial="hidden" animate="visible" exit="exit"
            className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
              <input
                value={profile.fullName}
                onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                className={inputClass}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Bio</label>
              <textarea
                value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                rows={4}
                maxLength={300}
                className={`${inputClass} resize-none`}
                placeholder="Tell readers about yourself..."
              />
              <p className="text-xs text-gray-300 text-right mt-1">{profile.bio.length}/300</p>
            </div>
            <motion.button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200"
            >
              {savingProfile ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Save Profile
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Change Password */}
        {activeTab === 'password' && (
          <motion.div
            key="password"
            variants={tabContent}
            initial="hidden" animate="visible" exit="exit"
          >
            <motion.div
              animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm"
            >
              {[
                { label: 'Current Password', key: 'currentPassword' },
                { label: 'New Password', key: 'newPassword' },
                { label: 'Confirm New Password', key: 'confirmPassword' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <div className="relative">
                    <input
                      type={showPasswords[key] ? 'text' : 'password'}
                      value={passwords[key]}
                      onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                      className={`${inputClass} pr-10`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow(key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <EyeIcon open={showPasswords[key]} />
                    </button>
                  </div>
                </div>
              ))}
              <motion.button
                onClick={handleChangePassword}
                disabled={savingPassword}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200"
              >
                {savingPassword ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Change Password
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* My Posts */}
        {activeTab === 'posts' && (
          <motion.div
            key="posts"
            variants={tabContent}
            initial="hidden" animate="visible" exit="exit"
            className="space-y-3"
          >
            {posts.length === 0 ? (
              <motion.div
                className="text-center py-20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-600">No public posts yet.</p>
                <p className="text-xs text-gray-400 mt-1">Start writing — your first post is waiting.</p>
              </motion.div>
            ) : (
              posts.map((post, i) => (
                <motion.div
                  key={post._id}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                >
                  <Link
                    to={`/post/${post.slug}`}
                    className="flex gap-3 sm:gap-4 bg-white border border-gray-100 rounded-2xl p-3.5 sm:p-4 hover:shadow-md hover:border-indigo-100 transition-all duration-200 block"
                  >
                    {post.coverImage && (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-16 h-14 sm:w-20 sm:h-16 object-cover rounded-xl shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-800 truncate">{post.title}</h3>
                      {post.shortDescription && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{post.shortDescription}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-300">
                        {post.readingTime && <span>{post.readingTime} min read</span>}
                        {post.views !== undefined && <span>· {post.views} views</span>}
                        {post.category && (
                          <span className="text-indigo-400 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                            {post.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center shrink-0 text-gray-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}