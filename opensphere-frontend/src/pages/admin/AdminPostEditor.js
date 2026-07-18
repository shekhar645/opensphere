import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: 'easeOut' }
  }),
};

function PostsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 items-center">
          <div className="w-14 h-14 bg-gray-100 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="h-7 w-20 bg-gray-100 rounded-xl" />
            <div className="h-7 w-16 bg-gray-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Toggle switch component
function Toggle({ enabled, onChange, loading }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={loading}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
        enabled ? 'bg-emerald-500' : 'bg-gray-200'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm ${
          enabled ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function AdminPostsList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [pinningId, setPinningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | published | draft | pinned

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = () => {
    setLoading(true);
    API.get('/posts/admin/all')
      .then(res => setPosts(res.data.data || []))
      .catch(() => toast.error('Failed to load posts'))
      .finally(() => setLoading(false));
  };

  const handleTogglePublish = async (post) => {
    setTogglingId(post._id);
    try {
      const res = await API.put(`/posts/${post._id}`, {
        ...post,
        category: post.category?._id || post.category,
        tags: post.tags?.map(t => t._id || t),
        isPublished: !post.isPublished,
      });
      setPosts(prev =>
        prev.map(p => p._id === post._id ? { ...p, isPublished: !p.isPublished } : p)
      );
      toast.success(!post.isPublished ? 'Post published!' : 'Moved to drafts');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleTogglePin = async (post) => {
    setPinningId(post._id);
    try {
      await API.put(`/posts/${post._id}`, {
        ...post,
        category: post.category?._id || post.category,
        tags: post.tags?.map(t => t._id || t),
        isPinned: !post.isPinned,
      });
      setPosts(prev =>
        prev.map(p => p._id === post._id ? { ...p, isPinned: !p.isPinned } : p)
      );
      toast.success(!post.isPinned ? 'Post pinned to top!' : 'Post unpinned');
    } catch {
      toast.error('Failed to update pin');
    } finally {
      setPinningId(null);
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setDeletingId(post._id);
    try {
      await API.delete(`/posts/${post._id}`);
      setPosts(prev => prev.filter(p => p._id !== post._id));
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter + search
  const filtered = posts
    .filter(p => {
      if (filter === 'published') return p.isPublished;
      if (filter === 'draft') return !p.isPublished;
      if (filter === 'pinned') return p.isPinned;
      return true;
    })
    .filter(p =>
      !search.trim() ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase())
    )
    // Pinned posts float to top
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const counts = {
    all: posts.length,
    published: posts.filter(p => p.isPublished).length,
    draft: posts.filter(p => !p.isPublished).length,
    pinned: posts.filter(p => p.isPinned).length,
  };

  const filterTabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'published', label: 'Published', count: counts.published },
    { key: 'draft', label: 'Drafts', count: counts.draft },
    { key: 'pinned', label: 'Pinned', count: counts.pinned },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">

      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Posts</h1>
          <p className="text-sm text-gray-400 mt-1">{posts.length} total posts</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Link
            to="/admin/posts/new"
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </Link>
        </motion.div>
      </motion.div>

      {/* Search + Filter */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full bg-white border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white border border-gray-100 text-gray-500 hover:text-indigo-600 hover:border-indigo-200'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                filter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Posts List */}
      {loading ? (
        <PostsSkeleton />
      ) : filtered.length === 0 ? (
        <motion.div
          className="text-center py-24"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-600">No posts found.</p>
          <p className="text-xs text-gray-400 mt-1">
            {search ? `No results for "${search}"` : 'Create your first post to get started.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((post, i) => (
              <motion.div
                key={post._id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                layout
                className={`bg-white border rounded-2xl p-4 flex gap-4 items-center transition-all duration-200 hover:shadow-md ${
                  post.isPinned ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100'
                }`}
              >
                {/* Cover thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.isPinned && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z"/>
                        </svg>
                        Pinned
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-gray-800 truncate">{post.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {post.category && (
                      <span className="text-xs text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full">{post.category.name}</span>
                    )}
                    {post.createdAt && (
                      <span className="text-xs text-gray-300">
                        {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                    {post.views !== undefined && (
                      <span className="flex items-center gap-1 text-xs text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {post.views}
                      </span>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 shrink-0">

                  {/* Publish toggle */}
                  <div className="flex flex-col items-center gap-1">
                    <Toggle
                      enabled={post.isPublished}
                      onChange={() => handleTogglePublish(post)}
                      loading={togglingId === post._id}
                    />
                    <span className={`text-xs font-medium ${post.isPublished ? 'text-emerald-500' : 'text-gray-300'}`}>
                      {post.isPublished ? 'Live' : 'Draft'}
                    </span>
                  </div>

                  {/* Pin toggle */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleTogglePin(post)}
                    disabled={pinningId === post._id}
                    title={post.isPinned ? 'Unpin post' : 'Pin to top'}
                    className={`p-2 rounded-xl transition-colors disabled:opacity-50 ${
                      post.isPinned
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-gray-50 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50'
                    }`}
                  >
                    {pinningId === post._id ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill={post.isPinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    )}
                  </motion.button>

                  {/* Edit */}
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Link
                      to={`/admin/posts/edit/${post._id}`}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 px-3 py-2 rounded-xl transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Link>
                  </motion.div>

                  {/* Delete */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(post)}
                    disabled={deletingId === post._id}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                  >
                    {deletingId === post._id ? (
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}