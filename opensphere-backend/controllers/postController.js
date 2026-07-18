const Post = require('../models/Post');
const SharedPermission = require('../models/SharedPermission');
const ReadingHistory = require('../models/ReadingHistory');
const axios = require('axios');
const puppeteer = require('puppeteer');

// Check if user can access post
const canAccessPost = async (post, user) => {
  if (post.visibility === 'PUBLIC_EVERYONE') return true;
  if (!user) return false;
  if (post.author.toString() === user._id.toString()) return true;
  if (user.role === 'admin') return true;
  if (post.visibility === 'PUBLIC_LOGGED_IN') return true;
  if (post.visibility === 'SHARED_USERS') {
    const permission = await SharedPermission.findOne({ post: post._id, sharedWith: user._id });
    return !!permission;
  }
  return false;
};

// Generates slide-style HTML from post content, matching your SlidesView logic
function buildSlidesHtml(post) {
  const container = post.content || '';

  // Simple split by top-level block tags, similar to your frontend splitContentIntoSlides
  const slides = [];
  const div = `<div>${container}</div>`;
  const matches = div.match(/<(p|h1|h2|h3|ul|ol|blockquote|img)[^>]*>.*?<\/\1>|<img[^>]*\/?>/gs) || [container];

  let current = '';
  let currentLen = 0;
  const maxChars = 420;

  matches.forEach(block => {
    const textLen = block.replace(/<[^>]+>/g, '').length;
    if (currentLen + textLen > maxChars && current) {
      slides.push(current);
      current = '';
      currentLen = 0;
    }
    current += block;
    currentLen += textLen;
  });
  if (current) slides.push(current);

  const titleSlide = `
    <section class="slide title-slide">
      ${post.coverImage ? `<img src="${post.coverImage}" class="cover" />` : ''}
      <div class="title-content">
        ${post.category ? `<span class="badge">${post.category.name}</span>` : ''}
        <h1>${post.title}</h1>
        ${post.subtitle ? `<p class="subtitle">${post.subtitle}</p>` : ''}
      </div>
    </section>
  `;

  const contentSlides = slides.map(s => `
    <section class="slide content-slide">
      <div class="content">${s}</div>
    </section>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page { size: 800px 1000px; margin: 0; }
        body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; margin: 0; }
        .slide {
          width: 800px;
          height: 1000px;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        .title-slide { justify-content: center; }
        .cover { width: 100%; height: 400px; object-fit: cover; }
        .title-content { padding: 40px 50px; }
        .badge {
          display: inline-block;
          font-size: 13px;
          font-weight: 600;
          color: #4f46e5;
          background: #eef2ff;
          border: 1px solid #e0e7ff;
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 16px;
        }
        h1 { font-size: 34px; color: #111827; line-height: 1.25; margin: 0 0 12px; }
        .subtitle { font-size: 18px; color: #9ca3af; line-height: 1.5; }
        .content-slide .content {
          padding: 60px 50px;
          font-size: 18px;
          line-height: 1.7;
          color: #374151;
        }
        .content img { width: 100%; border-radius: 12px; margin: 16px 0; }
        .content h2, .content h3 { color: #111827; font-weight: 700; }
        .content blockquote {
          border-left: 4px solid #c7d2fe;
          background: #eef2ff66;
          padding: 8px 16px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      ${titleSlide}
      ${contentSlides}
    </body>
    </html>
  `;
}

exports.downloadPostAsPdf = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('category');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const html = buildSlidesHtml(post);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      width: '800px',
      height: '1000px',
      printBackground: true,
      pageRanges: ''
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${post.slug || 'post'}.pdf"`
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
};

// @desc    Get all published posts (public feed)
// @route   GET /api/posts
exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { isPublished: true };

    if (!req.user) {
      query.visibility = 'PUBLIC_EVERYONE';
    } else if (req.user.role !== 'admin') {
      query.visibility = { $in: ['PUBLIC_EVERYONE', 'PUBLIC_LOGGED_IN'] };
    }

    if (req.query.category) query.category = req.query.category;
    if (req.query.tag) query.tags = req.query.tag;
    if (req.query.featured) query.isFeatured = true;

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('author', 'fullName username profilePicture')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug color')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single post by slug
// @route   GET /api/posts/:slug
exports.getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, isPublished: true })
      .populate('author', 'fullName username profilePicture bio')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug color');

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const hasAccess = await canAccessPost(post, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied' });

    // Increment views in DB, and reflect the new count immediately in the response
    post.views = (post.views || 0) + 1;
    await Post.findByIdAndUpdate(post._id, { $inc: { views: 1 } });

    if (req.user) {
      await ReadingHistory.findOneAndUpdate(
        { user: req.user._id, post: post._id },
        { readAt: new Date() },
        { upsert: true }
      );
    }

    // Find related posts: same category OR overlapping tags, excluding this post
    const orConditions = [];
    if (post.category) {
      orConditions.push({ category: post.category._id || post.category });
    }
    if (post.tags && post.tags.length > 0) {
      orConditions.push({ tags: { $in: post.tags.map(t => t._id || t) } });
    }

    let relatedPosts = [];
    if (orConditions.length > 0) {
      relatedPosts = await Post.find({
        _id: { $ne: post._id },
        isPublished: true,
        visibility: 'PUBLIC_EVERYONE',
        $or: orConditions
      })
        .populate('author', 'fullName username profilePicture')
        .populate('category', 'name slug color')
        .select('title subtitle slug coverImage readingTime publishedAt views')
        .sort({ publishedAt: -1 })
        .limit(4);
    }

    res.status(200).json({ success: true, data: post, relatedPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create post
// @route   POST /api/posts
exports.createPost = async (req, res) => {
  try {
    req.body.author = req.user._id;
    if (!req.body.category) delete req.body.category;
    const post = await Post.create(req.body);
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
exports.updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (!req.body.category) delete req.body.category;
    post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search posts
// @route   GET /api/posts/search
exports.searchPosts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search query required' });

    const visibilityQuery = req.user
      ? (req.user.role === 'admin' ? {} : { visibility: { $in: ['PUBLIC_EVERYONE', 'PUBLIC_LOGGED_IN'] } })
      : { visibility: 'PUBLIC_EVERYONE' };

    const posts = await Post.find({
      $text: { $search: q },
      isPublished: true,
      ...visibilityQuery
    })
      .populate('author', 'fullName username profilePicture')
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .limit(20);

    res.status(200).json({ success: true, data: posts, count: posts.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin all posts (including drafts)
// @route   GET /api/posts/admin/all
exports.getAdminPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.visibility) query.visibility = req.query.visibility;
    if (req.query.isDraft !== undefined) query.isDraft = req.query.isDraft === 'true';

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('author', 'fullName username')
      .populate('category', 'name')
      .populate('tags', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ success: true, data: posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Share post with users
// @route   POST /api/posts/:id/share
exports.sharePost = async (req, res) => {
  try {
    const { userIds } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const permissions = userIds.map(userId => ({
      post: post._id,
      sharedWith: userId,
      sharedBy: req.user._id
    }));

    await SharedPermission.insertMany(permissions, { ordered: false });
    await Post.findByIdAndUpdate(req.params.id, { visibility: 'SHARED_USERS' });

    res.status(200).json({ success: true, message: 'Post shared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/posts/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [total, published, drafts, featured, byVisibility] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ isPublished: true }),
      Post.countDocuments({ isDraft: true }),
      Post.countDocuments({ isFeatured: true }),
      Post.aggregate([{ $group: { _id: '$visibility', count: { $sum: 1 } } }])
    ]);

    const User = require('../models/User');
    const totalUsers = await User.countDocuments();

    res.status(200).json({
      success: true,
      data: { total, published, drafts, featured, byVisibility, totalUsers }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Portfolio posts API
// @route   GET /api/portfolio-posts
exports.getPortfolioPosts = async (req, res) => {
  try {
    const posts = await Post.find({ showOnPortfolio: true, isPublished: true, visibility: 'PUBLIC_EVERYONE' })
      .populate('author', 'fullName username')
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .select('title subtitle slug coverImage author category tags shortDescription publishedAt readingTime')
      .sort({ publishedAt: -1 });

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Proxy download attachment through backend (avoids browser 401)
// @route   GET /api/posts/:id/download/:attachmentIndex
exports.downloadAttachment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const hasAccess = await canAccessPost(post, req.user);
    if (!hasAccess) return res.status(403).json({ success: false, message: 'Access denied' });

    const index = parseInt(req.params.attachmentIndex);
    const file = post.attachments[index];
    if (!file) return res.status(404).json({ success: false, message: 'Attachment not found' });

    // Build a clean public URL (strip any transformation flags like fl_attachment)
    let downloadUrl = file.url;
    downloadUrl = downloadUrl.replace('/fl_attachment/', '/').replace('fl_attachment/', '');

    console.log('Fetching from Cloudinary:', downloadUrl);

    const response = await axios.get(downloadUrl, {
      responseType: 'stream',
      headers: {}
    });

    const filename = encodeURIComponent(file.originalName || `file.${file.format || 'pdf'}`);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    response.data.pipe(res);
  } catch (error) {
    console.error('DOWNLOAD ERROR:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};