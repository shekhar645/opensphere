import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function PostCard({ post, index }) {
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.slug}`)
      .then(() => {
        setCopied(true);
        toast.success('Link copied!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error('Failed to copy'));
  };

  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <motion.div
      custom={index}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: (i) => ({
          opacity: 1, y: 0,
          transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }
        }),
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-100 transition-shadow duration-300"
    >
      {/* Cover Image with zoom on hover */}
      {post.coverImage && (
        <Link to={`/post/${post.slug}`} className="block overflow-hidden bg-gray-100" style={{ height: '210px' }}>
          <motion.img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ display: 'block' }}
          />
        </Link>
      )}

      <div className="px-5 pt-4 pb-3">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {post.category && (
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100"
            >
              {post.category.name}
            </motion.span>
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

        {/* Title + subtitle */}
        <Link to={`/post/${post.slug}`} className="block group/title">
          <h2 className="text-lg font-bold text-gray-900 leading-snug mb-1 group-hover/title:text-indigo-700 transition-colors duration-200">
            {post.title}
          </h2>
          {post.subtitle && (
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.subtitle}</p>
          )}
        </Link>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.slice(0, 3).map(tag => (
              <motion.span
                key={tag._id}
                whileHover={{ scale: 1.08, y: -1 }}
                transition={{ duration: 0.15 }}
                className="text-xs px-2.5 py-0.5 rounded-full text-white font-medium cursor-default"
                style={{ backgroundColor: tag.color || '#8b5cf6' }}
              >
                #{tag.name}
              </motion.span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 bg-gray-50/50">
        <div className="text-xs text-gray-400">
          {post.attachments?.length > 0 && (
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {post.attachments.length} file{post.attachments.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Share button with copied state */}
          <motion.button
            onClick={handleShare}
            whileTap={{ scale: 0.93 }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 bg-white px-3 py-1.5 rounded-lg transition-colors duration-150"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1 text-green-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </motion.span>
              ) : (
                <motion.span
                  key="share"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              to={`/post/${post.slug}`}
              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors duration-150 font-medium flex items-center gap-1"
            >
              Read
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}