const mongoose = require('mongoose');

const sharedPermissionSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessLevel: {
    type: String,
    enum: ['read'],
    default: 'read'
  }
}, {
  timestamps: true
});

// One permission per user per post
sharedPermissionSchema.index({ post: 1, sharedWith: 1 }, { unique: true });

module.exports = mongoose.model('SharedPermission', sharedPermissionSchema);