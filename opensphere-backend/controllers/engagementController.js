const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Post = require('../models/Post');
const sendEmail = require('../utils/sendEmail');

// Fire-and-forget email notifier — never blocks or fails the API response
const notifyAdmin = ({ subject, html }) => {
  sendEmail({ to: process.env.EMAIL_USER, subject, html }).catch((err) => {
    console.error('Email notification failed:', err.message);
  });
};

// @desc    Get all comments for a post
// @route   GET /api/posts/:postId/comments
exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'fullName username profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:postId/comments
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text: text.trim()
    });

    await comment.populate('author', 'fullName username profilePicture');

    notifyAdmin({
      subject: `New comment on "${post.title}"`,
      html: `
        <p><strong>${req.user.fullName}</strong> (@${req.user.username}) commented on your post <strong>${post.title}</strong>:</p>
        <blockquote style="margin:12px 0;padding:12px;background:#f5f5f7;border-left:3px solid #4f46e5;">${comment.text}</blockquote>
        <p><a href="${process.env.CLIENT_URL}/posts/${post.slug}">View post</a></p>
      `
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment (author or admin)
// @route   DELETE /api/posts/:postId/comments/:commentId
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isOwner = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();
    res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on a post (like if not liked, unlike if already liked)
// @route   POST /api/posts/:postId/like
exports.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const existingLike = await Like.findOne({ post: post._id, user: req.user._id });

    if (existingLike) {
      await existingLike.deleteOne();
      const count = await Like.countDocuments({ post: post._id });
      return res.status(200).json({ success: true, liked: false, count });
    }

    await Like.create({ post: post._id, user: req.user._id });
    const count = await Like.countDocuments({ post: post._id });

    notifyAdmin({
      subject: `${req.user.fullName} liked your post "${post.title}"`,
      html: `
        <p><strong>${req.user.fullName}</strong> (@${req.user.username}) liked your post <strong>${post.title}</strong>.</p>
        <p><a href="${process.env.CLIENT_URL}/posts/${post.slug}">View post</a></p>
      `
    });

    res.status(200).json({ success: true, liked: true, count });
  } catch (error) {
    next(error);
  }
};

// @desc    Get like status + count for a post
// @route   GET /api/posts/:postId/like
exports.getLikeStatus = async (req, res, next) => {
  try {
    const count = await Like.countDocuments({ post: req.params.postId });
    let liked = false;
    if (req.user) {
      liked = !!(await Like.findOne({ post: req.params.postId, user: req.user._id }));
    }
    res.status(200).json({ success: true, liked, count });
  } catch (error) {
    next(error);
  }
};