import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse shadow-sm">
    <div className="w-full h-52 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
    <div className="px-5 pt-4 pb-3">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="h-5 bg-gray-100 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-5/6 mt-1.5" />
    </div>
    <div className="flex justify-between px-5 py-3 border-t border-gray-50">
      <div className="h-3 w-16 bg-gray-100 rounded" />
      <div className="flex gap-2">
        <div className="h-7 w-16 bg-gray-100 rounded-lg" />
        <div className="h-7 w-16 bg-gray-100 rounded-lg" />
      </div>
    </div>
  </div>
);

const AdminHero = () => (
  <div className="relative bg-white border-b border-gray-100 overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-50 rounded-full opacity-60 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-purple-50 rounded-full opacity-40 blur-3xl" />
    </div>

    <motion.div
      className="relative max-w-2xl mx-auto px-4 py-16 sm:py-24"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.div
        className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-500 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full mb-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block" />
        my space
      </motion.div>

      {/* Socrates Quote */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        <div className="flex items-start gap-3">
          <span className="text-5xl text-indigo-200 font-serif leading-none mt-1 select-none">"</span>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
              The unexamined life is<br />
              not worth <span className="text-indigo-600">living.</span>
            </p>
            <p className="text-sm text-gray-400 mt-3 tracking-widest uppercase font-medium">
              — Socrates
            </p>
          </div>
        </div>
      </motion.div>

      <motion.p
        className="text-sm text-gray-400 max-w-sm leading-relaxed mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        A quiet place where I write, share files, and put things I don't want to forget.
      </motion.p>

      <motion.div
        className="flex items-center gap-3 flex-wrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Link
          to="/create"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200 hover:shadow-indigo-300 hover:shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New post
        </Link>
        <Link
          to="/admin"
          className="text-sm font-medium text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 bg-white px-5 py-2.5 rounded-xl transition-all hover:shadow-sm"
        >
          Dashboard →
        </Link>
      </motion.div>
    </motion.div>
  </div>
);

export default function HomePage() {
  const { isAdmin } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = isAdmin ? '/posts/admin/all' : '/posts';
    API.get(endpoint)
      .then(res => setPosts(res.data.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Admin gets hero, public gets nothing */}
      {isAdmin && <AdminHero />}

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Admin gets section label, public gets nothing */}
        {isAdmin && (
          <motion.div
            className="flex items-center justify-between mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              All posts
            </h2>
            {!loading && posts.length > 0 && (
              <span className="text-xs text-gray-300 bg-gray-100 px-2.5 py-1 rounded-full">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </span>
            )}
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-5">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            className="text-center py-28"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              🌱
            </div>
            <p className="text-base font-semibold text-gray-600">Nothing here yet.</p>
            <p className="text-sm text-gray-400 mt-1">Check back soon!</p>
            {isAdmin && (
              <Link
                to="/create"
                className="inline-flex items-center gap-1.5 mt-5 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-400 px-4 py-2 rounded-xl transition-all"
              >
                Write your first post →
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="space-y-5"
            initial="hidden"
            animate="visible"
          >
            {posts.map((post, i) => (
              <PostCard key={post._id} post={post} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}