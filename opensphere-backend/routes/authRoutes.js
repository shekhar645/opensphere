const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, logout, getUsers } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.post('/logout', protect, logout);
router.get('/users', protect, adminOnly, getUsers);

module.exports = router;