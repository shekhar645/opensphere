import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PostPage from './pages/PostPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPosts from './pages/admin/AdminPosts';
import AdminPostEditor from './pages/admin/AdminPostEditor';
import AdminCategories from './pages/admin/AdminCategories';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTags from './pages/admin/AdminTags';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import CreatePost from './pages/admin/CreatePost';

// Page wrapper — every page fades + slides up on enter, fades out on exit
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

// Separate component so useLocation works inside Router
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/post/:slug" element={<PageTransition><PostPage /></PageTransition>} />
        <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
        <Route path="/create" element={<ProtectedRoute adminOnly><CreatePost /></ProtectedRoute>} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <PageTransition><ProfilePage /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <PageTransition><AdminDashboard /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin/posts" element={
          <ProtectedRoute adminOnly>
            <PageTransition><AdminPosts /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin/posts/new" element={
          <ProtectedRoute adminOnly>
            <PageTransition><AdminPostEditor /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin/posts/edit/:id" element={
          <ProtectedRoute adminOnly>
            <PageTransition><AdminPostEditor /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin/categories" element={
          <ProtectedRoute adminOnly>
            <PageTransition><AdminCategories /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute adminOnly>
            <PageTransition><AdminUsers /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin/tags" element={
          <ProtectedRoute adminOnly>
            <PageTransition><AdminTags /></PageTransition>
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Navbar />
      <AnimatedRoutes />
    </Router>
  );
}

export default App;