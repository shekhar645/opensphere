const mongoose = require('mongoose');

const readingHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  readAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

readingHistorySchema.index({ user: 1, post: 1 }, { unique: true });
readingHistorySchema.index({ user: 1, readAt: -1 });

module.exports = mongoose.model('ReadingHistory', readingHistorySchema);