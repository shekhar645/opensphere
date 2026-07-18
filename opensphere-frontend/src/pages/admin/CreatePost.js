import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC_EVERYONE', label: '🌍 Public', desc: 'Visible to everyone' },
  { value: 'PRIVATE', label: '🔒 Private', desc: 'Only visible to you (the author) and admins' },
];

export default function CreatePost() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC_EVERYONE');
  const [categoryId, setCategoryId] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const coverInputRef = useRef();

  const [attachments, setAttachments] = useState([]);
  const attachInputRef = useRef();

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('write');

  useEffect(() => {
    API.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
    API.get('/tags').then(r => setTags(r.data.data || [])).catch(() => {});
  }, []);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverImageFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const removeCover = () => {
    setCoverImageFile(null);
    setCoverPreview('');
    coverInputRef.current.value = '';
  };

  const handleAttachments = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
    attachInputRef.current.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await API.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  };

  const handleSubmit = async (asDraft = false) => {
    if (!title.trim()) return toast.error('Title is required');
    if (!content.trim()) return toast.error('Content is required');

    setSubmitting(true);
    try {
      let coverImageUrl = '';

      if (coverImageFile) {
        try {
          const result = await uploadToCloudinary(coverImageFile);
          coverImageUrl = result.url || result.secure_url || '';
        } catch {
          toast.error('Cover image upload failed');
          setSubmitting(false);
          return;
        }
      }

      const uploadedAttachments = [];
      for (const file of attachments) {
        try {
          const result = await uploadToCloudinary(file);
          uploadedAttachments.push({
            url: result.url || result.secure_url,
            originalName: file.name,
            format: file.name.split('.').pop(),
            size: file.size,
            publicId: result.public_id || '',
          });
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        content,
        visibility,
        category: categoryId || undefined,
        tags: selectedTags,
        isFeatured,
        isDraft: asDraft,
        isPublished: !asDraft,
        coverImage: coverImageUrl,
        attachments: uploadedAttachments,
      };

      await API.post('/posts', payload);
      toast.success(asDraft ? 'Draft saved!' : 'Post published! 🎉');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-gray-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-700">New Post</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {['write', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition capitalize ${
                  activeTab === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'write' ? '✏️ Write' : '⚙️ Settings'}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Publishing...
                </>
              ) : 'Publish →'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-6">

          {/* Main */}
          <div className="flex-1 min-w-0">

            {activeTab === 'write' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Cover image */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {coverPreview ? (
                    <div className="relative">
                      <img src={coverPreview} alt="Cover" className="w-full h-52 object-cover" />
                      <button
                        type="button"
                        onClick={removeCover}
                        className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-700 rounded-full w-7 h-7 flex items-center justify-center shadow text-sm transition"
                      >✕</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverInputRef.current.click()}
                      className="w-full h-32 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-2xl"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-medium">Add cover image</span>
                    </button>
                  )}
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </div>

                {/* Title & subtitle */}
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 space-y-3">
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Post title..."
                    className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 outline-none border-none bg-transparent"
                  />
                  <input
                    type="text"
                    value={subtitle}
                    onChange={e => setSubtitle(e.target.value)}
                    placeholder="Subtitle (optional)..."
                    className="w-full text-sm text-gray-500 placeholder-gray-300 outline-none border-none bg-transparent"
                  />
                </div>

                {/* Markdown editor */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" data-color-mode="light">
                  <MDEditor
                    value={content}
                    onChange={setContent}
                    height={400}
                    preview="live"
                  />
                  <div className="px-4 py-2 border-t border-gray-50 text-xs text-gray-300 text-right">
                    {wordCount} words
                  </div>
                </div>

                {/* Attachments */}
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Attachments</span>
                    <button
                      type="button"
                      onClick={() => attachInputRef.current.click()}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50 transition"
                    >
                      + Add file
                    </button>
                  </div>
                  <input ref={attachInputRef} type="file" multiple className="hidden" onChange={handleAttachments} />

                  {attachments.length === 0 ? (
                    <p className="text-xs text-gray-300 text-center py-4">No attachments — PDF, ZIP, images, etc.</p>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                          <span className="text-lg">
                            {file.name.endsWith('.pdf') ? '📄' : file.name.endsWith('.zip') ? '🗜️' : file.type.startsWith('image') ? '🖼️' : '📎'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button type="button" onClick={() => removeAttachment(i)} className="text-gray-300 hover:text-red-400 transition text-sm">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Visibility */}
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Visibility</p>
                  <div className="space-y-2">
                    {VISIBILITY_OPTIONS.map(opt => (
                      <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${visibility === opt.value ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <input
                          type="radio"
                          name="visibility"
                          value={opt.value}
                          checked={visibility === opt.value}
                          onChange={() => setVisibility(opt.value)}
                          className="mt-0.5 accent-indigo-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                          <p className="text-xs text-gray-400">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Category</p>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 bg-white"
                  >
                    <option value="">No category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Tags</p>
                  {tags.length === 0 ? (
                    <p className="text-xs text-gray-300">No tags found.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <button
                          key={tag._id}
                          type="button"
                          onClick={() => toggleTag(tag._id)}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium border transition ${
                            selectedTags.includes(tag._id)
                              ? 'text-white border-transparent'
                              : 'text-gray-600 border-gray-200 bg-gray-50 hover:border-gray-300'
                          }`}
                          style={selectedTags.includes(tag._id) ? { backgroundColor: tag.color || '#8b5cf6' } : {}}
                        >
                          #{tag.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Options</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={e => setIsFeatured(e.target.checked)}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">⭐ Featured post</p>
                      <p className="text-xs text-gray-400">Pin this to the top of your feed</p>
                    </div>
                  </label>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20 space-y-3">
              <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Summary</p>
                <p className="text-xs text-gray-600 font-medium truncate">{title || 'Untitled'}</p>
                <p className="text-xs text-gray-400 mt-1">{wordCount} words</p>
                <p className="text-xs text-gray-400">{attachments.length} attachment{attachments.length !== 1 ? 's' : ''}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {VISIBILITY_OPTIONS.find(o => o.value === visibility)?.label}
                </p>
              </div>
              {coverPreview && (
                <div className="rounded-2xl overflow-hidden border border-gray-100">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-28 object-cover" />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}