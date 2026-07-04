const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { protect } = require('../middleware/authMiddleware');
const User        = require('../models/User');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage — no disk writes needed
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  },
});

// ── POST /api/upload/profile-pic ──────────────────────────────
router.post('/profile-pic', protect, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:         'skcet-library/profiles',
          public_id:      `user_${req.user.id}`,
          overwrite:      true,
          transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
        },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    // Save URL to database
    await User.update(req.user.id, { profile_pic: result.secure_url });

    res.json({
      success:  true,
      message:  'Profile photo updated!',
      photo_url: result.secure_url,
    });
  } catch (e) { next(e); }
});

// ── DELETE /api/upload/profile-pic ───────────────────────────
router.delete('/profile-pic', protect, async (req, res, next) => {
  try {
    await cloudinary.uploader.destroy(`skcet-library/profiles/user_${req.user.id}`);
    await User.update(req.user.id, { profile_pic: null });
    res.json({ success: true, message: 'Profile photo removed.' });
  } catch (e) { next(e); }
});

module.exports = router;