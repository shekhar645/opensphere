const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage so we can stream to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// Upload single file to Cloudinary
exports.uploadFile = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided' });
      }

      const isImage = req.file.mimetype.startsWith('image/');

      // Upload to Cloudinary via stream
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'opensphere',
            resource_type: isImage ? 'image' : 'raw',
            // For non-images, keep original filename
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      res.status(200).json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        size: result.bytes,
        resource_type: result.resource_type,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
];