import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.28, delay: i * 0.05, ease: 'easeOut' }
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
};

function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex gap-8">
        {['w-24', 'w-20', 'w-16', 'w-16'].map((w, i) => (
          <div key={i} className={`h-3 ${w} bg-gray-200 rounded`} />
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="px-4 py-3.5 border-b border-gray-100 flex gap-8 items-center">
          <div className="h-3 w-48 bg-gray-200 rounded flex-1" />
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
          <div className="flex gap-2">
            <div className="h-5 w-8 bg-gray-200 rounded" />
            <div className="h-5 w-10 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

const visibilityBadge = (v) => {
  const map = {
    PUBLIC_EVERYONE: 'bg-green-100 text-green-700',
    PUBLIC_LOGGED_IN: 'bg-blue-100 text-blue-700',
    PRIVATE: 'bg-red-100 text-red-700',
    SHARED_USERS: 'bg-yellow-100 text-yellow-700',
  };
  return map[v] || 'bg-gray-100 text-gray-700';
};

const visibilityLabel = (v) => {
  const map = {
    PUBLIC_EVERYONE: 'Everyone',
    PUBLIC_LOGGED_IN: 'Logged In',
    PRIVATE: 'Private',
    SHARED_USERS: 'Shared',
  };
  return map[v] || v;
};

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState('all'); // all | published | draft

  const fetchPosts = () => {
    API.get('/posts/admin/all')
      .then(res => setPosts(res.data.data || []))
      .catch(() => toast.error('Failed to load posts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    setDeletingId(id);
    try {
      await API.delete(`/posts/${id}`);
      toast.success('Post deleted');
      setPosts(prev => prev.filter(p => p._id !== id));
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = posts.filter(p => {
    if (filter === 'published') return p.isPublished;
    if (filter === 'draft') return !p.isPublished;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">

      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">All Posts</h1>
          <p className="text-sm text-gray-400 mt-0.5">{posts.length} post{posts.length !== 1 ? 's' : ''} total</p>
        </div>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Link
            to="/create"
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium border border-indigo-600 hover:bg-white hover:text-indigo-600 transition-all duration-200"
          >
            + New Post
          </Link>
        </motion.div>
      </motion.div>

      {/* Filter tabs */}
      {!loading && posts.length > 0 && (
        <motion.div
          className="flex gap-1 mb-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        >
          {[
            { key: 'all', label: `All (${posts.length})` },
            { key: 'published', label: `Published (${posts.filter(p => p.isPublished).length})` },
            { key: 'draft', label: `Drafts (${posts.filter(p => !p.isPublished).length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <TableSkeleton />
      ) : posts.length === 0 ? (
        <motion.div
          className="text-center py-24 text-gray-400"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <p className="text-4xl mb-3">📄</p>
          <p className="font-medium text-gray-500">No posts yet.</p>
          <p className="text-sm mt-1">Create your first post to get started!</p>
        </motion.div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Visibility</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {filtered.map((post, i) => (
                    <motion.tr
                      key={post._id}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-xs">
                        <span className="truncate block max-w-xs">{post.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${visibilityBadge(post.visibility)}`}>
                          {visibilityLabel(post.visibility)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${post.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {post.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3 items-center">
                          <Link
                            to={`/admin/posts/edit/${post._id}`}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(post._id)}
                            disabled={deletingId === post._id}
                            className="text-red-500 hover:text-red-700 text-xs font-medium transition disabled:opacity-40"
                          >
                            {deletingId === post._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            <AnimatePresence>
              {filtered.map((post, i) => (
                <motion.div
                  key={post._id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                >
                  <p className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2">{post.title}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${visibilityBadge(post.visibility)}`}>
                      {visibilityLabel(post.visibility)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${post.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {post.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex gap-4 border-t border-gray-100 pt-2">
                    <Link
                      to={`/admin/posts/edit/${post._id}`}
                      className="text-indigo-600 text-xs font-medium hover:text-indigo-800 transition"
                    >
                      ✏️ Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(post._id)}
                      disabled={deletingId === post._id}
                      className="text-red-500 text-xs font-medium hover:text-red-700 transition disabled:opacity-40"
                    >
                      🗑️ {deletingId === post._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}