import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import { getFileIcon, formatFileSize } from '../utils/cloudinary';
import PostEngagement from '../components/PostEngagement';
import toast from 'react-hot-toast';

const PostSkeleton = () => (
  <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
    <div className="w-full h-72 bg-gray-100 rounded-2xl mb-8" />
    <div className="h-4 bg-gray-100 rounded w-24 mb-4" />
    <div className="h-8 bg-gray-200 rounded w-3/4 mb-3" />
    <div className="h-5 bg-gray-100 rounded w-1/2 mb-8" />
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className={`h-3 bg-gray-100 rounded ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  </div>
);

export default function PostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    API.get(`/posts/${slug}`)
      .then(res => {
        setPost(res.data.data);
        setRelatedPosts(res.data.relatedPosts || []);
      })
      .catch(err => {
        if (err.response?.status === 403) setError('You do not have access to this post.');
        else if (err.response?.status === 404) setError('Post not found.');
        else setError('Something went wrong.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(scrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleShare = () => {
    const apiBase = process.env.REACT_APP_API_URL || 'https://api.opensphere.sbs/api';
    const previewUrl = `${apiBase.replace(/\/api$/, '')}/api/posts/${slug}/preview`;
    navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (file, index) => {
    setDownloadingIndex(index);
    try {
      const response = await API.get(
        `/posts/${post._id}/download/${index}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName || `file.${file.format || 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloadingIndex(null);
    }
  };

  if (loading) return <PostSkeleton />;

  if (error) return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 py-24 text-center"
    >
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-lg font-semibold text-gray-800 mb-1">{error}</p>
      <p className="text-sm text-gray-400 mb-6">The page you're looking for isn't available.</p>
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-400 px-4 py-2 rounded-xl transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to home
      </button>
    </motion.div>
  );

  if (!post) return null;

  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-0.5 bg-gray-100 z-50">
        <div
          className="h-full bg-indigo-600 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-3xl mx-auto px-4 py-8 sm:py-12"
      >
        <div className="flex items-center justify-between mb-8">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </motion.button>
        </div>

        {post.coverImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-56 sm:h-80 rounded-2xl overflow-hidden mb-8 bg-gray-100 group"
          >
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
          </motion.div>
        )}

        <div className="flex items-center gap-2.5 mb-4 flex-wrap">
          {post.category && (
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
              {post.category.name}
            </span>
          )}
          {post.readingTime && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="10" strokeLinecap="round" />
              </svg>
              {post.readingTime} min read
            </span>
          )}
          {formattedDate && (
            <span className="text-xs text-gray-300">· {formattedDate}</span>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3">
          {post.title}
        </h1>
        {post.subtitle && (
          <p className="text-base sm:text-xl text-gray-400 mb-8 leading-relaxed">
            {post.subtitle}
          </p>
        )}

        <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-100">
          <div className="w-16 h-2.5 bg-indigo-400 rounded-full" />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-600 border border-gray-100 hover:border-indigo-200 bg-white px-4 py-2 rounded-xl transition-all duration-150"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="copied"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5 text-green-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </motion.span>
              ) : (
                <motion.span
                  key="share"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <div
          className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed
            prose-headings:font-bold prose-headings:text-gray-900
            prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:w-full prose-img:object-cover
            prose-blockquote:border-l-4 prose-blockquote:border-indigo-200 prose-blockquote:text-gray-500 prose-blockquote:bg-indigo-50/40 prose-blockquote:py-1 prose-blockquote:rounded-r-lg
            prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono
            prose-pre:bg-gray-900 prose-pre:rounded-xl prose-pre:text-gray-100"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-gray-100">
            {post.tags.map((tag, i) => (
              <motion.span
                key={tag._id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="text-xs px-3 py-1.5 rounded-full text-white font-medium"
                style={{ backgroundColor: tag.color || '#8b5cf6' }}
              >
                #{tag.name}
              </motion.span>
            ))}
          </div>
        )}
       <PostEngagement postId={post._id} />
        {post.attachments?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 pt-8 border-t border-gray-100"
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Attachments · {post.attachments.length}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {post.attachments.map((file, i) => (
                <motion.button
                  key={i}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDownload(file, i)}
                  disabled={downloadingIndex === i}
                  className="flex items-center gap-3 bg-white hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-xl px-4 py-3.5 transition-all duration-150 text-left w-full disabled:opacity-60"
                >
                  <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-lg">
                    {getFileIcon(file.format)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{file.originalName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>
                  </div>
                  <span className="text-indigo-500 shrink-0">
                    {downloadingIndex === i ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {relatedPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-14 pt-10 border-t border-gray-100"
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
              Related Posts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedPosts.map((rp) => (
                <motion.button
                  key={rp._id}
                  whileHover={{ y: -3 }}
                  onClick={() => navigate(`/post/${rp.slug}`)}
                  className="text-left bg-white border border-gray-100 hover:border-indigo-200 rounded-xl overflow-hidden transition-all duration-150"
                >
                  {rp.coverImage && (
                    <div className="h-32 bg-gray-100">
                      <img src={rp.coverImage} alt={rp.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2">{rp.title}</p>
                    {rp.subtitle && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{rp.subtitle}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-300">
                      {rp.readingTime && <span>{rp.readingTime} min read</span>}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="flex justify-center mt-14">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-indigo-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            Back to top
          </button>
        </div>
      </motion.article>
    </>
  );
}