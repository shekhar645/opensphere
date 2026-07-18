import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../api/axios';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }
  }),
};

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl p-5 bg-gray-100 h-28" />
      ))}
    </div>
  );
}

const icons = {
  posts: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  published: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  drafts: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  users: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  manage: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  categories: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  tags: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 9V4a1 1 0 011-1z" />
    </svg>
  ),
  usersLink: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/posts/admin/stats'),
      API.get('/posts/admin/all'),
    ])
      .then(([statsRes, postsRes]) => {
        setStats(statsRes.data.data);
        const all = postsRes.data.data || [];
        setRecentPosts(all.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    {
      label: 'Total Posts',
      value: stats.total ?? 0,
      icon: icons.posts,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      valuColor: 'text-indigo-700',
      border: 'border-indigo-100',
      bg: 'bg-indigo-50/60',
    },
    {
      label: 'Published',
      value: stats.published ?? 0,
      icon: icons.published,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      valuColor: 'text-emerald-700',
      border: 'border-emerald-100',
      bg: 'bg-emerald-50/60',
    },
    {
      label: 'Drafts',
      value: stats.drafts ?? 0,
      icon: icons.drafts,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      valuColor: 'text-amber-700',
      border: 'border-amber-100',
      bg: 'bg-amber-50/60',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers ?? 0,
      icon: icons.users,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      valuColor: 'text-purple-700',
      border: 'border-purple-100',
      bg: 'bg-purple-50/60',
    },
  ] : [];

  const quickLinks = [
    { label: 'Manage Posts', to: '/admin/posts', desc: 'Create, edit, delete posts', icon: icons.manage, accent: 'group-hover:text-indigo-600', border: 'group-hover:border-indigo-200' },
    { label: 'Categories', to: '/admin/categories', desc: 'Manage post categories', icon: icons.categories, accent: 'group-hover:text-emerald-600', border: 'group-hover:border-emerald-200' },
    { label: 'Tags', to: '/admin/tags', desc: 'Manage post tags', icon: icons.tags, accent: 'group-hover:text-amber-600', border: 'group-hover:border-amber-200' },
    { label: 'Users', to: '/admin/users', desc: 'View and manage users', icon: icons.usersLink, accent: 'group-hover:text-purple-600', border: 'group-hover:border-purple-200' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">

      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-10"
        initial="hidden" animate="visible" variants={fadeUp}
      >
        <div>
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">Admin Panel</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Here's what's going on with your content.</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Link
            to="/create"
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </Link>
        </motion.div>
      </motion.div>

      {/* Stat Cards */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className={`rounded-2xl p-5 border ${card.bg} ${card.border} shadow-sm cursor-default`}
            >
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${card.iconBg} ${card.iconColor} mb-3`}>
                {card.icon}
              </div>
              <p className={`text-3xl font-bold ${card.valuColor}`}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">{card.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <motion.h2
        className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
      >
        Quick Actions
      </motion.h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
        {quickLinks.map((item, i) => (
          <motion.div
            key={item.to}
            custom={i + 4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
          >
            <Link
              to={item.to}
              className={`group flex flex-col gap-2.5 bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all duration-200 h-full ${item.border}`}
            >
              <div className={`text-gray-400 transition-colors duration-200 ${item.accent}`}>
                {item.icon}
              </div>
              <p className={`font-semibold text-gray-800 text-sm transition-colors duration-200 ${item.accent}`}>{item.label}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Posts */}
      {!loading && recentPosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Recent Posts</h2>
            <Link to="/admin/posts" className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
              View all →
            </Link>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {recentPosts.map((post, i) => (
              <motion.div
                key={post._id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className={`flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors duration-150 ${i !== recentPosts.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${post.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <p className="text-sm font-medium text-gray-800 truncate">{post.title}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    post.status === 'published'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {post.status}
                  </span>
                  <Link
                    to={`/admin/posts/edit/${post._id}`}
                    className="text-xs text-gray-400 hover:text-indigo-600 transition-colors font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}