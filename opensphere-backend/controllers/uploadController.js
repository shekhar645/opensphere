const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Use memory storage so we can upload the buffer to S3
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// Generates a unique, safe filename (keeps original extension)
function generateFileName(originalName) {
  const ext = path.extname(originalName);
  const randomStr = crypto.randomBytes(16).toString('hex');
  return `opensphere/${Date.now()}-${randomStr}${ext}`;
}

// Upload single file to S3
exports.uploadFile = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided' });
      }

      const isImage = req.file.mimetype.startsWith('image/');
      const key = generateFileName(req.file.originalname);

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      });

      await s3.send(command);

      const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      res.status(200).json({
        success: true,
        url: fileUrl,
        public_id: key,
        format: path.extname(req.file.originalname).replace('.', ''),
        size: req.file.size,
        resource_type: isImage ? 'image' : 'raw',
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
];