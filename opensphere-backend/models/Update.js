const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 100
    },
    message: {
      type: String,
      required: [true, 'Update message is required'],
      trim: true,
      maxlength: 500
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Update', updateSchema);