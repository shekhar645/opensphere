const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: [300, 'Subtitle cannot exceed 300 characters'],
    default: ''
  },
  slug: {
    type: String,
    lowercase: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  coverImage: {
    type: String,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  attachments: [
  {
    url: String,
    publicId: String,
    resourceType: String,
    format: String,
    originalName: String,
    size: Number,
  }
  ],
  visibility: {
    type: String,
    enum: ['PUBLIC_EVERYONE', 'PUBLIC_LOGGED_IN', 'PRIVATE', 'SHARED_USERS'],
    default: 'PUBLIC_EVERYONE'
  },
  isDraft: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  showOnPortfolio: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  readingTime: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters'],
    default: ''
  }
}, {
  timestamps: true
});

// Auto generate slug from title
postSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now();
  }
  // Calculate reading time (avg 200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  // Set publishedAt date
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Index for search
postSchema.index({ title: 'text', content: 'text', shortDescription: 'text' });
postSchema.index({ slug: 1 });
postSchema.index({ visibility: 1, isPublished: 1 });
postSchema.index({ isFeatured: 1 });

module.exports = mongoose.model('Post', postSchema);