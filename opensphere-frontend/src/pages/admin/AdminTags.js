import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.3, delay: i * 0.05, ease: 'easeOut' }
  }),
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
};

function TagsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2 animate-pulse">
      {[80, 64, 96, 72, 56, 88].map((w, i) => (
        <div key={i} className="h-8 rounded-full bg-gray-200" style={{ width: w }} />
      ))}
    </div>
  );
}

export default function AdminTags() {
  const [tags, setTags] = useState([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTags = () => {
    setFetching(true);
    API.get('/tags')
      .then(res => setTags(res.data.data || []))
      .finally(() => setFetching(false));
  };

  useEffect(() => { fetchTags(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await API.post('/tags', { name, color });
      toast.success('Tag created!');
      setName('');
      setColor('#8b5cf6');
      fetchTags();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create tag');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tag?')) return;
    setDeletingId(id);
    try {
      await API.delete(`/tags/${id}`);
      toast.success('Tag deleted');
      setTags(prev => prev.filter(t => t._id !== id));
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  // Preview color for the new tag
  const previewStyle = { backgroundColor: color };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">

      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      >
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Tags</h1>
        <p className="text-sm text-gray-400 mt-0.5">Create and manage post tags</p>
      </motion.div>

      {/* Create form */}
      <motion.div
        className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h2 className="font-semibold text-gray-700 mb-3">Add New Tag</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="flex gap-3 items-center">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Tag name"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {/* Color picker + preview */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer p-0.5"
                title="Pick tag color"
              />
            </div>
          </div>

          {/* Live preview */}
          {name && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <span className="text-xs text-gray-400">Preview:</span>
              <span
                className="text-xs px-3 py-1 rounded-full text-white font-medium"
                style={previewStyle}
              >
                {name}
              </span>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Creating...
              </>
            ) : '+ Create Tag'}
          </motion.button>
        </form>
      </motion.div>

      {/* Tags list */}
      <motion.div
        className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">All Tags</h2>
          {tags.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{tags.length} total</span>
          )}
        </div>

        {fetching ? (
          <TagsSkeleton />
        ) : tags.length === 0 ? (
          <motion.div
            className="text-center py-12 text-gray-400"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <p className="text-3xl mb-2">🏷️</p>
            <p className="text-sm">No tags yet. Create your first one above!</p>
          </motion.div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {tags.map((tag, i) => (
                <motion.span
                  key={tag._id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full text-white font-medium shadow-sm"
                  style={{ backgroundColor: tag.color || '#8b5cf6' }}
                >
                  {tag.name}
                  <button
                    onClick={() => handleDelete(tag._id)}
                    disabled={deletingId === tag._id}
                    className="hover:opacity-70 transition ml-0.5 text-xs leading-none disabled:opacity-40"
                    title="Delete tag"
                  >
                    {deletingId === tag._id ? '...' : '✕'}
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}