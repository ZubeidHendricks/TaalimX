const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    cv: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    id: ['application/pdf', 'image/jpeg', 'image/png'],
    police_clearance: ['application/pdf', 'image/jpeg', 'image/png']
  };

  const fileType = req.body.type || 'cv';
  
  if (allowedTypes[fileType] && allowedTypes[fileType].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload teacher documents
router.post('/teacher-documents', auth, authorize('teacher'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { type } = req.body;
    
    if (!['cv', 'id', 'police_clearance'].includes(type)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    // Get teacher ID
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [req.user.id]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const teacherId = teacherResult.rows[0].id;
    const fileUrl = `/uploads/${req.file.filename}`;

    // Update teacher record with file URL
    let updateQuery;
    switch (type) {
      case 'cv':
        updateQuery = 'UPDATE teachers SET cv_url = $1 WHERE id = $2';
        break;
      case 'id':
        updateQuery = 'UPDATE teachers SET id_document_url = $1 WHERE id = $2';
        break;
      case 'police_clearance':
        updateQuery = 'UPDATE teachers SET police_clearance_url = $1 WHERE id = $2';
        break;
    }

    await query(updateQuery, [fileUrl, teacherId]);

    res.json({
      message: 'File uploaded successfully',
      fileUrl: fileUrl,
      type: type
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 10MB' });
    }
  }
  
  if (error.message === 'Invalid file type') {
    return res.status(400).json({ error: 'Invalid file type. Please upload a supported file format' });
  }
  
  res.status(500).json({ error: 'Failed to upload file' });
});

module.exports = router;
