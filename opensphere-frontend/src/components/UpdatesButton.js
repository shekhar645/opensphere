import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';

export default function UpdatesButton() {
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && updates.length === 0) {
      setLoading(true);
      API.get('/updates')
        .then(res => setUpdates(res.data.data || []))
        .catch(() => setUpdates([]))
        .finally(() => setLoading(false));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggleOpen}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 bg-white px-4 py-2 rounded-xl transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Updates
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">Latest updates</p>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">Loading...</div>
              ) : updates.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No updates yet.</div>
              ) : (
                updates.map((u) => (
                  <div key={u._id} className="px-4 py-3 border-b border-gray-50 last:border-b-0">
                    {u.title && (
                      <p className="text-sm font-semibold text-gray-800 mb-0.5">{u.title}</p>
                    )}
                    <p className="text-sm text-gray-600 leading-relaxed">{u.message}</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}