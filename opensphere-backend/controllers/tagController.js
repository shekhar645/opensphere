const Tag = require('../models/Tag');

// @desc    Get all tags
// @route   GET /api/tags
exports.getTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a tag
// @route   POST /api/tags
exports.createTag = async (req, res) => {
  try {
    const { name, color } = req.body;
    const tag = await Tag.create({ name, color });
    res.status(201).json({ success: true, data: tag });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Tag already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a tag
// @route   DELETE /api/tags/:id
exports.deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};