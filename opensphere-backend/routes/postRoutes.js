const express = require('express');
const router = express.Router();
const {
  getPosts, getPostBySlug, createPost, updatePost,
  deletePost, searchPosts, getAdminPosts, sharePost,
  getDashboardStats, getPortfolioPosts, downloadAttachment,
  downloadPostAsPdf
} = require('../controllers/postController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

router.get('/search', optionalAuth, searchPosts);
router.get('/admin/all', protect, adminOnly, getAdminPosts);
router.get('/admin/stats', protect, adminOnly, getDashboardStats);
router.get('/portfolio', getPortfolioPosts);
router.get('/', optionalAuth, getPosts);
router.get('/:slug', optionalAuth, getPostBySlug);
router.post('/', protect, adminOnly, createPost);
router.put('/:id', protect, adminOnly, updatePost);
router.delete('/:id', protect, adminOnly, deletePost);
router.post('/:id/share', protect, adminOnly, sharePost);
router.get('/:id/download/:attachmentIndex', protect, downloadAttachment);


module.exports = router;