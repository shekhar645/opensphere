const User = require('../models/User');
const Post = require('../models/Post');
const sendEmail = require('../utils/sendEmail');

// @desc    Get current logged-in user profile
// @route   GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update current user profile (name, bio, profilePicture)
// @route   PUT /api/users/me
exports.updateMe = async (req, res) => {
  try {
    const allowed = ['fullName', 'bio', 'profilePicture'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/users/me/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    // Send confirmation email with new credentials
    try {
      await sendEmail({
        to: user.email,
        subject: 'Your OpenSphere password was changed',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Password Changed</h2>
            <p>Hi ${user.fullName},</p>
            <p>Your OpenSphere account password was just updated. Here are your login credentials:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Email / Username</td>
                <td style="padding: 8px 0; font-weight: bold;">${user.email} / ${user.username}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">New Password</td>
                <td style="padding: 8px 0; font-weight: bold;">${newPassword}</td>
              </tr>
            </table>
            <p>
              <a href="${process.env.CLIENT_URL}/login" style="background: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">
                Log in to OpenSphere
              </a>
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">
              If you didn't make this change, please contact us immediately.
            </p>
          </div>
        `,
      });
      console.log('Password change email sent to:', user.email);
    } catch (emailErr) {
      console.error('Failed to send password change email:', emailErr.message);
    }

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get public profile by username + their published posts
// @route   GET /api/users/:username
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('fullName username bio profilePicture createdAt');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const posts = await Post.find({
      author: user._id,
      isPublished: true,
      visibility: 'PUBLIC_EVERYONE'
    })
      .populate('category', 'name slug color')
      .populate('tags', 'name slug color')
      .select('title subtitle slug coverImage shortDescription readingTime views publishedAt category tags')
      .sort({ publishedAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, data: { user, posts } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin — get all users
// @route   GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};