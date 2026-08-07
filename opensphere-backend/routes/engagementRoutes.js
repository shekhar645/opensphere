const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getComments, addComment, deleteComment,
  toggleLike, getLikeStatus
} = require('../controllers/engagementController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/:postId/comments', getComments);
router.post('/:postId/comments', protect, addComment);
router.delete('/:postId/comments/:commentId', protect, deleteComment);

router.get('/:postId/like', optionalAuth, getLikeStatus);
router.post('/:postId/like', protect, toggleLike);

module.exports = router;