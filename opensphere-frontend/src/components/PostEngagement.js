import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function getGuestId() {
  let id = localStorage.getItem('guestId');
  if (!id) {
    id = 'guest_' + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem('guestId', id);
  }
  return id;
}

export default function PostEngagement({ postId }) {
  const { user } = useAuth();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [guestName, setGuestName] = useState(localStorage.getItem('guestName') || '');
  const [namePromptOpen, setNamePromptOpen] = useState(false);
  const [namePromptFor, setNamePromptFor] = useState(null); // 'like' | 'comment'
  const [nameInput, setNameInput] = useState('');

  const guestId = getGuestId();

  useEffect(() => {
    if (!postId) return;
    const query = user ? '' : `?guestId=${guestId}`;
    API.get(`/posts/${postId}/like${query}`)
      .then(res => {
        setLiked(res.data.liked);
        setLikeCount(res.data.count);
      })
      .catch(() => {});

    API.get(`/posts/${postId}/comments`)
      .then(res => setComments(res.data.data || []))
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [postId]);

  const runLike = async (name) => {
    setLikeLoading(true);
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await API.post(`/posts/${postId}/like`, user ? {} : { guestId, guestName: name });
      setLiked(res.data.liked);
      setLikeCount(res.data.count);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error('Something went wrong');
    } finally {
      setLikeLoading(false);
    }
  };

  const runComment = async (name) => {
    setSubmitting(true);
    try {
      const res = await API.post(`/posts/${postId}/comments`, {
        text: commentText.trim(),
        ...(user ? {} : { guestName: name })
      });
      setComments([res.data.data, ...comments]);
      setCommentText('');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = () => {
    if (!user && !guestName) {
      setNamePromptFor('like');
      setNamePromptOpen(true);
      return;
    }
    runLike(guestName);
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user && !guestName) {
      setNamePromptFor('comment');
      setNamePromptOpen(true);
      return;
    }
    runComment(guestName);
  };

  const confirmName = () => {
    const name = nameInput.trim();
    if (!name) {
      toast.error('Please enter your name');
      return;
    }
    localStorage.setItem('guestName', name);
    setGuestName(name);
    setNamePromptOpen(false);
    setNameInput('');

    if (namePromptFor === 'like') runLike(name);
    if (namePromptFor === 'comment') runComment(name);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/posts/${postId}/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const displayName = (comment) => comment.author?.fullName || comment.guestName || 'Guest';
  const displayInitial = (comment) => (comment.author?.fullName || comment.guestName || '?')[0]?.toUpperCase();

  return (
    <div className="mt-10 pt-8 border-t border-gray-100">
      {namePromptOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl"
        >
          <p className="text-sm text-gray-600 mb-2">What's your name?</p>
          <div className="flex gap-2">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmName()}
              placeholder="Your name"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <button
              onClick={confirmName}
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
            >
              Continue
            </button>
            <button
              onClick={() => setNamePromptOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600 px-2"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
          disabled={likeLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-150 ${
            liked
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
              : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600'
          }`}
        >
          <motion.svg
            animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </motion.svg>
          <span className="text-sm font-medium">
            {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
          </span>
        </motion.button>

        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </div>
      </div>

      <form onSubmit={handleSubmitComment} className="mb-8">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold shrink-0">
            {(user?.fullName || guestName)?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {commentsLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-24" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No comments yet. Be the first to say something!</p>
      ) : (
        <div className="space-y-5">
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden">
                  {comment.author?.profilePicture ? (
                    <img src={comment.author.profilePicture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    displayInitial(comment)
                  )}
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                   <p className="text-sm font-semibold text-gray-800">
                      {displayName(comment)}
                    </p>
                    {(user?._id === comment.author?._id || user?.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-xs text-gray-300 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap break-words">{comment.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}