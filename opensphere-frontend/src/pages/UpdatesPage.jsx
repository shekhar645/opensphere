import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';

const UpdatesPage = ({ user }) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', image: { url: '' } });
  const [editingId, setEditingId] = useState(null);

  // Fetch updates
  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const res = await API.get('/updates');
      setUpdates(res.data.data);
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create or update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    try {
      if (editingId) {
        await API.put(`/updates/${editingId}`, formData);
        toast.success('Update edited successfully');
      } else {
        await API.post('/updates', formData);
        toast.success('Update posted successfully');
      }
      setFormData({ title: '', description: '', image: { url: '' } });
      setEditingId(null);
      setShowForm(false);
      fetchUpdates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving update');
    }
  };

  // Delete update
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this update?')) return;
    try {
      await API.delete(`/updates/${id}`);
      toast.success('Update deleted');
      fetchUpdates();
    } catch (error) {
      toast.error('Error deleting update');
    }
  };

  // Edit update
  const handleEdit = (update) => {
    setFormData({
      title: update.title,
      description: update.description,
      image: update.image || { url: '' }
    });
    setEditingId(update._id);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header with large logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-100 sticky top-0 z-40"
      >
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          {/* Large Logo */}
          <div className="mb-6 flex justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-32 h-32 bg-indigo-100 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <span className="text-5xl font-bold text-indigo-600">◉</span>
            </motion.div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Latest Updates</h1>
          <p className="text-gray-500">News and announcements from OpenSphere</p>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Admin Create Button */}
        {user?.role === 'admin' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ title: '', description: '', image: { url: '' } });
            }}
            className="mb-8 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <span>+</span>
            Post New Update
          </motion.button>
        )}

        {/* Create/Edit Form */}
        <AnimatePresence>
          {showForm && user?.role === 'admin' && (
            <motion.form
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                {editingId ? 'Edit Update' : 'Create New Update'}
              </h2>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., New Feature Released"
                    maxLength="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formData.title.length}/100</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Write your update message here..."
                    maxLength="500"
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formData.description.length}/500</p>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image?.url || ''}
                    onChange={(e) => setFormData({ ...formData, image: { url: e.target.value } })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                  {formData.image?.url && (
                    <motion.img
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={formData.image.url}
                      alt="Preview"
                      className="mt-4 max-w-full h-40 object-cover rounded-xl"
                    />
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
                  >
                    {editingId ? 'Update' : 'Post Update'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({ title: '', description: '', image: { url: '' } });
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Updates List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : updates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl text-gray-500">No updates yet</p>
            {user?.role === 'admin' && (
              <p className="text-gray-400 mt-2">Be the first to post an update!</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {updates.map((update) => (
              <motion.div
                key={update._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  {update.image?.url && (
                    <div className="md:w-64 h-64 md:h-auto overflow-hidden bg-gray-100">
                      <motion.img
                        whileHover={{ scale: 1.05 }}
                        src={update.image.url}
                        alt={update.title}
                        className="w-full h-full object-cover transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 p-8 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {update.title}
                      </h3>
                      <p className="text-gray-600 text-lg leading-relaxed mb-4">
                        {update.description}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        {update.author?.profilePicture && (
                          <img
                            src={update.author.profilePicture}
                            alt={update.author.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div className="text-sm">
                          <p className="font-semibold text-gray-900">
                            {update.author?.fullName || 'Anonymous'}
                          </p>
                          <p className="text-gray-400">
                            {new Date(update.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Admin Actions */}
                      {user?.role === 'admin' && (
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(update)}
                            className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-all text-sm font-semibold"
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(update._id)}
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all text-sm font-semibold"
                          >
                            Delete
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UpdatesPage;