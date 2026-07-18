const express = require('express');
const router = express.Router();
const { getTags, createTag, deleteTag } = require('../controllers/tagController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getTags);
router.post('/', protect, adminOnly, createTag);
router.delete('/:id', protect, adminOnly, deleteTag);

module.exports = router;