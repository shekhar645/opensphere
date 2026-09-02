import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminUpdatesPanel() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchUpdates = () => {
    setLoading(true);
    API.get('/updates')
      .then(res => setUpdates(res.data.data || []))
      .catch(() => setUpdates([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Update message is required');
      return;
    }
    setPosting(true);
    try {
      await API.post('/updates', { title: title.trim(), message: message.trim() });
      toast.success('Update posted');
      setTitle('');
      setMessage('');
      fetchUpdates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post update');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/updates/${id}`);
      setUpdates(prev => prev.filter(u => u._id !== id));
      toast.success('Update removed');
    } catch (err) {
      toast.error('Failed to delete update');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Post an update</h2>

      <form onSubmit={handlePost} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8 space-y-3">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="What's new?"
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={posting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-60"
          >
            {posting ? 'Posting...' : 'Post update'}
          </button>
        </div>
      </form>

      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Past updates</h3>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : updates.length === 0 ? (
        <p className="text-sm text-gray-400">No updates posted yet.</p>
      ) : (
        <div className="space-y-3">
          {updates.map((u) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl border border-gray-100 p-4 flex justify-between items-start gap-3"
            >
              <div>
                {u.title && <p className="text-sm font-semibold text-gray-800">{u.title}</p>}
                <p className="text-sm text-gray-600 mt-0.5">{u.message}</p>
                <p className="text-xs text-gray-300 mt-1">
                  {new Date(u.createdAt).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(u._id)}
                className="text-xs text-gray-300 hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}