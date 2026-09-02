const Update = require('../models/Update');

// @desc    Get all updates (newest first)
// @route   GET /api/updates
exports.getUpdates = async (req, res) => {
  try {
    const updates = await Update.find()
      .populate('postedBy', 'fullName username')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, data: updates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new update
// @route   POST /api/updates
exports.createUpdate = async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Update message is required' });
    }

    const update = await Update.create({
      title: title?.trim() || undefined,
      message: message.trim(),
      postedBy: req.user._id
    });

    await update.populate('postedBy', 'fullName username');

    res.status(201).json({ success: true, data: update });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an update
// @route   DELETE /api/updates/:id
exports.deleteUpdate = async (req, res) => {
  try {
    const update = await Update.findByIdAndDelete(req.params.id);
    if (!update) return res.status(404).json({ success: false, message: 'Update not found' });

    res.status(200).json({ success: true, message: 'Update deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};