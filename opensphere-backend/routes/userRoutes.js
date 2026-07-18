const express = require('express');
const router = express.Router();
const {
  getMe, updateMe, changePassword,
  getPublicProfile, getAllUsers
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/me/password', protect, changePassword);
router.get('/', protect, adminOnly, getAllUsers);
router.get('/:username', getPublicProfile);

module.exports = router;