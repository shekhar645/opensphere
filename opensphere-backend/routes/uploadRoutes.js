const express = require('express');
const router = express.Router();
const { uploadFile } = require('../controllers/uploadController');
const { protect, adminOnly } = require('../middleware/auth');

// Only admin can upload files
router.post('/', protect, adminOnly, uploadFile);

module.exports = router;