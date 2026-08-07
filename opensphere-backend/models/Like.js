const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guestId: {
    type: String
  },
  guestName: {
    type: String
  }
}, {
  timestamps: true
});

likeSchema.index({ post: 1, user: 1 }, { unique: true, partialFilterExpression: { user: { $exists: true } } });
likeSchema.index({ post: 1, guestId: 1 }, { unique: true, partialFilterExpression: { guestId: { $exists: true } } });

module.exports = mongoose.model('Like', likeSchema);