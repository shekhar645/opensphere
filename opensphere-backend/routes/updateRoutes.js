const express = require('express');
const router = express.Router();
const { getUpdates, createUpdate, deleteUpdate } = require('../controllers/updateController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getUpdates);
router.post('/', protect, adminOnly, createUpdate);
router.delete('/:id', protect, adminOnly, deleteUpdate);

module.exports = router;