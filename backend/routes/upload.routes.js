const express = require('express');
const upload = require('../services/upload.service');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', protect, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      fileUrl,
      originalFileName: req.file.originalname
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
